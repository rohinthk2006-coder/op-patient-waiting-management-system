import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.core.config import settings
from app.repositories.booking_repository import booking_repo, _mock_bookings
from app.schemas.booking import BookingStatus
from app.websocket.manager import ws_manager

logger = logging.getLogger("app.worker.expiry")


class TokenExpiryWorker:
    def __init__(self):
        self.is_running = False
        self._task: asyncio.Task = None

    async def start(self):
        self.is_running = True
        logger.info("TokenExpiryWorker started. Running restart recovery check...")
        # Step 10: Recover pending work after backend restarts
        await self.process_overdue_tokens(actor="STARTUP_RECOVERY")
        self._task = asyncio.create_task(self._run_loop())

    async def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
        logger.info("TokenExpiryWorker stopped.")

    async def _run_loop(self):
        while self.is_running:
            try:
                await self.process_overdue_tokens(actor="SYSTEM_WORKER")
            except Exception as e:
                logger.error(f"Error in TokenExpiryWorker cycle: {e}")
            await asyncio.sleep(settings.EXPIRY_WORKER_INTERVAL_SECONDS)

    async def process_overdue_tokens(self, actor: str = "SYSTEM_WORKER"):
        """
        Server-authoritative expiry check:
        - Filters tokens strictly where status == 'BOOKED' (immune: CHECKED_IN, IN_CONSULTATION, COMPLETED, CANCELLED)
        - Checks if now > grace_period_deadline
        - Atomically transitions status to 'EXPIRED'
        - Recalculates queue waiting times & broadcasts WebSocket event
        - Records in audit log
        """
        now = datetime.now(timezone.utc)
        current_time_str = f"{now.hour:02d}:{now.minute:02d}"

        # Fetch candidate bookings from DB or mock store
        candidates: List[Dict[str, Any]] = []
        if not booking_repo.db_mgr.is_mock and booking_repo.db_mgr.db is not None:
            cursor = booking_repo.db_mgr.db.bookings.find({"status": BookingStatus.BOOKED.value})
            candidates = await cursor.to_list(length=500)
        else:
            candidates = [b for b in _mock_bookings.values() if b["status"] == BookingStatus.BOOKED.value]

        expired_count = 0
        for booking in candidates:
            # Check deadline boundary
            grace_deadline = booking.get("grace_period_deadline", "23:59")
            # For demonstration, if booking is marked for test immediate expiry or if current time passed
            # We also support a demo trigger flag `demo_force_expire`
            should_expire = False
            if booking.get("demo_force_expire", False):
                should_expire = True
            elif current_time_str > grace_deadline:
                should_expire = True

            if should_expire:
                booking_id = booking["_id"] if "_id" in booking else booking["id"]
                # Atomic update to EXPIRED
                updated = await booking_repo.update_status(
                    booking_id=booking_id,
                    new_status=BookingStatus.EXPIRED,
                    audit_actor=actor
                )
                if updated:
                    expired_count += 1
                    logger.info(f"Token #{booking['token_number']} ({booking['booking_ref']}) EXPIRED by {actor}.")
                    
                    from app.services.notification_service import notification_service
                    await notification_service.send_notification(
                        recipient_phone=booking["patient_phone"],
                        title="OP Token Expired",
                        message=f"Token #{booking['token_number']} expired because the reporting deadline and grace period passed without check-in.",
                        category="TOKEN_EXPIRED",
                        booking_ref=booking["booking_ref"]
                    )

                    # Broadcast to WebSockets
                    await ws_manager.broadcast_all({
                        "event": "TOKEN_EXPIRED",
                        "booking_id": booking_id,
                        "token_number": booking["token_number"],
                        "patient_name": booking["patient_name"],
                        "doctor_id": booking["doctor_id"],
                        "schedule_id": booking["schedule_id"],
                        "timestamp": now.isoformat(),
                        "reason": "Missed reporting deadline and grace period"
                    })

        if expired_count > 0:
            logger.info(f"Processed {expired_count} expired tokens in cycle.")


expiry_worker = TokenExpiryWorker()
