import uuid
from typing import List, Dict, Any, Optional
from app.db.mongodb import db_manager

# Seed Hospitals and Doctors data
# Comprehensive Trichy (Tiruchirappalli) Hospital Catalog
DEFAULT_HOSPITALS = [
    {
        "_id": "hosp-apollo-01",
        "id": "hosp-apollo-01",
        "name": "Apollo Speciality Hospital Trichy",
        "code": "APOLLO",
        "city": "Tiruchirappalli",
        "area": "Ariyamangalam",
        "address": "Old Thanjavur Road, Ariyamangalam, Trichy",
        "phone": "+91 431 407 7777",
        "emergency_contact": "1066",
        "latitude": 10.8015,
        "longitude": 78.7350,
        "created_at": "2026-10-23T08:00:00Z",
        "departments": [
            {
                "id": "dept-card-01",
                "name": "Cardiology & Cath Lab",
                "room_number": "OPD Room 102",
                "active_doctors_count": 2,
                "current_avg_wait_min": 16
            },
            {
                "id": "dept-ortho-01",
                "name": "Orthopedics & Joint Care",
                "room_number": "OPD Room 105",
                "active_doctors_count": 2,
                "current_avg_wait_min": 12
            },
            {
                "id": "dept-neuro-01",
                "name": "Neurology & Stroke Clinic",
                "room_number": "OPD Room 108",
                "active_doctors_count": 1,
                "current_avg_wait_min": 20
            },
            {
                "id": "dept-onco-01",
                "name": "Medical Oncology",
                "room_number": "OPD Room 112",
                "active_doctors_count": 1,
                "current_avg_wait_min": 15
            }
        ]
    },
    {
        "_id": "hosp-trichy-gh-01",
        "id": "hosp-trichy-gh-01",
        "name": "Mahatma Gandhi Memorial Govt Hospital (GH Trichy)",
        "code": "MGMGH",
        "city": "Tiruchirappalli",
        "area": "Puthur / Collectorate",
        "address": "Collector Office Road, Puthur, Tiruchirappalli",
        "phone": "+91 431 241 2544",
        "emergency_contact": "108",
        "latitude": 10.8125,
        "longitude": 78.6856,
        "created_at": "2026-10-23T08:00:00Z",
        "departments": [
            {
                "id": "dept-gh-gen-01",
                "name": "General Medicine OPD",
                "room_number": "OPD Block A - Hall 1",
                "active_doctors_count": 5,
                "current_avg_wait_min": 22
            },
            {
                "id": "dept-gh-trauma-01",
                "name": "Emergency Trauma & Casualty",
                "room_number": "Casualty Room 01",
                "active_doctors_count": 4,
                "current_avg_wait_min": 5
            },
            {
                "id": "dept-gh-ped-01",
                "name": "Pediatrics & Neonatal Care",
                "room_number": "Child Care Block 2",
                "active_doctors_count": 3,
                "current_avg_wait_min": 14
            },
            {
                "id": "dept-gh-ortho-01",
                "name": "Orthopedics & Fracture Clinic",
                "room_number": "OPD Room 104",
                "active_doctors_count": 2,
                "current_avg_wait_min": 18
            }
        ]
    },
    {
        "_id": "hosp-kauvery-cantonment-02",
        "id": "hosp-kauvery-cantonment-02",
        "name": "Kauvery Hospital (Cantonment)",
        "code": "KAUVERY",
        "city": "Tiruchirappalli",
        "area": "Cantonment",
        "address": "No. 12, Royal Road, Cantonment, Tiruchirappalli",
        "phone": "+91 431 400 6000",
        "emergency_contact": "0431-4006000",
        "latitude": 10.8038,
        "longitude": 78.6850,
        "created_at": "2026-10-23T08:00:00Z",
        "departments": [
            {
                "id": "dept-k-card-01",
                "name": "Interventional Cardiology",
                "room_number": "Consultation Suite 1",
                "active_doctors_count": 3,
                "current_avg_wait_min": 14
            },
            {
                "id": "dept-k-neuro-01",
                "name": "Neuro & Spine Surgery",
                "room_number": "Consultation Suite 4",
                "active_doctors_count": 2,
                "current_avg_wait_min": 18
            },
            {
                "id": "dept-k-gastro-01",
                "name": "Medical Gastroenterology",
                "room_number": "Consultation Suite 7",
                "active_doctors_count": 2,
                "current_avg_wait_min": 15
            }
        ]
    },
    {
        "_id": "hosp-kauvery-heartcity-03",
        "id": "hosp-kauvery-heartcity-03",
        "name": "Kauvery Hospital (Heartcity - Tennur)",
        "code": "K-HEART",
        "city": "Tiruchirappalli",
        "area": "Tennur",
        "address": "No. 11, Thennur High Road, Tiruchirappalli",
        "phone": "+91 431 407 7000",
        "emergency_contact": "0431-4077000",
        "latitude": 10.8192,
        "longitude": 78.6875,
        "created_at": "2026-10-23T08:00:00Z",
        "departments": [
            {
                "id": "dept-kh-cardio-01",
                "name": "Cardiology & Cardiac ICU",
                "room_number": "Heart OPD Room 1",
                "active_doctors_count": 3,
                "current_avg_wait_min": 10
            },
            {
                "id": "dept-kh-ctvs-01",
                "name": "Cardiothoracic Surgery",
                "room_number": "Heart OPD Room 3",
                "active_doctors_count": 2,
                "current_avg_wait_min": 15
            }
        ]
    },
    {
        "_id": "hosp-srm-trichy-05",
        "id": "hosp-srm-trichy-05",
        "name": "SRM Medical College Hospital & Research Centre",
        "code": "SRM-TRI",
        "city": "Tiruchirappalli",
        "area": "Irungalur / Samayapuram",
        "address": "Trichy - Chennai National Highway, Irungalur, Trichy",
        "phone": "+91 431 225 8686",
        "emergency_contact": "0431-2258888",
        "latitude": 10.9654,
        "longitude": 78.7451,
        "created_at": "2026-10-23T08:00:00Z",
        "departments": [
            {
                "id": "dept-srm-gen-01",
                "name": "General Medicine",
                "room_number": "OPD Hall 101",
                "active_doctors_count": 4,
                "current_avg_wait_min": 12
            },
            {
                "id": "dept-srm-derm-01",
                "name": "Dermatology & Skin Care",
                "room_number": "OPD Hall 105",
                "active_doctors_count": 2,
                "current_avg_wait_min": 10
            }
        ]
    },
    {
        "_id": "hosp-csi-mission-06",
        "id": "hosp-csi-mission-06",
        "name": "C.S.I. Mission Hospital (St. Luke's)",
        "code": "CSI-HOSP",
        "city": "Tiruchirappalli",
        "area": "Woraiyur",
        "address": "Allithurai Road, Woraiyur, Tiruchirappalli",
        "phone": "+91 431 276 1958",
        "emergency_contact": "0431-2761958",
        "latitude": 10.8280,
        "longitude": 78.6720,
        "created_at": "2026-10-23T08:00:00Z",
        "departments": [
            {
                "id": "dept-csi-gen-01",
                "name": "General Medicine & Diabetes",
                "room_number": "OPD Room 1",
                "active_doctors_count": 2,
                "current_avg_wait_min": 11
            },
            {
                "id": "dept-csi-ent-01",
                "name": "ENT (Ear, Nose & Throat)",
                "room_number": "OPD Room 4",
                "active_doctors_count": 1,
                "current_avg_wait_min": 9
            }
        ]
    },
    {
        "_id": "hosp-maruti-07",
        "id": "hosp-maruti-07",
        "name": "Maruti Medical Center & Hospital",
        "code": "MARUTI",
        "city": "Tiruchirappalli",
        "area": "Cantonment",
        "address": "No. 56, Heber Road, Cantonment, Tiruchirappalli",
        "phone": "+91 431 241 4455",
        "emergency_contact": "0431-2414455",
        "latitude": 10.8045,
        "longitude": 78.6865,
        "created_at": "2026-10-23T08:00:00Z",
        "departments": [
            {
                "id": "dept-maruti-ortho-01",
                "name": "Trauma, Arthroscopy & Ortho",
                "room_number": "OPD Room 101",
                "active_doctors_count": 2,
                "current_avg_wait_min": 13
            }
        ]
    },
    {
        "_id": "hosp-frontline-08",
        "id": "hosp-frontline-08",
        "name": "Frontline Hospital",
        "code": "FRONTLINE",
        "city": "Tiruchirappalli",
        "area": "Karur Bypass Road / Annamalai Nagar",
        "address": "5/2, Karur Bypass Road, Annamalai Nagar, Trichy",
        "phone": "+91 431 270 5500",
        "emergency_contact": "0431-2705500",
        "latitude": 10.8320,
        "longitude": 78.6800,
        "created_at": "2026-10-23T08:00:00Z",
        "departments": [
            {
                "id": "dept-front-uro-01",
                "name": "Urology & Nephrology",
                "room_number": "Kidney Care Unit 2",
                "active_doctors_count": 2,
                "current_avg_wait_min": 14
            }
        ]
    },
    {
        "_id": "hosp-gvh-09",
        "id": "hosp-gvh-09",
        "name": "G. Viswanathan Speciality Hospital",
        "code": "GVH",
        "city": "Tiruchirappalli",
        "area": "Singarathope",
        "address": "27, Babu Road, Singarathope, Tiruchirappalli",
        "phone": "+91 431 270 0401",
        "emergency_contact": "0431-2700401",
        "latitude": 10.8305,
        "longitude": 78.6975,
        "created_at": "2026-10-23T08:00:00Z",
        "departments": [
            {
                "id": "dept-gvh-mat-01",
                "name": "Infertility, OB-GYN & Pediatrics",
                "room_number": "Women & Child Care 1",
                "active_doctors_count": 2,
                "current_avg_wait_min": 16
            }
        ]
    },
    {
        "_id": "hosp-miot-02",
        "id": "hosp-miot-02",
        "name": "MIOT Hospitals Trichy Outpatient Centre",
        "code": "MIOT-TRI",
        "city": "Tiruchirappalli",
        "area": "Cantonment",
        "address": "Promenade Road, Cantonment, Tiruchirappalli",
        "phone": "+91 431 422 2888",
        "emergency_contact": "1057",
        "latitude": 10.7980,
        "longitude": 78.6820,
        "created_at": "2026-10-23T08:00:00Z",
        "departments": [
            {
                "id": "dept-ortho-02",
                "name": "Orthopedics & Joint Replacement",
                "room_number": "OPD Room 201",
                "active_doctors_count": 2,
                "current_avg_wait_min": 15
            },
            {
                "id": "dept-neuro-02",
                "name": "Neurology & Spine Clinic",
                "room_number": "OPD Room 204",
                "active_doctors_count": 1,
                "current_avg_wait_min": 25
            }
        ]
    }
]

