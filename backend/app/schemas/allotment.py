from pydantic import BaseModel


class AllotmentRequest(BaseModel):
    hostel_id: int
    academic_year: int


class ComputeScoresRequest(BaseModel):
    academic_year: int


class CancelAllocationRequest(BaseModel):
    pass
