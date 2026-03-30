from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.config.supabase import supabase_admin
from app.middleware.auth import require_role
from app.schemas.allotment import AllotmentRequest, ComputeScoresRequest
from app.services.allotment_engine import run_hostel_allotment
from app.utils.response import success_response

router = APIRouter(prefix="/api/v1/allotment", tags=["Allotment"])

_warden_admin = Depends(require_role(["admin", "warden"]))


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
    if not hostel_resp.data:
        raise HTTPException(status_code=404, detail="Hostel not found")

    try:
        result = await run_hostel_allotment(body.hostel_id, body.academic_year)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return success_response("Allotment completed", result)


# ── GET /api/v1/allotment/results ────────────────────────────────────────────
@router.get("/results")
async def get_allotment_results(
    academic_year: Optional[int] = None,
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
async def get_hostel_allotment_results(hostel_id: int, user=_warden_admin):
    resp = (
        supabase_admin.table("v_allocation_result")
        .select("*")
        .eq("hostel_id", hostel_id)
        .order("allocation_date", desc=True)
        .execute()
    )
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


# ── POST /api/v1/allotment/compute-scores ────────────────────────────────────
@router.post("/compute-scores")
async def compute_merit_scores(body: ComputeScoresRequest, user=_warden_admin):
    resp = supabase_admin.rpc(
        "compute_merit_scores",
        {"p_academic_year": body.academic_year}
    ).execute()
    return success_response("Merit scores computed")
