from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query
from app.schemas.booking import BookingCreate, WalkinBookingCreate, BookingResponse, BookingStatus, BookingType
from app.repositories.booking_repository import booking_repo
from app.repositories.hospital_repository import hospital_repo
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/bookings", tags=["OP Bookings & Tokens"])


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_online_booking(booking_in: BookingCreate):
    doctor = await hospital_repo.get_doctor_by_id(booking_in.doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    hospital = await hospital_repo.get_hospital_by_id(booking_in.hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    booking_record = await booking_repo.create_booking(
        booking_data=booking_in,
        patient_id=f"patient-{booking_in.patient_phone}",
        doctor_name=doctor["name"],
        department_name=doctor["department_name"],
        opd_room=doctor["opd_room"],
        avg_consultation_min=10,
        booking_type=BookingType.ONLINE
    )

    # Dispatch booking confirmation notification
    from app.services.notification_service import notification_service
    await notification_service.send_notification(
        recipient_phone=booking_record["patient_phone"],
        title="OP Token Booking Confirmed",
        message=f"Your token is #{booking_record['token_number']} ({booking_record['booking_ref']}) for {doctor['name']}. Please report to {doctor['opd_room']} by {booking_record['reporting_deadline']}.",
        category="BOOKING_CONFIRMATION",
        booking_ref=booking_record["booking_ref"]
    )

    # Broadcast new booking event to live queue subscribers
    await ws_manager.broadcast({
        "event": "NEW_TOKEN_BOOKED",
        "token_number": booking_record["token_number"],
        "booking_ref": booking_record["booking_ref"],
        "schedule_id": booking_record["schedule_id"],
        "status": booking_record["status"]
    }, channel=f"queue_{booking_record['schedule_id']}")

    return booking_record


@router.post("/walkin", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_walkin_booking(booking_in: WalkinBookingCreate):
    doctor = await hospital_repo.get_doctor_by_id(booking_in.doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    booking_record = await booking_repo.create_booking(
        booking_data=booking_in,
        patient_id=f"walkin-{booking_in.patient_phone}",
        doctor_name=doctor["name"],
        department_name=doctor["department_name"],
        opd_room=doctor["opd_room"],
        avg_consultation_min=10,
        booking_type=BookingType.OFFLINE_WALKIN
    )

    # Broadcast walk-in checked-in token event
    await ws_manager.broadcast({
        "event": "WALKIN_TOKEN_ISSUED",
        "token_number": booking_record["token_number"],
        "booking_ref": booking_record["booking_ref"],
        "schedule_id": booking_record["schedule_id"],
        "status": booking_record["status"]
    }, channel=f"queue_{booking_record['schedule_id']}")

    return booking_record


@router.post("/{booking_id}/check-in", response_model=BookingResponse)
async def patient_check_in(booking_id: str):
    booking = await booking_repo.get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking["status"] in [BookingStatus.EXPIRED.value, BookingStatus.CANCELLED.value]:
        raise HTTPException(status_code=400, detail=f"Cannot check in: Token is already {booking['status']}")

    updated = await booking_repo.update_status(
        booking_id=booking_id,
        new_status=BookingStatus.CHECKED_IN,
        audit_actor="PATIENT_SELF_CHECKIN"
    )

    from app.services.notification_service import notification_service
    await notification_service.send_notification(
        recipient_phone=booking["patient_phone"],
        title="Check-in Confirmed",
        message=f"You are checked in for Token #{booking['token_number']}. Your token is safe from auto-expiry.",
        category="CHECKIN_CONFIRMATION",
        booking_ref=booking["booking_ref"]
    )

    await ws_manager.broadcast({
        "event": "PATIENT_CHECKED_IN",
        "token_number": booking["token_number"],
        "schedule_id": booking["schedule_id"]
    }, channel=f"queue_{booking['schedule_id']}")

    return updated


@router.get("/patient/{phone}", response_model=List[BookingResponse])
async def get_patient_bookings(phone: str):
    bookings = await booking_repo.get_bookings_by_patient(phone)
    return bookings


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking_details(booking_id: str):
    b = await booking_repo.get_booking_by_id(booking_id)
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    return b
