from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Tuple
import uuid
from datetime import datetime, timezone
import math
import heapq

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class Incident(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lat: float
    lng: float
    incident_type: str
    severity: int = Field(ge=1, le=5)
    description: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    anonymous: bool = True

class IncidentCreate(BaseModel):
    lat: float
    lng: float
    incident_type: str
    severity: int = Field(ge=1, le=5)
    description: Optional[str] = None

class TollGate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lat: float
    lng: float
    name: str
    monitored: bool = True

class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float

class RoutePoint(BaseModel):
    lat: float
    lng: float

class RouteResponse(BaseModel):
    safest_route: List[RoutePoint]
    shortest_route: List[RoutePoint]
    safety_score: float
    distance_km: float
    incident_count: int
    toll_count: int
    estimated_time_min: int

class EmergencyContact(BaseModel):
    name: str
    number: str
    description: str

class SafetyStats(BaseModel):
    total_incidents: int
    total_tollgates: int
    high_risk_areas: int
    safe_routes_calculated: int

# Sample data initialization
async def init_sample_data():
    """Initialize sample data if not exists"""
    incidents_count = await db.incidents.count_documents({})
    if incidents_count == 0:
        # Sample incidents across major Indian cities (Mumbai coordinates range)
        sample_incidents = [
            {"id": str(uuid.uuid4()), "lat": 19.0760, "lng": 72.8777, "incident_type": "harassment", "severity": 4, "description": "Street harassment reported", "timestamp": datetime.now(timezone.utc).isoformat(), "anonymous": True},
            {"id": str(uuid.uuid4()), "lat": 19.0896, "lng": 72.8656, "incident_type": "theft", "severity": 3, "description": "Chain snatching", "timestamp": datetime.now(timezone.utc).isoformat(), "anonymous": True},
            {"id": str(uuid.uuid4()), "lat": 19.0330, "lng": 72.8569, "incident_type": "unsafe_zone", "severity": 2, "description": "Poor lighting", "timestamp": datetime.now(timezone.utc).isoformat(), "anonymous": True},
            {"id": str(uuid.uuid4()), "lat": 19.1136, "lng": 72.8697, "incident_type": "assault", "severity": 5, "description": "Physical assault reported", "timestamp": datetime.now(timezone.utc).isoformat(), "anonymous": True},
            {"id": str(uuid.uuid4()), "lat": 19.0176, "lng": 72.8561, "incident_type": "harassment", "severity": 3, "description": "Verbal harassment", "timestamp": datetime.now(timezone.utc).isoformat(), "anonymous": True},
            {"id": str(uuid.uuid4()), "lat": 18.9388, "lng": 72.8354, "incident_type": "unsafe_zone", "severity": 4, "description": "Isolated area", "timestamp": datetime.now(timezone.utc).isoformat(), "anonymous": True},
            {"id": str(uuid.uuid4()), "lat": 19.0728, "lng": 72.8826, "incident_type": "theft", "severity": 3, "description": "Bag snatching", "timestamp": datetime.now(timezone.utc).isoformat(), "anonymous": True},
            {"id": str(uuid.uuid4()), "lat": 19.0520, "lng": 72.8720, "incident_type": "harassment", "severity": 2, "description": "Catcalling", "timestamp": datetime.now(timezone.utc).isoformat(), "anonymous": True},
        ]
        await db.incidents.insert_many(sample_incidents)
    
    tollgates_count = await db.tollgates.count_documents({})
    if tollgates_count == 0:
        sample_tollgates = [
            {"id": str(uuid.uuid4()), "lat": 19.0550, "lng": 72.8700, "name": "Eastern Express Highway Toll", "monitored": True},
            {"id": str(uuid.uuid4()), "lat": 19.0900, "lng": 72.8600, "name": "Western Express Highway Toll", "monitored": True},
            {"id": str(uuid.uuid4()), "lat": 19.0200, "lng": 72.8450, "name": "Bandra-Worli Sea Link Toll", "monitored": True},
            {"id": str(uuid.uuid4()), "lat": 19.1000, "lng": 72.8800, "name": "Mulund Toll Plaza", "monitored": True},
            {"id": str(uuid.uuid4()), "lat": 18.9500, "lng": 72.8300, "name": "South Mumbai Checkpoint", "monitored": True},
        ]
        await db.tollgates.insert_many(sample_tollgates)

# Helper functions
def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates in km using Haversine formula"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def calculate_safety_score(incidents_nearby: int, tollgates_nearby: int, distance: float) -> float:
    """Calculate safety score (0-100, higher is safer)"""
    # Base score
    base_score = 100
    
    # Reduce score for incidents (each incident reduces score)
    incident_penalty = incidents_nearby * 15
    
    # Increase score for tollgates (each tollgate adds to safety)
    tollgate_bonus = tollgates_nearby * 10
    
    # Distance factor (longer routes slightly reduce score)
    distance_penalty = min(distance * 0.5, 20)
    
    final_score = max(0, min(100, base_score - incident_penalty + tollgate_bonus - distance_penalty))
    return round(final_score, 2)

async def calculate_route_safety(route_points: List[Tuple[float, float]], incidents: List, tollgates: List) -> Tuple[int, int]:
    """Calculate incidents and tollgates near a route"""
    incident_count = 0
    tollgate_count = 0
    proximity_threshold = 0.5  # km
    
    for point in route_points:
        for incident in incidents:
            dist = calculate_distance(point[0], point[1], incident['lat'], incident['lng'])
            if dist < proximity_threshold:
                incident_count += 1
                break
        
        for tollgate in tollgates:
            dist = calculate_distance(point[0], point[1], tollgate['lat'], tollgate['lng'])
            if dist < proximity_threshold:
                tollgate_count += 1
                break
    
    return incident_count, tollgate_count

def generate_route_points(start_lat: float, start_lng: float, end_lat: float, end_lng: float, 
                         incidents: List, is_safest: bool = False) -> List[Tuple[float, float]]:
    """Generate route points - safest route avoids high-incident areas"""
    points = []
    steps = 10
    
    if is_safest:
        # Calculate midpoint with offset to avoid incidents
        mid_lat = (start_lat + end_lat) / 2
        mid_lng = (start_lng + end_lng) / 2
        
        # Check for incidents near midpoint and adjust
        incident_nearby = False
        for incident in incidents:
            if incident['severity'] >= 4:
                dist = calculate_distance(mid_lat, mid_lng, incident['lat'], incident['lng'])
                if dist < 1.0:  # Within 1km
                    incident_nearby = True
                    # Offset the route
                    mid_lat += 0.01
                    mid_lng += 0.01
                    break
        
        # Create curved route through adjusted midpoint
        for i in range(steps + 1):
            t = i / steps
            if t < 0.5:
                t2 = t * 2
                lat = start_lat + (mid_lat - start_lat) * t2
                lng = start_lng + (mid_lng - start_lng) * t2
            else:
                t2 = (t - 0.5) * 2
                lat = mid_lat + (end_lat - mid_lat) * t2
                lng = mid_lng + (end_lng - mid_lng) * t2
            points.append((lat, lng))
    else:
        # Shortest route - direct line
        for i in range(steps + 1):
            t = i / steps
            lat = start_lat + (end_lat - start_lat) * t
            lng = start_lng + (end_lng - start_lng) * t
            points.append((lat, lng))
    
    return points

# Routes
@api_router.get("/")
async def root():
    return {"message": "SafestPath API - Women's Safety Route System"}

@api_router.post("/incidents", response_model=Incident)
async def create_incident(incident: IncidentCreate):
    """Report a new incident anonymously"""
    incident_dict = incident.model_dump()
    incident_obj = Incident(**incident_dict)
    
    doc = incident_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.incidents.insert_one(doc)
    return incident_obj

@api_router.get("/incidents", response_model=List[Incident])
async def get_incidents():
    """Get all incidents"""
    incidents = await db.incidents.find({}, {"_id": 0}).to_list(1000)
    
    for incident in incidents:
        if isinstance(incident['timestamp'], str):
            incident['timestamp'] = datetime.fromisoformat(incident['timestamp'])
    
    return incidents

@api_router.get("/tollgates", response_model=List[TollGate])
async def get_tollgates():
    """Get all toll gates"""
    tollgates = await db.tollgates.find({}, {"_id": 0}).to_list(1000)
    return tollgates

@api_router.post("/routes/calculate", response_model=RouteResponse)
async def calculate_route(request: RouteRequest):
    """Calculate safest and shortest routes"""
    # Get incidents and tollgates
    incidents = await db.incidents.find({}, {"_id": 0}).to_list(1000)
    tollgates = await db.tollgates.find({}, {"_id": 0}).to_list(1000)
    
    # Generate routes
    safest_points = generate_route_points(request.start_lat, request.start_lng, 
                                         request.end_lat, request.end_lng, 
                                         incidents, is_safest=True)
    shortest_points = generate_route_points(request.start_lat, request.start_lng, 
                                           request.end_lat, request.end_lng, 
                                           incidents, is_safest=False)
    
    # Calculate safety metrics for safest route
    incident_count, toll_count = await calculate_route_safety(safest_points, incidents, tollgates)
    
    # Calculate distance
    total_distance = calculate_distance(request.start_lat, request.start_lng, 
                                       request.end_lat, request.end_lng)
    
    # Calculate safety score
    safety_score = calculate_safety_score(incident_count, toll_count, total_distance)
    
    # Estimated time (assuming 40 km/h average speed)
    estimated_time = int((total_distance / 40) * 60)
    
    return RouteResponse(
        safest_route=[RoutePoint(lat=p[0], lng=p[1]) for p in safest_points],
        shortest_route=[RoutePoint(lat=p[0], lng=p[1]) for p in shortest_points],
        safety_score=safety_score,
        distance_km=round(total_distance, 2),
        incident_count=incident_count,
        toll_count=toll_count,
        estimated_time_min=estimated_time
    )

@api_router.get("/emergency-contacts", response_model=List[EmergencyContact])
async def get_emergency_contacts():
    """Get emergency helpline numbers"""
    return [
        EmergencyContact(
            name="National Women Helpline",
            number="181",
            description="24x7 support for women in distress"
        ),
        EmergencyContact(
            name="National Emergency Number",
            number="112",
            description="All emergency services (Police, Fire, Medical)"
        ),
        EmergencyContact(
            name="Women in Distress",
            number="1091",
            description="Women helpline for immediate assistance"
        ),
        EmergencyContact(
            name="Police",
            number="100",
            description="Direct police emergency line"
        ),
    ]

@api_router.get("/stats", response_model=SafetyStats)
async def get_safety_stats():
    """Get safety statistics"""
    total_incidents = await db.incidents.count_documents({})
    total_tollgates = await db.tollgates.count_documents({})
    high_risk = await db.incidents.count_documents({"severity": {"$gte": 4}})
    
    return SafetyStats(
        total_incidents=total_incidents,
        total_tollgates=total_tollgates,
        high_risk_areas=high_risk,
        safe_routes_calculated=0  # This would be tracked in production
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await init_sample_data()
    logger.info("Sample data initialized")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()