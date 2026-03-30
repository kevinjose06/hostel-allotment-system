from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from app.config.supabase import supabase_admin
from app.middleware.auth import get_current_user, require_role
from app.utils.response import success_response
import time

router = APIRouter(prefix="/api/v1/document", tags=["Documents"])


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


# ── POST /api/v1/document/upload ─────────────────────────────────────────────
@router.post("/upload", status_code=201)
async def upload_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    user=Depends(require_role(["student"]))
):
    # Validate file size (max 5 MB)
    MAX_SIZE = 5 * 1024 * 1024
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5 MB.")

    student_id = _get_student_id(user.id)

    # Build storage path
    file_path = f"{student_id}/{document_type}/{int(time.time())}_{file.filename}"

    # Upload to Supabase Storage
    try:
        supabase_admin.storage.from_("student-documents").upload(
            path=file_path,
            file=contents,
            file_options={"content-type": file.content_type, "upsert": "true"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Storage upload failed: {str(e)}")

    # Upsert document record in DB
    try:
        db_resp = (
            supabase_admin.table("student_document")
            .upsert(
                {
                    "student_id": student_id,
                    "document_type": document_type,
                    "file_path": file_path,
                    "verification_status": "Pending"
                },
                on_conflict="student_id,document_type"
            )
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return success_response("Document uploaded", db_resp.data[0] if db_resp.data else None)


# ── GET /api/v1/document/my ──────────────────────────────────────────────────
@router.get("/my")
async def get_my_documents(user=Depends(require_role(["student"]))):
    student_id = _get_student_id(user.id)

    resp = (
        supabase_admin.table("student_document")
        .select("*")
        .eq("student_id", student_id)
        .execute()
    )
    return success_response("Documents", resp.data)


# ── PATCH /api/v1/document/{document_id}/verify ──────────────────────────────
@router.patch("/{document_id}/verify")
async def verify_document(
    document_id: int,
    status: str = Form(...),        # 'Verified' or 'Rejected'
    remarks: Optional[str] = Form(None),
    user=Depends(require_role(["advisor", "admin"]))
):
    if status not in ("Verified", "Rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'Verified' or 'Rejected'")

    # Get advisor id if applicable
    advisor_resp = (
        supabase_admin.table("class_advisor")
        .select("advisor_id")
        .eq("auth_uid", user.id)
        .maybe_single()
        .execute()
    )
    advisor_id = advisor_resp.data["advisor_id"] if advisor_resp.data else None

    from datetime import datetime
    resp = (
        supabase_admin.table("student_document")
        .update({
            "verification_status": status,
            "verified_by": advisor_id,
            "verified_at": datetime.utcnow().isoformat(),
            "remarks": remarks
        })
        .eq("document_id", document_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Document not found")

    return success_response("Document status updated", resp.data[0])
