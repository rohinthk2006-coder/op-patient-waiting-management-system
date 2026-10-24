# Open Questions, Unresolved Decisions & Product Assumptions
## Hospital OP Live Tracker & Outpatient Queue Management System

**Document Version:** 1.0.0  
**Date:** October 24, 2026  
**Document Classification:** Internal Product Strategy & Healthcare System Architecture  
**Target Platform:** Web Application (Responsive Mobile & Desktop, Waiting Hall Digital Signage)  
**Primary Region:** Tamil Nadu, India (Initial Network: Tiruchirappalli / Trichy District)  

---

## 1. Executive Summary & Verification Baseline

This document captures the critical assumptions, unverified market hypotheses, clinical workflow constraints, legal-regulatory questions, and unresolved product decisions identified during the discovery and requirements engineering phases of the **Hospital OP Live Tracker**.

In strict accordance with the **Golden Role** principles (Principal Product Manager, Senior Business Analyst, Healthcare Technology Architect, and QA Lead), the product documentation distinguishes between:
1. **Verified Existing Code Capabilities:** Features verified through direct source inspection and passing automated tests in the repository.
2. **Prototype / Simulated Implementations:** Features present in the codebase using mock data, local algorithmic heuristics, or simulated hardware gateways.
3. **Planned & Proposed Capabilities:** Enterprise features, third-party integrations, multi-tenant administrative controls, and regulatory safeguards required for full commercial and clinical deployment.

### 1.1 Repository Verification Summary

| Component | Implemented & Verified in Repo | Simulated / Heuristic in Repo | Planned / Unverified for Production |
| :--- | :--- | :--- | :--- |
| **Module 1: UI Foundation** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide icons, responsive layout, App shell navigation. | — | Multi-language localization (Tamil / English), WCAG 2.1 AA certified audit. |
| **Module 2: Authentication & RBAC** | JWT bearer tokens, bcrypt hashing, role schema (`PATIENT`, `DOCTOR`, `RECEPTIONIST`, `ADMIN`), OTP verification endpoint (`/auth/otp/verify`). | Fast2SMS gateway simulated in dev (`123456` autofill when uncharged); pre-seeded demo users. | Real-world SMS DLT template registration, ABHA / Ayushman Bharat Digital Mission (ABDM) integration, Multi-Factor Auth (MFA) for staff. |
| **Module 3: Hospital & Schedule Master** | Multi-hospital catalog (MGMGH GH, Kauvery, Apollo, SRM, CSI, Frontline), department doctor assignments, morning/evening OP schedules. | In-memory store fallback when live MongoDB is offline. | Self-service Hospital Admin management console, doctor leave / substitution calendar sync. |
| **Module 4: OP Booking & Discovery** | Atomic booking endpoint (`/bookings`), patient phone & name validation, Aadhaar input & 12-digit format check. | Aadhaar stored in DB without UIDAI e-KYC API verification; client-side formatting. | UIDAI / ABDM compliant e-KYC, token cancellation self-service portal, pre-payment gateway (if fee-based). |
| **Module 5: Unified Queue Engine** | Single authoritative queue per schedule/date, zero duplicate token guarantee under 30-client parallel concurrency, walk-in registration. | Walk-in tokens mixed sequentially; manual desk triage logic. | Configurable walk-in vs online slot reservation ratios (e.g., 60/40 split), emergency patient priority bump. |
| **Module 6: Check-In & Auto Token Expiry** | 1-tap patient check-in (`/check-in`), asyncio background worker (30s interval), atomic status transition to `EXPIRED`, check-in immunity, crash-restart catch-up. | Demo force-expiry trigger for stakeholder testing. | Configurable grace periods per department (e.g., Geriatrics vs General OP), authorized late-arrival reinstatement audit workflow. |
| **Module 7: Waiting Time & AI** | Transparent heuristic engine: $\text{Wait} = (\text{Position} - 1) \times \text{AvgTime} + \text{StatusOffset} + \text{DelayOffset}$. | scikit-learn RandomForestRegressor pipeline scaffold with heuristic fallback. | Continuous training on actual hospital timestamp logs (check-in, enter room, exit room), handling doctor multi-tasking (OP vs Emergency Ward rounds). |
| **Module 8: Live Signage & WebSockets** | Fullscreen Waiting Hall TV mode, Web Audio API dual-tone chime (880Hz / 659Hz), WebSocket broadcasting (`ws_manager`). | WebSocket running on single Uvicorn node; local audio synthesis. | High-availability Redis Pub/Sub WebSocket cluster, multilingual text-to-speech (TTS) voice announcements (Tamil + English). |
| **Module 9: Emergency Bed Availability** | Real-time counts across ICU, Trauma, Oxygen, General Ward; critical alert badges (Green/Amber/Red). | Manual REST update mock endpoints. | Integration with Hospital Information System (HIS) / Electronic Health Records (EHR) bed census modules, stale-data lockout alerts. |
| **Module 10: Travel & Analytics** | Trichy localities catalog, Haversine distance with 1.25 urban detour factor, travel mode speeds, peak-hour delay logic. Recharts hourly flow and pie charts. | Traffic calculation is an algorithmic heuristic based on pre-configured coordinates, NOT external live GPS traffic. | Live integration with Google Maps Distance Matrix / OpenStreetMap API; hospital-wide executive KPI dashboards. |

