from typing import List, Optional
from pydantic import BaseModel, Field


class DepartmentSchema(BaseModel):
    id: str
    name: str
    room_number: str
    active_doctors_count: int = 0
    current_avg_wait_min: int = 15


class HospitalBase(BaseModel):
    name: str = Field(..., min_length=2)
    code: str = Field(..., min_length=2, max_length=10)
    city: str
    address: str
    phone: str
    emergency_contact: str
    latitude: Optional[float] = 10.8125
    longitude: Optional[float] = 78.6856
    area: Optional[str] = "Tiruchirappalli"


class HospitalCreate(HospitalBase):
    pass


class HospitalResponse(HospitalBase):
    id: str
    departments: List[DepartmentSchema] = []
    total_waiting_patients: int = 0
    created_at: str
    model_config = {"from_attributes": True}
