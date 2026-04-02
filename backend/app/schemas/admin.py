from pydantic import BaseModel, EmailStr
from typing import Optional


class CreateAdvisorRequest(BaseModel):
    name: str
    department: str
    email: str
    contact_no: Optional[str] = None
    temp_password: str = "TempPass@1234"


class UpdateAdvisorRequest(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    contact_no: Optional[str] = None


class CreateClassRequest(BaseModel):
    degree_program: str
    department: str
    year: int
    division: str
    advisor_id: int
    academic_year: str


class CreateHostelRequest(BaseModel):
    hostel_name: str
    hostel_type: str          # 'LH' or 'MH'
    total_capacity: int
    reserved_seats: int


class UpdateHostelRequest(BaseModel):
    total_capacity: Optional[int] = None
    reserved_seats: Optional[int] = None
    hostel_name: Optional[str] = None


class CreateWardenRequest(BaseModel):
    name: str
    email: Optional[str] = None
    contact_no: Optional[str] = None
    hostel_id: int
    temp_password: str = "TempPass@1234"
class UpdateWardenRequest(BaseModel):
    name: Optional[str] = None
    contact_no: Optional[str] = None
    hostel_id: Optional[int] = None
