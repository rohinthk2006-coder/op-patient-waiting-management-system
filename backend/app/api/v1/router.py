from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.hospitals import router as hospitals_router
from app.api.v1.bookings import router as bookings_router
from app.api.v1.queue import router as queue_router
from app.api.v1.beds import router as beds_router
from app.api.v1.predictions import router as predictions_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.traffic import router as traffic_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(hospitals_router)
api_router.include_router(bookings_router)
api_router.include_router(queue_router)
api_router.include_router(beds_router)
api_router.include_router(predictions_router)
api_router.include_router(notifications_router)
api_router.include_router(traffic_router)

