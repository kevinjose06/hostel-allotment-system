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
import asyncio


def _compute_merit_scores(applications: List[Dict]) -> List[Dict]:
    """
    Normalise income and distance across all applications and
    compute a merit score in [0.0, 1.0] for each.
    """
    if not applications:
        return []

    # Safe extraction of max values
    incomes = [a.get("family_annual_income") for a in applications if a.get("family_annual_income") is not None]
    distances = [a.get("distance_from_college") for a in applications if a.get("distance_from_college") is not None]
    
    max_income   = max(incomes) if incomes else 1.0
    max_distance = max(distances) if distances else 1.0
    
    if max_income == 0: max_income = 1.0
    if max_distance == 0: max_distance = 1.0

    for app in applications:
        income = app.get("family_annual_income", 0) or 0
        distance = app.get("distance_from_college", 0) or 0
        
        income_score   = 1.0 - (income  / max_income)
        distance_score =        distance / max_distance
        app["merit_score"] = round(0.5 * income_score + 0.5 * distance_score, 4)

    return applications


async def run_hostel_allotment(hostel_id: int, academic_year: str) -> Dict:
    """
    Main entry point called by the allotment route.
    Returns a summary dict.
    """

    # 1. Fetch hostel and system configuration (Parallel)
    async def get_config():
        h_task = asyncio.to_thread(lambda: supabase_admin.table("hostel").select("*").eq("hostel_id", hostel_id).single().execute())
        c_task = asyncio.to_thread(lambda: supabase_admin.table("system_config").select("config_value").eq("config_key", "reservation_percentage").maybe_single().execute())
        return await asyncio.gather(h_task, c_task)

    results = await get_config()
    hostel_resp, config_resp = results[0], results[1]

    if not hostel_resp or not getattr(hostel_resp, 'data', None):
        raise ValueError(f"Hostel {hostel_id} not found")

    res_percent = 20 # Default fallback
    if config_resp and getattr(config_resp, 'data', None):
        try:
            res_percent = int(config_resp.data["config_value"])
        except:
            pass

    hostel         = hostel_resp.data
    hostel_type    = hostel.get("hostel_type", "MH")
    total_capacity = hostel.get("total_capacity", 0)
    
    import math
    reserved_seats = math.floor(total_capacity * (res_percent / 100))
    gender_filter  = "Female" if hostel_type == "LH" else "Male"

    # 2. Fetch all approved applications with student info
    apps_resp = await asyncio.to_thread(
        lambda: supabase_admin.table("application")
        .select("*, student (*)")
        .eq("academic_year", academic_year)
        .eq("status", "Approved")
        .execute()
    )

    def _get_gender(app_data):
        student = app_data.get("student")
        if not student: return None
        # Handle dict or list returned by join
        if isinstance(student, list) and len(student) > 0:
            student = student[0]
        if isinstance(student, dict):
            g = student.get("gender")
            return g.strip().capitalize() if g else None
        return None

    all_apps: List[Dict] = [
        a for a in (getattr(apps_resp, 'data', None) or [])
        if _get_gender(a) == gender_filter.capitalize()
    ]

    if not all_apps:
        return {
            "hostel_id": hostel_id,
            "hostel_name": hostel.get("hostel_name", "Unknown"),
            "academic_year": academic_year,
            "total_allocated": 0,
            "reserved_allocated": 0,
            "general_allocated": 0,
            "message": f"No approved {gender_filter} applications found for {academic_year}."
        }

    # 3. Compute merit scores and update DB (Parallel)
    all_apps = _compute_merit_scores(all_apps)

    async def update_merit(app):
        return await asyncio.to_thread(
            lambda: supabase_admin.table("application")
            .update({"merit_score": app["merit_score"]})
            .eq("application_id", app["application_id"])
            .execute()
        )
    await asyncio.gather(*(update_merit(app) for app in all_apps))

    # 4. Filter already allotted
    app_ids = [a["application_id"] for a in all_apps]
    alloc_resp = await asyncio.to_thread(lambda: supabase_admin.table("allocation").select("application_id").in_("application_id", app_ids).execute())
    already_allotted = {r["application_id"] for r in (getattr(alloc_resp, 'data', None) or [])}
    unallotted = [a for a in all_apps if a["application_id"] not in already_allotted]

    total_allocated    = 0
    reserved_allocated = 0
    general_allocated  = 0
    today_str          = str(date.today())

    # 5. PHASE 1 — Reserved seat allocation
    cat_resp = await asyncio.to_thread(lambda: supabase_admin.table("benefit_category").select("id").eq("is_active", True).execute())
    active_cat_ids = [c["id"] for c in (getattr(cat_resp, 'data', None) or [])]

    reserved_candidates = [
        a for a in unallotted
        if any(cat_id in (a.get("selected_category_ids") or []) for cat_id in active_cat_ids)
        or a.get("pwd_status") or a.get("bpl_status") or a.get("sc_st_status")
    ]
    reserved_candidates.sort(key=lambda a: -a.get("merit_score", 0))

    allocations_to_insert = []

    for app in reserved_candidates:
        if total_allocated >= reserved_seats:
            break

        category = "Reserved"
        cats = app.get("selected_category_ids")
        if cats and isinstance(cats, list) and len(cats) > 0:
            category = f"Reserved_Cat_{cats[0]}"
        elif app.get("pwd_status"):   category = "Reserved_PWD"
        elif app.get("bpl_status"):   category = "Reserved_BPL"
        elif app.get("sc_st_status"): category = "Reserved_SCST"

        allocations_to_insert.append({
            "application_id": app["application_id"],
            "hostel_id":       hostel_id,
            "allocation_date": today_str,
            "status":          "Active",
            "category":        category
        })
        already_allotted.add(app["application_id"])
        total_allocated += 1
        reserved_allocated += 1

    # 6. PHASE 2 — General seat allocation
    remaining_seats = total_capacity - total_allocated
    general_candidates = sorted(
        [a for a in unallotted if a["application_id"] not in already_allotted],
        key=lambda a: -a.get("merit_score", 0)
    )

    for app in general_candidates:
        if remaining_seats <= 0:
            break
        allocations_to_insert.append({
            "application_id": app["application_id"],
            "hostel_id":       hostel_id,
            "allocation_date": today_str,
            "status":          "Active",
            "category":        "General"
        })
        total_allocated += 1
        general_allocated += 1
        remaining_seats -= 1

    # 7. Finalize insertions (Parallel)
    async def insert_alloc(alloc):
        return await asyncio.to_thread(lambda: supabase_admin.table("allocation").insert(alloc).execute())
    
    if allocations_to_insert:
        await asyncio.gather(*(insert_alloc(a) for a in allocations_to_insert))

    return {
        "hostel_id":         hostel_id,
        "hostel_name":       hostel.get("hostel_name"),
        "academic_year":     academic_year,
        "total_allocated":   total_allocated,
        "reserved_allocated": reserved_allocated,
        "general_allocated": general_allocated,
    }
