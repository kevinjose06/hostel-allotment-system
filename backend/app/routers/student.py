from fastapi import APIRouter, Depends, HTTPException
from app.config.supabase import supabase_admin
from app.middleware.auth import get_current_user, require_role
from app.schemas.student import StudentProfileUpdate, AcademicsUpdate
from app.utils.response import success_response

router = APIRouter(prefix="/api/v1/student", tags=["Student"])


def _get_student_id(user_id: str) -> int:
    resp = (
        supabase_admin.table("student")
        .select("student_id")
        .eq("auth_uid", user_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Student record not found")
    return resp.data["student_id"]


# ── GET /api/v1/student/profile ──────────────────────────────────────────────
@router.get("/profile")
async def get_my_profile(user=Depends(get_current_user)):
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
        .eq("auth_uid", user.id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Student not found")
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

    resp = (
        supabase_admin.table("student")
        .update(updates)
        .eq("auth_uid", user.id)
        .execute()
    )
    return success_response("Profile updated", resp.data[0] if resp.data else None)


# ── PUT /api/v1/student/academics ────────────────────────────────────────────
@router.put("/academics")
async def update_academics(
    body: AcademicsUpdate,
    user=Depends(require_role(["student"]))
):
    student_id = _get_student_id(user.id)
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
