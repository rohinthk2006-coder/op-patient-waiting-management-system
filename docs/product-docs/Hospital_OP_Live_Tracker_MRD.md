# Market Requirements Document (MRD)
# Hospital OP Live Tracker
### Multi-Hospital Outpatient Queue Orchestration, AI Waiting-Time Intelligence & Emergency Bed Tracking System

---

## Document Control & Metadata

| Field | Detail |
| :--- | :--- |
| **Document Version** | `1.0.0 (Approved Baseline)` |
| **Release Date** | October 24, 2026 |
| **Document Classification** | Commercial & Healthcare Systems Strategy |
| **Document Owner** | Principal Product Manager & Healthcare Technology Architect |
| **Review Status** | Formal Review Complete / Baseline Approved |
| **Target Audience** | Hospital Operations Directors, Medical Superintendents, Platform Engineers, Hackathon Evaluation Jury |
| **Primary Geographic Pilot** | Tiruchirappalli (Trichy) District, Tamil Nadu, India |
| **Target Architecture** | React 19 + TypeScript + Vite + Tailwind CSS v4 + FastAPI + MongoDB + WebSockets |

---

## 1. Executive Summary & Product Vision

Outpatient (OP) departments across public and private hospitals represent the primary gateway for patient care, yet they endure severe operational bottlenecks. Every day, hundreds of patients congregate in congested, poorly ventilated waiting corridors for two to four hours with zero visibility into queue progression or doctor availability. 

The **Hospital OP Live Tracker** is a mission-critical multi-hospital healthcare platform designed to eliminate waiting room congestion through a single authoritative queue engine. It integrates:
1. **Universal Outpatient Access:** Frictionless online pre-booking via mobile OTP paired with rapid physical walk-in desk registration.
2. **Anti-Fraud & Zero Duplicate Tokens:** Compound database unique indexes guaranteeing 100% token integrity under heavy parallel concurrency.
3. **Automated Arrival Check-In:** 1-tap patient confirmation at hospital gates, disarming auto-expiry and protecting legitimate arrivals.
4. **Autonomous Slot Reclamation:** Server-authoritative background worker automatically expiring no-shows past their reporting deadlines and grace periods, instantly advancing the queue.
5. **Real-Time Digital Signage & Audio Chimes:** High-contrast Waiting Hall TV mode with dual-tone audio chimes (880Hz / 659Hz) and doctor procedural delay broadcasts.
6. **Transparent Waiting-Time Intelligence:** Formula-driven heuristic wait forecasts with machine learning regression pipelines and confidence intervals.
7. **Emergency Bed Visibility:** Live, unit-wise availability tracking across ICU, Emergency Trauma, Oxygen, and General Ward beds.

---

## 2. Problem Statement & Outpatient Operational Pain Points

Current hospital outpatient workflows suffer from chronic operational deficiencies:

* **Chaotic Waiting Halls & Nosocomial Infection Risks:** Patients and vulnerable family members congregate in dense waiting areas for hours. This creates severe physical discomfort, heightens cross-infection risks, and sparks frequent verbal confrontations with nursing staff.
* **Queue Fraud, Scalping & Collisions:** Manual token registers and uncoordinated digital booking apps lack compound concurrency locks, allowing duplicate tokens, queue-jumping, and slot scalping.
* **Specialist Slot Wastage via Unmanaged No-Shows:** Between 15% and 30% of patients who book outpatient appointments fail to report. Traditional systems lack autonomous expiry mechanisms to advance the queue, leaving expensive specialists idle between consultations.
* **Opaque Clinical Delays:** When emergency surgeries, rounds, or urgent trauma cases delay a doctor, waiting outpatients receive zero notice, magnifying anxiety and frustration.
* **Disconnected Emergency Bed Intelligence:** During regional medical emergencies, patients and 108 ambulance crews waste golden-hour transit time visiting hospitals blindly because real-time ICU and oxygen bed availability is not publicly visible.

---

## 3. Target Market & Intended Hospital Segments

The platform addresses secondary and tertiary healthcare institutions, anchored by an initial pilot network in **Tiruchirappalli (Trichy), Tamil Nadu**:

| Segment | Target Institutions | Operational Characteristics | Platform Focus |
| :--- | :--- | :--- | :--- |
| **Segment 1: Government & Teaching Hospitals** | MGMGH Government Hospital Trichy, SRM Medical College Hospital | Extreme volume (1,500–3,500 OP/day); high walk-in ratio; language barriers. | Zero-duplicate token concurrency; high-contrast digital signage; dual-tone audio chimes; walk-in parity. |
| **Segment 2: Regional Multi-Specialty Networks** | Kauvery Hospital (Cantonment & Heartcity), Apollo Speciality, Frontline Hospital | Patient experience driven; focus on punctuality and waiting lounge decongestion. | Passwordless mobile OTP booking; live queue movement tracking; transparent waiting time forecasts. |
| **Segment 3: Charitable & Mission Hospitals** | CSI Mission Hospital, Child Jesus Hospital | Cost-sensitive operations; reliance on resilient, low-maintenance infrastructure. | Dual-engine offline memory store resilience; shared emergency bed availability reporting. |

