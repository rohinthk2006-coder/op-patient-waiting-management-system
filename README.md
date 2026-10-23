# Hospital OP Live Tracker
### AI-Powered Multi-Hospital Outpatient Queue, Waiting-Time Prediction and Emergency Bed Availability System

---

## 🌟 Overview
**Hospital OP Live Tracker** is a full-stack, enterprise-grade healthcare outpatient queue management application designed to eliminate chaotic waiting room crowds, prevent queue fraud and duplicate tokens, automate patient check-ins and token expiry, deliver real-time digital signage for waiting halls with audio chime announcements, and track emergency bed availability in real time.

---

## 🚀 Key Features

1. **Patient Portal & Hospital Comparison:**
   - Real-time comparison of hospital outpatient loads and average department waiting times before traveling.
   - Atomic OP token booking with zero duplicate token guarantee under high concurrency.
   - 1-tap **"I Am At Hospital (Check In)"** button to confirm arrival and disarm auto-expiry.
   - Reporting deadline & 10-minute grace period indicator.

2. **Server-Side Background Expiry Worker:**
   - Autonomous server-authoritative asyncio background worker (30-second scan interval).
   - Automatically transitions no-show tokens to `EXPIRED` once the reporting deadline + grace period passes.
   - Checked-in and in-consultation tokens are strictly immune to auto-expiry.
   - Crash & restart recovery: automatically catches up on overdue tokens on backend boot.

3. **Waiting Hall TV Mode (Digital Signage):**
   - Fullscreen high-contrast display for hospital waiting hall screens.
   - Giant active token display with glowing emerald badge and OPD room number.
   - Next 3 Waiting Patients banner.
   - Web Audio API synthesizer for hospital dual-tone chime (`ding-dong` at 880Hz / 659Hz).

4. **Doctor Consultation Console:**
   - Room console for OPD doctors to manage patient flow.
   - Action controls: `Call Next Patient`, `Start Visit`, `Complete Consultation`, `Put on Hold`, `Mark Absent`.
   - `⚡ Test Auto-Expiry` button for demonstration of automatic grace period expiration.

5. **AI Waiting-Time Prediction Engine:**
   - Transparent baseline heuristic: dynamic queue position $\times$ rolling average consultation time + doctor delay offset.
   - scikit-learn regression pipeline with fallback protection when data records are sparse.

6. **Emergency Bed Availability Tracker:**
   - Live occupancy tracking across ICU, Emergency Trauma, Oxygen Support, and General Wards.
   - Real-time color-coded alert badges (Green / Amber / Critical Red).

7. **Multi-Channel Notification Dispatcher:**
   - Automated delivery of SMS/Push notifications for Booking Confirmation, Approaching Turn Alerts, and Token Expiry.
   - Live in-app notifications drawer.

8. **Queue Throughput & Velocity Analytics (Recharts):**
   - Hourly patient arrival and completion bar charts.
   - Token distribution pie chart (Waiting, Completed, Expired).

---

## 🛠 Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, Axios
- **Backend:** Python 3.12, FastAPI, Pydantic v2, Motor, PyMongo, Uvicorn, Python-Jose (JWT), Passlib (Bcrypt), WebSockets
- **Database:** MongoDB (with hybrid live cluster connection and high-fidelity local development store)
- **AI/ML:** Python, NumPy, pandas, scikit-learn
- **Testing:** pytest, pytest-asyncio, HTTPX

---

## 📂 Project Structure

```text
d:\op patient waiting management system/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── PatientPortal.tsx
│   │   │   ├── WaitingHallTVMode.tsx
│   │   │   ├── DoctorConsole.tsx
│   │   │   ├── EmergencyBedsDashboard.tsx
│   │   │   ├── QueueAnalytics.tsx
│   │   │   └── NotificationsModal.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── utils/
│   │   │   └── audioChime.ts
│   │   ├── App.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── auth.py
│   │   │   ├── hospitals.py
│   │   │   ├── bookings.py
│   │   │   ├── queue.py
│   │   │   ├── beds.py
│   │   │   ├── predictions.py
│   │   │   ├── notifications.py
│   │   │   └── router.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   └── mongodb.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── hospital.py
│   │   │   ├── doctor.py
│   │   │   ├── booking.py
│   │   │   ├── queue.py
│   │   │   ├── bed.py
│   │   │   └── prediction.py
│   │   ├── repositories/
│   │   │   ├── booking_repository.py
│   │   │   └── hospital_repository.py
│   │   ├── services/
│   │   │   ├── prediction_service.py
│   │   │   └── notification_service.py
│   │   ├── workers/
│   │   │   └── expiry_worker.py
│   │   ├── websocket/
│   │   │   └── manager.py
│   │   └── main.py
│   ├── tests/
│   │   ├── test_api.py
│   │   └── test_concurrency_and_expiry.py
│   ├── pytest.ini
│   └── requirements.txt
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🏃 Getting Started Locally

### 1. Backend Setup
```powershell
cd backend
# Virtual environment is already created in backend/venv
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/v1/health`

### 2. Frontend Setup
```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
- Web Application: `http://127.0.0.1:5173/`

### 3. Running Automated Tests
```powershell
cd backend
.\venv\Scripts\pytest tests/ -v
```
All 8 automated backend tests pass with 100% green status (including 30-client parallel concurrency test).

```powershell
cd frontend
npm run build
```
Production bundle compiles in <2 seconds with 0 TypeScript/Vite errors.
