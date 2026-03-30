"""
Hostel Allotment Engine — RGIT Kottayam
=========================================
Implements the two-phase merit-based hostel allotment algorithm.

Phase 1 — Reserved seats (20% of total):
    Priority order within reserved seats: PWD → BPL → SC/ST
    Within each category, ranked by merit score descending.

Phase 2 — General seats (remaining 80%):
    All unallotted approved applicants ranked purely by merit score.

Merit Score Formula (equal weightage):
    income_score   = 1 - (income / max_income)      ← lower income = higher score
    distance_score = distance / max_distance         ← farther = higher score
    merit_score    = 0.5 * income_score + 0.5 * distance_score
"""

from app.config.supabase import supabase_admin
from datetime import date
from typing import List, Dict, Any


def _compute_merit_scores(applications: List[Dict]) -> List[Dict]:
    """
    Normalise income and distance across all applications and
    compute a merit score in [0.0, 1.0] for each.
    """
    if not applications:
        return []

    max_income   = max(a["family_annual_income"]   for a in applications) or 1.0
    max_distance = max(a["distance_from_college"]  for a in applications) or 1.0

    for app in applications:
        income_score   = 1.0 - (app["family_annual_income"]  / max_income)
        distance_score =        app["distance_from_college"] / max_distance
        app["merit_score"] = round(0.5 * income_score + 0.5 * distance_score, 4)

    return applications


def _category_sort_key(app: Dict) -> tuple:
    """
    Returns a sort key so that within reserved seats:
        PWD  → priority 1  (highest)
        BPL  → priority 2
        SC/ST → priority 3
    Works with the snapshot flags stored on the application record.
    """
    if app["pwd_status"]:    priority = 1
    elif app["bpl_status"]:  priority = 2
    elif app["sc_st_status"]:priority = 3
    else:                  priority = 4
    return (priority, -app["merit_score"])


async def run_hostel_allotment(hostel_id: int, academic_year: int) -> Dict:
    """
    Main entry point called by the allotment route.
    Returns a summary dict.
    """

    # ── 1. Fetch hostel configuration ────────────────────────────────────────
    hostel_resp = (
        supabase_admin.table("hostel")
        .select("hostel_id, hostel_name, hostel_type, total_capacity, reserved_seats")
        .eq("hostel_id", hostel_id)
        .single()
        .execute()
    )
    if not hostel_resp.data:
        raise ValueError(f"Hostel {hostel_id} not found")

    hostel         = hostel_resp.data
    hostel_type    = hostel["hostel_type"]          # 'LH' or 'MH'
    total_capacity = hostel["total_capacity"]
    reserved_seats = hostel["reserved_seats"]
    gender_filter  = "Female" if hostel_type == "LH" else "Male"

    # ── 2. Fetch all approved applications for the correct gender ────────────
    apps_resp = (
        supabase_admin.table("application")
        .select("""
            application_id,
            family_annual_income,
            distance_from_college,
            bpl_status,
            pwd_status,
            sc_st_status,
            student (
                student_id, gender
            )
        """)
        .eq("academic_year", academic_year)
        .eq("status", "Approved")
        .execute()
    )

    all_apps: List[Dict] = [
        a for a in (apps_resp.data or [])
        if a.get("student", {}).get("gender") == gender_filter
    ]

    if not all_apps:
        return {
            "hostel_id": hostel_id,
            "hostel_name": hostel["hostel_name"],
            "academic_year": academic_year,
            "total_allocated": 0,
            "reserved_allocated": 0,
            "general_allocated": 0,
            "message": "No approved applications found for this hostel type."
        }

    # ── 3. Compute merit scores ───────────────────────────────────────────────
    all_apps = _compute_merit_scores(all_apps)

    # Persist computed merit scores back to the application table
    for app in all_apps:
        supabase_admin.table("application").update(
            {"merit_score": app["merit_score"]}
        ).eq("application_id", app["application_id"]).execute()

    # ── 4. Find already-allotted applications (idempotency guard) ────────────
    app_ids = [a["application_id"] for a in all_apps]
    allocated_resp = (
        supabase_admin.table("allocation")
        .select("application_id")
        .in_("application_id", app_ids)
        .execute()
    )
    already_allotted = {
        r["application_id"] for r in (allocated_resp.data or [])
    }
    unallotted = [a for a in all_apps if a["application_id"] not in already_allotted]

    total_allocated    = 0
    reserved_allocated = 0
    general_allocated  = 0
    today_str          = str(date.today())

    # ── 5. PHASE 1 — Reserved seat allocation ────────────────────────────────
    reserved_candidates = [
        a for a in unallotted
        if (
            a["pwd_status"] or
            a["bpl_status"] or
            a["sc_st_status"]
        )
    ]
    reserved_candidates.sort(key=_category_sort_key)

    for app in reserved_candidates:
        if total_allocated >= reserved_seats:
            break

        if app["pwd_status"]:      category = "Reserved_PWD"
        elif app["bpl_status"]:    category = "Reserved_BPL"
        else:                      category = "Reserved_SCST"

        supabase_admin.table("allocation").insert({
            "application_id": app["application_id"],
            "hostel_id":       hostel_id,
            "allocation_date": today_str,
            "status":          "Active",
            "category":        category
        }).execute()

        already_allotted.add(app["application_id"])
        total_allocated    += 1
        reserved_allocated += 1

    # ── 6. PHASE 2 — General seat allocation ─────────────────────────────────
    remaining_seats    = total_capacity - total_allocated
    general_candidates = sorted(
        [a for a in unallotted if a["application_id"] not in already_allotted],
        key=lambda a: -a["merit_score"]
    )

    for app in general_candidates:
        if remaining_seats <= 0:
            break

        supabase_admin.table("allocation").insert({
            "application_id": app["application_id"],
            "hostel_id":       hostel_id,
            "allocation_date": today_str,
            "status":          "Active",
            "category":        "General"
        }).execute()

        total_allocated   += 1
        general_allocated += 1
        remaining_seats   -= 1

    return {
        "hostel_id":         hostel_id,
        "hostel_name":       hostel["hostel_name"],
        "academic_year":     academic_year,
        "total_allocated":   total_allocated,
        "reserved_allocated": reserved_allocated,
        "general_allocated": general_allocated,
    }
