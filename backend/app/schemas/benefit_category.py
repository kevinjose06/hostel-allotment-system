from pydantic import BaseModel
from typing import Optional, List

class BenefitCategoryCreate(BaseModel):
    name: str
    code: str
    is_active: bool = True
    requires_doc: bool = True

class BenefitCategoryUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    requires_doc: Optional[bool] = None
