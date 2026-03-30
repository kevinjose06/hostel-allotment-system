from fastapi import APIRouter, Depends, HTTPException
from app.config.supabase import supabase_admin
from app.middleware.auth import require_role
from app.schemas.admin import (
    CreateAdvisorRequest, UpdateAdvisorRequest,
    CreateClassRequest, CreateHostelRequest,
    UpdateHostelRequest, CreateWardenRequest
)
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

_admin = Depends(require_role(["admin"]))


# ── POST /api/v1/admin/advisor ───────────────────────────────────────────────
@router.post("/advisor", status_code=201)
async def create_advisor(body: CreateAdvisorRequest, user=_admin):
    # Get admin row
    admin_row = (
        supabase_admin.table("admin")
        .select("admin_id")
        .eq("auth_uid", user.id)
        .single()
        .execute()
    )
    if not admin_row.data:
        raise HTTPException(status_code=404, detail="Admin record not found")

    # Create Supabase Auth account for advisor
    try:
        auth_resp = supabase_admin.auth.admin.create_user({
            "email": body.email,
            "password": body.temp_password,
            "user_metadata": {"role": "advisor", "name": body.name},
            "email_confirm": True
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Insert advisor row
    try:
        db_resp = (
            supabase_admin.table("class_advisor")
            .insert({
                "name": body.name,
                "department": body.department,
                "email": body.email,
                "contact_no": body.contact_no,
                "admin_id": admin_row.data["admin_id"],
                "auth_uid": auth_resp.user.id,
            })
            .execute()
        )
    except Exception as e:
        supabase_admin.auth.admin.delete_user(auth_resp.user.id)
        raise HTTPException(status_code=400, detail=str(e))

    return success_response("Advisor created", db_resp.data[0])


# ── GET /api/v1/admin/advisors ───────────────────────────────────────────────
@router.get("/advisors")
async def get_all_advisors(user=_admin):
    resp = (
        supabase_admin.table("class_advisor")
        .select("*, class(class_id, degree_program, department, year, division)")
        .order("name")
        .execute()
    )
    return success_response("Advisors", resp.data)


# ── PUT /api/v1/admin/advisor/{advisor_id} ───────────────────────────────────
@router.put("/advisor/{advisor_id}")
async def update_advisor(advisor_id: int, body: UpdateAdvisorRequest, user=_admin):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    resp = (
        supabase_admin.table("class_advisor")
        .update(updates)
        .eq("advisor_id", advisor_id)
        .execute()
    )
    return success_response("Advisor updated", resp.data[0] if resp.data else None)


# ── DELETE /api/v1/admin/advisor/{advisor_id} ────────────────────────────────
@router.delete("/advisor/{advisor_id}")
async def delete_advisor(advisor_id: int, user=_admin):
    resp = (
        supabase_admin.table("class_advisor")
        .delete()
        .eq("advisor_id", advisor_id)
        .execute()
    )
    return success_response("Advisor deleted")


# ── POST /api/v1/admin/class ─────────────────────────────────────────────────
@router.post("/class", status_code=201)
async def create_class(body: CreateClassRequest, user=_admin):
    resp = (
        supabase_admin.table("class")
        .insert(body.model_dump())
        .execute()
    )
    return success_response("Class created", resp.data[0])


# ── GET /api/v1/admin/classes ────────────────────────────────────────────────
@router.get("/classes")
async def get_all_classes(user=_admin):
    resp = (
        supabase_admin.table("class")
        .select("*, class_advisor(name, email)")
        .order("degree_program")
        .execute()
    )
    return success_response("Classes", resp.data)


# ── PUT /api/v1/admin/class/{class_id} ──────────────────────────────────────
@router.put("/class/{class_id}")
async def update_class(class_id: int, body: dict, user=_admin):
    resp = (
        supabase_admin.table("class")
        .update(body)
        .eq("class_id", class_id)
        .execute()
    )
    return success_response("Class updated", resp.data[0] if resp.data else None)


# ── POST /api/v1/admin/hostel ────────────────────────────────────────────────
@router.post("/hostel", status_code=201)
async def create_hostel(body: CreateHostelRequest, user=_admin):
    resp = (
        supabase_admin.table("hostel")
        .insert(body.model_dump())
        .execute()
    )
    return success_response("Hostel created", resp.data[0])


# ── PUT /api/v1/admin/hostel/{hostel_id} ─────────────────────────────────────
@router.put("/hostel/{hostel_id}")
async def update_hostel(hostel_id: int, body: UpdateHostelRequest, user=_admin):
    updates = body.model_dump(exclude_none=True)
    resp = (
        supabase_admin.table("hostel")
        .update(updates)
        .eq("hostel_id", hostel_id)
        .execute()
    )
    return success_response("Hostel updated", resp.data[0] if resp.data else None)


# ── POST /api/v1/admin/warden ────────────────────────────────────────────────
@router.post("/warden", status_code=201)
async def create_warden(body: CreateWardenRequest, user=_admin):
    try:
        auth_resp = supabase_admin.auth.admin.create_user({
            "email": body.email,
            "password": body.temp_password,
            "user_metadata": {"role": "warden", "name": body.name},
            "email_confirm": True
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        db_resp = (
            supabase_admin.table("warden")
            .insert({
                "name": body.name,
                "email": body.email,
                "contact_no": body.contact_no,
                "hostel_id": body.hostel_id,
                "auth_uid": auth_resp.user.id,
            })
            .execute()
        )
    except Exception as e:
        supabase_admin.auth.admin.delete_user(auth_resp.user.id)
        raise HTTPException(status_code=400, detail=str(e))

    return success_response("Warden created", db_resp.data[0])


# ── GET /api/v1/admin/stats ──────────────────────────────────────────────────
@router.get("/stats")
async def get_dashboard_stats(user=_admin):
    applications = (
        supabase_admin.table("application")
        .select("status")
        .execute()
    )
    allocations = (
        supabase_admin.table("allocation")
        .select("status")
        .execute()
    )
    hostels = (
        supabase_admin.table("v_hostel_occupancy")
        .select("*")
        .execute()
    )
    return success_response("Stats", {
        "applications": applications.data,
        "allocations": allocations.data,
        "hostels": hostels.data
    })
