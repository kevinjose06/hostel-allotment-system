from typing import Any, Optional
from pydantic import BaseModel


class APIResponse(BaseModel):
    """Standard envelope used for every response — matches Node version exactly."""
    success: bool
    message: str
    data: Optional[Any] = None
