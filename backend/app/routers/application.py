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
    if not resp or not getattr(resp, 'data', None):
        raise HTTPException(status_code=404, detail="Student record not found")
    return resp.data["student_id"]


# ── POST /api/v1/application ─────────────────────────────────────────────────
@router.post("/", status_code=201)
async def submit_application(
    body: ApplicationSubmitRequest,
    user=Depends(require_role(["student"]))
):
    import asyncio

    # 1. Fetch student info and deadline in parallel
    async def get_base_data():
        s_task = asyncio.to_thread(lambda: supabase_admin.table("student").select("student_id, class(advisor_id)").eq("auth_uid", user.id).single().execute())
        c_task = asyncio.to_thread(lambda: supabase_admin.table("system_config").select("config_value").eq("config_key", "application_deadline").maybe_single().execute())
        return await asyncio.gather(s_task, c_task)

    student_res, config_res = await get_base_data()
    if not student_res or not getattr(student_res, 'data', None): raise HTTPException(status_code=404, detail="Student not found")
    
    student_id = student_res.data.get("student_id")
    advisor_id = (student_res.data.get("class", {}) or {}).get("advisor_id")
    
    print(f"DEBUG: Submitting application for Student ID: {student_id}, Advisor ID: {advisor_id}")

    if not student_id: raise HTTPException(status_code=400, detail="Profile Incomplete: Student record not found.")
    if not advisor_id: 
        raise HTTPException(
            status_code=400, 
            detail="Your profile is not assigned to a Class/Advisor. Please contact the office."
        )

    # 2. Check deadline and existing app
    async def check_rules():
        if config_res and getattr(config_res, 'data', None):
            from datetime import datetime
            deadline_str = config_res.data["config_value"]
            # Handle both 'Z' (UTC) and naive (Local) strings
            if 'Z' in deadline_str:
                deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
            else:
                deadline = datetime.fromisoformat(deadline_str)
            
            # Use .astimezone() to ensure both side are aware and comparable in local time
            if datetime.now().astimezone() > deadline.astimezone(): return "deadline_ended"
        
        existing = await asyncio.to_thread(lambda: supabase_admin.table("application").select("application_id").eq("student_id", student_id).eq("academic_year", body.academic_year).maybe_single().execute())
        return "already_done" if existing and getattr(existing, 'data', None) else None

    rule_err = await check_rules()
    if rule_err == "deadline_ended": raise HTTPException(status_code=403, detail="Deadline passed.")
    if rule_err == "already_done": raise HTTPException(status_code=409, detail="Already applied this year.")

    # 3. Calculate merit and perform submission
    merit_score = round(max(0, 50 - (body.family_annual_income / 100000) * 5) + min(50, (body.distance_from_college / 500) * 50), 2)
    
    app_vals = {
        "student_id": student_id, "advisor_id": advisor_id, "academic_year": body.academic_year,
        "family_annual_income": body.family_annual_income, "distance_from_college": body.distance_from_college,
        "bpl_status": body.bpl_status, "pwd_status": body.pwd_status, "sc_st_status": body.sc_st_status,
        "home_address": body.home_address, "guardian_name": body.guardian_name, "guardian_contact": body.guardian_contact,
        "merit_score": merit_score, "status": "Pending", "selected_category_ids": getattr(body, 'selected_category_ids', [])
    }

    # Parallelize insertions
    async def save_all():
        a_task = asyncio.to_thread(lambda: supabase_admin.table("application").insert(app_vals).execute())
        p_task = asyncio.to_thread(lambda: supabase_admin.table("student_academics").upsert({
            "student_id": student_id, "family_annual_income": body.family_annual_income,
            "distance_from_college": body.distance_from_college, "bpl_status": body.bpl_status,
            "pwd_status": body.pwd_status, "sc_st_status": body.sc_st_status,
        }, on_conflict="student_id").execute())
        return await asyncio.gather(a_task, p_task)

    results = await save_all()
    return success_response("Application submitted", results[0].data[0])


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
    if not resp or not getattr(resp, 'data', None):
        raise HTTPException(status_code=404, detail="No application found")
    return success_response("Application", resp.data)


# ── PUT /api/v1/application/my ───────────────────────────────────────────────
@router.put("/my")
async def resubmit_application(
    body: ApplicationResubmitRequest,
    user=Depends(require_role(["student"]))
):
    student_id = _get_student_id(user.id)

    # Check deadline
    config_resp = (
        supabase_admin.table("system_config")
        .select("config_value")
        .eq("config_key", "application_deadline")
        .maybe_single()
        .execute()
    )
    if config_resp and getattr(config_resp, 'data', None):
        from datetime import datetime
        try:
            deadline_str = config_resp.data["config_value"]
            if isinstance(deadline_str, str):
                if 'Z' in deadline_str:
                    deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
                else:
                    deadline = datetime.fromisoformat(deadline_str)
                
                if datetime.now().astimezone() > deadline.astimezone():
                    raise HTTPException(
                        status_code=403,
                        detail="The deadline for re-submitting has passed."
                    )
        except (ValueError, TypeError):
            pass 

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
    if body.selected_category_ids is not None:
        updates["selected_category_ids"] = body.selected_category_ids

    resp = (
        supabase_admin.table("application")
        .update(updates)
        .eq("student_id", student_id)
        .eq("academic_year", body.academic_year)
        .in_("status", ["Pending", "Returned"]) # Allow editing both
        .execute()
    )
    if not resp or not getattr(resp, 'data', None):
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
    if not resp or not getattr(resp, 'data', None):
        raise HTTPException(status_code=404, detail="Application not found")
    return success_response("Application", resp.data)


# ── GET /api/v1/application ──────────────────────────────────────────────────
@router.get("/")
async def get_all_applications(
    status: Optional[str] = None,
    academic_year: Optional[str] = None,
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
