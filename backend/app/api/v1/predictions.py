from fastapi import APIRouter, Query
from app.services.prediction_service import prediction_service
from app.schemas.prediction import WaitingTimePredictionResponse

router = APIRouter(prefix="/predictions", tags=["Waiting-Time Predictions"])


@router.get("/wait-time", response_model=WaitingTimePredictionResponse)
async def get_wait_time(
    queue_position: int = Query(..., ge=1),
    avg_consultation_min: int = Query(10, ge=1),
    doctor_status: str = Query("AVAILABLE"),
    emergency_delay_min: int = Query(0, ge=0)
):
    result = prediction_service.predict_wait_time(
        queue_position=queue_position,
        avg_consultation_min=avg_consultation_min,
        doctor_status=doctor_status,
        emergency_delay_min=emergency_delay_min
    )
    return WaitingTimePredictionResponse(
        doctor_id="doc-anand-01",
        queue_position=queue_position,
        predicted_wait_minutes=result["predicted_wait_minutes"],
        confidence_interval_min=result["confidence_interval_min"],
        prediction_type=result["prediction_type"],
        data_freshness_seconds=result["data_freshness_seconds"],
        factors=result["factors"]
    )