DEFAULT_DOCTORS = [
    {
        "_id": "doc-anand-01",
        "id": "doc-anand-01",
        "name": "Dr. R. Anand, MD, DM",
        "hospital_id": "hosp-apollo-01",
        "department_id": "dept-card-01",
        "department_name": "Cardiology & Cath Lab",
        "specialization": "Interventional Cardiologist",
        "opd_room": "OPD Room 102",
        "status": "AVAILABLE",
        "created_at": "2026-10-23T08:00:00Z",
        "schedules": [
            {
                "id": "sch-card-morning",
                "day": "Everyday",
                "start_time": "09:00",
                "end_time": "13:00",
                "avg_consultation_time_min": 10,
                "max_tokens": 30,
                "grace_period_min": 10
            }
        ]
    },
    {
        "_id": "doc-priya-02",
        "id": "doc-priya-02",
        "name": "Dr. Priya Sundaram, MS",
        "hospital_id": "hosp-apollo-01",
        "department_id": "dept-ortho-01",
        "department_name": "Orthopedics & Joint Care",
        "specialization": "Orthopedic Surgeon",
        "opd_room": "OPD Room 105",
        "status": "AVAILABLE",
        "created_at": "2026-10-23T08:00:00Z",
        "schedules": [
            {
                "id": "sch-ortho-morning",
                "day": "Everyday",
                "start_time": "09:30",
                "end_time": "13:30",
                "avg_consultation_time_min": 12,
                "max_tokens": 25,
                "grace_period_min": 10
            }
        ]
    },
    {
        "_id": "doc-trichy-gh-saravanan",
        "id": "doc-trichy-gh-saravanan",
        "name": "Dr. K. Saravanan, MD",
        "hospital_id": "hosp-trichy-gh-01",
        "department_id": "dept-gh-gen-01",
        "department_name": "General Medicine OPD",
        "specialization": "Senior Consultant Physician",
        "opd_room": "OPD Block A - Hall 1",
        "status": "AVAILABLE",
        "created_at": "2026-10-23T08:00:00Z",
        "schedules": [
            {
                "id": "sch-gh-gen-morning",
                "day": "Everyday",
                "start_time": "08:30",
                "end_time": "13:00",
                "avg_consultation_time_min": 8,
                "max_tokens": 50,
                "grace_period_min": 15
            }
        ]
    },
    {
        "_id": "doc-kauvery-senthil",
        "id": "doc-kauvery-senthil",
        "name": "Dr. T. Senthilkumar, DM",
        "hospital_id": "hosp-kauvery-cantonment-02",
        "department_id": "dept-k-card-01",
        "department_name": "Interventional Cardiology",
        "specialization": "Senior Interventional Cardiologist",
        "opd_room": "Consultation Suite 1",
        "status": "AVAILABLE",
        "created_at": "2026-10-23T08:00:00Z",
        "schedules": [
            {
                "id": "sch-kauvery-card-morning",
                "day": "Everyday",
                "start_time": "09:00",
                "end_time": "13:30",
                "avg_consultation_time_min": 12,
                "max_tokens": 30,
                "grace_period_min": 10
            }
        ]
    },
    {
        "_id": "doc-frontline-balaji",
        "id": "doc-frontline-balaji",
        "name": "Dr. V. Balaji, MS, MCh",
        "hospital_id": "hosp-frontline-08",
        "department_id": "dept-front-uro-01",
        "department_name": "Urology & Nephrology",
        "specialization": "Consultant Urologist & Transplant Surgeon",
        "opd_room": "Kidney Care Unit 2",
        "status": "AVAILABLE",
        "created_at": "2026-10-23T08:00:00Z",
        "schedules": [
            {
                "id": "sch-frontline-uro-morning",
                "day": "Everyday",
                "start_time": "10:00",
                "end_time": "14:00",
                "avg_consultation_time_min": 15,
                "max_tokens": 20,
                "grace_period_min": 10
            }
        ]
    }
]