---

## 2. Unvalidated Market Assumptions

The following market-level assumptions require formal validation through pilot hospital deployments, patient focus groups, and clinical operational audits before general availability:

### MA-01: Patient Digital Literacy & Smartphone Penetration in Regional Outpatient Hubs
* **Assumption:** The majority of patients visiting multi-specialty hospitals in Tier-2 Indian cities (such as Tiruchirappalli) possess a smartphone with an active data connection and can navigate a web application to book tokens and monitor queues.
* **Risk:** Rural and elderly patients visiting public hospitals (e.g., MGMGH Government Hospital) may lack digital access, creating health equity disparities.
* **Mitigation:** The system strictly maintains a **Unified Online and Walk-in Queue**. Hospital reception desks and kiosks issue identical physical printed tokens that feed into the authoritative digital queue, ensuring 100% inclusion.

### MA-02: Doctor & Clinical Staff Adherence to Console Workflow
* **Assumption:** Outpatient doctors or assisting clinical nurses will click `Call Next Patient`, `Start Consultation`, and `Complete Consultation` in real time during busy clinical sessions.
* **Risk:** Clinicians facing heavy patient loads (40–60 patients/session) may find manual software interactions burdensome, causing the digital queue state to lag behind the physical consultation room.
* **Mitigation:**
  1. Design single-click, high-contrast, keyboard-friendly console interfaces (using `design-taste-frontend` and `frontend-design` principles).
  2. Allow OP nurses or receptionists to drive token progression on behalf of the doctor.
  3. Support batch completion or automated time-elapsed reminders.

### MA-03: Patient Acceptance of Automatic Token Expiry & Grace Periods
* **Assumption:** Patients will accept that failure to arrive at the hospital and check in before their reporting deadline (+ 10-minute grace period) results in automated token cancellation.
* **Risk:** Patients arriving late due to unforeseen traffic or emergency situations may react confrontationally at reception desks if their token is marked `EXPIRED`.
* **Mitigation:** Implement proactive SMS / WhatsApp reminders at $T-30$ minutes and $T-10$ minutes, clearly display countdown timers on mobile screens, and provide an authorized **Reception Reinstatement Workflow** for legitimate medical emergencies.

### MA-04: Multi-Hospital Cooperation on Emergency Bed Reporting
* **Assumption:** Competing private hospital networks (e.g., Apollo, Kauvery, SRM, Frontline) will willingly share real-time emergency bed occupancy data on a unified public or regional dashboard.
* **Risk:** Commercial competition or liability fears may lead private institutions to withhold occupancy figures or report stale data.
* **Mitigation:** Position the bed tracker as a regional public health emergency coordination utility; provide role-based view tiers (public sees categorized availability levels; emergency ambulance services see exact bed numbers; private hospitals control manual broadcast access).

---

## 3. Legal, Regulatory & Healthcare Safeguards

### REG-01: Indian Digital Personal Data Protection (DPDP) Act 2023 Compliance
* **Context:** Healthcare data is classified as sensitive personal data under Indian law.
* **Requirements:**
  1. Explicit consent must be captured at registration.
  2. Data minimization: only collect phone number, patient name, age, and gender strictly necessary for OP triage.
  3. Right to erasure and data retention limits: consultation queues must be archived after 24 hours; personal identifiers must not be exposed on public signage screens.
* **Action Required:** Retain legal counsel specializing in Indian health tech regulations to draft the formal Data Privacy Policy and Consent Artifacts.

### REG-02: Aadhaar Card Number Handling & UIDAI Guidelines
* **Context:** The current repository includes Aadhaar card number input and privacy masking in the booking flow. Under the Aadhaar Act and Supreme Court rulings, private entities cannot mandate Aadhaar for non-statutory benefits without specific authorization.
* **Current Mitigation in Code:** Aadhaar is purely optional in the schema; inputs are masked in UI views (`XXXX-XXXX-1234`).
* **Unresolved Decision:** Shall the production system remove Aadhaar entirely in favor of the **Ayushman Bharat Health Account (ABHA ID)**, which is the national standard under ABDM and fully supported by the National Health Authority (NHA)?
* **Recommendation:** Transition from raw Aadhaar collection to voluntary ABHA ID linking.

