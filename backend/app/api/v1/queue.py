from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from app.repositories.booking_repository import booking_repo
from app.repositories.hospital_repository import hospital_repo
from app.schemas.booking import BookingStatus
from app.schemas.queue import QueueSessionResponse, QueueTokenItem, TokenActionRequest, DoctorDelayUpdate
from app.websocket.manager import ws_manager
from app.services.prediction_service import prediction_service

router = APIRouter(prefix="/queue", tags=["Queue & Live Tracker"])

# Active serving token tracking per schedule
_active_serving: dict = {}


@router.get("/session/{schedule_id}", response_model=QueueSessionResponse)
async def get_queue_session(
    schedule_id: str,
    date: Optional[str] = Query(None)
):
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    bookings = await booking_repo.get_session_bookings(schedule_id, date)

    current_token = _active_serving.get(schedule_id)
    total_booked = len(bookings)
    total_completed = len([b for b in bookings if b["status"] == BookingStatus.COMPLETED.value])
    total_expired = len([b for b in bookings if b["status"] == BookingStatus.EXPIRED.value])
    waiting_bookings = [b for b in bookings if b["status"] in [BookingStatus.BOOKED.value, BookingStatus.CHECKED_IN.value]]
    total_waiting = len(waiting_bookings)

    # Calculate next up tokens (next 3 eligible)
    next_up: List[int] = []
    for b in waiting_bookings:
        if current_token is None or b["token_number"] > current_token:
            next_up.append(b["token_number"])
            if len(next_up) == 3:
                break

    # Check active doctor delay
    delay_info = booking_repo.get_doctor_delay(schedule_id)
    doc_delay = delay_info.get("delay_minutes", 0)
    delay_reason = delay_info.get("delay_reason")

    token_items: List[QueueTokenItem] = []
    for idx, b in enumerate(waiting_bookings):
        pred = prediction_service.predict_wait_time(
            queue_position=idx + 1,
            emergency_delay_min=doc_delay
        )
        token_items.append(QueueTokenItem(
            booking_id=b.get("id") or b.get("_id"),
            token_number=b["token_number"],
            patient_name=b["patient_name"],
            status=b["status"],
            reporting_deadline=b.get("adjusted_reporting_deadline") or b["reporting_deadline"],
            grace_period_deadline=b["grace_period_deadline"],
            estimated_wait_minutes=pred["predicted_wait_minutes"],
            doctor_delay_min=doc_delay,
            delay_reason=delay_reason,
            aadhar_number=b.get("aadhar_number"),
            patient_location=b.get("patient_location")
        ))

    return QueueSessionResponse(
        id=f"session-{schedule_id}-{date}",
        schedule_id=schedule_id,
        doctor_id="doc-anand-01",
        doctor_name="Dr. R. Anand",
        department_name="Cardiology & Cath Lab",
        opd_room="OPD Room 102",
        date=date,
        current_serving_token=current_token,
        next_up_tokens=next_up,
        total_booked=total_booked,
        total_completed=total_completed,
        total_expired=total_expired,
        total_waiting=total_waiting,
        doctor_delay_min=doc_delay,
        delay_reason=delay_reason,
        session_status="RUNNING",
        tokens=token_items
    )


