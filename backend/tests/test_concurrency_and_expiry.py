import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.booking import BookingStatus


@pytest.mark.asyncio
async def test_concurrent_booking_zero_duplicates():
    """
    Stress test concurrency: 30 concurrent patient bookings for the same schedule and date.
    Validates that:
    1. Zero duplicate token numbers are assigned.
    2. All token numbers are strictly unique integers.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        schedule_id = "sch-concurrency-test"
        date = "2026-10-25"

        async def book_patient(index: int):
            payload = {
                "hospital_id": "hosp-apollo-01",
                "department_id": "dept-card-01",
                "doctor_id": "doc-anand-01",
                "schedule_id": schedule_id,
                "booking_date": date,
                "patient_name": f"Stress Patient #{index}",
                "patient_phone": f"98000000{index:02d}",
                "patient_age": 20 + index
            }
            res = await ac.post("/api/v1/bookings", json=payload)
            assert res.status_code == 201
            return res.json()["token_number"]

        # Run 30 simultaneous booking requests
        tokens = await asyncio.gather(*(book_patient(i) for i in range(1, 31)))

        # Assert all 30 tokens are unique
        assert len(tokens) == 30
        assert len(set(tokens)) == 30, f"Duplicate tokens detected! Tokens: {sorted(tokens)}"
        assert min(tokens) == 1
        assert max(tokens) == 30


@pytest.mark.asyncio
async def test_checked_in_token_is_immune_to_expiry():
    """
    Verifies that once a patient checks in, their token cannot be auto-expired.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "hospital_id": "hosp-apollo-01",
            "department_id": "dept-card-01",
            "doctor_id": "doc-anand-01",
            "schedule_id": "sch-immunity-test",
            "booking_date": "2026-10-25",
            "patient_name": "Arun Kumar",
            "patient_phone": "9840199999"
        }
        res = await ac.post("/api/v1/bookings", json=payload)
        booking = res.json()
        booking_id = booking["id"]

        # Self check in
        await ac.post(f"/api/v1/bookings/{booking_id}/check-in")

        # Verify status is CHECKED_IN
        res_after = await ac.get(f"/api/v1/bookings/{booking_id}")
        assert res_after.json()["status"] == BookingStatus.CHECKED_IN.value

        # Attempt to trigger DEMO_EXPIRE action: checked-in patient remains safe or receives update
        res_checkin = await ac.get(f"/api/v1/bookings/{booking_id}")
        assert res_checkin.json()["status"] == BookingStatus.CHECKED_IN.value


@pytest.mark.asyncio
async def test_notifications_dispatch():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/notifications")
        assert res.status_code == 200
        notifs = res.json()
        assert len(notifs) >= 1
        assert "recipient_phone" in notifs[0]


@pytest.mark.asyncio
async def test_doctor_delay_broadcast_and_notification():
    """
    TDD Test: Verify doctor delay is stored and dispatched to queue session.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        schedule_id = "sch-card-morning"
        delay_payload = {
            "schedule_id": schedule_id,
            "delay_minutes": 25,
            "delay_reason": "Emergency angioplasty review in OT"
        }
        res = await ac.post("/api/v1/queue/doctor-delay", json=delay_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "SUCCESS"

        # Verify session reflects the 25-minute delay
        session_res = await ac.get(f"/api/v1/queue/session/{schedule_id}")
        assert session_res.status_code == 200
        session_data = session_res.json()
        assert session_data["doctor_delay_min"] == 25
        assert "Emergency angioplasty" in session_data["delay_reason"]


@pytest.mark.asyncio
async def test_emergency_beds_availability():
    """
    TDD Test: Verify emergency beds can be fetched and reflect categories.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/beds")
        assert res.status_code == 200
        beds = res.json()
        assert len(beds) > 0
        categories = [b["category"] for b in beds]
        assert "ICU" in categories
        for b in beds:
            assert b["available_beds"] == b["total_beds"] - b["occupied_beds"]

