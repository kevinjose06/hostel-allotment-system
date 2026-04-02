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
    if existing and existing.data:
        raise HTTPException(
            status_code=409,
            detail="Application already submitted for this academic year"
        )

    # 1. Fetch current profile snapshot for advisor_id
    student_info = (
        supabase_admin.table("student")
        .select("class_id, class(advisor_id)")
        .eq("student_id", student_id)
        .single()
        .execute()
    )
    
    # Safely extract advisor_id
    cls_data = student_info.data.get("class", {})
    if isinstance(cls_data, list) and len(cls_data) > 0:
        cls_data = cls_data[0]
    
    advisor_id = cls_data.get("advisor_id")
    if not advisor_id:
         raise HTTPException(status_code=400, detail="No advisor assigned to your class. Please contact Admin.")

    # 2. Calculate merit score (identical logic to frontend)
    # Income points: 50 - (income / 100000) * 5
    # Distance points: (distance / 500) * 50
    income_pts = max(0, 50 - (body.family_annual_income / 100000) * 5)
    dist_pts = min(50, (body.distance_from_college / 500) * 50)
    merit_score = round(income_pts + dist_pts, 2)

    # 3. Insert Application
    resp = (
        supabase_admin.table("application")
        .insert({
            "student_id": student_id,
            "advisor_id": advisor_id,
            "academic_year": body.academic_year,
            "family_annual_income": body.family_annual_income,
            "distance_from_college": body.distance_from_college,
            "bpl_status": body.bpl_status,
            "pwd_status": body.pwd_status,
            "sc_st_status": body.sc_st_status,
            "home_address": body.home_address,
            "guardian_name": body.guardian_name,
            "guardian_contact": body.guardian_contact,
            "merit_score": merit_score,
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

    # Re-calculate merit score
    income_pts = max(0, 50 - (body.family_annual_income / 100000) * 5)
    dist_pts = min(50, (body.distance_from_college / 500) * 50)
    merit_score = round(income_pts + dist_pts, 2)

    updates = {
        "family_annual_income": body.family_annual_income,
        "distance_from_college": body.distance_from_college,
        "merit_score": merit_score,
        "status": "Pending",
        "remarks": None
    }
    
    # Add other fields if provided (exclude_none already handles this in most cases but we map explicitly for safety)
    if body.home_address: updates["home_address"] = body.home_address
    if body.guardian_name: updates["guardian_name"] = body.guardian_name
    if body.guardian_contact: updates["guardian_contact"] = body.guardian_contact
    if body.bpl_status is not None: updates["bpl_status"] = body.bpl_status
    if body.pwd_status is not None: updates["pwd_status"] = body.pwd_status
    if body.sc_st_status is not None: updates["sc_st_status"] = body.sc_st_status

    resp = (
        supabase_admin.table("application")
        .update(updates)
        .eq("student_id", student_id)
        .eq("academic_year", body.academic_year)
        .in_("status", ["Pending", "Returned"]) # Allow editing both
        .execute()
    )
    if not resp.data:
        raise HTTPException(
            status_code=404,
            detail="No application found to update"
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
