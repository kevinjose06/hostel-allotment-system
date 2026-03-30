from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.config.supabase import supabase_admin
from app.middleware.auth import require_role
from app.schemas.application import AdvisorActionRequest
from app.services.email_service import send_application_status_email
from app.utils.response import success_response
from datetime import date

router = APIRouter(prefix="/api/v1/advisor", tags=["Advisor"])

_advisor = Depends(require_role(["advisor", "admin"]))


def _get_advisor_id(user_id: str) -> int:
    resp = (
        supabase_admin.table("class_advisor")
        .select("advisor_id")
        .eq("auth_uid", user_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Advisor record not found")
    return resp.data["advisor_id"]


# ── GET /api/v1/advisor/applications ────────────────────────────────────────
@router.get("/applications")
async def get_my_applications(
    status: Optional[str] = None,
    academic_year: Optional[int] = None,
    user=_advisor
):
    advisor_id = _get_advisor_id(user.id)

    query = (
        supabase_admin.table("application")
        .select("""
            *,
            student (
                college_id, first_name, last_name, gender,
                bpl_status, pwd_status, sc_st_status,
                family_annual_income, distance_from_college,
                class ( degree_program, department, year, division )
            )
        """)
        .eq("advisor_id", advisor_id)
        .order("submitted_at", desc=True)
    )

    if status:
        query = query.eq("status", status)
    if academic_year:
        query = query.eq("academic_year", academic_year)

    resp = query.execute()
    return success_response("Applications", resp.data)


# ── GET /api/v1/advisor/application/{application_id} ───────────────────────
@router.get("/application/{application_id}")
async def get_application_detail(application_id: int, user=_advisor):
    advisor_id = _get_advisor_id(user.id)

    resp = (
        supabase_admin.table("application")
        .select("""
            *,
            student (
                *, student_academics (*),
                class ( degree_program, department, year, division )
            )
        """)
        .eq("application_id", application_id)
        .eq("advisor_id", advisor_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Application not found")

    return success_response("Application", resp.data)


# ── PATCH /api/v1/advisor/application/{application_id}/approve ──────────────
@router.patch("/application/{application_id}/approve")
async def approve_application(
    application_id: int,
    body: AdvisorActionRequest,
    user=_advisor
):
    advisor_id = _get_advisor_id(user.id)

    resp = (
        supabase_admin.table("application")
        .update({
            "status": "Approved",
            "reviewed_date": str(date.today()),
            "remarks": body.remarks
        })
        .eq("application_id", application_id)
        .eq("advisor_id", advisor_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Application not found or not yours")

    # Fetch student email for notification
    app_data = resp.data[0]
    student_resp = (
        supabase_admin.table("student")
        .select("email, first_name")
        .eq("student_id", app_data["student_id"])
        .single()
        .execute()
    )
    if student_resp.data:
        await send_application_status_email(
            student_resp.data["email"],
            student_resp.data["first_name"],
            "Approved"
        )

    return success_response("Application approved", app_data)


# ── PATCH /api/v1/advisor/application/{application_id}/reject ───────────────
@router.patch("/application/{application_id}/reject")
async def reject_application(
    application_id: int,
    body: AdvisorActionRequest,
    user=_advisor
):
    advisor_id = _get_advisor_id(user.id)

    resp = (
        supabase_admin.table("application")
        .update({
            "status": "Rejected",
            "reviewed_date": str(date.today()),
            "remarks": body.remarks
        })
        .eq("application_id", application_id)
        .eq("advisor_id", advisor_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Application not found or not yours")

    app_data = resp.data[0]
    student_resp = (
        supabase_admin.table("student")
        .select("email, first_name")
        .eq("student_id", app_data["student_id"])
        .single()
        .execute()
    )
    if student_resp.data:
        await send_application_status_email(
            student_resp.data["email"],
            student_resp.data["first_name"],
            "Rejected",
            body.remarks
        )

    return success_response("Application rejected", app_data)


# ── PATCH /api/v1/advisor/application/{application_id}/return ───────────────
@router.patch("/application/{application_id}/return")
async def return_application(
    application_id: int,
    body: AdvisorActionRequest,
    user=_advisor
):
    if not body.remarks:
        raise HTTPException(
            status_code=400,
            detail="Remarks are required when returning an application"
        )

    advisor_id = _get_advisor_id(user.id)

    resp = (
        supabase_admin.table("application")
        .update({
            "status": "Returned",
            "remarks": body.remarks
        })
        .eq("application_id", application_id)
        .eq("advisor_id", advisor_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Application not found or not yours")

    app_data = resp.data[0]
    student_resp = (
        supabase_admin.table("student")
        .select("email, first_name")
        .eq("student_id", app_data["student_id"])
        .single()
        .execute()
    )
    if student_resp.data:
        await send_application_status_email(
            student_resp.data["email"],
            student_resp.data["first_name"],
            "Returned",
            body.remarks
        )

    return success_response("Application returned for clarification", app_data)


# ── GET /api/v1/advisor/application/{application_id}/documents ───────────────
@router.get("/application/{application_id}/documents")
async def get_application_documents(application_id: int, user=_advisor):
    # Get student_id from application
    app_resp = (
        supabase_admin.table("application")
        .select("student_id")
        .eq("application_id", application_id)
        .single()
        .execute()
    )
    if not app_resp.data:
        raise HTTPException(status_code=404, detail="Application not found")

    docs = (
        supabase_admin.table("student_document")
        .select("*")
        .eq("student_id", app_resp.data["student_id"])
        .execute()
    )
    return success_response("Documents", docs.data)
