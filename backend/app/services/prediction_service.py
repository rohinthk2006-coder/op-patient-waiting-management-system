import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import numpy as np

logger = logging.getLogger("app.service.prediction")


class WaitingTimePredictionService:
    def __init__(self):
        self.ml_model = None
        self.is_ml_trained = False
        self.min_samples_for_ml = 50

    def calculate_baseline(
        self,
        queue_position: int,
        avg_consultation_min: int = 10,
        doctor_status: str = "AVAILABLE",
        emergency_delay_min: int = 0
    ) -> Dict[str, Any]:
        """
        Transparent baseline prediction calculation:
        Wait Time = (Queue Position - 1) * Avg Consultation Time + Status Offset + Emergency Offset
        """
        if queue_position <= 1:
            estimated_wait = 2 if doctor_status == "AVAILABLE" else 8
        else:
            estimated_wait = (queue_position - 1) * avg_consultation_min

        status_offset = 0
        if doctor_status == "ON_BREAK":
            status_offset = 15
        elif doctor_status == "IN_CONSULTATION":
            status_offset = 5

        total_wait = max(estimated_wait + status_offset + emergency_delay_min, 0)
        confidence_margin = 5  # ±5 minutes transparent confidence interval

        return {
            "predicted_wait_minutes": total_wait,
            "confidence_interval_min": confidence_margin,
            "prediction_type": "BASELINE_HEURISTIC",
            "data_freshness_seconds": 15,
            "factors": {
                "queue_position": queue_position,
                "avg_consultation_min": avg_consultation_min,
                "status_offset": status_offset,
                "emergency_delay_min": emergency_delay_min,
                "model_status": "Transparent Heuristic Baseline"
            }
        }

    def predict_wait_time(
        self,
        queue_position: int,
        avg_consultation_min: int = 10,
        doctor_status: str = "AVAILABLE",
        emergency_delay_min: int = 0
    ) -> Dict[str, Any]:
        """
        Predicts wait time using ML model when trained, or falls back to baseline heuristic.
        """
        if self.is_ml_trained and self.ml_model is not None:
            try:
                features = np.array([[queue_position, avg_consultation_min, 1 if doctor_status == "AVAILABLE" else 0]])
                pred = self.ml_model.predict(features)[0]
                return {
                    "predicted_wait_minutes": max(int(round(pred)), 0),
                    "confidence_interval_min": 4,
                    "prediction_type": "ML_REGRESSION",
                    "data_freshness_seconds": 10,
                    "factors": {
                        "queue_position": queue_position,
                        "model_type": "scikit-learn RandomForestRegressor"
                    }
                }
            except Exception as e:
                logger.warning(f"ML prediction error ({e}). Falling back to baseline.")

        # Default fallback
        return self.calculate_baseline(
            queue_position=queue_position,
            avg_consultation_min=avg_consultation_min,
            doctor_status=doctor_status,
            emergency_delay_min=emergency_delay_min
        )


prediction_service = WaitingTimePredictionService()
