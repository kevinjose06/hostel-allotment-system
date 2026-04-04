import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.config.supabase import supabase_admin
from app.services.email_service import send_password_reset_email
import os

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

class ResetRequest(BaseModel):
    email: str

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
            # Silent fail for security (enumeration prevention)
            return {"message": "Success"}

        # 2. Dispatch branded email in background
        background_tasks.add_task(
            send_password_reset_email, 
            request.email, 
            link
        )

        return {"message": "Success"}
    except Exception as e:
        print(f"[AUTH] Reset request failed for {request.email}: {e}")
        return {"message": "Success"}
