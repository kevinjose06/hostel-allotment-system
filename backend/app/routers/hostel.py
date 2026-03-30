from fastapi import APIRouter, Depends, HTTPException
from app.config.supabase import supabase_admin
from app.middleware.auth import get_current_user
from app.utils.response import success_response

router = APIRouter(prefix="/api/v1/hostel", tags=["Hostel"])


# ── GET /api/v1/hostel ───────────────────────────────────────────────────────
@router.get("/")
async def get_all_hostels(user=Depends(get_current_user)):
    resp = (
        supabase_admin.table("v_hostel_occupancy")
        .select("*")
        .execute()
    )
    return success_response("Hostels", resp.data)


# ── GET /api/v1/hostel/{hostel_id} ───────────────────────────────────────────
@router.get("/{hostel_id}")
async def get_hostel_by_id(hostel_id: int, user=Depends(get_current_user)):
    resp = (
        supabase_admin.table("hostel")
        .select("*, warden(*)")
        .eq("hostel_id", hostel_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Hostel not found")
    return success_response("Hostel", resp.data)


# ── GET /api/v1/hostel/{hostel_id}/occupancy ─────────────────────────────────
@router.get("/{hostel_id}/occupancy")
async def get_hostel_occupancy(hostel_id: int, user=Depends(get_current_user)):
    resp = (
        supabase_admin.table("v_hostel_occupancy")
        .select("*")
        .eq("hostel_id", hostel_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Hostel not found")
    return success_response("Hostel occupancy", resp.data)
