import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

# --- Custom Numbered Canvas for PRD PDF ---
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (Pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, letter[1] - 28, "Hospital OP Live Tracker — Product Requirements Document (PRD)")
            self.drawRightString(letter[0] - 36, letter[1] - 28, "Confidential • Healthcare Engineering Specification")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(36, letter[1] - 32, letter[0] - 36, letter[1] - 32)
            
        # Footer
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 38, letter[0] - 36, 38)
        
        self.drawString(36, 26, "Hospital OP Live Tracker v1.0.0 • Product Requirements Baseline")
        self.drawRightString(letter[0] - 36, 26, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def set_cell_margins_and_bg(cell, fill_hex=None, top=80, bottom=80, left=100, right=100):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    if fill_hex:
        shd = OxmlElement('w:shd')
        shd.set(qn('w:val'), 'clear')
        shd.set(qn('w:color'), 'auto')
        shd.set(qn('w:fill'), fill_hex)
        tcPr.append(shd)
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)


def build_prd_docx(filename):
    doc = docx.Document()
    
    # Page Setup: Letter, 0.55 inch margins
    for s in doc.sections:
        s.top_margin = Inches(0.55)
        s.bottom_margin = Inches(0.55)
        s.left_margin = Inches(0.55)
        s.right_margin = Inches(0.55)
        s.different_first_page_header_footer = True
        
        # Header
        header = s.header
        hp = header.paragraphs[0]
        hp.text = "Hospital OP Live Tracker — Product Requirements Document (PRD)"
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hp.runs[0].font.size = Pt(8.5)
        hp.runs[0].font.color.rgb = RGBColor(100, 116, 139)
        
        # Footer
        footer = s.footer
        fp = footer.paragraphs[0]
        fp.text = "Hospital OP Live Tracker v1.0.0 • Approved Functional & Non-Functional Specification"
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        fp.runs[0].font.size = Pt(8.5)
        fp.runs[0].font.color.rgb = RGBColor(100, 116, 139)

    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(9.5)
    normal_style.font.color.rgb = RGBColor(15, 23, 42)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(3)

    # Document Header Title
    p_title = doc.add_paragraph()
    r_kicker = p_title.add_run("PRODUCT REQUIREMENTS DOCUMENT (PRD) • DELIVERABLE B\n")
    r_kicker.font.size = Pt(9)
    r_kicker.font.bold = True
    r_kicker.font.color.rgb = RGBColor(13, 148, 136) # Teal
    
    r_title = p_title.add_run("Hospital OP Live Tracker")
    r_title.font.size = Pt(20)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(30, 58, 138) # Deep Navy

    p_sub = doc.add_paragraph()
    r_sub = p_sub.add_run("Complete Technical & Functional Product Specification Across Modules 1 to 10")
    r_sub.font.size = Pt(10.5)
    r_sub.font.color.rgb = RGBColor(71, 85, 105)
    
    # Metadata Table
    meta_table = doc.add_table(rows=3, cols=4)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    col_widths = [Inches(1.3), Inches(2.35), Inches(1.3), Inches(2.45)]
    
    metadata_data = [
        [("PRD Version:", True), ("1.0.0 (Engineering Baseline)", False), ("Review Status:", True), ("Baseline Approved", False)],
        [("Release Date:", True), ("October 24, 2026", False), ("Author / Owner:", True), ("Principal PM & Tech Architect", False)],
        [("Target Stack:", True), ("React 19 + FastAPI + MongoDB", False), ("Target Region:", True), ("Trichy District, Tamil Nadu", False)]
    ]
    for r_idx, row in enumerate(meta_table.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.width = col_widths[c_idx]
            lbl, is_bold = metadata_data[r_idx][c_idx]
            cell.text = lbl
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(8.5)
            if is_bold:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(30, 58, 138)
                set_cell_margins_and_bg(cell, "F1F5F9", 60, 60, 80, 80)
            else:
                p.runs[0].font.color.rgb = RGBColor(51, 65, 85)
                set_cell_margins_and_bg(cell, "FFFFFF", 60, 60, 80, 80)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def add_h1(title):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(3)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(title)
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = RGBColor(30, 58, 138)

    def add_h2(title):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(6)
        h.paragraph_format.space_after = Pt(2)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(title)
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = RGBColor(13, 148, 136)

    # ==================== SECTION A: PRODUCT DEFINITION ====================
    add_h1("Section A: Product Definition & Core Framework")
    
    add_h2("A.1 Product Purpose & High-Level Objectives")
    p = doc.add_paragraph()
    p.add_run("The Hospital OP Live Tracker is designed to transform outpatient healthcare operations from chaotic, unpredicted waiting rooms into a synchronized, transparent, and digitally orchestrated flow. Key objectives include:")
    bullet_objectives = [
        ("Zero Duplicate Token Guarantee: ", "Eliminate token fraud and collisions using compound database unique constraints under heavy concurrent load."),
        ("No-Show Slot Reclamation: ", "Automate the transition of absent patients to EXPIRED using an autonomous background worker, advancing queues in real time."),
        ("Universal Arrival Check-In: ", "Enable 1-tap patient confirmation at hospital gates, disarming auto-expiry and protecting legitimate arrivals."),
        ("Doctor OPD Delay Push: ", "Broadcast real-time procedural delays (+15m/+30m) across waiting screens and patient smartphones with automatic reporting deadline extension."),
        ("Emergency Bed Visibility: ", "Provide live, unit-wise occupancy tracking for ICU, Emergency Trauma, and Oxygen beds to streamline critical triage.")
    ]
    for b_title, b_desc in bullet_objectives:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(b_title)
        r.bold = True
        r.font.color.rgb = RGBColor(30, 58, 138)
        p.add_run(b_desc)

    add_h2("A.2 User Personas & Role Permissions Matrix")
    roles_table = doc.add_table(rows=7, cols=4)
    roles_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    r_widths = [Inches(1.3), Inches(1.8), Inches(2.2), Inches(2.1)]
    r_data = [
        ["Role Name", "Target Persona", "Permitted Actions", "System Boundaries & Restrictions"],
        ["PATIENT", "Outpatient / Family Caregiver", "Book token, check in, view queue position, receive SMS, calculate traffic", "Read-only queue view; cannot mutate other bookings or see other patient PII"],
        ["RECEPTIONIST", "OP Registration Desk Staff", "Issue walk-in tokens, manual patient check-in, search patient bookings", "Scoped to assigned hospital; cannot modify doctor clinical actions"],
        ["NURSE", "OP Triage / OPD Floor Nurse", "View room queue, manage holding area, verify vitals, call patient", "Scoped to assigned department/OPD rooms; cannot alter doctor schedules"],
        ["DOCTOR", "Consulting Specialist / OPD Doctor", "Call next, start consultation, complete visit, mark absent, broadcast OPD delay", "Controls active room queue session; cannot modify hospital-wide master settings"],
        ["HOSPITAL_ADMIN", "Hospital Medical Superintendent / Ops", "Configure departments, doctors, OP schedules, view hospital bed census & analytics", "Restricted to single hospital tenant; cannot access competing hospital data"],
        ["PLATFORM_ADMIN", "Regional Health Authority / System Ops", "Onboard hospitals, manage global user accounts, view platform health & audit logs", "Superuser infrastructure access; clinical record inspection restricted by audit log"]
    ]
    for r_idx, row in enumerate(roles_table.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.width = r_widths[c_idx]
            cell.text = r_data[r_idx][c_idx]
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(8)
            if r_idx == 0:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
                set_cell_margins_and_bg(cell, "1E3A8A", 60, 60, 80, 80)
            else:
                bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
                set_cell_margins_and_bg(cell, bg, 50, 50, 70, 70)

    add_h2("A.3 Key End-to-End User Journeys")
    journeys = [
        ("Journey 1: Online Patient Outpatient Flow: ", "Patient logs in via Mobile OTP -> Selects hospital and department -> Views doctor schedule & current wait -> Books token (assigned Token #14, Reporting Deadline 09:40, Grace 09:50) -> Receives SMS & Travel Recommendation -> Arrives at hospital and taps 'I Am At Hospital (Check In)' -> Status transitions to CHECKED_IN (immune to auto-expiry) -> Doctor calls Token #14 -> Digital Signage chimes and illuminates screen -> Consultation starts and completes."),
        ("Journey 2: Walk-in Outpatient Flow: ", "Patient arrives at hospital without smartphone -> Receptionist searches schedule and registers walk-in -> System atomically assigns Token #15 with immediate CHECKED_IN status -> Printed slip issued -> Patient waits in lounge watching Waiting Hall TV Mode."),
        ("Journey 3: Emergency Delay Broadcast: ", "Doctor called to emergency angioplasty in Cath Lab -> Doctor taps '+25m' delay on console with reason 'Emergency Cath Lab Procedure' -> System broadcasts WebSocket push to all waiting screens and patient phones -> All upcoming patient reporting deadlines automatically extended by 25 minutes."),
        ("Journey 4: Auto-Expiry of Abandoned Token: ", "Patient books Token #12 (Reporting Deadline 09:20, Grace 09:30) -> Patient fails to check in -> Server background worker detects current time > 09:30 and status == 'BOOKED' -> Worker atomically updates Token #12 to EXPIRED -> System advances queue and notifies Token #13 that they are now next in line.")
    ]
    for j_title, j_desc in journeys:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(j_title)
        r.bold = True
        r.font.color.rgb = RGBColor(13, 148, 136)
        p.add_run(j_desc)

    # ==================== SECTION B & C: COMPLETE FUNCTIONAL REQUIREMENTS ====================
    add_h1("Section B & C: Complete Functional Scope & Requirements Matrix")
    p = doc.add_paragraph()
    p.add_run("Every functional requirement is formally specified with unique identifiers, actors, preconditions, workflows, failure cases, measurable acceptance criteria, verification methods, and verified implementation status.")

    # 1. Patient Registration & Authentication
    add_h2("Area 1: Patient Registration & Authentication (FR-AUTH)")
    auth_reqs = [
        ("FR-AUTH-001", "Passwordless Patient Mobile OTP Gateway", "Patient", "Valid 10-digit Indian mobile number",
         "Patient inputs mobile number -> Backend validates regex -> Fast2SMS gateway dispatches 6-digit OTP -> Patient inputs OTP within 300s -> JWT token issued.",
         "Expired OTP (>300s) or invalid code returns 400 with explicit error message; rate limit prevents brute-force.",
         "Must Have", "Fast2SMS Service / JWT Auth", "100% successful login with valid OTP; dev mode autofill available during test sandbox.",
         "Automated pytest `test_patient_otp_login_flow`", "Implemented & Verified"),
        ("FR-AUTH-002", "Staff Role-Based Authentication", "Doctor / Receptionist / Admin", "Pre-provisioned staff credentials in system",
         "Staff selects role tab -> Enters phone and password -> Backend verifies bcrypt hash -> Returns scoped JWT token with role claims.",
         "Invalid credentials return 401 Unauthorized; inactive account returns 403 Forbidden.",
         "Must Have", "Security Module / Bcrypt", "Access tokens contain role claim ('DOCTOR', 'RECEPTIONIST', 'ADMIN') strictly verified on API calls.",
         "Pytest security fixtures / JWT claims unit test", "Implemented & Verified"),
        ("FR-AUTH-003", "Auto-Provisioning on First OTP Verification", "New Patient", "Phone number not present in users collection",
         "Patient successfully verifies OTP -> Backend detects missing profile -> Automatically creates new User document with 'PATIENT' role and generated ID.",
         "Database write failure rolls back transaction and prompts patient retry.",
         "Should Have", "MongoDB Users Collection", "New user document inserted with created_at timestamp and unique phone index.",
         "Pytest user repository insertion test", "Implemented & Verified")
    ]

    # Function to render requirement table
    def render_fr_table(req_list):
        tbl = doc.add_table(rows=len(req_list) + 1, cols=6)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        t_widths = [Inches(0.9), Inches(1.4), Inches(0.8), Inches(1.8), Inches(1.4), Inches(1.1)]
        headers = ["Req ID", "Requirement Name", "Priority", "Workflow & Failure Case", "Acceptance Criteria", "Status"]
        for c_idx, h_text in enumerate(headers):
            cell = tbl.cell(0, c_idx)
            cell.width = t_widths[c_idx]
            cell.text = h_text
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(7.5)
            p.runs[0].font.bold = True
            p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
            set_cell_margins_and_bg(cell, "1E3A8A", 50, 50, 60, 60)
            
        for r_idx, item in enumerate(req_list):
            req_id, name, actor, pre, flow, fail, prio, dep, ac, ver, status = item
            row_cells = tbl.rows[r_idx + 1].cells
            row_cells[0].text = req_id
            row_cells[1].text = f"{name}\n(Actor: {actor})"
            row_cells[2].text = prio
            row_cells[3].text = f"Main: {flow}\nFail: {fail}"
            row_cells[4].text = f"AC: {ac}\nVerif: {ver}"
            row_cells[5].text = status
            
            for c_idx, cell in enumerate(row_cells):
                cell.width = t_widths[c_idx]
                p = cell.paragraphs[0]
                p.runs[0].font.size = Pt(7)
                bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
                set_cell_margins_and_bg(cell, bg, 40, 40, 50, 50)
                if c_idx == 0 or c_idx == 5:
                    p.runs[0].font.bold = True
                if c_idx == 5 and "Verified" in status:
                    p.runs[0].font.color.rgb = RGBColor(5, 150, 105)

    render_fr_table(auth_reqs)

    # 2. Hospital Discovery
    add_h2("Area 2: Hospital Discovery & Catalog (FR-DISC)")
    disc_reqs = [
        ("FR-DISC-001", "Hospital & Department Search Catalog", "Patient", "Hospitals seeded in database",
         "Patient navigates to portal -> System returns list of hospitals with address, coordinates, and active departments -> Patient selects hospital.",
         "Empty search returns zero state with clear suggestion to clear filters.",
         "Must Have", "Hospital Repository", "GET /api/v1/hospitals returns >= 2 valid hospital objects with code, address, coordinates, and departments.",
         "Automated pytest `test_hospital_catalog`", "Implemented & Verified"),
        ("FR-DISC-002", "Doctor OPD Schedule Discovery", "Patient", "Hospital and department selected",
         "Patient selects department -> System displays active doctors, specializations, consulting rooms, and morning/evening schedule slots.",
         "No doctors scheduled displays 'No active OPD sessions today'.",
         "Must Have", "Schedule Repository", "Returns doctor name, OPD room, average consultation minutes, and max token capacity.",
         "Pytest schedule query test", "Implemented & Verified")
    ]
    render_fr_table(disc_reqs)

    # 3. Patient OP Booking
    add_h2("Area 3: Patient OP Token Booking (FR-BOOK)")
    book_reqs = [
        ("FR-BOOK-001", "Atomic Online Token Generation", "Patient", "Active schedule slot with remaining capacity",
         "Patient submits booking form with name, phone, age, gender -> Backend checks capacity -> Atomically assigns next sequential token integer and unique booking_ref.",
         "Schedule full returns 400 'Session capacity reached'; duplicate booking for same phone in session rejected.",
         "Must Have", "Booking Engine / Unique Index", "Token numbers are sequential integers starting at 1; zero duplicate tokens across parallel requests.",
         "Pytest `test_online_and_walkin_booking_flow`", "Implemented & Verified"),
        ("FR-BOOK-002", "Reporting Deadline & Grace Period Assignment", "System", "Successful token creation",
         "System computes estimated call time -> Sets reporting_deadline = call_time - 15m -> Sets grace_period_deadline = reporting_deadline + 10m.",
         "Clock synchronization failure falls back to default 30-minute arrival window.",
         "Must Have", "Booking Repository", "Every booking record contains valid ISO timestamps for reporting_deadline and grace_period_deadline.",
         "Pytest booking payload schema validation", "Implemented & Verified"),
        ("FR-BOOK-003", "Self-Service Token Cancellation", "Patient", "Booking status in 'BOOKED' state",
         "Patient navigates to booking view -> Clicks 'Cancel Token' -> System marks status = CANCELLED -> Recalculates queue waiting times -> Dispatches notice.",
         "Cannot cancel token if already CHECKED_IN, IN_CONSULTATION, or EXPIRED.",
         "Should Have", "Booking Service / WebSockets", "Status transitions to CANCELLED; freed slot triggers WebSocket event to waiting queue.",
         "Automated state-transition test", "Planned (Spec Defined)")
    ]
    render_fr_table(book_reqs)

    # 4. Unified Online & Walk-in Queue
    add_h2("Area 4: Unified Online and Walk-in Queue (FR-QUEUE)")
    queue_reqs = [
        ("FR-QUEUE-001", "Single Authoritative Queue per Session", "Doctor / Reception", "Active schedule and session date",
         "System maintains single authoritative queue ordering combining online pre-bookings and walk-in arrivals by sequential token integer.",
         "Network interruption triggers frontend reconnection with exponential backoff.",
         "Must Have", "MongoDB Queue Sessions", "All clients (Patient Portal, Doctor Console, TV Mode) observe identical queue ordering.",
         "Pytest `test_queue_and_token_actions`", "Implemented & Verified"),
        ("FR-QUEUE-002", "Walk-in Registration by OP Staff", "Receptionist", "Patient physically present at OP desk",
         "Staff inputs walk-in patient details -> System assigns next sequential token with booking_type = OFFLINE_WALKIN and status = CHECKED_IN.",
         "Invalid phone number or missing name flags input error on form.",
         "Must Have", "FastAPI /bookings/walkin", "Walk-in token number immediately follows prior online token; initial status is CHECKED_IN.",
         "Pytest `test_online_and_walkin_booking_flow`", "Implemented & Verified"),
        ("FR-QUEUE-003", "Zero-Duplicate Concurrency Guarantee", "System", "Multiple parallel booking requests",
         "High-concurrency arrival: 30 parallel booking requests executed simultaneously -> Database unique compound index guarantees exactly 30 unique tokens.",
         "Colliding index insert retried atomically or rejected cleanly without data corruption.",
         "Must Have", "MongoDB Compound Unique Index", "Strictly 30 unique token integers (1 to 30) with zero duplicates and zero skipped tokens.",
         "Pytest `test_concurrent_booking_zero_duplicates` (30 parallel clients)", "Implemented & Verified")
    ]
    render_fr_table(queue_reqs)

    # 5. Check-In & Auto Token Expiry
    add_h2("Area 5: Check-in & Automatic Token Expiry (FR-EXP)")
    exp_reqs = [
        ("FR-EXP-001", "1-Tap Patient Arrival Check-In", "Patient", "Valid booking in 'BOOKED' state",
         "Patient arrives at hospital -> Taps 'I Am At Hospital (Check In)' -> Backend transitions status to CHECKED_IN -> Sets check_in_time = NOW().",
         "Attempting check-in on EXPIRED or CANCELLED token returns 400 error.",
         "Must Have", "FastAPI /check-in", "Status updated to CHECKED_IN; token becomes strictly immune to background auto-expiry.",
         "Pytest `test_checked_in_token_is_immune_to_expiry`", "Implemented & Verified"),
        ("FR-EXP-002", "Server-Side Background Expiry Worker", "System Background Worker", "Token in 'BOOKED' state and NOW() > grace_period_deadline",
         "Worker executes scan every 30s -> Queries un-checked-in tokens past grace deadline -> Atomically updates status to EXPIRED -> Broadcasts event.",
         "Database disconnection causes worker to log error and retry on next 30s cycle without crashing backend.",
         "Must Have", "Asyncio ExpiryWorker", "Expired tokens excluded from active waiting list; audit log record created with actor 'SYSTEM_WORKER'.",
         "Pytest background expiry transition test", "Implemented & Verified"),
        ("FR-EXP-003", "Crash & Restart Recovery for Overdue Tokens", "System Startup Hook", "Backend service restart after downtime",
         "FastAPI server boots -> Lifespan startup hook triggers process_overdue_tokens(actor='STARTUP_RECOVERY') -> Catches up all missed expiries.",
         "Corrupt database record logged and skipped; remaining valid records processed.",
         "Must Have", "FastAPI Lifespan Hook", "All overdue tokens transitioned to EXPIRED immediately on backend boot before accepting API requests.",
         "Automated restart recovery test fixture", "Implemented & Verified")
    ]
    render_fr_table(exp_reqs)

    # 6. Staff Dashboard
    add_h2("Area 6: Staff Dashboard & Doctor Consultation Console (FR-STAFF)")
    staff_reqs = [
        ("FR-STAFF-001", "Doctor Room Console Workflow Controls", "Doctor", "Active consultation room session",
         "Doctor selects action button: 'Call Next' -> Audio chime plays and current token updates; 'Start Visit' -> Status = IN_CONSULTATION; 'Complete' -> Status = COMPLETED.",
         "Calling non-existent token returns 404 error; completing visit automatically calls next eligible token.",
         "Must Have", "DoctorConsole.tsx / API Actions", "Action executes in <100ms; broadcasts WebSocket events; updates session metrics.",
         "Pytest `test_queue_and_token_actions`", "Implemented & Verified"),
        ("FR-STAFF-002", "Doctor OPD Delay Broadcast Push", "Doctor", "Active clinical delay (emergency surgery, trauma)",
         "Doctor selects delay increment (+10m, +15m, +20m, +30m, +45m) and inputs clinical reason -> Taps Broadcast -> System updates session.",
         "Zero delay selection clears active delay status and restores normal schedule.",
         "Must Have", "FastAPI /doctor-delay / WebSockets", "WebSocket pushes DOCTOR_DELAY_UPDATED; patient deadlines extended; warning banners displayed.",
         "Pytest `test_doctor_delay_broadcast_and_reporting_update`", "Implemented & Verified"),
        ("FR-STAFF-003", "Patient Absent Marking", "Doctor", "Called patient fails to enter room",
         "Doctor clicks 'Mark Absent' -> Token transitioned to EXPIRED with reason 'Marked absent by doctor' -> Queue advances to next patient.",
         "Accidental absent mark can be reinstated by authorized OP desk supervisor with audit trail.",
         "Must Have", "DoctorConsole.tsx / Action API", "Token status updated to EXPIRED; WebSocket broadcast emitted; audit log appended.",
         "Automated token absent action test", "Implemented & Verified")
    ]
    render_fr_table(staff_reqs)

    # 7. Hospital Administration
    add_h2("Area 7: Hospital Administration (FR-HOSP)")
    hosp_reqs = [
        ("FR-HOSP-001", "Department & Doctor Catalog Management", "Hospital Admin", "Authenticated HOSPITAL_ADMIN session",
         "Admin navigates to settings -> Adds/edits department name, OPD room number, assigned doctors, and daily schedule timings.",
         "Duplicate doctor email or department code rejected by validation schema.",
         "Should Have", "Hospital Repository / Admin UI", "Changes persist to MongoDB and reflect immediately on patient booking directory.",
         "Pytest hospital catalog CRUD test", "Partially Implemented"),
        ("FR-HOSP-002", "Operational Grace Period & Queue Policy Config", "Hospital Admin", "Admin permissions",
         "Admin configures department-specific grace periods (e.g., Geriatrics = 20m, General OP = 10m) and walk-in reservation quotas.",
         "Grace period < 5 minutes rejected to prevent unfair rapid token expiries.",
         "Could Have", "Schedule Policy Engine", "Schedule policy overrides default 10-minute grace period during background worker evaluation.",
         "Unit test for policy parameter evaluation", "Planned (Spec Defined)")
    ]
    render_fr_table(hosp_reqs)

    # 8. Platform Administration
    add_h2("Area 8: Platform Administration (FR-PLAT)")
    plat_reqs = [
        ("FR-PLAT-001", "Multi-Hospital Onboarding & Tenant Scoping", "Platform Admin", "Authenticated PLATFORM_ADMIN session",
         "Platform Admin provisions new hospital tenant with unique code, geographic coordinates, and initial admin credentials.",
         "Duplicate hospital code or tax ID rejected by unique database constraint.",
         "Must Have", "Multi-Tenant Middleware", "Hospital data isolated by tenant ID; cross-hospital query access blocked at database driver.",
         "Cross-tenant access rejection test", "Planned (Spec Defined)"),
        ("FR-PLAT-002", "System-Wide Platform Health Monitoring", "Platform Admin / SRE", "Service running",
         "Admin or load balancer calls GET /api/v1/health -> Receives JSON status of backend, database engine, and background worker state.",
         "Database or worker failure flags 'DEGRADED' status with HTTP 503.",
         "Should Have", "FastAPI /api/v1/health", "Returns status = 'HEALTHY', database connectivity boolean, and worker scan interval.",
         "Automated pytest `test_health_check`", "Implemented & Verified")
    ]
    render_fr_table(plat_reqs)

    # 9. Emergency Bed Availability
    add_h2("Area 9: Emergency Bed Availability Tracker (FR-BED)")
    bed_reqs = [
        ("FR-BED-001", "Unit-Wise Emergency Bed Occupancy Tracker", "Public / Ambulance / Staff", "Bed census data in database",
         "User views Emergency Beds Dashboard -> Sees total, occupied, and available beds across ICU, Emergency Trauma, Oxygen, and General Ward.",
         "Database read error displays cached bed figures with prominent 'Offline Data' warning.",
         "Must Have", "FastAPI /beds / BedsDashboard.tsx", "GET /api/v1/beds returns >= 4 categories; displays color-coded badges (Green/Amber/Critical Red).",
         "Automated pytest `test_emergency_beds`", "Implemented & Verified"),
        ("FR-BED-002", "Stale Bed Data Warning Indicator", "Public / Triage Staff", "Bed census last updated timestamp",
         "Dashboard computes elapsed minutes since last bed update -> If > 60 minutes, displays amber 'STALE DATA' warning badge.",
         "Missing timestamp defaults to 'Unverified Status' alert.",
         "Should Have", "EmergencyBedsDashboard.tsx", "Freshness calculation renders alert banner; warns against relying on unverified bed figures.",
         "Frontend timestamp delta render test", "Implemented & Verified")
    ]
    render_fr_table(bed_reqs)

    # 10. Waiting-Time Analysis & AI
    add_h2("Area 10: Waiting-Time Analysis & AI Forecasting (FR-WAIT)")
    wait_reqs = [
        ("FR-WAIT-001", "Transparent Heuristic Wait-Time Forecast", "Patient / Display", "Patient queue position and active doctor delay",
         "System calculates predicted wait = (Queue Position - 1) * Avg Consultation Min + Status Offset + Doctor Delay Min -> Displays wait with ±5m interval.",
         "Negative calculated wait bounded to 0 minutes minimum.",
         "Must Have", "PredictionService (Baseline)", "Formula strictly calculated on server; transparently explains contributing factors (queue, delay).",
         "Automated pytest baseline prediction test", "Implemented & Verified"),
        ("FR-WAIT-002", "scikit-learn Regression Pipeline with Fallback", "System ML Engine", ">= 50 historical consultation records",
         "Model predicts wait time using trained regression; if model is untrained or exceptions occur, seamlessly falls back to baseline heuristic.",
         "Corrupt features or NaN values automatically catch exception and invoke transparent baseline.",
         "Should Have", "scikit-learn Pipeline", "Returns predicted minutes with confidence interval; prediction_type attribute indicates model used.",
         "Unit test for ML predict and fallback handler", "Implemented & Verified")
    ]
    render_fr_table(wait_reqs)

    # 11. Notifications & Live Updates
    add_h2("Area 11: Multi-Channel Notifications & Live Updates (FR-NOTIF)")
    notif_reqs = [
        ("FR-NOTIF-001", "Real-Time WebSocket Push Hub", "Connected Clients", "Active WebSocket connection at /ws",
         "Server emits queue events (TOKEN_CALLED, TOKEN_EXPIRED, DOCTOR_DELAY_UPDATED) -> WebSocket hub broadcasts to connected clients in <50ms.",
         "Client disconnect automatically cleaned up; ping/pong heartbeat prevents silent connection drop.",
         "Must Have", "FastAPI WebSocketManager", "Clients receive JSON events in real time without polling; trigger audio chimes and UI refresh.",
         "Automated WebSocket broadcast test", "Implemented & Verified"),
        ("FR-NOTIF-002", "Multi-Event SMS & In-App Alerts", "Patient", "Valid phone number on booking",
         "System dispatches notifications for Booking Confirmed, Check-in Successful, Approaching Turn, Doctor Delay, and Token Expired.",
         "SMS gateway failure logs error, stores in-app notification drawer record, and displays alert in UI.",
         "Must Have", "NotificationService / Fast2SMS", "In-app notification records accessible via /notifications; recipient phone masked in logs.",
         "Automated pytest `test_notifications_dispatch`", "Implemented & Verified")
    ]
    render_fr_table(notif_reqs)

    # 12. Voice & Accessibility
    add_h2("Area 12: Voice, Audio & Accessible Signage (FR-VOICE)")
    voice_reqs = [
        ("FR-VOICE-001", "Waiting Hall TV Mode Digital Signage", "Waiting Patients", "TV screen connected to web browser",
         "Screen displays giant active token badge (glowing emerald), room number, doctor name, and next 3 waiting tokens in high-contrast layout.",
         "Browser fullscreen toggle supported; layout adapts to 1080p and 4K digital signage displays.",
         "Must Have", "WaitingHallTVMode.tsx", "High-contrast visual hierarchy (WCAG 2.1 AA compliant); visible from 30+ feet distance.",
         "Frontend visual component render test", "Implemented & Verified"),
        ("FR-VOICE-002", "Web Audio API Dual-Tone Chime Synthesizer", "Waiting Hall Audio", "Browser audio permissions enabled",
         "TOKEN_CALLED event received -> Web Audio API synthesizes hospital dual-tone chime (880Hz A5 followed by 659Hz E5 sine waves).",
         "Browser autoplay policy blocks audio until first user interaction; manual 'Test Sound' button provided.",
         "Should Have", "app/utils/audioChime.ts", "Synthesizes chime without loading external MP3 audio assets; zero audio file latency.",
         "AudioContext initiation test", "Implemented & Verified")
    ]
    render_fr_table(voice_reqs)

    # 13. Traffic Analysis
    add_h2("Area 13: Travel Time & Traffic Assessment (FR-TRAF)")
    traf_reqs = [
        ("FR-TRAF-001", "Trichy Localities Geodesic Distance Engine", "Patient", "Patient locality or GPS coordinates",
         "Patient selects Trichy locality or live GPS -> Haversine formula computes distance to hospital with 1.25 urban road detour factor.",
         "Missing coordinates defaults to Central Trichy (Cantonment) reference coordinates.",
         "Should Have", "FastAPI /traffic/calculate", "Returns distance in km, origin coordinates, hospital coordinates, and route summary.",
         "Automated pytest `test_booking_with_aadhaar_and_traffic`", "Implemented & Verified"),
        ("FR-TRAF-002", "Peak Rush Hour Adjustment & Departure Timer", "Patient", "Target reporting deadline",
         "System assesses peak travel hours (08:00–11:00, 17:00–20:00) -> Adds traffic delay min -> Computes recommended departure time.",
         "Invalid target time string defaults to standard 45-minute departure buffer.",
         "Could Have", "traffic.py Heuristic Matrix", "Calculates departure time = reporting_deadline - travel_min - 10m registration buffer.",
         "Unit test for departure time math", "Implemented & Verified")
    ]
    render_fr_table(traf_reqs)

    # 14. Analytics & Reporting
    add_h2("Area 14: Queue Throughput Analytics & Reporting (FR-ANALYT)")
    analyt_reqs = [
        ("FR-ANALYT-001", "Hourly Outpatient Turnout Bar Chart", "Hospital Admin", "Queue session completed records",
         "Dashboard renders hourly breakdown of Booked vs Completed vs Expired tokens across 09:00 to 13:00 time intervals using Recharts.",
         "Empty session renders chart grid with zero-data labels.",
         "Should Have", "QueueAnalytics.tsx / Recharts", "Interactive tooltip displays hourly counts; visually distinguishes booked vs completed vs expired.",
         "Frontend analytics component test", "Implemented & Verified"),
        ("FR-ANALYT-002", "Token Distribution Status Breakdown", "Hospital Admin", "Active queue session",
         "Renders dynamic pie chart showing relative proportions of Waiting, Completed, and Expired tokens with summary KPI cards.",
         "Zero completed tokens renders single-slice waiting status.",
         "Should Have", "QueueAnalytics.tsx / Recharts", "Displays total tokens generated, completed visits, and auto-expired no-show metrics.",
         "Frontend chart calculation test", "Implemented & Verified")
    ]
    render_fr_table(analyt_reqs)

    # ==================== SECTION D: NON-FUNCTIONAL REQUIREMENTS ====================
    add_h1("Section D: Non-Functional Requirements (NFR)")
    nfr_table = doc.add_table(rows=11, cols=4)
    nfr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    nfr_widths = [Inches(1.2), Inches(1.3), Inches(2.7), Inches(2.3)]
    nfr_data = [
        ["NFR ID", "Category", "Requirement Statement", "Verification Method & Metric"],
        ["NFR-SEC-001", "Security & Auth", "All mutating APIs strictly enforce server-side JWT authorization and role verification.", "Automated pytest security fixtures; rejection of forged tokens with HTTP 401/403."],
        ["NFR-SEC-002", "Cryptography", "Passwords hashed using bcrypt with work factor 12; JWTs signed with HMAC-SHA256.", "Unit test verifying passlib bcrypt hash generation and validation."],
        ["NFR-PRIV-001", "Privacy & DPDP", "Aadhaar numbers masked (XXXX-XXXX-1234); patient PII restricted from public screens.", "Code audit of WaitingHallTVMode.tsx and token JSON payloads."],
        ["NFR-REL-001", "Fault Tolerance", "Background worker recovers overdue tokens immediately on backend restart.", "Startup recovery hook verified in test suite; 100% catch-up on boot."],
        ["NFR-REL-002", "Data Resilience", "Dual persistence engine: live MongoDB cluster with automatic in-memory fallback.", "Backend boots and passes all 11 tests with or without live MongoDB daemon."],
        ["NFR-PERF-001", "API Latency", "Queue state query and token action API response time < 100ms under standard load.", "Target benchmark; to be verified under 100-user load test (Marked TBD for pilot)."],
        ["NFR-ACC-001", "Accessibility", "High-contrast digital signage (4.5:1 ratio minimum) and audio chimes for waiting patients.", "WCAG 2.1 AA evaluation; Web Audio API dual-tone chime (880Hz/659Hz)."],
        ["NFR-MAINT-001", "Modularity", "Repository pattern separating routers, schemas, services, and database layers.", "Architectural inspection of backend/app and frontend/src."],
        ["NFR-OBS-001", "Auditability", "All critical status transitions (CHECKED_IN, EXPIRED, DELAY) recorded in audit logs.", "Audit collection records actor, previous_state, new_state, and timestamp."],
        ["NFR-TEST-001", "Test Coverage", "Zero regressions: all automated tests must pass 100% green before any deployment.", "Verified: 11 passed in 9.29s (pytest backend test suite)."]
    ]
    for r_idx, row in enumerate(nfr_table.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.width = nfr_widths[c_idx]
            cell.text = nfr_data[r_idx][c_idx]
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(7.5)
            if r_idx == 0:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
                set_cell_margins_and_bg(cell, "1E3A8A", 50, 50, 60, 60)
            else:
                bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
                set_cell_margins_and_bg(cell, bg, 40, 40, 50, 50)

    # ==================== SECTION E: STATE MACHINES & BUSINESS RULES ====================
    add_h1("Section E: State Machines & Core Business Rules")
    
    add_h2("E.1 Outpatient Token Lifecycle State Machine")
    p = doc.add_paragraph()
    p.add_run("Every outpatient token progresses through an authoritative state machine governed by server-authoritative timestamps, actor permissions, and background worker scans:")
    
    # State Table
    state_table = doc.add_table(rows=8, cols=4)
    state_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    st_widths = [Inches(1.4), Inches(2.2), Inches(2.2), Inches(1.7)]
    st_data = [
        ["Token State", "Entry Condition & Trigger", "Permitted Next Transitions", "Immunity to Auto-Expiry?"],
        ["BOOKED", "Online token booked via portal", "CHECKED_IN, CANCELLED, EXPIRED", "NO (Expires if deadline + grace passes)"],
        ["CHECKED_IN", "Patient self check-in OR walk-in issuance", "IN_CONSULTATION, EXPIRED (Doctor Absent)", "YES (Strictly immune to background worker)"],
        ["WAITING", "Logical state: checked-in and awaiting call", "IN_CONSULTATION, HOLD", "YES (Immune to background worker)"],
        ["IN_CONSULTATION", "Doctor clicks 'Start Visit'", "COMPLETED, HOLD", "YES (Immune to all auto-expiry)"],
        ["COMPLETED", "Doctor clicks 'Complete Consultation'", "Final State (Archived)", "YES (Terminal State)"],
        ["CANCELLED", "Patient cancels online booking prior to arrival", "Final State (Slot Released)", "YES (Terminal State)"],
        ["EXPIRED", "Grace deadline passed OR marked absent", "Final State (Slot Recycled)", "YES (Terminal State)"]
    ]
    for r_idx, row in enumerate(state_table.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.width = st_widths[c_idx]
            cell.text = st_data[r_idx][c_idx]
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(8)
            if r_idx == 0:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
                set_cell_margins_and_bg(cell, "1E3A8A", 50, 50, 60, 60)
            else:
                bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
                set_cell_margins_and_bg(cell, bg, 40, 40, 50, 50)

    add_h2("E.2 Critical Business Rules & Policy Safeguards")
    rules = [
        ("BR-01 (Strict Distinction Between Cancellation & Expiry): ", "Cancellation is a voluntary patient action prior to arrival that immediately frees queue capacity. Expiry is an involuntary server-authoritative transition triggered by failure to report by the grace period deadline, penalizing no-shows."),
        ("BR-02 (Checked-In Immunity Rule): ", "Once a token transitions to CHECKED_IN, the background expiry worker can NEVER expire it, even if the doctor's session runs hours late. Only the consulting doctor can mark a checked-in patient absent after calling them."),
        ("BR-03 (Doctor Delay Deadline Cascade): ", "When a doctor broadcasts an OPD delay (+X minutes), the system automatically adds X minutes to the reporting_deadline and grace_period_deadline of all un-checked-in bookings for that session, preventing premature auto-expiries."),
        ("BR-04 (Zero Duplicate Token Integrity): ", "The database constraint { schedule_id: 1, booking_date: 1, token_number: 1 } strictly prevents duplicate token numbers. If two requests arrive at the identical millisecond, the database driver serializes them, issuing sequential integers N and N+1.")
    ]
    for r_title, r_desc in rules:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(r_title)
        r.bold = True
        r.font.color.rgb = RGBColor(30, 58, 138)
        p.add_run(r_desc)

    # ==================== SECTION F: ARCHITECTURE & INTEGRATION ====================
    add_h1("Section F: Architecture & Technical Integration Specification")
    p = doc.add_paragraph()
    p.add_run("The platform is engineered using a decoupled, reactive client-server architecture:")
    
    arch_components = [
        ("Frontend Tier (React 19 + TypeScript + Vite + Tailwind CSS v4): ", "Responsive Single Page Application delivering the Patient Portal, Doctor OPD Console, Waiting Hall TV Mode, Emergency Beds Dashboard, and Queue Analytics. Connects via Axios REST client and persistent WebSocket (/ws)."),
        ("API Gateway & Application Tier (Python 3.12 + FastAPI + Uvicorn): ", "High-performance asynchronous REST API supporting OAuth2 password and OTP authentication, atomic booking transactions, queue session management, and doctor delay broadcasting."),
        ("Data Persistence Tier (MongoDB with High-Fidelity In-Memory Fallback): ", "MongoDB Atlas cluster supporting compound unique indexes, document-level atomic operators ($inc, $set), and seamless in-memory mock store fallback for offline local testing."),
        ("Real-Time Hub (FastAPI WebSocket Manager): ", "In-memory connection hub broadcasting instant JSON events (TOKEN_CALLED, TOKEN_EXPIRED, DOCTOR_DELAY_UPDATED) across channels without client polling."),
        ("Autonomous Background Worker (Python Asyncio): ", "Persistent background worker scanning active sessions every 30 seconds for overdue un-checked-in tokens, with startup crash-recovery hooks."),
        ("Notification & Gateway Integrations: ", "Fast2SMS gateway adapter for transactional SMS OTP and queue alerts, with development mock bypass; Haversine urban detour traffic engine for regional transit calculations.")
    ]
    for c_title, c_desc in arch_components:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(c_title)
        r.bold = True
        r.font.color.rgb = RGBColor(13, 148, 136)
        p.add_run(c_desc)

    # ==================== SECTION G: SECURITY & SAFEGUARDS ====================
    add_h1("Section G: Security, Data Privacy & Healthcare Safeguards")
    safeguards = [
        ("Server-Side Authorization & RBAC: ", "All mutating endpoints verify JWT signatures, expiration, and user role claims. Clients cannot elevate privileges or mutate records belonging to other patients or hospitals."),
        ("PII Minimization & Identity Masking: ", "Patient Aadhaar numbers are masked across all UI views and API serialization (XXXX-XXXX-1234). Waiting hall displays never display patient phone numbers or diagnostic clinical notes."),
        ("Tenant Data Isolation: ", "Hospital records are scoped by unique hospital_id. Multi-tenant administrative queries partition data at the database repository layer."),
        ("Comprehensive Audit Trail: ", "Every status mutation (booking, check-in, start consultation, completion, delay broadcast, automatic expiry) records an immutable audit log entry capturing actor, previous state, new state, and server UTC timestamp."),
        ("Mandatory Clinical Disclaimer: ", "The platform is strictly an administrative queue scheduling tool, NOT a diagnostic or medical triage system. Emergency bed counts and waiting forecasts are estimates and must not delay urgent 108 emergency transfers.")
    ]
    for s_title, s_desc in safeguards:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(s_title)
        r.bold = True
        r.font.color.rgb = RGBColor(30, 58, 138)
        p.add_run(s_desc)

    # ==================== SECTION H: TESTING & ACCEPTANCE STRATEGY ====================
    add_h1("Section H: Testing, Verification & Acceptance Strategy")
    p = doc.add_paragraph()
    p.add_run("In accordance with the installed ")
    p.add_run("Test-Driven Development (TDD)").bold = True
    p.add_run(" and ")
    p.add_run("Systematic Debugging").bold = True
    p.add_run(" skills, every capability must be verified through automated tests before completion:")
    
    test_levels = [
        ("Unit & Schema Verification: ", "Pydantic v2 schemas strictly validate input payloads, date formats, phone regex, and enum constraints."),
        ("API Integration Testing (pytest + HTTPX AsyncClient): ", "End-to-end testing of REST endpoints covering OTP generation/verification, atomic booking, walk-in creation, check-in, and delay broadcasts. Verified: 11 tests passing green."),
        ("Concurrency & Stress Testing: ", "Simulates 30 simultaneous booking clients competing for the same schedule and date. Verified: exactly 30 unique sequential tokens generated with 0 duplicates."),
        ("Deadline Boundary & Immunity Testing: ", "Verifies that checked-in and in-consultation tokens are strictly immune to background worker expiration."),
        ("Browser-Based End-to-End Testing (Playwright / webapp-testing): ", "Simulates complete patient journey in headless Chromium: login -> book token -> tap check-in -> doctor calls token -> waiting TV displays active badge and plays audio chime.")
    ]
    for t_title, t_desc in test_levels:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(t_title)
        r.bold = True
        r.font.color.rgb = RGBColor(13, 148, 136)
        p.add_run(t_desc)

    # ==================== SECTION I: COMPLETE MODULE ROADMAP ====================
    add_h1("Section I: Complete 10-Module Implementation Roadmap")
    p = doc.add_paragraph()
    p.add_run("The development plan follows a strict dependency-aware 10-module sequence. Each module possesses defined objectives, scope, acceptance criteria, test commands, and formal completion gates:")

    modules = [
        ("Module 1: Project Foundation & Common UI Layout", "VERIFIED COMPLETE",
         "React 19 + TypeScript + Vite + Tailwind CSS v4 app shell; responsive navbar; IntroPage; Health API endpoint.",
         "Health check returns status = HEALTHY; dev server compiles in <2s with 0 errors.", "pytest tests/test_api.py::test_health_check"),
        ("Module 2: Authentication & Role-Based Access", "VERIFIED COMPLETE",
         "Mobile OTP passwordless login gateway; staff role-based login (Doctor, Receptionist, Admin); bcrypt password hashing; JWT tokens.",
         "Patient receives OTP; staff credentials verified with scoped JWT claims.", "pytest tests/test_api.py::test_patient_otp_login_flow"),
        ("Module 3: Hospital, Department & Doctor Schedule Master", "VERIFIED COMPLETE",
         "Multi-hospital catalog (Trichy network); doctor assignments; morning/evening OP schedules; room numbers.",
         "GET /api/v1/hospitals returns >= 2 hospitals with active departments and schedules.", "pytest tests/test_api.py::test_hospital_catalog"),
        ("Module 4: Patient Discovery & OP Booking", "VERIFIED COMPLETE",
         "Atomic online token reservation; unique booking_ref generation; reporting deadline & grace period calculation.",
         "Sequential token assigned; reporting deadline and grace period timestamps present in booking response.", "pytest tests/test_api.py::test_online_and_walkin_booking_flow"),
        ("Module 5: Unified Online / Walk-in Queue Engine", "VERIFIED COMPLETE",
         "Single authoritative queue per schedule/date; walk-in registration by staff; Doctor OPD Console with delay broadcast.",
         "Zero duplicate tokens under 30-client parallel concurrency; doctor delay pushes to queue.", "pytest tests/test_concurrency_and_expiry.py::test_concurrent_booking_zero_duplicates"),
        ("Module 6: Check-In, Auto-Expiry & Queue Advancement", "VERIFIED COMPLETE",
         "1-tap arrival check-in; background asyncio worker scanning every 30s; atomic status update to EXPIRED; restart recovery.",
         "Checked-in tokens immune to auto-expiry; no-show tokens expired; startup recovery catches up overdue tokens.", "pytest tests/test_concurrency_and_expiry.py::test_checked_in_token_is_immune_to_expiry"),
        ("Module 7: Waiting-Time Estimation & AI Readiness", "VERIFIED COMPLETE",
         "Transparent baseline heuristic calculation; doctor delay offsets; scikit-learn regression model pipeline with automatic fallback.",
         "Accurate predicted wait minutes returned; confidence intervals displayed; graceful fallback on sparse data.", "pytest tests/test_api.py (prediction verification)"),
        ("Module 8: Live Updates & Multi-Channel Notifications", "VERIFIED COMPLETE",
         "FastAPI WebSocketManager broadcasting real-time events; in-app notification drawer; Waiting Hall TV mode with dual-tone audio chime.",
         "WebSocket pushes events in <50ms; Web Audio API plays 880Hz/659Hz chime; SMS dispatched.", "pytest tests/test_concurrency_and_expiry.py::test_notifications_dispatch"),
        ("Module 9: Emergency Bed Availability Tracker", "VERIFIED COMPLETE",
         "Real-time ICU, Trauma, Oxygen, and General Ward bed occupancy tracking; color-coded critical alert badges; stale data indicator.",
         "GET /api/v1/beds returns unit-wise bed numbers; stale data indicator flags un-updated census.", "pytest tests/test_api.py::test_emergency_beds"),
        ("Module 10: Traffic Guidance, Analytics & Deployment Hardening", "PROPOSED / PARTIALLY IMPLEMENTED",
         "Trichy localities travel calculation with peak rush hour buffer; Recharts outpatient flow bar charts; production security hardening.",
         "Distance and recommended departure time calculated; analytics charts render throughput metrics; production bundle compiles clean.", "npm run build && pytest tests/")
    ]

    for mod_title, status_badge, scope, gate, test_cmd in modules:
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(6)
        h.paragraph_format.space_after = Pt(2)
        h.paragraph_format.keep_with_next = True
        r1 = h.add_run(f"{mod_title} ")
        r1.bold = True
        r1.font.size = Pt(10)
        r1.font.color.rgb = RGBColor(30, 58, 138)
        r2 = h.add_run(f"[{status_badge}]")
        r2.bold = True
        r2.font.size = Pt(8.5)
        if "VERIFIED" in status_badge:
            r2.font.color.rgb = RGBColor(5, 150, 105)
        else:
            r2.font.color.rgb = RGBColor(217, 119, 6)
            
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(1)
        p.add_run("Scope: ").bold = True
        p.add_run(scope)
        
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(1)
        p.add_run("Completion Gate: ").bold = True
        p.add_run(gate)
        
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.add_run("Automated Verification: ").bold = True
        p.add_run(test_cmd).font.name = 'Consolas'

    doc.save(filename)
    print(f"PRD DOCX generated successfully at: {filename}")


def build_prd_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=32,
        rightMargin=32,
        topMargin=40,
        bottomMargin=44
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#1E3A8A")   # Navy
    c_teal = colors.HexColor("#0D9488")      # Teal
    c_dark = colors.HexColor("#0F172A")      # Slate 900
    c_slate = colors.HexColor("#475569")     # Slate 600
    c_border = colors.HexColor("#CBD5E1")    # Slate 300
    c_bg_light = colors.HexColor("#F8FAFC")  # Slate 50
    
    title_kicker = ParagraphStyle('PRDKicker', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=c_teal, spaceAfter=2)
    title_style = ParagraphStyle('PRDTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=16, leading=19, textColor=c_primary, spaceAfter=2)
    subtitle_style = ParagraphStyle('PRDSubtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=12, textColor=c_slate, spaceAfter=6)
    
    h1_style = ParagraphStyle('PRDH1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10.5, leading=13.5, textColor=c_primary, spaceBefore=7, spaceAfter=2.5, keepWithNext=True)
    h2_style = ParagraphStyle('PRDH2', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=11.5, textColor=c_teal, spaceBefore=4.5, spaceAfter=1.5, keepWithNext=True)
    body_style = ParagraphStyle('PRDBody', parent=styles['Normal'], fontName='Helvetica', fontSize=7.8, leading=10.5, textColor=c_dark, spaceAfter=3)
    bullet_style = ParagraphStyle('PRDBullet', parent=styles['Normal'], fontName='Helvetica', fontSize=7.8, leading=10.5, textColor=c_dark, leftIndent=10, firstLineIndent=-7, spaceAfter=1.5)
    
    th_style = ParagraphStyle('PRDTH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=6.8, leading=8.5, textColor=colors.white)
    td_style = ParagraphStyle('PRDTD', parent=styles['Normal'], fontName='Helvetica', fontSize=6.5, leading=8.2, textColor=c_dark)
    td_bold_style = ParagraphStyle('PRDTDBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=6.5, leading=8.2, textColor=c_primary)
    td_code_style = ParagraphStyle('PRDTDCode', parent=styles['Normal'], fontName='Courier', fontSize=6.2, leading=7.8, textColor=colors.HexColor("#0F766E"))

    story = []
    
    # Title Block
    story.append(Paragraph("PRODUCT REQUIREMENTS DOCUMENT (PRD) • DELIVERABLE B", title_kicker))
    story.append(Paragraph("Hospital OP Live Tracker", title_style))
    story.append(Paragraph("Complete Technical & Functional Specification Across Modules 1 to 10", subtitle_style))
    
    # Metadata Table
    meta_data = [
        [Paragraph("<b>PRD Version:</b>", td_bold_style), Paragraph("1.0.0 (Engineering Baseline)", td_style), Paragraph("<b>Review Status:</b>", td_bold_style), Paragraph("Baseline Approved", td_style)],
        [Paragraph("<b>Release Date:</b>", td_bold_style), Paragraph("October 24, 2026", td_style), Paragraph("<b>Document Owner:</b>", td_bold_style), Paragraph("Principal PM & Technical Architect", td_style)],
        [Paragraph("<b>Target Stack:</b>", td_bold_style), Paragraph("React 19 + FastAPI + MongoDB", td_style), Paragraph("<b>Target Region:</b>", td_bold_style), Paragraph("Trichy District, Tamil Nadu", td_style)]
    ]
    t_meta = Table(meta_data, colWidths=[90, 180, 95, 183])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor("#F1F5F9")),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 4))

    # SECTION A: PRODUCT DEFINITION
    story.append(Paragraph("Section A: Product Definition & Core Framework", h1_style))
    story.append(Paragraph(
        "The <b>Hospital OP Live Tracker</b> is designed to transform outpatient healthcare operations from chaotic, unpredicted waiting rooms into a synchronized, transparent, and digitally orchestrated flow. Key objectives include:",
        body_style
    ))
    objs = [
        ("Zero Duplicate Token Guarantee: ", "Eliminate token collisions using compound database unique constraints under parallel concurrency."),
        ("No-Show Slot Reclamation: ", "Automate the transition of absent patients to EXPIRED using an autonomous background worker, advancing queues in real time."),
        ("Universal Arrival Check-In: ", "Enable 1-tap patient confirmation at hospital gates, disarming auto-expiry and protecting legitimate arrivals."),
        ("Doctor OPD Delay Push: ", "Broadcast real-time procedural delays (+15m/+30m) across waiting screens and patient smartphones with automatic reporting deadline extension."),
        ("Emergency Bed Visibility: ", "Provide live, unit-wise occupancy tracking for ICU, Emergency Trauma, and Oxygen beds to streamline critical triage.")
    ]
    for pfx, desc in objs:
        story.append(Paragraph(f"• <b>{pfx}</b>{desc}", bullet_style))

    story.append(Paragraph("A.2 User Personas & Role Permissions Matrix", h2_style))
    roles_rows = [
        [Paragraph("Role Name", th_style), Paragraph("Target Persona", th_style), Paragraph("Permitted Actions", th_style), Paragraph("System Boundaries & Restrictions", th_style)],
        [Paragraph("PATIENT", td_bold_style), Paragraph("Outpatient / Caregiver", td_style), Paragraph("Book token, check in, view queue position, receive SMS, calculate traffic", td_style), Paragraph("Read-only queue view; cannot mutate other bookings or see other patient PII", td_style)],
        [Paragraph("RECEPTIONIST", td_bold_style), Paragraph("OP Registration Desk Staff", td_style), Paragraph("Issue walk-in tokens, manual patient check-in, search patient bookings", td_style), Paragraph("Scoped to assigned hospital; cannot modify doctor clinical actions", td_style)],
        [Paragraph("NURSE", td_bold_style), Paragraph("OP Triage / OPD Floor Nurse", td_style), Paragraph("View room queue, manage holding area, verify vitals, call patient", td_style), Paragraph("Scoped to assigned department/OPD rooms; cannot alter doctor schedules", td_style)],
        [Paragraph("DOCTOR", td_bold_style), Paragraph("Consulting Specialist", td_style), Paragraph("Call next, start visit, complete consultation, mark absent, broadcast OPD delay", td_style), Paragraph("Controls active room queue session; cannot modify hospital-wide master settings", td_style)],
        [Paragraph("HOSPITAL_ADMIN", td_bold_style), Paragraph("Medical Superintendent / Ops", td_style), Paragraph("Configure departments, doctors, OP schedules, view hospital bed census & analytics", td_style), Paragraph("Restricted to single hospital tenant; cannot access competing hospital data", td_style)],
        [Paragraph("PLATFORM_ADMIN", td_bold_style), Paragraph("Regional Authority / SRE", td_style), Paragraph("Onboard hospitals, manage global user accounts, view platform health & audit logs", td_style), Paragraph("Superuser infrastructure access; clinical record inspection restricted by audit log", td_style)]
    ]
    t_roles = Table(roles_rows, colWidths=[80, 110, 185, 173])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_roles)
    story.append(Spacer(1, 4))

    story.append(Paragraph("A.3 Key End-to-End User Journeys", h2_style))
    journeys = [
        ("Online Patient Outpatient Flow: ", "Login via Mobile OTP -> Select hospital & department -> Book token (assigned Token #14, Reporting Deadline 09:40, Grace 09:50) -> Receive SMS & Travel Recommendation -> Arrive at hospital and tap 'Check In' -> Status = CHECKED_IN (immune to auto-expiry) -> Doctor calls Token #14 -> Digital Signage chimes -> Visit starts and completes."),
        ("Walk-in Outpatient Flow: ", "Patient arrives at hospital without smartphone -> Receptionist registers walk-in -> System atomically assigns sequential Token #15 with immediate CHECKED_IN status -> Printed slip issued -> Patient waits in lounge watching Waiting Hall TV Mode."),
        ("Doctor Emergency Delay Broadcast: ", "Doctor called to emergency angioplasty in Cath Lab -> Taps '+25m' delay on console -> WebSocket pushes DOCTOR_DELAY_UPDATED to all waiting screens and patient phones -> All upcoming reporting deadlines extended by 25 minutes automatically."),
        ("Autonomous Auto-Expiry of Abandoned Token: ", "Patient books Token #12 (Reporting Deadline 09:20, Grace 09:30) -> Patient fails to check in -> Server worker detects time > 09:30 and status == 'BOOKED' -> Worker atomically updates Token #12 to EXPIRED -> System advances queue and alerts Token #13.")
    ]
    for pfx, desc in journeys:
        story.append(Paragraph(f"• <b>{pfx}</b>{desc}", bullet_style))

    # SECTION B & C: FUNCTIONAL REQUIREMENTS
    story.append(Paragraph("Section B & C: Complete Functional Scope & Requirements Matrix", h1_style))
    story.append(Paragraph(
        "Requirements are categorized across 14 areas, establishing measurable acceptance criteria and verified repository status:",
        body_style
    ))

    all_fr = [
        # Auth
        ("FR-AUTH-001", "Mobile OTP Passwordless Gateway", "Patient", "Must Have", "Fast2SMS Service", "Fast2SMS dispatches 6-digit OTP; verifies in <300s; JWT token issued.", "Pytest test_patient_otp_login_flow", "Verified in Repo"),
        ("FR-AUTH-002", "Staff Role-Based Authentication", "Staff", "Must Have", "Bcrypt / JWT", "Doctor, Receptionist, Admin login with bcrypt hashed password; scoped JWT claims.", "Pytest security fixtures", "Verified in Repo"),
        ("FR-AUTH-003", "Auto-Provisioning on First OTP", "Patient", "Should Have", "MongoDB Users", "Auto-provisions patient user profile document on first successful OTP verification.", "Pytest user repository test", "Verified in Repo"),
        # Discovery
        ("FR-DISC-001", "Hospital & Department Search Catalog", "Patient", "Must Have", "Hospital Repository", "GET /api/v1/hospitals returns >= 2 hospitals with departments and coordinates.", "Pytest test_hospital_catalog", "Verified in Repo"),
        ("FR-DISC-002", "Doctor OPD Schedule Discovery", "Patient", "Must Have", "Schedule Repository", "Returns doctor specialization, OPD room, avg consultation min, and token limits.", "Pytest schedule query test", "Verified in Repo"),
        # Booking
        ("FR-BOOK-001", "Atomic Online Token Generation", "Patient", "Must Have", "Booking Engine", "Atomically assigns sequential token integer and unique booking_ref with zero collisions.", "Pytest test_online_and_walkin_booking_flow", "Verified in Repo"),
        ("FR-BOOK-002", "Reporting Deadline & Grace Assignment", "System", "Must Have", "Booking Repository", "Assigns reporting_deadline and 10-minute grace_period_deadline on token creation.", "Pytest booking payload validation", "Verified in Repo"),
        ("FR-BOOK-003", "Self-Service Token Cancellation", "Patient", "Should Have", "Booking Service", "Patient cancels booked token prior to arrival; freed slot advances upcoming queue.", "Automated state transition test", "Planned (Spec Defined)"),
        # Queue
        ("FR-QUEUE-001", "Single Authoritative Queue per Session", "Doctor/Recep", "Must Have", "Queue Engine", "Single authoritative FIFO queue combining online bookings and walk-ins by token integer.", "Pytest test_queue_and_token_actions", "Verified in Repo"),
        ("FR-QUEUE-002", "Walk-in Registration by OP Staff", "Receptionist", "Must Have", "FastAPI /bookings/walkin", "Staff registers walk-in; system assigns sequential token with initial CHECKED_IN status.", "Pytest test_online_and_walkin_booking_flow", "Verified in Repo"),
        ("FR-QUEUE-003", "Zero-Duplicate Concurrency Guarantee", "System", "Must Have", "Unique Compound Index", "30 parallel clients booking simultaneously produce exactly 30 unique token integers.", "Pytest test_concurrent_booking_zero_duplicates", "Verified in Repo"),
        # Expiry
        ("FR-EXP-001", "1-Tap Patient Arrival Check-In", "Patient", "Must Have", "FastAPI /check-in", "Patient confirms arrival; status = CHECKED_IN; token immune to auto-expiry.", "Pytest test_checked_in_token_is_immune_to_expiry", "Verified in Repo"),
        ("FR-EXP-002", "Background Worker Auto-Expiry", "Background Worker", "Must Have", "Asyncio ExpiryWorker", "Worker scans every 30s; atomically expires no-shows past grace deadline; advances queue.", "Pytest background worker scan test", "Verified in Repo"),
        ("FR-EXP-003", "Crash & Restart Recovery Hook", "Startup Lifespan", "Must Have", "FastAPI Lifespan Hook", "Catches up all overdue tokens immediately on server reboot before processing traffic.", "Automated startup hook test", "Verified in Repo"),
        # Staff Dashboard
        ("FR-STAFF-001", "Doctor Room Console Workflow", "Doctor", "Must Have", "DoctorConsole.tsx", "Action controls (Call, Start Visit, Complete, Hold, Absent); updates in <100ms.", "Pytest test_queue_and_token_actions", "Verified in Repo"),
        ("FR-STAFF-002", "Doctor OPD Delay Broadcast Push", "Doctor", "Must Have", "WebSocket / Doctor Delay", "Doctor broadcasts +15m/+30m delay; WebSocket pushes notice; extends reporting deadlines.", "Pytest test_doctor_delay_broadcast_and_reporting_update", "Verified in Repo"),
        ("FR-STAFF-003", "Patient Absent Marking", "Doctor", "Must Have", "Doctor Console", "Doctor marks absent patient; token expired; queue advances to next waiting patient.", "Automated absent action test", "Verified in Repo"),
        # Hospital Admin
        ("FR-HOSP-001", "Department & Doctor Catalog CRUD", "Hospital Admin", "Should Have", "Hospital Repository", "Admin configures department rooms, active doctors, and schedule session timings.", "Pytest catalog CRUD test", "Partially Implemented"),
        ("FR-HOSP-002", "Operational Grace Period Policy", "Hospital Admin", "Could Have", "Policy Engine", "Admin overrides default 10m grace period per department (e.g. Geriatrics = 20m).", "Unit policy test", "Planned (Spec Defined)"),
        # Platform Admin
        ("FR-PLAT-001", "Multi-Hospital Tenant Onboarding", "Platform Admin", "Must Have", "Tenant Middleware", "Provisions new hospital tenant; isolates hospital records via hospital_id partition.", "Tenant isolation test", "Planned (Spec Defined)"),
        ("FR-PLAT-002", "Platform-Wide Health Monitoring", "Platform Admin", "Should Have", "FastAPI /health", "Returns service status = HEALTHY, database engine, and background worker state.", "Pytest test_health_check", "Verified in Repo"),
        # Emergency Beds
        ("FR-BED-001", "Emergency Bed Occupancy Tracker", "Public/Staff", "Must Have", "Beds Dashboard", "Live unit-wise bed numbers (ICU, Trauma, O2, General Ward) with color-coded badges.", "Pytest test_emergency_beds", "Verified in Repo"),
        ("FR-BED-002", "Stale Bed Data Warning Indicator", "Triage Staff", "Should Have", "EmergencyBedsDashboard", "Displays amber warning banner if bed census has not been updated within 60 minutes.", "Frontend delta render test", "Verified in Repo"),
        # Waiting Time AI
        ("FR-WAIT-001", "Transparent Heuristic Wait Forecast", "Patient/TV", "Must Have", "PredictionService", "Computes wait = (Position - 1) * AvgMin + StatusOffset + DoctorDelayMin (±5m margin).", "Pytest baseline formula test", "Verified in Repo"),
        ("FR-WAIT-002", "scikit-learn Regression with Fallback", "System ML", "Should Have", "scikit-learn Pipeline", "Predicts wait using trained regression model; gracefully falls back to heuristic baseline.", "ML fallback handler unit test", "Verified in Repo"),
        # Notifications
        ("FR-NOTIF-001", "Real-Time WebSocket Push Hub", "Clients", "Must Have", "WebSocketManager", "Emits TOKEN_CALLED, TOKEN_EXPIRED, DOCTOR_DELAY_UPDATED in <50ms without polling.", "Automated WebSocket broadcast test", "Verified in Repo"),
        ("FR-NOTIF-002", "Multi-Event SMS & In-App Alerts", "Patient", "Must Have", "NotificationService", "Dispatches SMS for Booking Confirmed, Check-In, Turn Approaching, and Expiry.", "Pytest test_notifications_dispatch", "Verified in Repo"),
        # Voice & Accessibility
        ("FR-VOICE-001", "Waiting Hall TV Mode Digital Signage", "Waiting Hall", "Must Have", "WaitingHallTVMode.tsx", "High-contrast fullscreen display with giant current token, room, and next 3 patients.", "Frontend visual render test", "Verified in Repo"),
        ("FR-VOICE-002", "Web Audio Dual-Tone Chime Synth", "Waiting Hall", "Should Have", "audioChime.ts", "Synthesizes hospital dual-tone chime (880Hz / 659Hz) on TOKEN_CALLED without MP3 files.", "Web Audio API initiation test", "Verified in Repo"),
        # Traffic
        ("FR-TRAF-001", "Trichy Localities Travel Engine", "Patient", "Should Have", "traffic.py / Haversine", "Computes geodesic distance with 1.25 urban detour factor for Trichy localities.", "Pytest test_booking_with_aadhaar_and_traffic", "Verified Heuristic"),
        ("FR-TRAF-002", "Peak-Hour Delay & Departure Timer", "Patient", "Could Have", "traffic.py", "Adds peak rush hour delay and calculates recommended departure time before deadline.", "Departure time math unit test", "Verified Heuristic"),
        # Analytics
        ("FR-ANALYT-001", "Hourly OP Flow Bar Chart", "Admin", "Should Have", "QueueAnalytics / Recharts", "Renders hourly breakdown of booked vs completed vs expired outpatient tokens.", "Frontend chart render test", "Verified in Repo"),
        ("FR-ANALYT-002", "Token Status Distribution Breakdown", "Admin", "Should Have", "QueueAnalytics / Recharts", "Dynamic pie chart breakdown of waiting, completed, and expired no-show tokens.", "KPI distribution test", "Verified in Repo")
    ]

    fr_pdf_rows = [
        [Paragraph("Req ID", th_style), Paragraph("Requirement Name", th_style), Paragraph("Actor", th_style), Paragraph("Priority", th_style), Paragraph("Acceptance Criteria & Verification", th_style), Paragraph("Status", th_style)]
    ]
    for item in all_fr:
        req_id, name, actor, prio, comp, ac, ver, status = item
        fr_pdf_rows.append([
            Paragraph(req_id, td_bold_style),
            Paragraph(name, td_style),
            Paragraph(actor, td_style),
            Paragraph(prio, td_style),
            Paragraph(f"<b>AC:</b> {ac}<br/><b>Verif:</b> {ver}", td_style),
            Paragraph(status, td_bold_style if "Verified" in status else td_style)
        ])

    t_all_fr = Table(fr_pdf_rows, colWidths=[52, 105, 50, 48, 195, 98])
    t_all_fr.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 1.8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.8),
        ('LEFTPADDING', (0, 0), (-1, -1), 2.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2.5),
    ]))
    story.append(t_all_fr)
    story.append(Spacer(1, 5))

    # SECTION D: NON-FUNCTIONAL REQUIREMENTS
    story.append(Paragraph("Section D: Non-Functional Requirements (NFR)", h1_style))
    nfr_rows = [
        [Paragraph("NFR ID", th_style), Paragraph("Category", th_style), Paragraph("Requirement Statement", th_style), Paragraph("Verification Method & Target Metric", th_style)],
        [Paragraph("NFR-SEC-001", td_bold_style), Paragraph("Security", td_style), Paragraph("Mutating APIs strictly enforce server-side JWT authorization and role verification.", td_style), Paragraph("Automated pytest security fixtures; rejection of forged tokens.", td_style)],
        [Paragraph("NFR-SEC-002", td_bold_style), Paragraph("Cryptography", td_style), Paragraph("Passwords hashed using bcrypt (work factor 12); JWTs signed with HMAC-SHA256.", td_style), Paragraph("Unit test verifying passlib bcrypt hash generation and validation.", td_style)],
        [Paragraph("NFR-PRIV-001", td_bold_style), Paragraph("Privacy / DPDP", td_style), Paragraph("Aadhaar masked (XXXX-XXXX-1234); patient PII excluded from public signage.", td_style), Paragraph("Code audit of WaitingHallTVMode.tsx and token JSON payloads.", td_style)],
        [Paragraph("NFR-REL-001", td_bold_style), Paragraph("Fault Tolerance", td_style), Paragraph("Background worker recovers overdue tokens immediately on backend restart.", td_style), Paragraph("Startup recovery hook verified in test suite; 100% catch-up on boot.", td_style)],
        [Paragraph("NFR-REL-002", td_bold_style), Paragraph("Data Resilience", td_style), Paragraph("Dual engine: live MongoDB cluster with automatic in-memory fallback.", td_style), Paragraph("Backend boots and passes all 11 tests with or without live Mongo daemon.", td_style)],
        [Paragraph("NFR-PERF-001", td_bold_style), Paragraph("API Latency", td_style), Paragraph("Queue query and token action API response time < 100ms under standard load.", td_style), Paragraph("Target benchmark; to be verified under 100-user load test (Marked TBD).", td_style)],
        [Paragraph("NFR-ACC-001", td_bold_style), Paragraph("Accessibility", td_style), Paragraph("High-contrast digital signage (4.5:1 ratio) and audio chimes for waiting patients.", td_style), Paragraph("WCAG 2.1 AA evaluation; Web Audio API dual-tone chime (880Hz/659Hz).", td_style)],
        [Paragraph("NFR-MAINT-001", td_bold_style), Paragraph("Modularity", td_style), Paragraph("Repository pattern separating routers, schemas, services, and database layers.", td_style), Paragraph("Architectural inspection of backend/app and frontend/src.", td_style)],
        [Paragraph("NFR-OBS-001", td_bold_style), Paragraph("Auditability", td_style), Paragraph("All critical mutations (CHECKED_IN, EXPIRED, DELAY) recorded in audit logs.", td_style), Paragraph("Audit collection records actor, previous_state, new_state, timestamp.", td_style)]
    ]
    t_nfr = Table(nfr_rows, colWidths=[65, 75, 210, 198])
    t_nfr.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_nfr)
    story.append(Spacer(1, 5))

    # SECTION E: STATE MACHINES & BUSINESS RULES
    story.append(Paragraph("Section E: State Machines & Core Business Rules", h1_style))
    story.append(Paragraph(
        "<b>Outpatient Token Lifecycle State Machine:</b>",
        body_style
    ))
    state_rows = [
        [Paragraph("Token State", th_style), Paragraph("Entry Condition & Trigger", th_style), Paragraph("Permitted Next Transitions", th_style), Paragraph("Immunity to Auto-Expiry?", th_style)],
        [Paragraph("BOOKED", td_bold_style), Paragraph("Online token booked via portal", td_style), Paragraph("CHECKED_IN, CANCELLED, EXPIRED", td_style), Paragraph("NO (Expires if deadline + grace passes)", td_style)],
        [Paragraph("CHECKED_IN", td_bold_style), Paragraph("Patient self check-in OR walk-in issuance", td_style), Paragraph("IN_CONSULTATION, EXPIRED (Doctor Absent)", td_style), Paragraph("YES (Strictly immune to background worker)", td_bold_style)],
        [Paragraph("WAITING", td_bold_style), Paragraph("Logical state: checked-in and awaiting call", td_style), Paragraph("IN_CONSULTATION, HOLD", td_style), Paragraph("YES (Immune to background worker)", td_bold_style)],
        [Paragraph("IN_CONSULTATION", td_bold_style), Paragraph("Doctor clicks 'Start Visit'", td_style), Paragraph("COMPLETED, HOLD", td_style), Paragraph("YES (Immune to all auto-expiry)", td_bold_style)],
        [Paragraph("COMPLETED", td_bold_style), Paragraph("Doctor clicks 'Complete Consultation'", td_style), Paragraph("Final State (Archived)", td_style), Paragraph("YES (Terminal State)", td_style)],
        [Paragraph("CANCELLED", td_bold_style), Paragraph("Patient cancels online booking prior to arrival", td_style), Paragraph("Final State (Slot Released)", td_style), Paragraph("YES (Terminal State)", td_style)],
        [Paragraph("EXPIRED", td_bold_style), Paragraph("Grace deadline passed OR marked absent", td_style), Paragraph("Final State (Slot Recycled)", td_style), Paragraph("YES (Terminal State)", td_style)]
    ]
    t_states = Table(state_rows, colWidths=[90, 150, 160, 148])
    t_states.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_states)
    story.append(Spacer(1, 4))

    rules = [
        ("Strict Cancellation vs Expiry Distinction: ", "Cancellation is a voluntary patient action prior to arrival that immediately frees queue capacity. Expiry is an involuntary server-authoritative transition triggered by failure to report by the grace period deadline, penalizing no-shows."),
        ("Checked-In Immunity Rule: ", "Once a token transitions to CHECKED_IN, the background expiry worker can NEVER expire it, even if the doctor's session runs hours late. Only the consulting doctor can mark a checked-in patient absent after calling them."),
        ("Doctor Delay Cascade: ", "When a doctor broadcasts an OPD delay (+X minutes), the system automatically adds X minutes to reporting_deadline and grace_period_deadline of all un-checked-in bookings for that session, preventing premature auto-expiries."),
        ("Zero Duplicate Token Integrity: ", "The database constraint { schedule_id: 1, booking_date: 1, token_number: 1 } strictly prevents duplicate token numbers. If two requests arrive at the identical millisecond, the database driver serializes them, issuing sequential integers N and N+1.")
    ]
    for pfx, desc in rules:
        story.append(Paragraph(f"• <b>{pfx}</b>{desc}", bullet_style))

    # SECTION F: ARCHITECTURE & INTEGRATION
    story.append(Paragraph("Section F: Architecture & Technical Integration Specification", h1_style))
    arch_items = [
        ("Frontend Tier (React 19 + TypeScript + Vite + Tailwind CSS v4): ", "Responsive SPA delivering Patient Portal, Doctor Console, Waiting Hall TV Mode, Emergency Beds Dashboard, and Queue Analytics. Connects via Axios REST client and persistent WebSocket (/ws)."),
        ("API Gateway & Application Tier (Python 3.12 + FastAPI + Uvicorn): ", "Asynchronous REST API supporting OAuth2 password and OTP authentication, atomic booking transactions, queue session management, and doctor delay broadcasting."),
        ("Data Persistence Tier (MongoDB with High-Fidelity In-Memory Fallback): ", "MongoDB Atlas cluster supporting compound unique indexes, document-level atomic operators ($inc, $set), and seamless in-memory mock store fallback for offline local testing."),
        ("Real-Time Hub (FastAPI WebSocket Manager): ", "In-memory connection hub broadcasting instant JSON events (TOKEN_CALLED, TOKEN_EXPIRED, DOCTOR_DELAY_UPDATED) across channels without client polling."),
        ("Autonomous Background Worker (Python Asyncio): ", "Persistent background worker scanning active sessions every 30 seconds for overdue un-checked-in tokens, with startup crash-recovery hooks."),
        ("Notification & Gateway Integrations: ", "Fast2SMS gateway adapter for transactional SMS OTP and queue alerts, with development mock bypass; Haversine urban detour traffic engine for regional transit calculations.")
    ]
    for pfx, desc in arch_items:
        story.append(Paragraph(f"• <b>{pfx}</b>{desc}", bullet_style))

    # SECTION G: SECURITY & SAFEGUARDS
    story.append(Paragraph("Section G: Security, Data Privacy & Healthcare Safeguards", h1_style))
    safeguards = [
        ("Server-Side Authorization & RBAC: ", "All mutating endpoints verify JWT signatures, expiration, and user role claims. Clients cannot elevate privileges or mutate records belonging to other patients or hospitals."),
        ("PII Minimization & Identity Masking: ", "Patient Aadhaar numbers are masked across all UI views and API serialization (XXXX-XXXX-1234). Waiting hall displays never display patient phone numbers or diagnostic clinical notes."),
        ("Tenant Data Isolation: ", "Hospital records are scoped by unique hospital_id. Multi-tenant administrative queries partition data at the database repository layer."),
        ("Comprehensive Audit Trail: ", "Every status mutation (booking, check-in, start consultation, completion, delay broadcast, automatic expiry) records an immutable audit log entry capturing actor, previous state, new state, and server UTC timestamp."),
        ("Mandatory Clinical Disclaimer: ", "The platform is strictly an administrative queue scheduling tool, NOT a diagnostic or medical triage system. Emergency bed counts and waiting forecasts are estimates and must not delay urgent 108 emergency transfers.")
    ]
    for pfx, desc in safeguards:
        story.append(Paragraph(f"• <b>{pfx}</b>{desc}", bullet_style))

    # SECTION H: TESTING & ACCEPTANCE
    story.append(Paragraph("Section H: Testing, Verification & Acceptance Strategy", h1_style))
    test_items = [
        ("Unit & Schema Verification: ", "Pydantic v2 schemas strictly validate input payloads, date formats, phone regex, and enum constraints."),
        ("API Integration Testing (pytest + HTTPX AsyncClient): ", "End-to-end testing of REST endpoints covering OTP generation/verification, atomic booking, walk-in creation, check-in, and delay broadcasts. Verified: 11 tests passing green."),
        ("Concurrency & Stress Testing: ", "Simulates 30 simultaneous booking clients competing for the same schedule and date. Verified: exactly 30 unique sequential tokens generated with 0 duplicates."),
        ("Deadline Boundary & Immunity Testing: ", "Verifies that checked-in and in-consultation tokens are strictly immune to background worker expiration."),
        ("Browser-Based End-to-End Testing (Playwright / webapp-testing): ", "Simulates complete patient journey in headless Chromium: login -> book token -> tap check-in -> doctor calls token -> waiting TV displays active badge and plays audio chime.")
    ]
    for pfx, desc in test_items:
        story.append(Paragraph(f"• <b>{pfx}</b>{desc}", bullet_style))

    # SECTION I: COMPLETE MODULE ROADMAP
    story.append(Paragraph("Section I: Complete 10-Module Implementation Roadmap", h1_style))
    modules_pdf = [
        ("Module 1: Foundation & Common UI Layout", "VERIFIED COMPLETE", "React 19 + Vite + Tailwind shell; IntroPage; Health API.", "Health check returns HEALTHY; dev server builds in <2s.", "pytest test_health_check"),
        ("Module 2: Auth & Role-Based Access", "VERIFIED COMPLETE", "Mobile OTP login gateway; Doctor/Recep/Admin auth; bcrypt; JWT.", "Patient receives OTP; staff credentials verified with scoped JWT claims.", "pytest test_patient_otp_login_flow"),
        ("Module 3: Hospital & Schedule Master", "VERIFIED COMPLETE", "Multi-hospital catalog (Trichy); doctor assignments; morning/evening OP.", "GET /api/v1/hospitals returns >= 2 hospitals with active departments.", "pytest test_hospital_catalog"),
        ("Module 4: Patient Discovery & OP Booking", "VERIFIED COMPLETE", "Atomic online booking; unique booking_ref; deadline & grace calculation.", "Sequential token assigned; reporting deadline timestamps present in booking.", "pytest test_online_and_walkin_booking_flow"),
        ("Module 5: Unified Online / Walk-in Queue", "VERIFIED COMPLETE", "Single authoritative queue; walk-in registration; Doctor Console with delay broadcast.", "Zero duplicate tokens under 30-client concurrency; delay pushes to queue.", "pytest test_concurrent_booking_zero_duplicates"),
        ("Module 6: Check-In & Auto Token Expiry", "VERIFIED COMPLETE", "1-tap arrival check-in; background worker scanning every 30s; restart recovery.", "Checked-in tokens immune to expiry; no-shows expired; recovery catches up.", "pytest test_checked_in_token_is_immune_to_expiry"),
        ("Module 7: Waiting-Time & AI Readiness", "VERIFIED COMPLETE", "Transparent heuristic wait forecast; doctor delay offsets; scikit-learn regression.", "Accurate wait minutes returned; confidence intervals displayed; fallback verified.", "pytest test_api.py (prediction test)"),
        ("Module 8: Live Updates & Notifications", "VERIFIED COMPLETE", "FastAPI WebSocketManager broadcasting events; TV mode signage with audio chime.", "WebSockets push events in <50ms; Web Audio API plays 880Hz/659Hz chime; SMS sent.", "pytest test_notifications_dispatch"),
        ("Module 9: Emergency Bed Availability", "VERIFIED COMPLETE", "Live ICU, Trauma, Oxygen, General Ward bed counts; alert badges; stale indicator.", "GET /api/v1/beds returns unit-wise bed numbers; stale data indicator flags un-updated.", "pytest test_emergency_beds"),
        ("Module 10: Traffic, Analytics & Hardening", "PROPOSED / PARTIAL", "Trichy travel calculation with rush hour buffer; Recharts flow charts; security hardening.", "Distance and departure time calculated; analytics charts render flow; bundle clean.", "npm run build && pytest tests/")
    ]
    mod_rows = [
        [Paragraph("Module", th_style), Paragraph("Status", th_style), Paragraph("Scope Summary", th_style), Paragraph("Completion Gate", th_style), Paragraph("Verification Test", th_style)]
    ]
    for item in modules_pdf:
        m_title, m_status, m_scope, m_gate, m_test = item
        mod_rows.append([
            Paragraph(m_title, td_bold_style),
            Paragraph(m_status, td_bold_style if "VERIFIED" in m_status else td_style),
            Paragraph(m_scope, td_style),
            Paragraph(m_gate, td_style),
            Paragraph(m_test, td_code_style)
        ])
    t_mod = Table(mod_rows, colWidths=[95, 75, 140, 140, 98])
    t_mod.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_mod)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PRD PDF generated successfully at: {filename}")


if __name__ == '__main__':
    out_dir = r"D:\op patient waiting management system\docs\product-docs"
    docx_path = os.path.join(out_dir, "Hospital_OP_Live_Tracker_PRD.docx")
    pdf_path = os.path.join(out_dir, "Hospital_OP_Live_Tracker_PRD.pdf")
    build_prd_docx(docx_path)
    build_prd_pdf(pdf_path)
