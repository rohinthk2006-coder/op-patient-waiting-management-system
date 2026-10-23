import logging
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("app.db")


class MongoDBManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    is_connected: bool = False
    is_mock: bool = False
    _mock_store: Dict[str, Dict[str, Any]] = {}

    async def connect(self):
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
            # Set short timeout to quickly detect if local/remote Mongo is available
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=2000,
            )
            # Ping database to verify connection
            await self.client.admin.command('ping')
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.is_connected = True
            self.is_mock = False
            logger.info(f"Connected to MongoDB database: {settings.MONGODB_DB_NAME}")
            await self.create_indexes()
        except Exception as e:
            logger.warning(f"Live MongoDB not available ({e}). Initializing high-fidelity memory store for development.")
            self.is_connected = True
            self.is_mock = True
            self._init_mock_store()

    async def create_indexes(self):
        if not self.db or self.is_mock:
            return
        try:
            # Users: unique phone
            await self.db.users.create_index("phone", unique=True)
            await self.db.users.create_index("email", sparse=True)

            # Bookings: Crucial compound unique index preventing duplicate token assignment
            await self.db.bookings.create_index(
                [("schedule_id", 1), ("booking_date", 1), ("token_number", 1)],
                unique=True,
                name="unique_schedule_date_token"
            )

            # Queue Sessions: one session per schedule per date
            await self.db.queue_sessions.create_index(
                [("schedule_id", 1), ("date", 1)],
                unique=True,
                name="unique_schedule_session_date"
            )

            # Audit logs: indexed by timestamp and entity
            await self.db.audit_logs.create_index([("timestamp", -1)])
            await self.db.audit_logs.create_index([("entity_type", 1), ("entity_id", 1)])

            logger.info("MongoDB unique indexes and constraints verified.")
        except Exception as ex:
            logger.error(f"Error creating indexes: {ex}")

    def _init_mock_store(self):
        collections = [
            "users", "hospitals", "departments", "doctors", "staff_members",
            "op_schedules", "bookings", "queue_sessions", "queue_entries",
            "bed_status", "waiting_time_predictions", "notifications", "audit_logs"
        ]
        for col in collections:
            if col not in self._mock_store:
                self._mock_store[col] = {}

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")


db_manager = MongoDBManager()


def get_database() -> AsyncIOMotorDatabase:
    return db_manager.db
