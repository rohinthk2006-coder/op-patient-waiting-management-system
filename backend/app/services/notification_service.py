import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

logger = logging.getLogger("app.service.notifications")

_mock_notifications: List[Dict[str, Any]] = []


class NotificationService:
    def __init__(self):
        pass

    async def send_notification(
        self,
        recipient_phone: str,
        title: str,
        message: str,
        category: str = "QUEUE_UPDATE",  # BOOKING_CONFIRMATION, TURN_APPROACHING, GRACE_WARNING, TOKEN_EXPIRED
        booking_ref: Optional[str] = None
    ) -> Dict[str, Any]:
        notif_id = str(uuid.uuid4())
        record = {
            "id": notif_id,
            "recipient_phone": recipient_phone,
            "title": title,
            "message": message,
            "category": category,
            "booking_ref": booking_ref,
            "status": "DELIVERED",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        _mock_notifications.insert(0, record)
        logger.info(f"[NOTIFICATION DISPATCHED] To: {recipient_phone} | {title}: {message}")
        return record

    async def get_patient_notifications(self, phone: str) -> List[Dict[str, Any]]:
        return [n for n in _mock_notifications if n["recipient_phone"] == phone]

    async def get_recent_notifications(self, limit: int = 20) -> List[Dict[str, Any]]:
        return _mock_notifications[:limit]


notification_service = NotificationService()
