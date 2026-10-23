import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.booking import BookingStatus


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "HEALTHY"
        assert "database" in data
        assert "background_worker" in data


@pytest.mark.asyncio
async def test_hospital_catalog():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/hospitals")
        assert response.status_code == 200
        hospitals = response.json()
        assert len(hospitals) >= 2
        assert hospitals[0]["code"] == "APOLLO"


@pytest.mark.asyncio
async def test_online_and_walkin_booking_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Online booking
        payload = {
            "hospital_id": "hosp-apollo-01",
            "department_id": "dept-card-01",
            "doctor_id": "doc-anand-01",
            "schedule_id": "sch-card-morning",
            "booking_date": "2026-10-24",
            "patient_name": "Karthik Subramanian",
            "patient_phone": "9840123456",
            "patient_age": 34,
            "patient_gender": "Male"
        }
        res_online = await ac.post("/api/v1/bookings", json=payload)
        assert res_online.status_code == 201
        booking = res_online.json()
        assert booking["token_number"] >= 1
        assert booking["status"] == BookingStatus.BOOKED.value
        assert "reporting_deadline" in booking
        assert "grace_period_deadline" in booking

        booking_id = booking["id"]

        # 2. Patient Check-In
        res_checkin = await ac.post(f"/api/v1/bookings/{booking_id}/check-in")
        assert res_checkin.status_code == 200
        checked_booking = res_checkin.json()
        assert checked_booking["status"] == BookingStatus.CHECKED_IN.value

        # 3. Walk-in booking directly receives CHECKED_IN
        walkin_payload = {
            "hospital_id": "hosp-apollo-01",
            "department_id": "dept-card-01",
            "doctor_id": "doc-anand-01",
            "schedule_id": "sch-card-morning",
            "booking_date": "2026-10-24",
            "patient_name": "Meena Kumari (Walk-in)",
            "patient_phone": "9840999888",
            "patient_age": 55,
            "patient_gender": "Female"
        }
        res_walkin = await ac.post("/api/v1/bookings/walkin", json=walkin_payload)
        assert res_walkin.status_code == 201
        walkin_booking = res_walkin.json()
        assert walkin_booking["token_number"] > booking["token_number"]
        assert walkin_booking["status"] == BookingStatus.CHECKED_IN.value


@pytest.mark.asyncio
async def test_queue_and_token_actions():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Doctor calls token 1 for date 2026-10-24
        action_payload = {
            "action": "CALL",
            "token_number": 1,
            "date": "2026-10-24"
        }
        res_call = await ac.post("/api/v1/queue/session/sch-card-morning/action", json=action_payload)
        assert res_call.status_code == 200

        # Query live session
        res_session = await ac.get("/api/v1/queue/session/sch-card-morning?date=2026-10-24")
        assert res_session.status_code == 200
        session_data = res_session.json()
        assert session_data["current_serving_token"] == 1


@pytest.mark.asyncio
async def test_emergency_beds():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/beds")
        assert res.status_code == 200
        beds = res.json()
        assert len(beds) >= 4
