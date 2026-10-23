from typing import List, Optional
from fastapi import APIRouter, Query
from app.services.notification_service import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[dict])
async def list_notifications(phone: Optional[str] = Query(None)):
    if phone:
        return await notification_service.get_patient_notifications(phone)
    return await notification_service.get_recent_notifications(limit=30)
