from typing import Optional
from pydantic import BaseModel


class WaitingTimePredictionResponse(BaseModel):
    booking_id: Optional[str] = None
    doctor_id: str
    queue_position: int
    predicted_wait_minutes: int
    confidence_interval_min: int  # e.g. ±5 min
    prediction_type: str  # "BASELINE_HEURISTIC" or "ML_REGRESSION"
    data_freshness_seconds: int
    factors: dict = {}
