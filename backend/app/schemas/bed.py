from enum import Enum
from pydantic import BaseModel, Field


class BedCategory(str, Enum):
    ICU = "ICU"
    EMERGENCY_TRAUMA = "EMERGENCY_TRAUMA"
    OXYGEN_SUPPORT = "OXYGEN_SUPPORT"
    GENERAL_WARD = "GENERAL_WARD"
    PEDIATRIC = "PEDIATRIC"


class BedStatusResponse(BaseModel):
    id: str
    hospital_id: str
    hospital_name: str
    category: BedCategory
    total_beds: int
    occupied_beds: int
    available_beds: int
    occupancy_rate: float
    status: str  # AVAILABLE, LOW, CRITICAL
    last_updated: str


class BedStatusUpdate(BaseModel):
    hospital_id: str
    category: BedCategory
    total_beds: int = Field(..., ge=0)
    occupied_beds: int = Field(..., ge=0)
