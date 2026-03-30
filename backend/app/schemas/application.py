from pydantic import BaseModel
from typing import Optional


class ApplicationSubmitRequest(BaseModel):
    academic_year: int
    family_annual_income: float
    distance_from_college: float


class ApplicationResubmitRequest(BaseModel):
    academic_year: int
    family_annual_income: float
    distance_from_college: float


class AdvisorActionRequest(BaseModel):
    remarks: Optional[str] = None