### REG-03: Medical Advice & Clinical Triage Disclaimer
* **Mandatory Safeguard:** The Hospital OP Live Tracker is strictly an administrative queue scheduling tool, **NOT** a clinical diagnostic or triage system.
* **System Disclaimer:** Emergency bed numbers and waiting-time predictions are indicative estimates. In life-threatening emergencies, patients must immediately call 108 or proceed directly to the nearest hospital emergency department without waiting for digital token processing.

---

## 4. Open Product Decisions Requiring Stakeholder Agreement

The following table summarizes the key business and architectural decisions that must be resolved prior to finalizing Phase 2 development:

| Decision ID | Area | Current Baseline Proposal | Alternative Options | Impact on Architecture & UX |
| :--- | :--- | :--- | :--- | :--- |
| **DEC-01** | **Late Arrival Handling** | Token marked `EXPIRED`; patient must re-book or register as fresh walk-in at reception desk. | **Option B:** Placed at back of current session queue.<br>**Option C:** Re-inserted after 3 upcoming patients with administrative penalty. | If Option B or C is chosen, queue position calculation and WebSocket advancement algorithms require conditional priority-reinsertion logic. |
| **DEC-02** | **Grace Period Config** | Fixed 10 minutes across all hospitals and departments. | **Option B:** Configurable per department (e.g., 5 mins for Pediatrics, 20 mins for Orthopedics/Geriatrics). | Requires schedule schema update: `grace_period_min` field per OP schedule in MongoDB. |
| **DEC-03** | **Walk-in vs Online Quota** | Mixed dynamically on first-come, first-served basis as bookings occur. | **Option B:** Reserved quota (e.g., Tokens 1–20 Online, Tokens 21–40 Walk-in).<br>**Option C:** Interleaved (Even tokens Online, Odd tokens Walk-in). | Dynamic FIFO maximizes room utilization, whereas reserved quotas protect walk-ins without smartphones. |
| **DEC-04** | **Patient Identifier Standard** | 10-digit Indian Mobile Phone + OTP. | **Option B:** Mobile + ABHA (Ayushman Bharat Health Account).<br>**Option C:** Hospital-specific MRN (Medical Record Number). | Mobile OTP offers the lowest barrier to entry. ABHA provides future integration into national health records. |
| **DEC-05** | **SMS Gateway Infrastructure** | Fast2SMS with development mock bypass. | **Option B:** Twilio India / Exotel.<br>**Option C:** WhatsApp Business API via Gupshup / Infobip. | WhatsApp Business API has higher open rates (>90%) and lower DLT SMS friction in India, but incurs per-conversation API billing. |
| **DEC-06** | **Real-Time Traffic Engine** | Internal Haversine formula with urban detour factor and peak-hour heuristic. | **Option B:** Google Maps Distance Matrix API.<br>**Option C:** Open-Source Routing Machine (OSRM) with OpenStreetMap data. | External Google Maps API requires billing accounts and per-request API costs, whereas OSRM requires self-hosted infrastructure. |
| **DEC-07** | **Emergency Bed Freshness Cutoff** | Stale badge displayed if bed census is not updated within 60 minutes. | **Option B:** 30 minutes for ICU/Trauma, 120 minutes for General Ward.<br>**Option C:** Hard lockout (hide availability) after 2 hours. | Protects emergency responders from acting on obsolete bed availability data. |

---

## 5. Technical Assumptions & System Boundaries

1. **Server Clock Authority:** All reporting deadlines, grace periods, and consultation timestamps are strictly evaluated against the central backend server's UTC time. Client-side clocks are untrusted.
2. **Idempotent Queue Updates:** All database transitions (`BOOKED` $\rightarrow$ `CHECKED_IN`, `BOOKED` $\rightarrow$ `EXPIRED`, `IN_CONSULTATION` $\rightarrow$ `COMPLETED`) are atomic compound operations (`find_one_and_update`), preventing race conditions.
3. **Database Scalability:** MongoDB compound unique index `{ schedule_id: 1, booking_date: 1, token_number: 1 }` guarantees zero duplicate token numbers across concurrent threads.
4. **Offline Resilience:** If hospital internet connectivity flickers, the local waiting hall display client must gracefully display the last known state, retry WebSocket connections with exponential backoff, and avoid blanking screens.
5. **No Direct Clinical Integration Required for MVP:** The system does not interface with PACS, radiology imaging, or pharmacy dispensary software in Phase 1/2.
