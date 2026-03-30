from pydantic import BaseModel
from typing import Optional


class StudentProfileUpdate(BaseModel):
    contact_number: Optional[str] = None
    family_annual_income: Optional[float] = None
    distance_from_college: Optional[float] = None
    bpl_status: Optional[bool] = None
    pwd_status: Optional[bool] = None
    sc_st_status: Optional[bool] = None


class AcademicsUpdate(BaseModel):
    year_of_study: Optional[int] = None
    cgpa: Optional[float] = None
    semester: Optional[int] = None
