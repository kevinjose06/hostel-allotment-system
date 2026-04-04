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
    
    # ── Count seats already occupied by students from OTHER academic years ──────
    # These are students currently residing (Active) who have NOT passed out yet.
    existing_active_resp = await asyncio.to_thread(
        lambda: supabase_admin.table("allocation")
        .select("allocation_id, application(academic_year)")
        .eq("hostel_id", hostel_id)
        .eq("status", "Active")
        .execute()
    )
    occupied_by_others = 0
    if existing_active_resp and getattr(existing_active_resp, 'data', None):
        for item in existing_active_resp.data:
            app_data = item.get("application")
            if isinstance(app_data, list): app_data = app_data[0] if app_data else None
            if isinstance(app_data, dict):
                ay = str(app_data.get("academic_year", "")).strip()
                if ay != academic_year.strip():
                    occupied_by_others += 1
    available_capacity = total_capacity - occupied_by_others
    print(f"[CAPACITY] Total: {total_capacity}, Occupied by other years: {occupied_by_others}, Available: {available_capacity}")
    
    # Robust cleanup: Fetch all active allocations for the target hostel,
    # then filter in Python by academic year to identify candidates for deletion.
    print(f"[CLEANUP] Identifying stale allocations for Hostel {hostel_id}...")
    
    # We fetch with application to check the year, but we'll use a simpler select
    # and handle the join logic in Python to avoid PostgREST relationship issues.
    raw_allocs = await asyncio.to_thread(
        lambda: supabase_admin.table("allocation")
        .select("allocation_id, application_id, application(academic_year)")
        .eq("hostel_id", hostel_id)
        .eq("status", "Active")
        .execute()
    )
    
    ids_to_del = []
    if raw_allocs and getattr(raw_allocs, 'data', None):
        for item in raw_allocs.data:
            app_data = item.get("application")
            # Handle both list and dict formats from Supabase response
            if isinstance(app_data, list) and len(app_data) > 0:
                app_data = app_data[0]
            
            if isinstance(app_data, dict):
                ay = str(app_data.get("academic_year", "")).strip()
                if ay == academic_year.strip():
                    ids_to_del.append(item["allocation_id"])

    if ids_to_del:
        print(f"[CLEANUP] Deleting {len(ids_to_del)} existing allocations for {academic_year}...")
        await asyncio.to_thread(
            lambda: supabase_admin.table("allocation")
            .delete()
            .in_("allocation_id", ids_to_del)
            .execute()
        )
        print(f"[CLEANUP] Cleaned up {len(ids_to_del)} stale allocations.")
    else:
        print("[CLEANUP] No stale allocations found for this year.")

    import math
    reserved_seats = math.floor(available_capacity * (res_percent / 100))
    gender_filter  = "Female" if hostel_type == "LH" else "Male"

    # 2. Fetch all approved applications for the correct academic year (with leniency)
    # We fetch ALL approved apps first and then filter in Python for robustness
    apps_resp = await asyncio.to_thread(
        lambda: supabase_admin.table("application")
        .select("*, student (*)")
        .eq("status", "Approved")
        .execute()
    )

    def _get_gender(app_data):
        student = app_data.get("student")
        if not student: return None
        if isinstance(student, list) and len(student) > 0:
            student = student[0]
        if isinstance(student, dict):
            g = student.get("gender")
            return g.strip().capitalize() if g else None
        return None

    def _match_year(app_year, target_year):
        ay = str(app_year or "").strip().lower()
        ty = str(target_year or "").strip().lower()
        # Lenient match: e.g. "2026" matches "2026-2027"
        return ay == ty or (ay in ty and len(ay) >= 4) or (ty in ay and len(ty) >= 4)

    all_apps: List[Dict] = [
        a for a in (getattr(apps_resp, 'data', None) or [])
        if _match_year(a.get("academic_year"), academic_year) and _get_gender(a) == gender_filter.capitalize()
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

    # 3. Compute merit scores and update DB
    all_apps = _compute_merit_scores(all_apps)

    import httpx
    # Performance Update: Use httpx.AsyncClient completely asynchronously to avoid OS thread limit exhaustion [Errno 11]
    print(f"Updating merit scores for {len(all_apps)} applications concurrently without threads...")
    
    supabase_url = supabase_admin.supabase_url
    supabase_key = supabase_admin.supabase_key
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    async def update_app(client, a_to_update):
        app_id = a_to_update["application_id"]
        url = f"{supabase_url}/rest/v1/application?application_id=eq.{app_id}"
        payload = {"merit_score": a_to_update["merit_score"]}
        try:
            await client.patch(url, headers=headers, json=payload, timeout=20.0)
        except Exception as e:
            print(f"Failed to update score for app {app_id}: {e}")

    chunk_size = 100
    async with httpx.AsyncClient() as client:
        for i in range(0, len(all_apps), chunk_size):
            chunk = all_apps[i:i + chunk_size]
            tasks = [update_app(client, a) for a in chunk if a.get("application_id")]
            if tasks:
                await asyncio.gather(*tasks)

    print("[SYNC] Merit scores synchronized.")

    # 4. Filter already allotted students across ALL hostels for this academic year
    # We fetch all active allocations and their associated applications to check the year in Python.
    print(f"[SYNC] Checking for existing active allocations in {academic_year}...")
    raw_active = await asyncio.to_thread(
        lambda: supabase_admin.table("allocation")
        .select("allocation_id, application_id, application(student_id, academic_year)")
        .eq("status", "Active")
        .execute()
    )
    
    already_allotted_student_ids = set()
    if raw_active and getattr(raw_active, 'data', None):
        for item in raw_active.data:
            app_data = item.get("application")
            if isinstance(app_data, list) and len(app_data) > 0:
                app_data = app_data[0]
            
            if isinstance(app_data, dict):
                ay = str(app_data.get("academic_year", "")).strip()
                if ay == academic_year.strip():
                    already_allotted_student_ids.add(app_data.get("student_id"))

    print(f"[SYNC] Found {len(already_allotted_student_ids)} students already allotted for {academic_year}.")
    unallotted = [a for a in all_apps if a["student_id"] not in already_allotted_student_ids]


    total_allocated    = 0
    reserved_allocated = 0
    general_allocated  = 0
    today_str          = str(date.today())

    # 5. PHASE 1 — Reserved seat allocation
    cat_resp = await asyncio.to_thread(lambda: supabase_admin.table("benefit_category").select("*").eq("is_active", True).execute())
    active_categories = getattr(cat_resp, 'data', None) or []
    active_cat_map = {c["id"]: c for c in active_categories}

    # Identify candidates with any active reservation benefit
    reserved_candidates = []
    for app in unallotted:
        has_benefit = False
        selected_ids = app.get("selected_category_ids") or []
        
        # Check dynamic categories
        if any(cid in active_cat_map for cid in selected_ids):
            has_benefit = True
        
        # Fallback for legacy columns
        if not has_benefit and (app.get("pwd_status") or app.get("bpl_status") or app.get("sc_st_status")):
            has_benefit = True
            
        if has_benefit:
            reserved_candidates.append(app)

    reserved_candidates.sort(key=lambda a: -a.get("merit_score", 0))

    allocations_to_insert = []

    for app in reserved_candidates:
        if total_allocated >= reserved_seats:
            break

        # Determine the exact Enum Label for the database
        # Forensic verification: Found labels are "Reserved_PWD" and "General"
        category_enum = "General"
        selected_ids = app.get("selected_category_ids") or []
        
        # Priority: First matched dynamic category
        matched_cat = next((active_cat_map[cid] for cid in selected_ids if cid in active_cat_map), None)
        if matched_cat:
            category_enum = f"Reserved_{matched_cat['code']}"
        elif app.get("pwd_status"):   category_enum = "Reserved_PWD"
        elif app.get("bpl_status"):   category_enum = "Reserved_BPL"
        elif app.get("sc_st_status"): category_enum = "Reserved_SCST"

        allocations_to_insert.append({
            "application_id": app["application_id"],
            "hostel_id":       hostel_id,
            "allocation_date": today_str,
            "status":          "Active",
            "category":        category_enum
        })
        already_allotted_student_ids.add(app["student_id"])
        total_allocated += 1
        reserved_allocated += 1

    # 6. PHASE 2 — General seat allocation
    remaining_seats = available_capacity - total_allocated
    general_candidates = sorted(
        [a for a in unallotted if a["student_id"] not in already_allotted_student_ids],
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

    # 7. Finalize insertions in bulk
    if allocations_to_insert:
        await asyncio.to_thread(
            lambda: supabase_admin.table("allocation").insert(allocations_to_insert).execute()
        )


    return {
        "hostel_id":         hostel_id,
        "hostel_name":       hostel.get("hostel_name"),
        "academic_year":     academic_year,
        "total_allocated":   total_allocated,
        "reserved_allocated": reserved_allocated,
        "general_allocated": general_allocated,
        "message": f"Successfully processed {total_allocated} allotments."
    }

