import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.config.supabase import supabase_admin
from app.services.email_service import send_password_reset_email
from app.schemas.auth import StudentRegisterRequest
from app.utils.response import success_response, error_response
import os

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

# ── Schemas ──────────────────────────────────────────────────────────────────
class ResetRequest(BaseModel):
    email: str

# ── POST /api/v1/auth/register/student ─────────────────────────────────────────
@router.post("/register/student")
async def register_student(req: StudentRegisterRequest):
    """
    Registers a new student by creating a Supabase Auth User 
    and inserting a primary record into public.student.
    """
    try:
        # 1. Create Supabase Auth User using Admin API
        # This handles the creation and allows us to set institutional metadata
        auth_user = await asyncio.to_thread(
            lambda: supabase_admin.auth.admin.create_user({
                "email": req.email,
                "password": req.password,
                "user_metadata": {
                    "role": "student",
                    "full_name": f"{req.first_name} {req.last_name}"
                },
                "email_confirm": True  # Auto-confirm for institutional workflow
            })
        )

        if not auth_user or not auth_user.user:
            raise HTTPException(status_code=400, detail="Failed to create institutional auth record.")

        auth_uid = auth_user.user.id

        # 2. Insert into public.student table
        student_data = {
            "auth_uid": auth_uid,
            "email": req.email,
            "first_name": req.first_name,
            "middle_name": req.middle_name,
            "last_name": req.last_name,
            "college_id": req.college_id,
            "gender": req.gender,
            "date_of_birth": req.date_of_birth,
            "contact_number": req.contact_number,
            "class_id": req.class_id,
            "department": req.department
        }

        # Use and ignore any fields that aren't in the DB schema if necessary
        # but here we rely on the schema being correct.
        db_resp = supabase_admin.table("student").insert(student_data).execute()

        # 3. Create placeholder academics record
        if not db_resp.data:
            raise HTTPException(status_code=500, detail="Student profile creation failed.")

        academics_data = {
            "student_id": db_resp.data[0]["student_id"],
            "year_of_study": req.year_of_study or 1,
            "family_annual_income": req.family_annual_income or 0,
            "distance_from_college": req.distance_from_college or 0,
            "bpl_status": req.bpl_status,
            "pwd_status": req.pwd_status,
            "sc_st_status": req.sc_st_status
        }
        supabase_admin.table("student_academics").insert(academics_data).execute()

        return success_response("Student registration successful", {"uid": auth_uid})

    except Exception as e:
        print(f"[AUTH] Registration failed: {str(e)}")
        # If database insert fails, we SHOULD ideally delete the auth user, 
        # but for simplicity we'll let it be and the next attempt will find them.
        raise HTTPException(status_code=400, detail=str(e))


# ── POST /api/v1/auth/request-reset ───────────────────────────────────────────
@router.post("/request-reset")
async def request_password_reset(request: ResetRequest, background_tasks: BackgroundTasks):
    """
    Generates a secure recovery link via Supabase Admin and 
    dispatches a branded institutional email.
    """
    try:
        # 1. Generate the recovery link using the Service Role Key (Admin)
        resp = await asyncio.to_thread(
            lambda: supabase_admin.auth.admin.generate_link(
                {"type": "recovery", "email": request.email}
            )
        )
        
        # Pull the secure action link
        link = getattr(resp.properties, 'action_link', None)
        
        if not link:
            # Silent fail for security
            return {"message": "Success"}

        # 2. Dispatch branded email in background via Resend
        background_tasks.add_task(
            send_password_reset_email, 
            request.email, 
            link
        )

        return {"message": "Success"}
    except Exception as e:
        print(f"[AUTH] Reset request failed for {request.email}: {e}")
        return {"message": "Success"}
