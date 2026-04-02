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
                college_id, first_name, last_name, gender, email, contact_number,
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

    # Patch: if PostgREST silently drops nested student joins, fetch manually
    apps = resp.data or []
    missing_ids = [a["student_id"] for a in apps if not a.get("student")]
    if missing_ids:
        students_resp = (
            supabase_admin.table("student")
            .select("*, class(*)")
            .in_("student_id", missing_ids)
            .execute()
        )
        student_map = {s["student_id"]: s for s in (students_resp.data or [])}
        for a in apps:
            if not a.get("student"):
                a["student"] = student_map.get(a["student_id"])

    return success_response("Applications", apps)


# ── GET /api/v1/advisor/application/{application_id} ───────────────────────
@router.get("/application/{application_id}")
async def get_application_detail(application_id: int, user=_advisor):
    advisor_id = _get_advisor_id(user.id)

    resp = (
        supabase_admin.table("application")
        .select("""
            *,
            student (
                college_id, first_name, last_name, gender, email, contact_number,
                class ( degree_program, department, year, division )
            )
        """)
        .eq("application_id", application_id)
        .eq("advisor_id", advisor_id)
        .single()
        .execute()
    )
    app_data = resp.data
    if "student" not in app_data or not app_data["student"] or app_data["student"].get("first_name") == "BACKEND":
        # Force fetch the student directly if PostgREST nested join fails silently
        s_resp = supabase_admin.table("student").select("*, class(*)").eq("student_id", app_data["student_id"]).single().execute()
        app_data["student"] = s_resp.data if s_resp.data else None
    
    return success_response("Application", app_data)


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
    student_id = app_data["student_id"]
    
    # NEW: Update all documents to 'Verified' when application is approved
    try:
        from datetime import datetime
        supabase_admin.table("student_document").update({
            "verification_status": "Verified",
            "verified_by": advisor_id,
            "verified_at": datetime.utcnow().isoformat()
        }).eq("student_id", student_id).execute()
    except Exception as e:
        print(f"Error updating doc status: {e}")

    student_resp = (
        supabase_admin.table("student")
        .select("email, first_name")
        .eq("student_id", student_id)
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
    student_id = app_data["student_id"]

    # Update docs to 'Rejected'
    try:
        from datetime import datetime
        supabase_admin.table("student_document").update({
            "verification_status": "Rejected",
            "verified_by": advisor_id,
            "verified_at": datetime.utcnow().isoformat(),
            "remarks": body.remarks
        }).eq("student_id", student_id).execute()
    except Exception as e:
        print(f"Error updating doc status: {e}")

    student_resp = (
        supabase_admin.table("student")
        .select("email, first_name")
        .eq("student_id", student_id)
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
    student_id = app_data["student_id"]

    # Update documents to 'Rejected' (to prompt student correction)
    try:
        from datetime import datetime
        supabase_admin.table("student_document").update({
            "verification_status": "Rejected",
            "verified_by": advisor_id,
            "verified_at": datetime.utcnow().isoformat(),
            "remarks": body.remarks
        }).eq("student_id", student_id).execute()
    except Exception as e:
        print(f"Error updating doc status: {e}")

    student_resp = (
        supabase_admin.table("student")
        .select("email, first_name")
        .eq("student_id", student_id)
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

    docs_resp = (
        supabase_admin.table("student_document")
        .select("*")
        .eq("student_id", app_resp.data["student_id"])
        .execute()
    )

    # Enrich each document with a 1-hour signed URL
    enriched = []
    for doc in (docs_resp.data or []):
        try:
            res = supabase_admin.storage.from_("student-documents").create_signed_url(
                doc["file_path"], 3600
            )
            # Handle different SDK return formats (dict with signedURL/signedUrl or direct string)
            if isinstance(res, dict):
                doc["signed_url"] = res.get("signedURL") or res.get("signedUrl")
            else:
                doc["signed_url"] = str(res)
        except Exception:
            doc["signed_url"] = None
        enriched.append(doc)

    return success_response("Documents", enriched)
