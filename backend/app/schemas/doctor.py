from typing import List, Optional
from pydantic import BaseModel, Field


class ScheduleSlot(BaseModel):
    id: str
    day: str
    start_time: str  # e.g., "09:00"
    end_time: str    # e.g., "13:00"
    avg_consultation_time_min: int = 10
    max_tokens: int = 30
    grace_period_min: int = 10


class DoctorBase(BaseModel):
    name: str = Field(..., min_length=2)
    hospital_id: str
    department_id: str
    department_name: str
    specialization: str
    opd_room: str
    status: str = "AVAILABLE"  # AVAILABLE, IN_CONSULTATION, ON_BREAK, OFF_DUTY


class DoctorCreate(DoctorBase):
    schedules: List[ScheduleSlot] = []


class DoctorResponse(DoctorBase):
    id: str
    schedules: List[ScheduleSlot] = []
    created_at: str
    model_config = {"from_attributes": True}
