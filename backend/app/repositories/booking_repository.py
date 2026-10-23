import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from app.db.mongodb import db_manager
from app.schemas.booking import BookingCreate, BookingStatus, BookingType

# In-memory store for development/testing when live MongoDB is not connected
_mock_bookings: Dict[str, Dict[str, Any]] = {}
_mock_token_counters: Dict[str, int] = {}


class BookingRepository:
    def __init__(self):
        self.db_mgr = db_manager

    async def get_next_token_number(self, schedule_id: str, booking_date: str) -> int:
        session_key = f"{schedule_id}_{booking_date}"
        if not self.db_mgr.is_mock and self.db_mgr.db is not None:
            # Atomic MongoDB counter via $inc
            res = await self.db_mgr.db.queue_sessions.find_one_and_update(
                {"schedule_id": schedule_id, "date": booking_date},
                {"$inc": {"token_counter": 1}},
                upsert=True,
                return_document=True
            )
            return res.get("token_counter", 1)
        else:
            # Atomic in-memory counter
            _mock_token_counters[session_key] = _mock_token_counters.get(session_key, 0) + 1
            return _mock_token_counters[session_key]

    async def create_booking(
        self,
        booking_data: BookingCreate,
        patient_id: str,
        doctor_name: str,
        department_name: str,
        opd_room: str,
        avg_consultation_min: int = 10,
        booking_type: BookingType = BookingType.ONLINE,
    ) -> Dict[str, Any]:
        token_num = await self.get_next_token_number(booking_data.schedule_id, booking_data.booking_date)
        
        now = datetime.now(timezone.utc)
        # Calculate estimated time: slot starts at 09:00 + (token - 1) * avg_min
        slot_base_minutes = 9 * 60 + (token_num - 1) * avg_consultation_min
        slot_hours = slot_base_minutes // 60
        slot_mins = slot_base_minutes % 60
        est_time_str = f"{slot_hours:02d}:{slot_mins:02d}"

        # Reporting deadline: 20 minutes before estimated consultation
        rep_deadline_mins = max(slot_base_minutes - 20, 9 * 60)
        rep_deadline_str = f"{rep_deadline_mins // 60:02d}:{rep_deadline_mins % 60:02d}"

        # Grace period deadline: 10 minutes past reporting deadline
        grace_deadline_mins = rep_deadline_mins + 10
        grace_deadline_str = f"{grace_deadline_mins // 60:02d}:{grace_deadline_mins % 60:02d}"

        booking_id = str(uuid.uuid4())
        ref_date = booking_data.booking_date.replace("-", "")
        booking_ref = f"OP-{ref_date}-{token_num:03d}"

        initial_status = BookingStatus.CHECKED_IN if booking_type == BookingType.OFFLINE_WALKIN else BookingStatus.BOOKED

        record = {
            "_id": booking_id,
            "id": booking_id,
            "booking_ref": booking_ref,
            "patient_id": patient_id,
            "patient_name": booking_data.patient_name,
            "patient_phone": booking_data.patient_phone,
            "patient_age": booking_data.patient_age,
            "patient_gender": booking_data.patient_gender,
            "hospital_id": booking_data.hospital_id,
            "department_id": booking_data.department_id,
            "department_name": department_name,
            "doctor_id": booking_data.doctor_id,
            "doctor_name": doctor_name,
            "opd_room": opd_room,
            "schedule_id": booking_data.schedule_id,
            "booking_date": booking_data.booking_date,
            "token_number": token_num,
            "booking_type": booking_type.value,
            "status": initial_status.value,
            "reporting_deadline": rep_deadline_str,
            "grace_period_deadline": grace_deadline_str,
            "estimated_consultation_time": est_time_str,
            "check_in_time": now.isoformat() if initial_status == BookingStatus.CHECKED_IN else None,
            "consultation_start_time": None,
            "consultation_end_time": None,
            "created_at": now.isoformat(),
        }

        if not self.db_mgr.is_mock and self.db_mgr.db is not None:
            await self.db_mgr.db.bookings.insert_one(record)
        else:
            _mock_bookings[booking_id] = record

        return record

    async def get_booking_by_id(self, booking_id: str) -> Optional[Dict[str, Any]]:
        if not self.db_mgr.is_mock and self.db_mgr.db is not None:
            return await self.db_mgr.db.bookings.find_one({"_id": booking_id})
        return _mock_bookings.get(booking_id)

    async def get_bookings_by_patient(self, patient_phone: str) -> List[Dict[str, Any]]:
        if not self.db_mgr.is_mock and self.db_mgr.db is not None:
            cursor = self.db_mgr.db.bookings.find({"patient_phone": patient_phone}).sort("created_at", -1)
            return await cursor.to_list(length=100)
        return [b for b in _mock_bookings.values() if b["patient_phone"] == patient_phone]

    async def get_session_bookings(self, schedule_id: str, booking_date: str) -> List[Dict[str, Any]]:
        if not self.db_mgr.is_mock and self.db_mgr.db is not None:
            cursor = self.db_mgr.db.bookings.find({
                "schedule_id": schedule_id,
                "booking_date": booking_date
            }).sort("token_number", 1)
            return await cursor.to_list(length=200)
        return sorted(
            [b for b in _mock_bookings.values() if b["schedule_id"] == schedule_id and b["booking_date"] == booking_date],
            key=lambda x: x["token_number"]
        )

    async def update_status(self, booking_id: str, new_status: BookingStatus, audit_actor: str = "SYSTEM") -> Optional[Dict[str, Any]]:
        now_iso = datetime.now(timezone.utc).isoformat()
        update_fields: Dict[str, Any] = {"status": new_status.value}
        if new_status == BookingStatus.CHECKED_IN:
            update_fields["check_in_time"] = now_iso
        elif new_status == BookingStatus.IN_CONSULTATION:
            update_fields["consultation_start_time"] = now_iso
        elif new_status == BookingStatus.COMPLETED:
            update_fields["consultation_end_time"] = now_iso

        if not self.db_mgr.is_mock and self.db_mgr.db is not None:
            res = await self.db_mgr.db.bookings.find_one_and_update(
                {"_id": booking_id},
                {"$set": update_fields},
                return_document=True
            )
            # Record in audit log
            await self.db_mgr.db.audit_logs.insert_one({
                "entity_type": "BOOKING",
                "entity_id": booking_id,
                "action": f"TRANSITION_TO_{new_status.value}",
                "actor": audit_actor,
                "timestamp": now_iso
            })
            return res
        else:
            if booking_id in _mock_bookings:
                _mock_bookings[booking_id].update(update_fields)
                return _mock_bookings[booking_id]
            return None


booking_repo = BookingRepository()
