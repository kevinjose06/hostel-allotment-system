from fastapi import APIRouter, Depends, HTTPException
from app.config.supabase import supabase_admin
from app.middleware.auth import get_current_user, require_role
from app.schemas.student import StudentProfileUpdate, AcademicsUpdate
from app.utils.response import success_response

router = APIRouter(prefix="/api/v1/student", tags=["Student"])


def _get_student_id(user_id: str, email: str = None) -> int:
    # 1. Try by auth_uid (Priority)
    resp = (
        supabase_admin.table("student")
        .select("student_id")
        .eq("auth_uid", user_id)
        .maybe_single()
        .execute()
    )
    
    # 2. Fallback to Email (Heals broken auth links)
    if not resp.data and email:
        print(f"⚠️ Identity Fallback: UID {user_id} not found in student table. Trying email {email}")
        resp = (
            supabase_admin.table("student")
            .select("student_id")
            .ilike("email", email)
            .maybe_single()
            .execute()
        )

    if not resp.data:
        print(f"❌ Identity Error: No student record found for UID {user_id} / Email {email}")
        raise HTTPException(status_code=404, detail="Student record not found")
    
    return resp.data["student_id"]


# ── GET /api/v1/student/profile ──────────────────────────────────────────────
@router.get("/profile")
async def get_my_profile(user=Depends(get_current_user)):
    student_id = _get_student_id(user.id, user.email)
    
    resp = (
        supabase_admin.table("student")
        .select("""
            *,
            student_academics (*),
            class (
                degree_program, department, year, division, advisor_id,
                class_advisor ( advisor_id, name, email, contact_no )
            )
        """)
        .eq("student_id", student_id)
        .maybe_single()
        .execute()
    )

    if not resp or not getattr(resp, 'data', None):
        raise HTTPException(status_code=404, detail="Student profile not found")
    return success_response("Profile", resp.data)


# ── PUT /api/v1/student/profile ──────────────────────────────────────────────
@router.put("/profile")
async def update_profile(
    body: StudentProfileUpdate,
    user=Depends(require_role(["student"]))
):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Separating generic student fields from academic/merit fields
    academic_fields = ['family_annual_income', 'distance_from_college', 'bpl_status', 'pwd_status', 'sc_st_status']
    student_updates = {k: v for k, v in updates.items() if k not in academic_fields}
    merit_updates = {k: v for k, v in updates.items() if k in academic_fields}

    # 1. Update Student Basic Info
    if student_updates:
        supabase_admin.table("student").update(student_updates).eq("auth_uid", user.id).execute()

    # 2. Update Student Academics & Active Application
    if merit_updates:
        student_id = _get_student_id(user.id, user.email)
        # Persistent storage in academics table
        supabase_admin.table("student_academics").upsert({"student_id": student_id, **merit_updates}).execute()
        
        # Session-specific update (if application exists for current year)
        # Fetch current config year
        cfg_resp = supabase_admin.table("system_config").select("config_value").eq("config_key", "academic_year").execute()
        active_year = cfg_resp.data[0]["config_value"] if cfg_resp.data else None
        
        if active_year:
            supabase_admin.table("application").update(merit_updates).eq("student_id", student_id).eq("academic_year", active_year).execute()

    return success_response("Profile and associated application updated")


# ── PUT /api/v1/student/academics ────────────────────────────────────────────
@router.put("/academics")
async def update_academics(
    body: AcademicsUpdate,
    user=Depends(require_role(["student"]))
):
    student_id = _get_student_id(user.id, user.email)
    updates = body.model_dump(exclude_none=True)

    resp = (
        supabase_admin.table("student_academics")
        .upsert({"student_id": student_id, **updates})
        .execute()
    )
    return success_response("Academics updated", resp.data[0] if resp.data else None)



# ── GET /api/v1/student/classes ──────────────────────────────────────────────
# Public — used in the registration form dropdown
@router.get("/classes")
async def get_available_classes():
    resp = (
        supabase_admin.table("class")
        .select("""
            class_id, degree_program, department,
            year, division, academic_year,
            class_advisor ( name )
        """)
        .order("degree_program")
        .order("department")
        .order("year")
        .execute()
    )
    return success_response("Classes", resp.data)
# ── GET /api/v1/student/config ──────────────────────────────────────────────
@router.get("/config")
async def get_student_config(user=Depends(get_current_user)):
    resp = supabase_admin.table("system_config").select("*").execute()
    config_dict = {item["config_key"]: item["config_value"] for item in resp.data}
    return success_response("System configuration", config_dict)


# ── GET /api/v1/student/reservation-categories ──────────────────────────────
@router.get("/reservation-categories")
async def get_active_reservation_categories(user=Depends(get_current_user)):
    resp = (
        supabase_admin.table("benefit_category")
        .select("*")
        .eq("is_active", True)
        .order("id")
        .execute()
    )
    return success_response("Reservation categories", resp.data)
