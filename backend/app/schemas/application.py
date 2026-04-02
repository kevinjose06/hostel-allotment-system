from pydantic import BaseModel
from typing import Optional


class ApplicationSubmitRequest(BaseModel):
    academic_year: str
    family_annual_income: float
    distance_from_college: float
    bpl_status: bool = False
    pwd_status: bool = False
    sc_st_status: bool = False
    home_address: str
    guardian_name: str
    guardian_contact: str
    selected_category_ids: list[int] = []


class ApplicationResubmitRequest(BaseModel):
    academic_year: str
    family_annual_income: float
    distance_from_college: float
    bpl_status: Optional[bool] = None
    pwd_status: Optional[bool] = None
    sc_st_status: Optional[bool] = None
    home_address: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_contact: Optional[str] = None
    selected_category_ids: Optional[list[int]] = None


class AdvisorActionRequest(BaseModel):
    remarks: Optional[str] = None
