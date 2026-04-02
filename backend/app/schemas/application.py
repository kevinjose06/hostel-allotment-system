from pydantic import BaseModel
from typing import Optional


class ApplicationSubmitRequest(BaseModel):
    academic_year: int
    family_annual_income: float
    distance_from_college: float
    bpl_status: bool = False
    pwd_status: bool = False
    sc_st_status: bool = False
    home_address: str
    guardian_name: str
    guardian_contact: str


class ApplicationResubmitRequest(BaseModel):
    academic_year: int
    family_annual_income: float
    distance_from_college: float
    bpl_status: Optional[bool] = None
    pwd_status: Optional[bool] = None
    sc_st_status: Optional[bool] = None
    home_address: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_contact: Optional[str] = None


class AdvisorActionRequest(BaseModel):
    remarks: Optional[str] = None