DEFAULT_BEDS = [
    # Apollo Trichy
    {"_id": "bed-1", "id": "bed-1", "hospital_id": "hosp-apollo-01", "hospital_name": "Apollo Speciality Hospital Trichy", "category": "ICU", "total_beds": 40, "occupied_beds": 31, "available_beds": 9, "occupancy_rate": 77.5, "status": "AVAILABLE", "last_updated": "2026-10-24T06:30:00Z"},
    {"_id": "bed-2", "id": "bed-2", "hospital_id": "hosp-apollo-01", "hospital_name": "Apollo Speciality Hospital Trichy", "category": "EMERGENCY_TRAUMA", "total_beds": 20, "occupied_beds": 16, "available_beds": 4, "occupancy_rate": 80.0, "status": "LOW", "last_updated": "2026-10-24T06:30:00Z"},
    {"_id": "bed-3", "id": "bed-3", "hospital_id": "hosp-apollo-01", "hospital_name": "Apollo Speciality Hospital Trichy", "category": "OXYGEN_SUPPORT", "total_beds": 50, "occupied_beds": 26, "available_beds": 24, "occupancy_rate": 52.0, "status": "AVAILABLE", "last_updated": "2026-10-24T06:30:00Z"},
    {"_id": "bed-4", "id": "bed-4", "hospital_id": "hosp-apollo-01", "hospital_name": "Apollo Speciality Hospital Trichy", "category": "GENERAL_WARD", "total_beds": 160, "occupied_beds": 142, "available_beds": 18, "occupancy_rate": 88.8, "status": "LOW", "last_updated": "2026-10-24T06:30:00Z"},
    # GH Trichy
    {"_id": "bed-gh-1", "id": "bed-gh-1", "hospital_id": "hosp-trichy-gh-01", "hospital_name": "Mahatma Gandhi Memorial Govt Hospital", "category": "ICU", "total_beds": 80, "occupied_beds": 72, "available_beds": 8, "occupancy_rate": 90.0, "status": "CRITICAL", "last_updated": "2026-10-24T06:30:00Z"},
    {"_id": "bed-gh-2", "id": "bed-gh-2", "hospital_id": "hosp-trichy-gh-01", "hospital_name": "Mahatma Gandhi Memorial Govt Hospital", "category": "EMERGENCY_TRAUMA", "total_beds": 50, "occupied_beds": 44, "available_beds": 6, "occupancy_rate": 88.0, "status": "LOW", "last_updated": "2026-10-24T06:30:00Z"},
    {"_id": "bed-gh-3", "id": "bed-gh-3", "hospital_id": "hosp-trichy-gh-01", "hospital_name": "Mahatma Gandhi Memorial Govt Hospital", "category": "OXYGEN_SUPPORT", "total_beds": 120, "occupied_beds": 85, "available_beds": 35, "occupancy_rate": 70.8, "status": "AVAILABLE", "last_updated": "2026-10-24T06:30:00Z"},
    {"_id": "bed-gh-4", "id": "bed-gh-4", "hospital_id": "hosp-trichy-gh-01", "hospital_name": "Mahatma Gandhi Memorial Govt Hospital", "category": "GENERAL_WARD", "total_beds": 600, "occupied_beds": 540, "available_beds": 60, "occupancy_rate": 90.0, "status": "CRITICAL", "last_updated": "2026-10-24T06:30:00Z"},
    # Kauvery Cantonment
    {"_id": "bed-k-1", "id": "bed-k-1", "hospital_id": "hosp-kauvery-cantonment-02", "hospital_name": "Kauvery Hospital (Cantonment)", "category": "ICU", "total_beds": 35, "occupied_beds": 27, "available_beds": 8, "occupancy_rate": 77.1, "status": "AVAILABLE", "last_updated": "2026-10-24T06:30:00Z"},
    {"_id": "bed-k-2", "id": "bed-k-2", "hospital_id": "hosp-kauvery-cantonment-02", "hospital_name": "Kauvery Hospital (Cantonment)", "category": "EMERGENCY_TRAUMA", "total_beds": 18, "occupied_beds": 12, "available_beds": 6, "occupancy_rate": 66.7, "status": "AVAILABLE", "last_updated": "2026-10-24T06:30:00Z"},
    # Kauvery Heartcity Tennur
    {"_id": "bed-kh-1", "id": "bed-kh-1", "hospital_id": "hosp-kauvery-heartcity-03", "hospital_name": "Kauvery Hospital (Heartcity - Tennur)", "category": "ICU", "total_beds": 25, "occupied_beds": 18, "available_beds": 7, "occupancy_rate": 72.0, "status": "AVAILABLE", "last_updated": "2026-10-24T06:30:00Z"},
    # SRM Trichy
    {"_id": "bed-srm-1", "id": "bed-srm-1", "hospital_id": "hosp-srm-trichy-05", "hospital_name": "SRM Medical College Hospital", "category": "GENERAL_WARD", "total_beds": 450, "occupied_beds": 310, "available_beds": 140, "occupancy_rate": 68.8, "status": "AVAILABLE", "last_updated": "2026-10-24T06:30:00Z"},
    # MIOT Trichy
    {"_id": "bed-miot-1", "id": "bed-miot-1", "hospital_id": "hosp-miot-02", "hospital_name": "MIOT Hospitals Trichy Centre", "category": "ICU", "total_beds": 20, "occupied_beds": 14, "available_beds": 6, "occupancy_rate": 70.0, "status": "AVAILABLE", "last_updated": "2026-10-24T06:30:00Z"},
]


