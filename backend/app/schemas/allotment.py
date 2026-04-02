from pydantic import BaseModel


class AllotmentRequest(BaseModel):
    hostel_id: int
    academic_year: str


class ComputeScoresRequest(BaseModel):
    academic_year: str


class CancelAllocationRequest(BaseModel):
    pass
