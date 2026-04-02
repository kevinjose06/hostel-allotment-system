from fastapi import APIRouter, Depends, HTTPException, status
from app.config.supabase import supabase, supabase_admin
from app.schemas.auth import StudentRegisterRequest, LoginRequest, ForgotPasswordRequest
from app.middleware.auth import get_current_user
from app.utils.response import success_response, error_response
import os

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


# ── POST /api/v1/auth/register/student ──────────────────────────────────────
@router.post("/register/student", status_code=201)
async def register_student(body: StudentRegisterRequest):
    """
    Creates a Supabase Auth user then inserts the student row.
    On any DB failure the auth user is rolled back.
    """
    # 1. Create Supabase Auth account
    try:
        auth_resp = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {
                "data": {
                    "role": "student",
                    "name": f"{body.first_name} {body.last_name}"
                }
            }
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not auth_resp.user:
        raise HTTPException(status_code=400, detail="Auth registration failed")

    auth_uid = auth_resp.user.id

    # 2. Insert core student record
    try:
        db_resp = supabase_admin.table("student").insert({
            "auth_uid": auth_uid,
            "email": body.email,
            "first_name": body.first_name,
            "middle_name": body.middle_name,
            "last_name": body.last_name,
            "college_id": body.college_id,
            "gender": body.gender,
            "date_of_birth": body.date_of_birth,
            "contact_number": body.contact_number,
            "class_id": body.class_id,
            "department": body.department
        }).execute()

        if not db_resp.data:
             raise Exception("Database response was empty during student insertion")
             
        student_id = db_resp.data[0]["student_id"]

        # 3. Insert academic/socioeconomic profile record
        supabase_admin.table("student_academics").insert({
            "student_id": student_id,
            "year_of_study": body.year_of_study,
            "family_annual_income": body.family_annual_income,
            "distance_from_college": body.distance_from_college,
            "bpl_status": body.bpl_status,
            "pwd_status": body.pwd_status,
            "sc_st_status": body.sc_st_status
        }).execute()
    except Exception as e:
        # Rollback: delete the auth user
        supabase_admin.auth.admin.delete_user(auth_uid)
        raise HTTPException(status_code=400, detail=str(e))

    return success_response(
        "Student registered. Please verify your email.",
        db_resp.data[0] if db_resp.data else None
    )


# ── POST /api/v1/auth/login ──────────────────────────────────────────────────
@router.post("/login")
async def login(body: LoginRequest):
    try:
        resp = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not resp.session:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return success_response("Login successful", {
        "access_token": resp.session.access_token,
        "user": {
            "id": resp.user.id,
            "email": resp.user.email,
            "user_metadata": resp.user.user_metadata
        }
    })


# ── POST /api/v1/auth/logout ─────────────────────────────────────────────────
@router.post("/logout")
async def logout(user=Depends(get_current_user)):
    supabase.auth.sign_out()
    return success_response("Logged out")


# ── GET /api/v1/auth/me ──────────────────────────────────────────────────────
@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    return success_response("Current user", {
        "id": user.id,
        "email": user.email,
        "user_metadata": user.user_metadata
    })


# ── POST /api/v1/auth/forgot-password ───────────────────────────────────────
@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    try:
        supabase.auth.reset_password_email(
            body.email,
            options={"redirect_to": f"{os.getenv('FRONTEND_URL')}/reset-password"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return success_response("Password reset email sent")