class HospitalRepository:
    def __init__(self):
        self.db_mgr = db_manager

    async def list_hospitals(self) -> List[Dict[str, Any]]:
        if not self.db_mgr.is_mock and self.db_mgr.db is not None:
            cursor = self.db_mgr.db.hospitals.find()
            items = await cursor.to_list(length=100)
            if items:
                return items
        return DEFAULT_HOSPITALS

    async def get_hospital_by_id(self, hospital_id: str) -> Optional[Dict[str, Any]]:
        hospitals = await self.list_hospitals()
        for h in hospitals:
            if h.get("id") == hospital_id or h.get("_id") == hospital_id:
                return h
        return None

    async def list_doctors(self, hospital_id: Optional[str] = None, department_id: Optional[str] = None) -> List[Dict[str, Any]]:
        docs = DEFAULT_DOCTORS
        if hospital_id:
            docs = [d for d in docs if d["hospital_id"] == hospital_id]
        if department_id:
            docs = [d for d in docs if d["department_id"] == department_id]
        return docs

    async def get_doctor_by_id(self, doctor_id: str) -> Optional[Dict[str, Any]]:
        for d in DEFAULT_DOCTORS:
            if d.get("id") == doctor_id or d.get("_id") == doctor_id:
                return d
        return None

    async def list_beds(self, hospital_id: Optional[str] = None) -> List[Dict[str, Any]]:
        beds = DEFAULT_BEDS
        if hospital_id:
            beds = [b for b in beds if b["hospital_id"] == hospital_id]
        return beds

    async def update_bed(self, hospital_id: str, category: str, total: int, occupied: int) -> Optional[Dict[str, Any]]:
        available = max(total - occupied, 0)
        rate = round((occupied / total * 100), 1) if total > 0 else 0.0
        status = "AVAILABLE" if rate < 75 else ("LOW" if rate < 90 else "CRITICAL")
        now_str = "2026-10-23T12:00:00Z"
        for b in DEFAULT_BEDS:
            if b["hospital_id"] == hospital_id and b["category"] == category:
                b.update({
                    "total_beds": total,
                    "occupied_beds": occupied,
                    "available_beds": available,
                    "occupancy_rate": rate,
                    "status": status,
                    "last_updated": now_str
                })
                return b
        return None


hospital_repo = HospitalRepository()
