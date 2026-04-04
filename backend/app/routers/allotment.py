from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Optional, List
from app.config.supabase import supabase_admin
from app.middleware.auth import require_role
from app.schemas.allotment import AllotmentRequest, ComputeScoresRequest
from app.services.allotment_engine import run_hostel_allotment
from app.utils.response import success_response

router = APIRouter(prefix="/api/v1/allotment", tags=["Allotment"])

_warden_admin = Depends(require_role(["admin", "warden"]))
_warden_only = Depends(require_role(["warden"]))


# ── POST /api/v1/allotment/run ───────────────────────────────────────────────
@router.post("/run")
async def trigger_allotment(body: AllotmentRequest, user=_warden_admin):
    # Verify hostel exists
    hostel_resp = (
        supabase_admin.table("hostel")
        .select("hostel_id, hostel_name")
        .eq("hostel_id", body.hostel_id)
        .maybe_single()
        .execute()
    )
    if not hostel_resp or not getattr(hostel_resp, 'data', None):
        raise HTTPException(status_code=404, detail="Hostel not found")

    try:
        result = await run_hostel_allotment(body.hostel_id, body.academic_year)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return success_response("Allotment completed", result)


# ── GET /api/v1/allotment/results ────────────────────────────────────────────
@router.get("/results")
async def get_allotment_results(
    academic_year: Optional[str] = None,
    user=_warden_admin
):
    query = (
        supabase_admin.table("v_allocation_result")
        .select("*")
        .order("allocation_date", desc=True)
    )
    if academic_year:
        query = query.eq("academic_year", academic_year)

    resp = query.execute()
    return success_response("Allotment results", resp.data)


# ── GET /api/v1/allotment/hostel/{hostel_id} ─────────────────────────────────
@router.get("/hostel/{hostel_id}")
async def get_hostel_allotment_results(
    hostel_id: int, 
    academic_year: Optional[str] = None,
    user=_warden_admin
):
    query = (
        supabase_admin.table("v_allocation_result")
        .select("*")
        .eq("hostel_id", hostel_id)
        .order("allocation_date", desc=True)
    )
    if academic_year:
        query = query.eq("academic_year", academic_year)
        
    resp = query.execute()
    return success_response("Hostel allotment results", resp.data)


# ── PATCH /api/v1/allotment/{allocation_id}/cancel ───────────────────────────
@router.patch("/{allocation_id}/cancel")
async def cancel_allocation(allocation_id: int, user=_warden_admin):
    resp = (
        supabase_admin.table("allocation")
        .update({"status": "Cancelled"})
        .eq("allocation_id", allocation_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Allocation not found")
    return success_response("Allocation cancelled", resp.data[0])


# ── GET /api/v1/allotment/residents ──────────────────────────────────────────
# Returns all currently Active allocations for a hostel, optionally filtered by year
@router.get("/residents")
async def get_residents(hostel_id: Optional[int] = None, academic_year: Optional[str] = None, user=_warden_admin):
    role = user.user_metadata.get("role")
    target_hostel_id = hostel_id
    
    if role == "warden":
        w_resp = supabase_admin.table("warden").select("hostel_id").eq("auth_uid", user.id).maybe_single().execute()
        if not w_resp or not getattr(w_resp, 'data', None):
            raise HTTPException(status_code=403, detail="Warden profile not found")
        target_hostel_id = w_resp.data["hostel_id"]

    query = (
        supabase_admin.table("allocation")
        .select("allocation_id, status, allocation_date, category, hostel_id, application(application_id, academic_year, student(student_id, first_name, middle_name, last_name, college_id, gender))")
        .eq("status", "Active")
        .order("allocation_date", desc=True)
    )
    if target_hostel_id:
        query = query.eq("hostel_id", target_hostel_id)
    resp = query.execute()
    rows = resp.data or []
    # Filter by academic_year in Python if provided
    if academic_year:
        def _year(row):
            app = row.get("application")
            if isinstance(app, list): app = app[0] if app else {}
            return str((app or {}).get("academic_year", "")).strip()
        rows = [r for r in rows if _year(r) == academic_year.strip()]
    return success_response("Residents fetched", rows)


# ── POST /api/v1/allotment/vacate ─────────────────────────────────────────────
# Marks a list of allocation_ids as Vacated (student passed out / left hostel)
@router.post("/vacate")
async def vacate_allocations(allocation_ids: List[int] = Body(...), user=_warden_admin):
    if not allocation_ids:
        raise HTTPException(status_code=400, detail="No allocation IDs provided")
    resp = (
        supabase_admin.table("allocation")
        .update({"status": "Vacated"})
        .in_("allocation_id", allocation_ids)
        .execute()
    )
    return success_response(f"Vacated {len(resp.data or [])} allocations", resp.data)


# ── POST /api/v1/allotment/compute-scores ────────────────────────────────────
@router.post("/compute-scores")
async def compute_merit_scores(body: ComputeScoresRequest, user=_warden_admin):
    resp = supabase_admin.rpc(
        "compute_merit_scores",
        {"p_academic_year": body.academic_year}
    ).execute()
    return success_response("Merit scores computed")
