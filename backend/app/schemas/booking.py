from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class BookingStatus(str, Enum):
    BOOKED = "BOOKED"
    CHECKED_IN = "CHECKED_IN"
    IN_CONSULTATION = "IN_CONSULTATION"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class BookingType(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE_WALKIN = "OFFLINE_WALKIN"


class BookingCreate(BaseModel):
    hospital_id: str
    department_id: str
    doctor_id: str
    schedule_id: str
    booking_date: str  # YYYY-MM-DD
    patient_name: str = Field(..., min_length=2)
    patient_phone: str = Field(..., min_length=10)
    patient_age: Optional[int] = Field(None, ge=0, le=130)
    patient_gender: Optional[str] = "Unspecified"
    aadhar_number: Optional[str] = Field(None, description="12-digit Aadhaar Card Number")
    patient_location: Optional[str] = Field(None, description="Patient live location / locality")
    patient_latitude: Optional[float] = None
    patient_longitude: Optional[float] = None
    travel_mode: Optional[str] = Field(None, description="BIKE, CAR, AUTO, BUS")
    travel_distance_km: Optional[float] = None
    estimated_travel_min: Optional[int] = None
    traffic_condition: Optional[str] = None
    recommended_departure_time: Optional[str] = None


class WalkinBookingCreate(BookingCreate):
    booking_type: BookingType = BookingType.OFFLINE_WALKIN


class BookingResponse(BaseModel):
    id: str
    booking_ref: str
    patient_id: str
    patient_name: str
    patient_phone: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    aadhar_number: Optional[str] = None
    patient_location: Optional[str] = None
    patient_latitude: Optional[float] = None
    patient_longitude: Optional[float] = None
    travel_mode: Optional[str] = None
    travel_distance_km: Optional[float] = None
    estimated_travel_min: Optional[int] = None
    traffic_condition: Optional[str] = None
    recommended_departure_time: Optional[str] = None
    hospital_id: str
    department_id: str
    department_name: str
    doctor_id: str
    doctor_name: str
    opd_room: str
    schedule_id: str
    booking_date: str
    token_number: int
    booking_type: BookingType
    status: BookingStatus
    reporting_deadline: str
    grace_period_deadline: str
    estimated_consultation_time: str
    doctor_delay_min: Optional[int] = 0
    delay_reason: Optional[str] = None
    adjusted_consultation_time: Optional[str] = None
    adjusted_reporting_deadline: Optional[str] = None
    check_in_time: Optional[str] = None
    consultation_start_time: Optional[str] = None
    consultation_end_time: Optional[str] = None
    created_at: str
    model_config = {"from_attributes": True}
