import os
from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config.supabase import supabase_admin

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    token = credentials.credentials
    try:
        # Optimization: use a lightweight user fetch
        response = supabase_admin.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        # Ensure role is available in metadata for downstream checks
        return response.user
    except Exception as e:
        # CRITICAL: This log will appear in your Render 'Logs' tab
        print(f"❌ SECURITY AUTH ERROR: {str(e)}")
        raise HTTPException(
            status_code=401, 
            detail=f"Authentication failed: {str(e)}"
        )


def require_role(allowed_roles: List[str]):
    """
    Factory that returns a FastAPI dependency enforcing role-based access.

    Usage:
        @router.post("/admin/advisor")
        async def create_advisor(user = Depends(require_role(["admin"]))):
            ...
    """
    async def role_checker(user=Depends(get_current_user)):
        role = (user.user_metadata or {}).get("role", "student")
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden. Required roles: {allowed_roles}"
            )
        return user
    return role_checker


# ── Convenience dependency aliases ──────────────────────────────────────────
def admin_only(user=Depends(require_role(["admin"]))):
    return user

def advisor_or_admin(user=Depends(require_role(["advisor", "admin"]))):
    return user

def warden_or_admin(user=Depends(require_role(["warden", "admin"]))):
    return user

def student_only(user=Depends(require_role(["student"]))):
    return user