---

## 4. Stakeholder Analysis & Adoption Barriers

| Stakeholder | Primary Goal | Key Functional Need | Adoption Barrier & Mitigation |
| :--- | :--- | :--- | :--- |
| **Patient & Caregiver** | Minimize physical hospital wait; know exact consultation time. | Passwordless OTP booking, live queue position, travel alerts. | **Barrier:** Digital literacy disparities.<br>**Mitigation:** Simplified UI, walk-in parity, audio chimes, WhatsApp support. |
| **OP Registration Staff** | Rapidly process walk-in crowds without duplicate errors. | Fast walk-in desk booking, automated check-in confirmation. | **Barrier:** High peak-hour registration stress.<br>**Mitigation:** Single-click 5-second walk-in issuance with auto-print. |
| **Nurses & OPD Staff** | Maintain orderly queue flow outside consulting rooms. | Queue status screen, patient attendance tracking, hold queue. | **Barrier:** Cluttered software.<br>**Mitigation:** Tablet-optimized clean queue view with instant status toggles. |
| **Consulting Doctor** | Focus on patient care without administrative friction. | Single-click console (Call, Start, Complete), delay broadcast. | **Barrier:** Time loss from complex software.<br>**Mitigation:** 1-tap delay broadcast (+15m/+30m) with live push to all screens. |
| **Hospital Admin** | Maximize room utilization; reduce waiting room chaos. | Live throughput analytics, bed census update, policy config. | **Barrier:** Downtime fears.<br>**Mitigation:** Dual-engine offline memory store resilience if internet flickers. |
| **Platform Admin** | Oversee regional health network and tenant integrity. | Multi-tenant onboarding, cross-hospital isolation, health API. | **Barrier:** Data privacy concerns.<br>**Mitigation:** Role-based access control, tenant data scoping, audit logging. |

---

## 5. Value Propositions by Stakeholder

* **For Patients:** Zero wasted hospital hours. Book from home, receive travel departure recommendations based on traffic, view live queue movement, and avoid arriving hours before the doctor is ready.
* **For Doctors:** Continuous, orderly patient throughput. No unannounced walk-ins barging into consulting rooms. Single-click delay broadcasting automatically adjusts all patient reporting deadlines when emergency surgeries arise.
* **For Staff:** Elimination of queue arguments. Server-authoritative token numbers, automated auto-expiry for no-shows, and digital waiting hall signage ensure fair, transparent patient calling.
* **For Administrators:** Actionable throughput velocity metrics, recovered appointment slots, optimized staff allocation, and regional emergency bed leadership.

---

## 6. Market-Level Product Requirements & Priorities

| Req ID | User / Market Need | Proposed Capability | Priority | Validation Status |
| :--- | :--- | :--- | :--- | :--- |
| **MR-001** | Frictionless patient identity without passwords | Mobile OTP authentication with auto-provisioning | **Must Have** | Verified in Repo (`/api/v1/auth/otp/*`) |
| **MR-002** | Discover hospital services and doctor schedules | Multi-hospital directory, doctor OPD schedules | **Must Have** | Verified in Repo (`/api/v1/hospitals`) |
| **MR-003** | Pre-book outpatient tokens with arrival deadlines | Atomic online booking with reporting deadline | **Must Have** | Verified in Repo (`/api/v1/bookings`) |
| **MR-004** | Equal access for walk-in and online outpatients | Unified queue engine with zero duplicate token guarantee | **Must Have** | Verified in Repo (30-client stress test) |
| **MR-005** | Recover unused consultation slots from no-shows | 1-tap arrival check-in and automated background expiry | **Must Have** | Verified in Repo (`expiry_worker.py`) |
| **MR-006** | Consulting room flow and delay communication | Doctor console (Call, Visit, Delay broadcast push) | **Must Have** | Verified in Repo (`DoctorConsole.tsx`) |
| **MR-007** | Manage hospital departments, staff, and policies | Hospital administration and OP schedule configuration | **Should Have** | Partially Implemented (Master Schemas) |
| **MR-008** | Platform-level multi-tenant health network | Platform admin onboarding with tenant data isolation | **Must Have** | Planned (Specification Defined) |
| **MR-009** | Real-time critical bed visibility for ambulances | Emergency bed tracker (ICU, Trauma, O2) with status | **Must Have** | Verified in Repo (`/api/v1/beds`) |
| **MR-010** | Transparent waiting time expectation management | Transparent heuristic wait forecast + ML regression hooks | **Must Have** | Verified in Repo (`prediction_service.py`) |
| **MR-011** | Instant status alerts across multiple channels | Real-time WebSockets hub + multi-event SMS/in-app alerts | **Must Have** | Verified in Repo (`ws_manager`, `/ws`) |
| **MR-012** | Accessible waiting hall calling for elderly/ill | Waiting Hall TV mode signage with dual-tone audio chime | **Must Have** | Verified in Repo (`WaitingHallTVMode.tsx`) |
| **MR-013** | Travel guidance to prevent missing OP deadlines | Trichy locality travel time calculation with rush hour buffer | **Should Have** | Verified Heuristic (`traffic.py`) |
| **MR-014** | Operational visibility into clinic throughput | Hourly outpatient arrival/completion velocity charts | **Should Have** | Verified in Repo (`QueueAnalytics.tsx`) |

