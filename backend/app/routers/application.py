from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.config.supabase import supabase_admin
from app.middleware.auth import get_current_user, require_role
from app.schemas.application import ApplicationSubmitRequest, ApplicationResubmitRequest
from app.utils.response import success_response

router = APIRouter(prefix="/api/v1/application", tags=["Application"])


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


# ── POST /api/v1/application ─────────────────────────────────────────────────
@router.post("/", status_code=201)
async def submit_application(
    body: ApplicationSubmitRequest,
    user=Depends(require_role(["student"]))
):
    student_id = _get_student_id(user.id)

    # Check for existing application this year
    existing = (
        supabase_admin.table("application")
        .select("application_id")
        .eq("student_id", student_id)
        .eq("academic_year", body.academic_year)
        .maybe_single()
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=409,
            detail="Application already submitted for this academic year"
        )

    # 1. Fetch current profile to create the application snapshot
    academics = (
        supabase_admin.table("student_academics")
        .select("family_annual_income, distance_from_college, bpl_status, pwd_status, sc_st_status")
        .eq("student_id", student_id)
        .single()
        .execute()
    )
    if not academics.data:
        raise HTTPException(status_code=400, detail="Student profile (academics) not found. Please complete profile first.")

    prof = academics.data

    # 2. Insert Application with snapshot values
    resp = (
        supabase_admin.table("application")
        .insert({
            "student_id": student_id,
            "academic_year": body.academic_year,
            "family_annual_income": prof["family_annual_income"],
            "distance_from_college": prof["distance_from_college"],
            "bpl_status": prof["bpl_status"],
            "pwd_status": prof["pwd_status"],
            "sc_st_status": prof["sc_st_status"],
            "status": "Pending"
        })
        .execute()
    )
    return success_response("Application submitted", resp.data[0])


# ── GET /api/v1/application/my ───────────────────────────────────────────────
@router.get("/my")
async def get_my_application(user=Depends(get_current_user)):
    student_id = _get_student_id(user.id)

    resp = (
        supabase_admin.table("application")
        .select("""
            *,
            student ( 
                first_name, last_name, college_id,
                class ( degree_program, department, year, division )
            ),
            allocation (
                allocation_id, allocation_date, status, category,
                hostel ( hostel_name, hostel_type )
            )
        """)
        .eq("student_id", student_id)
        .order("academic_year", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="No application found")
    return success_response("Application", resp.data)


# ── PUT /api/v1/application/my ───────────────────────────────────────────────
@router.put("/my")
async def resubmit_application(
    body: ApplicationResubmitRequest,
    user=Depends(require_role(["student"]))
):
    student_id = _get_student_id(user.id)

    resp = (
        supabase_admin.table("application")
        .update({
            "family_annual_income": body.family_annual_income,
            "distance_from_college": body.distance_from_college,
            "status": "Pending",
            "remarks": None
        })
        .eq("student_id", student_id)
        .eq("academic_year", body.academic_year)
        .eq("status", "Returned")
        .execute()
    )
    if not resp.data:
        raise HTTPException(
            status_code=404,
            detail="No returned application found for this year"
        )
    return success_response("Application resubmitted", resp.data[0])


# ── GET /api/v1/application/{application_id} ────────────────────────────────
@router.get("/{application_id}")
async def get_application_by_id(
    application_id: int,
    user=Depends(require_role(["admin", "advisor"]))
):
    resp = (
        supabase_admin.table("application")
        .select("""
            *,
            student (
                college_id, first_name, middle_name, last_name, gender,
                class ( degree_program, department, year, division )
            )
        """)
        .eq("application_id", application_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return success_response("Application", resp.data)


# ── GET /api/v1/application ──────────────────────────────────────────────────
@router.get("/")
async def get_all_applications(
    status: Optional[str] = None,
    academic_year: Optional[int] = None,
    gender: Optional[str] = None,
    department: Optional[str] = None,
    user=Depends(require_role(["admin"]))
):
    query = (
        supabase_admin.table("v_application_dashboard")
        .select("*")
        .order("merit_score", desc=True)
    )
    if status:
        query = query.eq("status", status)
    if academic_year:
        query = query.eq("academic_year", academic_year)
    if gender:
        query = query.eq("gender", gender)
    if department:
        query = query.eq("department", department)

    resp = query.execute()
    return success_response("All Applications", resp.data)
