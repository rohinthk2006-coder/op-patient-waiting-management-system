import math
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.repositories.hospital_repository import hospital_repo

router = APIRouter(prefix="/traffic", tags=["Live Location & Traffic Estimation"])

# Trichy Key Locality Reference Coordinates
TRICHY_LOCALITIES: Dict[str, Dict[str, float]] = {
    "Thillai Nagar": {"lat": 10.8260, "lng": 78.6830},
    "Cantonment": {"lat": 10.8038, "lng": 78.6850},
    "Central Bus Stand": {"lat": 10.7960, "lng": 78.6825},
    "Chathiram Bus Stand": {"lat": 10.8350, "lng": 78.6920},
    "K.K. Nagar": {"lat": 10.7780, "lng": 78.7050},
    "Srirangam": {"lat": 10.8625, "lng": 78.6900},
    "Woraiyur": {"lat": 10.8280, "lng": 78.6720},
    "Golden Rock (Ponmalai)": {"lat": 10.7890, "lng": 78.7180},
    "Trichy Airport Area": {"lat": 10.7654, "lng": 78.7144},
    "Tiruverumbur": {"lat": 10.7850, "lng": 78.7750},
    "NIT Trichy / Thuvakudi": {"lat": 10.7600, "lng": 78.8150},
    "Samayapuram": {"lat": 10.9250, "lng": 78.7420},
    "Palakkarai": {"lat": 10.8170, "lng": 78.6940},
    "Ariyamangalam": {"lat": 10.8015, "lng": 78.7350},
}


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate geodesic distance in kilometers between two lat/lon pairs."""
    r = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    straight_line_km = r * c
    # Road detour factor in urban Trichy
    return round(straight_line_km * 1.25, 2)


class TrafficCalculationRequest(BaseModel):
    hospital_id: str
    patient_latitude: Optional[float] = None
    patient_longitude: Optional[float] = None
    patient_locality: Optional[str] = None
    travel_mode: Optional[str] = Field("BIKE", description="BIKE, CAR, AUTO, BUS")
    target_reporting_time: Optional[str] = "09:00"  # HH:MM


class TrafficCalculationResponse(BaseModel):
    hospital_id: str
    hospital_name: str
    hospital_address: str
    hospital_lat: float
    hospital_lng: float
    origin_description: str
    origin_lat: float
    origin_lng: float
    travel_mode: str
    distance_km: float
    traffic_level: str  # SMOOTH, MODERATE, HEAVY
    traffic_delay_min: int
    estimated_travel_min: int
    recommended_departure_time: str
    route_summary: str


@router.get("/localities")
async def get_trichy_localities():
    """Returns list of pre-configured Trichy localities with GPS coords."""
    return [
        {"name": name, "latitude": coords["lat"], "longitude": coords["lng"]}
        for name, coords in TRICHY_LOCALITIES.items()
    ]


@router.post("/calculate", response_model=TrafficCalculationResponse)
async def calculate_travel_and_traffic(req: TrafficCalculationRequest):
    hospital = await hospital_repo.get_hospital_by_id(req.hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    hosp_lat = hospital.get("latitude", 10.8125)
    hosp_lng = hospital.get("longitude", 78.6856)

    # Determine origin coordinates
    origin_lat = req.patient_latitude
    origin_lng = req.patient_longitude
    origin_desc = req.patient_locality or "Detected Live GPS"

    if (origin_lat is None or origin_lng is None) and req.patient_locality:
        loc = TRICHY_LOCALITIES.get(req.patient_locality)
        if loc:
            origin_lat = loc["lat"]
            origin_lng = loc["lng"]
            origin_desc = req.patient_locality

    if origin_lat is None or origin_lng is None:
        # Default to Central Trichy (Cantonment)
        origin_lat = 10.8038
        origin_lng = 78.6850
        origin_desc = "Cantonment, Tiruchirappalli (Default)"

    distance_km = haversine_distance(origin_lat, origin_lng, hosp_lat, hosp_lng)

    # Travel mode velocity (km/h in urban Trichy)
    mode = (req.travel_mode or "BIKE").upper()
    speed_map = {
        "BIKE": 28.0,
        "CAR": 20.0,
        "AUTO": 22.0,
        "BUS": 15.0,
    }
    avg_speed = speed_map.get(mode, 25.0)

    # Traffic assessment based on time of day and distance
    # Simulated realistic live traffic variations for Trichy corridors
    now = datetime.now()
    hour = now.hour
    is_peak = (8 <= hour <= 11) or (17 <= hour <= 20)

    if is_peak:
        traffic_level = "HEAVY" if distance_km > 7 else "MODERATE"
        delay_min = int(round(distance_km * 1.5)) + 4
    else:
        traffic_level = "MODERATE" if distance_km > 10 else "SMOOTH"
        delay_min = int(round(distance_km * 0.8)) + 2

    raw_travel_time_min = int(round((distance_km / avg_speed) * 60))
    total_travel_min = max(raw_travel_time_min + delay_min, 5)

    # Calculate recommended departure time:
    # Target time minus total travel min minus 10 min parking/registration buffer
    target_time_str = req.target_reporting_time or "09:00"
    try:
        t_hour, t_min = map(int, target_time_str.split(":"))
        target_minutes = t_hour * 60 + t_min
        depart_minutes = target_minutes - (total_travel_min + 10)  # 10 min security & OP desk check-in buffer
        if depart_minutes < 0:
            depart_minutes += 24 * 60
        depart_str = f"{depart_minutes // 60:02d}:{depart_minutes % 60:02d}"
    except Exception:
        depart_str = "08:20"

    # Route summary description based on destination
    route_name = f"Via Main Arterial Road towards {hospital['name']}"
    if "Ariyamangalam" in hospital.get("address", ""):
        route_name = "Via Thanjavur Main Road & Palakkarai Bridge"
    elif "Cantonment" in hospital.get("address", ""):
        route_name = "Via Collectorate Road & Cantonment Flyover"
    elif "Puthur" in hospital.get("address", "") or "MGMGH" in hospital.get("code", ""):
        route_name = "Via Puthur High Road & GH Roundabout"
    elif "Tennur" in hospital.get("address", ""):
        route_name = "Via Thennur High Road"
    elif "Irungalur" in hospital.get("address", "") or "SRM" in hospital.get("code", ""):
        route_name = "Via NH-45 Trichy-Chennai Expressway & Toll Corridor"

    return TrafficCalculationResponse(
        hospital_id=req.hospital_id,
        hospital_name=hospital["name"],
        hospital_address=hospital["address"],
        hospital_lat=hosp_lat,
        hospital_lng=hosp_lng,
        origin_description=origin_desc,
        origin_lat=origin_lat,
        origin_lng=origin_lng,
        travel_mode=mode,
        distance_km=distance_km,
        traffic_level=traffic_level,
        traffic_delay_min=delay_min,
        estimated_travel_min=total_travel_min,
        recommended_departure_time=depart_str,
        route_summary=route_name,
    )
