from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.repositories.hospital_repository import hospital_repo
from app.schemas.hospital import HospitalResponse
from app.schemas.doctor import DoctorResponse

router = APIRouter(prefix="/hospitals", tags=["Hospitals & Doctors"])


@router.get("", response_model=List[HospitalResponse])
async def list_hospitals():
    hospitals = await hospital_repo.list_hospitals()
    return hospitals


@router.get("/{hospital_id}", response_model=HospitalResponse)
async def get_hospital(hospital_id: str):
    h = await hospital_repo.get_hospital_by_id(hospital_id)
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return h


@router.get("/{hospital_id}/doctors", response_model=List[DoctorResponse])
async def list_doctors(hospital_id: str, department_id: Optional[str] = Query(None)):
    doctors = await hospital_repo.list_doctors(hospital_id=hospital_id, department_id=department_id)
    return doctors


@router.get("/doctors/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(doctor_id: str):
    doc = await hospital_repo.get_doctor_by_id(doctor_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doc