@router.post("/session/{schedule_id}/action")
async def perform_token_action(schedule_id: str, action_req: TokenActionRequest):
    date = action_req.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    bookings = await booking_repo.get_session_bookings(schedule_id, date)
    target = None
    for b in bookings:
        if b["token_number"] == action_req.token_number:
            target = b
            break

    if not target:
        raise HTTPException(status_code=404, detail=f"Token #{action_req.token_number} not found.")

    booking_id = target.get("id") or target.get("_id")
    action = action_req.action.upper()

    if action == "CALL":
        _active_serving[schedule_id] = action_req.token_number
        # Broadcast chime and token call to all waiting screens
        await ws_manager.broadcast_all({
            "event": "TOKEN_CALLED",
            "token_number": action_req.token_number,
            "patient_name": target["patient_name"],
            "opd_room": target.get("opd_room", "OPD Room 102"),
            "doctor_name": target.get("doctor_name", "Dr. R. Anand"),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        return {"status": "SUCCESS", "message": f"Token #{action_req.token_number} called."}

    elif action == "START":
        await booking_repo.update_status(booking_id, BookingStatus.IN_CONSULTATION, audit_actor="DOCTOR")
        await ws_manager.broadcast_all({
            "event": "CONSULTATION_STARTED",
            "token_number": action_req.token_number
        })
        return {"status": "SUCCESS", "message": f"Consultation started for Token #{action_req.token_number}."}

    elif action == "COMPLETE":
        await booking_repo.update_status(booking_id, BookingStatus.COMPLETED, audit_actor="DOCTOR")
        # Advance queue automatically: find next token
        remaining = [b for b in bookings if b["token_number"] > action_req.token_number and b["status"] in [BookingStatus.BOOKED.value, BookingStatus.CHECKED_IN.value]]
        next_token = remaining[0]["token_number"] if remaining else None
        _active_serving[schedule_id] = next_token

        await ws_manager.broadcast_all({
            "event": "CONSULTATION_COMPLETED",
            "token_number": action_req.token_number,
            "next_token": next_token
        })
        return {"status": "SUCCESS", "message": f"Token #{action_req.token_number} completed. Next: {next_token}"}

    elif action == "ABSENT" or action == "EXPIRE":
        await booking_repo.update_status(booking_id, BookingStatus.EXPIRED, audit_actor="DOCTOR_ABSENT")
        await ws_manager.broadcast_all({
            "event": "TOKEN_EXPIRED",
            "token_number": action_req.token_number,
            "reason": "Marked absent by doctor"
        })
        return {"status": "SUCCESS", "message": f"Token #{action_req.token_number} marked absent/expired."}

    elif action == "DEMO_EXPIRE":
        # Simulates automatic background expiration
        target["demo_force_expire"] = True
        await booking_repo.update_status(booking_id, BookingStatus.EXPIRED, audit_actor="DEMO_EXPIRY_WORKER")
        await ws_manager.broadcast_all({
            "event": "TOKEN_EXPIRED",
            "token_number": action_req.token_number,
            "patient_name": target["patient_name"],
            "reason": "Automatic Token Expiry: Reporting deadline + Grace period exceeded."
        })
        return {"status": "SUCCESS", "message": f"Demonstration: Token #{action_req.token_number} expired automatically."}

    raise HTTPException(status_code=400, detail=f"Unsupported action: {action}")


@router.post("/doctor-delay")
async def update_doctor_delay(update: DoctorDelayUpdate):
    delay_info = booking_repo.set_doctor_delay(
        schedule_id=update.schedule_id,
        delay_minutes=update.delay_minutes,
        delay_reason=update.delay_reason,
        doctor_id=update.doctor_id
    )

    # Dispatched SMS / in-app notification to all waiting patients booked for this schedule
    from app.services.notification_service import notification_service
    date_today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    bookings = await booking_repo.get_session_bookings(update.schedule_id, date_today)
    for b in bookings:
        if b["status"] in [BookingStatus.BOOKED.value, BookingStatus.CHECKED_IN.value]:
            delay_text = (
                f"⚠️ Dr. {b.get('doctor_name', 'your doctor')} has reported a {update.delay_minutes}-min delay "
                f"({update.delay_reason}). Your consultation and reporting time have been adjusted accordingly."
            )
            await notification_service.send_notification(
                recipient_phone=b["patient_phone"],
                title="⚠️ Doctor OPD Delay Notice",
                message=delay_text,
                category="DOCTOR_DELAY_UPDATE",
                booking_ref=b["booking_ref"]
            )

    # Broadcast real-time WebSocket event to all waiting halls and patient portals
    await ws_manager.broadcast_all({
        "event": "DOCTOR_DELAY_UPDATED",
        "schedule_id": update.schedule_id,
        "delay_minutes": update.delay_minutes,
        "delay_reason": update.delay_reason,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {
        "status": "SUCCESS",
        "message": f"Doctor delay of {update.delay_minutes} minutes updated and broadcast to all patients.",
        "data": delay_info
    }


@router.get("/doctor-delay/{schedule_id}")
async def get_doctor_delay_status(schedule_id: str):
    return booking_repo.get_doctor_delay(schedule_id)