---

## 7. Product Scope, Exclusions & Strategic Roadmap

### In-Scope Functional Boundaries (Phase 1 & 2):
Multi-hospital directory; patient mobile OTP authentication; atomic online OP token reservation; walk-in OP desk registration; unified FIFO queue ordering; 1-tap arrival check-in; autonomous background expiry worker with crash recovery; doctor consultation console; doctor OPD delay broadcast push; high-contrast waiting hall TV signage with Web Audio chimes; baseline heuristic wait-time prediction; emergency bed status dashboard; and regional travel time calculation.

### Explicit Exclusions (Out of Scope for Initial MVP):
1. **No Clinical Diagnosis / Medical Triage:** The system does not provide medical diagnostic recommendations, prescribe drugs, or substitute for emergency 108 triage.
2. **No Inpatient / Billing Integration:** Does not process hospital inpatient ward admissions, complex insurance claim reimbursements, or dispensary inventory.
3. **No Biometric Hardware Mandate:** Aadhaar e-KYC biometric fingerprint/iris scanners are excluded; system operates with phone OTP and masked identity inputs in compliance with Indian privacy laws.

---

## 8. Success Indicators & Target Metrics

| Key Performance Indicator (KPI) | Target Operational Benchmark | Measurement & Verification Method |
| :--- | :--- | :--- |
| **Waiting Room Peak Crowd Density** | $> 40\%$ reduction in physical waiting crowd | Pre- and post-pilot waiting lounge headcounts |
| **No-Show Slot Recovery Rate** | $> 70\%$ of abandoned slots recycled to queue | Audit log tracking of `EXPIRED` tokens advancing next patient |
| **Wait Time Forecast Accuracy** | Within $\pm 15\%$ of actual consultation call time | Comparison of predicted wait minutes vs actual call timestamps |
| **Zero Duplicate Token Incidents** | $100\%$ mathematical integrity (0 duplicates) | Compound database unique constraint verification & stress tests |
| **Emergency Bed Update Latency** | $< 30$ minutes from physical bed status change | Audit timestamps of bed update API calls against hospital census |

---

## 9. High-Level Product Roadmap

* **Phase 1: Foundation & Core Queue Prototype (Verified Baseline):** Scaffolded React 19 frontend and FastAPI backend; verified in-memory store; verified atomic booking, check-in, background auto-expiry worker, TV display, and 11 automated pytest test cases.
* **Phase 2: Pilot Hospital Department Hardening (Weeks 1–4):** Deploy in single OPD room (Cardiology at Apollo/Kauvery Trichy); validate doctor console UX; connect live MongoDB Atlas cluster; integrate transactional SMS gateway with DLT registered templates.
* **Phase 3: Multi-Hospital & Emergency Bed Expansion (Weeks 5–8):** Onboard all 6 Trichy partner hospitals; operationalize emergency bed tracking with ward nurse mobile interface; deploy public waiting hall screens.
* **Phase 4: AI Optimization & ABDM Integration (Weeks 9–16):** Train scikit-learn regression models on collected consultation timestamps; integrate Ayushman Bharat Health Account (ABHA) patient identity; support WhatsApp Business conversational booking.

---

## 10. Stakeholder Validation & Operational Pilot Plan

To ensure clinical safety and operational adoption, the platform follows a structured 3-tier validation cycle:
1. **Stage 1: Synthetic Simulation:** Validate concurrency with 30+ simultaneous booking threads and test background worker catch-up after simulated server crashes (Verified in backend test suite).
2. **Stage 2: Single-Clinic Shadow Pilot:** Deploy the Doctor Console and Waiting Hall TV screen in a single outpatient clinic for 5 consecutive days without modifying hospital administrative records to assess doctor adherence and chime clarity.
3. **Stage 3: Full OP Department Pilot:** Activate live patient booking with SMS dispatch and walk-in integration across General Medicine and Cardiology departments with weekly stakeholder retrospectives.
