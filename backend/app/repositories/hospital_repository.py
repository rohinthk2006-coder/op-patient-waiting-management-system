import uuid
from typing import List, Dict, Any, Optional
from app.db.mongodb import db_manager

# Seed Hospitals and Doctors data
DEFAULT_HOSPITALS = [
    {
        "_id": "hosp-apollo-01",
        "id": "hosp-apollo-01",
        "name": "Apollo Super Specialty Hospital",
        "code": "APOLLO",
        "city": "Chennai",
        "address": "21 Greams Lane, Thousand Lights",
        "phone": "+91 44 2829 0200",
        "emergency_contact": "1066",
        "created_at": "2026-10-23T08:00:00Z",
        "departments": [
            {
                "id": "dept-card-01",
                "name": "Cardiology",
                "room_number": "OPD Room 102",
                "active_doctors_count": 2,
                "current_avg_wait_min": 18
            },
            {
                "id": "dept-ortho-01",
                "name": "Orthopedics",
                "room_number": "OPD Room 105",
                "active_doctors_count": 1,
                "current_avg_wait_min": 12
            },
            {
                "id": "dept-gen-01",
                "name": "General Medicine",
                "room_number": "OPD Room 108",
                "active_doctors_count": 3,
                "current_avg_wait_min": 10
            }
        ]
    },
    {
        "_id": "hosp-miot-02",
        "id": "hosp-miot-02",
        "name": "MIOT International Hospital",
        "code": "MIOT",
        "city": "Chennai",
        "address": "4/112 Mount Poonamallee Road, Manapakkam",
        "phone": "+91 44 4200 2288",
        "emergency_contact": "1057",
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
                "name": "Neurology",
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
        "department_name": "Cardiology",
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
        "department_name": "Orthopedics",
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
    }
]

DEFAULT_BEDS = [
    {"_id": "bed-1", "id": "bed-1", "hospital_id": "hosp-apollo-01", "hospital_name": "Apollo Super Specialty", "category": "ICU", "total_beds": 40, "occupied_beds": 32, "available_beds": 8, "occupancy_rate": 80.0, "status": "AVAILABLE", "last_updated": "2026-10-23T12:00:00Z"},
    {"_id": "bed-2", "id": "bed-2", "hospital_id": "hosp-apollo-01", "hospital_name": "Apollo Super Specialty", "category": "EMERGENCY_TRAUMA", "total_beds": 20, "occupied_beds": 17, "available_beds": 3, "occupancy_rate": 85.0, "status": "LOW", "last_updated": "2026-10-23T12:00:00Z"},
    {"_id": "bed-3", "id": "bed-3", "hospital_id": "hosp-apollo-01", "hospital_name": "Apollo Super Specialty", "category": "OXYGEN_SUPPORT", "total_beds": 50, "occupied_beds": 28, "available_beds": 22, "occupancy_rate": 56.0, "status": "AVAILABLE", "last_updated": "2026-10-23T12:00:00Z"},
    {"_id": "bed-4", "id": "bed-4", "hospital_id": "hosp-apollo-01", "hospital_name": "Apollo Super Specialty", "category": "GENERAL_WARD", "total_beds": 150, "occupied_beds": 138, "available_beds": 12, "occupancy_rate": 92.0, "status": "CRITICAL", "last_updated": "2026-10-23T12:00:00Z"},
    {"_id": "bed-5", "id": "bed-5", "hospital_id": "hosp-miot-02", "hospital_name": "MIOT International", "category": "ICU", "total_beds": 30, "occupied_beds": 24, "available_beds": 6, "occupancy_rate": 80.0, "status": "AVAILABLE", "last_updated": "2026-10-23T12:00:00Z"},
    {"_id": "bed-6", "id": "bed-6", "hospital_id": "hosp-miot-02", "hospital_name": "MIOT International", "category": "EMERGENCY_TRAUMA", "total_beds": 15, "occupied_beds": 9, "available_beds": 6, "occupancy_rate": 60.0, "status": "AVAILABLE", "last_updated": "2026-10-23T12:00:00Z"},
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
