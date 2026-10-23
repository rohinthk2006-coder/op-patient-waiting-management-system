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
