from fastapi import APIRouter, Depends, HTTPException
from app.config.supabase import supabase_admin
from app.middleware.auth import get_current_user
from app.utils.response import success_response

router = APIRouter(prefix="/api/v1/hostel", tags=["Hostel"])


# ── GET /api/v1/hostel ───────────────────────────────────────────────────────
@router.get("/")
async def get_all_hostels(user=Depends(get_current_user)):
    # Fetch base hostel occupancy view
    resp = supabase_admin.table("v_hostel_occupancy").select("*").execute()
    hostels = resp.data or []

    # Fetch reservation percentage from system_config
    res_percent = 20  # default fallback
    try:
        cfg = (
            supabase_admin.table("system_config")
            .select("config_value")
            .eq("config_key", "reservation_percentage")
            .maybe_single()
            .execute()
        )
        if cfg.data:
            res_percent = int(cfg.data["config_value"])
    except Exception:
        pass

    # Fetch all wardens with their hostel assignments
    wardens_resp = supabase_admin.table("warden").select("warden_id, name, contact_no, hostel_id").execute()
    warden_map = {}  # hostel_id -> warden row
    for w in (wardens_resp.data or []):
        if w.get("hostel_id"):
            warden_map[w["hostel_id"]] = w

    # Enrich each hostel row
    for h in hostels:
        cap = h.get("total_capacity") or 0
        h["reserved_seats"] = round(cap * res_percent / 100)
        warden = warden_map.get(h["hostel_id"])
        h["warden_name"] = warden["name"] if warden else None
        h["warden_contact_no"] = warden["contact_no"] if warden else None
        h["warden_id"] = warden["warden_id"] if warden else None

    return success_response("Hostels", hostels)


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
