from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class QueueTokenItem(BaseModel):
    booking_id: str
    token_number: int
    patient_name: str
    status: str
    reporting_deadline: str
    grace_period_deadline: str
    estimated_wait_minutes: int


class QueueSessionResponse(BaseModel):
    id: str
    schedule_id: str
    doctor_id: str
    doctor_name: str
    department_name: str
    opd_room: str
    date: str
    current_serving_token: Optional[int] = None
    next_up_tokens: List[int] = []
    total_booked: int = 0
    total_completed: int = 0
    total_expired: int = 0
    total_waiting: int = 0
    session_status: str = "RUNNING"  # SCHEDULED, RUNNING, PAUSED, CONCLUDED
    tokens: List[QueueTokenItem] = []


class CallTokenRequest(BaseModel):
    schedule_id: str
    date: str
    token_number: int


class TokenActionRequest(BaseModel):
    action: str  # CALL, START, COMPLETE, HOLD, ABSENT, CANCEL, DEMO_EXPIRE
    token_number: int
    date: Optional[str] = None
    notes: Optional[str] = None
