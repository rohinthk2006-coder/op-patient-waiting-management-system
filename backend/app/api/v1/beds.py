from typing import List, Optional
from fastapi import APIRouter, HTTPException
from app.repositories.hospital_repository import hospital_repo
from app.schemas.bed import BedStatusResponse, BedStatusUpdate
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/beds", tags=["Emergency Beds"])


@router.get("", response_model=List[BedStatusResponse])
async def list_emergency_beds(hospital_id: Optional[str] = None):
    beds = await hospital_repo.list_beds(hospital_id=hospital_id)
    return beds


@router.put("/update", response_model=BedStatusResponse)
async def update_emergency_bed(update_in: BedStatusUpdate):
    updated = await hospital_repo.update_bed(
        hospital_id=update_in.hospital_id,
        category=update_in.category.value,
        total=update_in.total_beds,
        occupied=update_in.occupied_beds
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Bed category for hospital not found")

    # Broadcast bed status update
    await ws_manager.broadcast_all({
        "event": "BED_STATUS_UPDATED",
        "hospital_id": update_in.hospital_id,
        "category": update_in.category.value,
        "available_beds": updated["available_beds"],
        "status": updated["status"]
    })
    return updated
