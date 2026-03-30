from pydantic import BaseModel, EmailStr
from typing import Optional


class StudentRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    middle_name: Optional[str] = None  # Added to match DB manual edit
    last_name: str
    college_id: str
    gender: str                       # 'Male' | 'Female' | 'Other'
    date_of_birth: str                # ISO date string  e.g. "2003-05-14"
    contact_number: str
    class_id: int
    year_of_study: int                # For student_academics table
    family_annual_income: float       # Current profile
    distance_from_college: float      # Current profile
    bpl_status: bool = False
    pwd_status: bool = False
    sc_st_status: bool = False


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
