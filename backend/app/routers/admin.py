from fastapi import APIRouter, Depends, HTTPException
from app.config.supabase import supabase_admin
from app.middleware.auth import require_role
from app.schemas.admin import (
    CreateAdvisorRequest, UpdateAdvisorRequest,
    CreateClassRequest, CreateHostelRequest,
    UpdateHostelRequest, CreateWardenRequest, UpdateWardenRequest
)
from app.schemas.config import SystemConfigRequest, SystemConfigResponse
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

_admin = Depends(require_role(["admin"]))
_admin_warden = Depends(require_role(["admin", "warden"]))


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
    # Fetch advisors
    adv_resp = supabase_admin.table("class_advisor").select("*").order("name").execute()
    advisors_list = adv_resp.data if adv_resp.data else []

    # Fetch all classes
    cls_resp = supabase_admin.table("class").select("class_id, degree_program, department, year, division, advisor_id").execute()
    classes_list = cls_resp.data if cls_resp.data else []

    # Map classes to advisors
    for adv in advisors_list:
        adv_classes = [c for c in classes_list if c.get("advisor_id") == adv.get("advisor_id")]
        adv["classes"] = adv_classes

    return success_response("Advisors", advisors_list)


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


# ── DELETE /api/v1/admin/class/{class_id} ───────────────────────────────────
@router.delete("/class/{class_id}")
async def delete_class(class_id: int, user=_admin):
    resp = (
        supabase_admin.table("class")
        .delete()
        .eq("class_id", class_id)
        .execute()
    )
    return success_response("Class deleted")


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


# ── POST /api/v1/admin/hostel/{hostel_id}/assign-warden ──────────────────────
@router.post("/hostel/{hostel_id}/assign-warden")
async def assign_warden_to_hostel(hostel_id: int, body: dict, user=_admin):
    warden_id = body.get("warden_id")
    
    # 1. Unassign current warden(s) from this hostel
    supabase_admin.table("warden").update({"hostel_id": None}).eq("hostel_id", hostel_id).execute()
    
    # 2. Assign new warden if provided
    if warden_id:
        resp = (
            supabase_admin.table("warden")
            .update({"hostel_id": hostel_id})
            .eq("warden_id", warden_id)
            .execute()
        )
        return success_response("Warden assigned", resp.data[0] if resp.data else None)
    
    return success_response("Warden unassigned")


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


# ── GET /api/v1/admin/wardens ────────────────────────────────────────────────
@router.get("/wardens")
async def get_all_wardens(user=_admin):
    resp = (
        supabase_admin.table("warden")
        .select("*, hostel(*)")
        .order("name")
        .execute()
    )
    return success_response("Wardens", resp.data)


# ── PUT /api/v1/admin/warden/{warden_id} ─────────────────────────────────────
@router.put("/warden/{warden_id}")
async def update_warden(warden_id: int, body: UpdateWardenRequest, user=_admin):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    resp = (
        supabase_admin.table("warden")
        .update(updates)
        .eq("warden_id", warden_id)
        .execute()
    )
    return success_response("Warden updated", resp.data[0] if resp.data else None)


# ── DELETE /api/v1/admin/warden/{warden_id} ──────────────────────────────────
@router.delete("/warden/{warden_id}")
async def delete_warden(warden_id: int, user=_admin):
    resp = (
        supabase_admin.table("warden")
        .delete()
        .eq("warden_id", warden_id)
        .execute()
    )
    return success_response("Warden deleted")


# ── GET /api/v1/admin/stats ──────────────────────────────────────────────────
@router.get("/stats")
async def get_dashboard_stats(
    status: Optional[str] = None,
    academic_year: Optional[str] = None,
    hostel_id: Optional[int] = None,
    user=_admin_warden
):
    # Fetch applications with optional filtering
    query = supabase_admin.table("v_application_dashboard").select("*")
    
    if status and status != 'All':
        query = query.eq("status", status)
    if academic_year:
        query = query.eq("academic_year", academic_year)
    if hostel_id:
        query = query.eq("hostel_id", hostel_id)
        
    applications = query.order("merit_score", desc=True).execute()
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


# ── GET /api/v1/admin/config ────────────────────────────────────────────────
@router.get("/config")
async def get_all_configs(user=_admin_warden):
    resp = supabase_admin.table("system_config").select("*").execute()
    # Convert list of {key, value} to {key: value} for easier frontend use
    config_dict = {item["config_key"]: item["config_value"] for item in resp.data}
    return success_response("System configurations", config_dict)


# ── POST /api/v1/admin/config ───────────────────────────────────────────────
@router.post("/config")
async def update_config(body: SystemConfigRequest, user=_admin):
    resp = (
        supabase_admin.table("system_config")
        .upsert({"config_key": body.config_key, "config_value": body.config_value})
        .execute()
    )
    return success_response("Configuration updated", resp.data[0] if resp.data else None)


# ── GET /api/v1/admin/reservation-categories ──────────────────────────────
@router.get("/reservation-categories")
async def get_all_reservation_categories(user=_admin_warden):
    resp = supabase_admin.table("benefit_category").select("*").order("id").execute()
    return success_response("Reservation categories", resp.data)


# ── POST /api/v1/admin/reservation-categories ─────────────────────────────
@router.post("/reservation-categories")
async def upsert_reservation_category(body: dict, user=_admin):
    # If code is missing, slugify the name
    if not body.get("code") and body.get("name"):
        import re
        name = body["name"].upper()
        if "SC" in name and "ST" in name:
            body["code"] = "SCST"
        else:
            body["code"] = re.sub(r'[^a-zA-Z0-9]', '', body["name"]).upper()[:20]
    
    resp = (
        supabase_admin.table("benefit_category")
        .upsert(body)
        .execute()
    )
    return success_response("Category updated", resp.data[0] if resp.data else None)


@router.delete("/reservation-categories/{cat_id}")
async def delete_reservation_category(cat_id: int, user=_admin):
    # Check if any application is currently using this category
    # Postgres ANY operator to check for membership in an array
    usage_check = (
        supabase_admin.table("application")
        .select("application_id", count="exact")
        .contains("selected_category_ids", [cat_id])
        .execute()
    )
    
    if usage_check.count and usage_check.count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete category: {usage_check.count} student applications are currently using it."
        )

    resp = (
        supabase_admin.table("benefit_category")
        .delete()
        .eq("id", cat_id)
        .execute()
    )
    return success_response("Category deleted", None)


# ── GET /api/v1/admin/warden/me ──────────────────────────────────────────────
# Used by a logged-in warden to find their own profile + assigned hostel
@router.get("/warden/me")
async def get_my_warden_profile(user=Depends(require_role(["warden"]))):
    resp = (
        supabase_admin.table("warden")
        .select("*, hostel(*)")
        .eq("auth_uid", user.id)
        .maybe_single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Warden profile not found")
    return success_response("Warden profile", resp.data)
