"""
FastAPI Backend for Location Recommendation System.
Endpoints:
- GET /api/localities - List all localities
- GET /api/criteria - Get criterion metadata
- POST /api/analyze - Rank locations based on user input
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- GET /health - Health check
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import os
from pathlib import Path

try:
    from .scoring_engine import ScoringEngine, load_localities
    from .database import (
        init_database, create_user, get_user_by_email, verify_password,
        save_search, get_user_searches, save_preference, get_user_preferences,
        add_favorite, get_user_favorites, remove_favorite, get_all_users,
        get_user_stats, deactivate_user, update_last_login
    )
    from .auth import create_token, verify_token, extract_token_from_header
    from .ml_engine import MLEngine
except ImportError:
    from scoring_engine import ScoringEngine, load_localities
    from database import (
        init_database, create_user, get_user_by_email, verify_password,
        save_search, get_user_searches, save_preference, get_user_preferences,
        add_favorite, get_user_favorites, remove_favorite, get_all_users,
        get_user_stats, deactivate_user, update_last_login
    )
    from auth import create_token, verify_token, extract_token_from_header
    from ml_engine import MLEngine


# ============================================================================
# Initialize App
# ============================================================================

app = FastAPI(
    title="Locus Copilot API",
    description="Location Recommendation Engine for Chennai",
    version="1.0.0"
)

# Enable CORS for frontend
origins_env = os.getenv("LOCUS_ALLOWED_ORIGINS", "http://localhost:8080,http://127.0.0.1:8080")
allowed_origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
allow_all_origins = "*" in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["http://localhost:8080"],
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data
BACKEND_DIR = Path(__file__).parent
localities_path = BACKEND_DIR / "localities.json"

try:
    localities_data = load_localities(localities_path)
    scoring_engine = ScoringEngine(localities_data)
    print("✅ Localities loaded successfully")
except Exception as e:
    print(f"❌ Error loading localities: {e}")
    localities_data = None
    scoring_engine = None

# Initialize database
try:
    init_database()
    print("✅ Database initialized successfully")
except Exception as e:
    print(f"❌ Error initializing database: {e}")

# Initialize ML Engine
ml_engine = None
try:
    if localities_data:
        ml_engine = MLEngine(localities_data)
        print("✅ ML Engine initialized successfully")
except Exception as e:
    print(f"⚠️ ML Engine failed to initialize: {e}")
    ml_engine = None


# ============================================================================
# Dependency: Get current user from JWT token
# ============================================================================

def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current user from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token format")
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload

def get_admin_user(current_user: dict = Depends(get_current_user)):
    """Ensure current user is admin"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return current_user


# ============================================================================
# Pydantic Models
# ============================================================================

class CriterionInfo(BaseModel):
    name: str
    description: str
    default_weight: float


class AnalyzeRequest(BaseModel):
    reference_lat: float
    reference_lon: float
    search_radius_km: float = 5.0
    weights: Dict[str, float]  # e.g., {"rent": 0.25, "crowd": 0.25, ...}
    business_type: Optional[str] = None  # e.g., "medical", "restaurant", "laptop", "mobile", "automobile", "stationary"
    limit: int = 10


class LocationScore(BaseModel):
    id: str
    name: str
    locality_name: str
    lat: float
    lon: float
    display_lat: float = 0.0
    display_lon: float = 0.0
    score: float
    score_percent: float
    breakdown: Dict[str, float]
    distance_km: float
    features: Dict
    constraint_details: Dict = {}


class AnalyzeResponse(BaseModel):
    success: bool
    reference_location: Dict
    results: List[LocationScore]
    stats: Dict
    data_quality: Dict


# ============================================================================
# Auth Models
# ============================================================================

class RegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6, max_length=16)
    full_name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user: Optional[Dict] = None
    message: str = ""


class UserProfile(BaseModel):
    id: int
    email: str
    full_name: str
    is_admin: bool
    created_at: str


class SaveSearchRequest(BaseModel):
    locality_name: str
    latitude: float
    longitude: float
    search_radius: float
    business_type: Optional[str] = None
    weights: Dict[str, float]
    result_count: int


class SavePreferenceRequest(BaseModel):
    preference_name: str
    weights: Dict[str, float]
    business_type: Optional[str] = None
    search_radius: float = 5.0
    description: str = ""


class AddFavoriteRequest(BaseModel):
    location_id: str
    location_name: str
    latitude: float
    longitude: float
    notes: str = ""

# ============================================================================
# Endpoints
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Locus Copilot API",
        "data_loaded": localities_data is not None,
    }


@app.get("/api/localities", tags=["Data"])
async def get_localities():
    """List all processed localities (paginated)."""
    if not localities_data:
        raise HTTPException(status_code=503, detail="Data not loaded")
    
    locs = sorted(localities_data["localities"].values(), key=lambda x: x.get("name", ""))
    return {
        "count": len(locs),
        "localities": locs,
    }


@app.get("/api/criteria", tags=["Data"])
async def get_criteria():
    """Get criterion metadata."""
    return {
        "criteria": ScoringEngine.CRITERIA,
        "description": "Weighted multi-criteria scoring for location ranking"
    }


@app.post("/api/analyze", tags=["Analysis"], response_model=AnalyzeResponse)
async def analyze_location(request: AnalyzeRequest):
    """
    Analyze a location and rank nearby areas.
    
    Example Request:
    {
        "reference_lat": 13.0062,
        "reference_lon": 80.2433,
        "search_radius_km": 5.0,
        "weights": {
            "rent": 0.25,
            "crowd": 0.25,
            "competition": 0.25,
            "accessibility": 0.25
        },
        "limit": 10
    }
    """
    if not localities_data or not scoring_engine:
        raise HTTPException(status_code=503, detail="Scoring engine not initialized")
    
    try:
        # Validate weights
        total_weight = sum(request.weights.values())
        if total_weight == 0:
            raise ValueError("Weights must not be all zero")
        
        # Rank locations
        results = scoring_engine.rank_locations(
            reference_lat=request.reference_lat,
            reference_lon=request.reference_lon,
            search_radius_km=request.search_radius_km,
            weights=request.weights,
            limit=request.limit,
            business_type=request.business_type,
        )
        
        # Get stats
        stats = scoring_engine.get_criterion_stats()

        # Compute data quality coverage around selected area
        in_radius = []
        for locality in localities_data["localities"].values():
            lat = locality.get("lat")
            lon = locality.get("lon")
            if lat is None or lon is None:
                continue
            if ScoringEngine._haversine(request.reference_lat, request.reference_lon, lat, lon) <= request.search_radius_km:
                in_radius.append(locality)

        candidate_count = len(in_radius)
        if candidate_count > 0:
            poi_coverage = sum(1 for l in in_radius if l.get("poi_count", 0) > 0) / candidate_count
            transit_coverage = sum(1 for l in in_radius if l.get("transit_stops", 0) > 0) / candidate_count
            market_coverage = sum(1 for l in in_radius if l.get("shops", 0) > 0) / candidate_count
            rent_signal_coverage = (
                sum(1 for l in in_radius if l.get("rent_source") in {"direct", "nearby_interpolated"}) / candidate_count
            )
            avg_rent_confidence = (
                sum(float(l.get("rent_confidence", 0.0)) for l in in_radius) / candidate_count
            )
            coverage_score = (
                (poi_coverage * 0.25)
                + (transit_coverage * 0.2)
                + (market_coverage * 0.2)
                + (rent_signal_coverage * 0.2)
                + (avg_rent_confidence * 0.15)
            )
        else:
            poi_coverage = 0.0
            transit_coverage = 0.0
            market_coverage = 0.0
            rent_signal_coverage = 0.0
            avg_rent_confidence = 0.0
            coverage_score = 0.0

        if coverage_score >= 0.65:
            confidence = "high"
        elif coverage_score >= 0.4:
            confidence = "medium"
        else:
            confidence = "low"

        data_quality = {
            "coverage_percent": round(coverage_score * 100, 1),
            "confidence": confidence,
            "radius_candidates": candidate_count,
            "poi_coverage_percent": round(poi_coverage * 100, 1),
            "transit_coverage_percent": round(transit_coverage * 100, 1),
            "market_coverage_percent": round(market_coverage * 100, 1),
            "rent_signal_coverage_percent": round(rent_signal_coverage * 100, 1),
            "avg_rent_confidence_percent": round(avg_rent_confidence * 100, 1),
            "note": "Coverage combines POI, transit, market activity, and rent signal confidence around the selected radius.",
        }
        
        return {
            "success": True,
            "reference_location": {
                "lat": request.reference_lat,
                "lon": request.reference_lon,
                "radius_km": request.search_radius_km,
            },
            "results": [LocationScore(**r) for r in results],
            "stats": stats,
            "data_quality": data_quality,
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/analyze/preset/{preset_name}", tags=["Analysis"])
async def analyze_preset(
    preset_name: str,
    reference_lat: float,
    reference_lon: float,
    search_radius_km: float = 5.0,
    limit: int = 10,
):
    """
    Analyze using predefined weight presets.
    
    Presets:
    - "balanced": Equal weights (0.25 each)
    - "budget": Prioritize rent (0.4), then crowd (0.3), accessibility (0.2), competition (0.1)
    - "foot_traffic": Prioritize crowd (0.4), accessibility (0.3), rent (0.2), competition (0.1)
    - "low_competition": Prioritize low competition (0.35), rent (0.3), crowd (0.2), accessibility (0.15)
    """
    presets = {
        "balanced": {"rent": 0.25, "crowd": 0.25, "competition": 0.25, "accessibility": 0.25},
        "budget": {"rent": 0.4, "crowd": 0.3, "accessibility": 0.2, "competition": 0.1},
        "foot_traffic": {"crowd": 0.4, "accessibility": 0.3, "rent": 0.2, "competition": 0.1},
        "low_competition": {"competition": 0.35, "rent": 0.3, "crowd": 0.2, "accessibility": 0.15},
    }
    
    if preset_name not in presets:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown preset. Available: {list(presets.keys())}"
        )
    
    request = AnalyzeRequest(
        reference_lat=reference_lat,
        reference_lon=reference_lon,
        search_radius_km=search_radius_km,
        weights=presets[preset_name],
        limit=limit,
    )
    
    return await analyze_location(request)


# ============================================================================
# Root
# ============================================================================

@app.get("/", tags=["Info"])
async def root():
    """API overview."""
    return {
        "name": "Locus Copilot API",
        "version": "1.0.0",
        "description": "Location recommendation engine for Chennai",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "criteria": "GET /api/criteria",
            "localities": "GET /api/localities",
            "analyze": "POST /api/analyze",
            "analyze_preset": "GET /api/analyze/preset/{preset_name}",
        }
    }


# ============================================================================
# Authentication Endpoints
# ============================================================================

@app.post("/api/auth/register", tags=["Authentication"])
async def register(request: RegisterRequest):
    """Register new user"""
    result = create_user(request.email, request.password, request.full_name)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return {"success": True, "message": "User registered successfully"}


@app.post("/api/auth/login", tags=["Authentication"])
async def login(request: LoginRequest):
    """Login user and return JWT token"""
    if not verify_password(request.email, request.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = get_user_by_email(request.email)
    if not user or not user["is_active"]:
        raise HTTPException(status_code=401, detail="User account is inactive")
    
    # Update last login
    update_last_login(user["id"])
    
    # Create token
    token = create_token(user["id"], user["email"], bool(user["is_admin"]))
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "is_admin": bool(user["is_admin"])
        }
    }


# ============================================================================
# User Endpoints
# ============================================================================

@app.get("/api/user/profile", tags=["User"])
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile"""
    user = get_user_by_email(current_user["email"])
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "is_admin": bool(user["is_admin"]),
        "created_at": user["created_at"],
        "last_login": user["last_login"]
    }


@app.post("/api/user/save-search", tags=["User"])
async def save_user_search(request: SaveSearchRequest, current_user: dict = Depends(get_current_user)):
    """Save search to history"""
    try:
        save_search(
            user_id=current_user["user_id"],
            locality_name=request.locality_name,
            lat=request.latitude,
            lon=request.longitude,
            radius=request.search_radius,
            business_type=request.business_type,
            weights=request.weights,
            result_count=request.result_count
        )
        return {"success": True, "message": "Search saved"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/user/searches", tags=["User"])
async def get_searches(current_user: dict = Depends(get_current_user)):
    """Get user search history"""
    searches = get_user_searches(current_user["user_id"], limit=100)
    return {"success": True, "searches": searches}


@app.post("/api/user/preferences", tags=["User"])
async def save_user_preference(request: SavePreferenceRequest, current_user: dict = Depends(get_current_user)):
    """Save search preference"""
    try:
        save_preference(
            user_id=current_user["user_id"],
            preference_name=request.preference_name,
            weights=request.weights,
            business_type=request.business_type,
            search_radius=request.search_radius,
            description=request.description
        )
        return {"success": True, "message": "Preference saved"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/user/preferences", tags=["User"])
async def get_preferences(current_user: dict = Depends(get_current_user)):
    """Get user saved preferences"""
    prefs = get_user_preferences(current_user["user_id"])
    return {"success": True, "preferences": prefs}


@app.post("/api/user/favorites", tags=["User"])
async def add_user_favorite(request: AddFavoriteRequest, current_user: dict = Depends(get_current_user)):
    """Add location to favorites"""
    try:
        add_favorite(
            user_id=current_user["user_id"],
            location_id=request.location_id,
            location_name=request.location_name,
            lat=request.latitude,
            lon=request.longitude,
            notes=request.notes
        )
        return {"success": True, "message": "Added to favorites"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/user/favorites", tags=["User"])
async def get_favorites(current_user: dict = Depends(get_current_user)):
    """Get user favorite locations"""
    favorites = get_user_favorites(current_user["user_id"])
    return {"success": True, "favorites": favorites}


@app.delete("/api/user/favorites/{favorite_id}", tags=["User"])
async def delete_favorite(favorite_id: int, current_user: dict = Depends(get_current_user)):
    """Remove favorite location"""
    try:
        remove_favorite(favorite_id, user_id=current_user["user_id"])
        return {"success": True, "message": "Removed from favorites"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# Admin Endpoints
# ============================================================================

@app.get("/api/admin/users", tags=["Admin"])
async def admin_get_users(current_user: dict = Depends(get_admin_user)):
    """Get all users (admin only)"""
    users = get_all_users()
    return {"success": True, "users": users}


@app.get("/api/admin/stats", tags=["Admin"])
async def admin_get_stats(current_user: dict = Depends(get_admin_user)):
    """Get system statistics (admin only)"""
    stats = get_user_stats()
    return {"success": True, "stats": stats}


@app.post("/api/admin/users/{user_id}/deactivate", tags=["Admin"])
async def admin_deactivate_user(user_id: int, current_user: dict = Depends(get_admin_user)):
    """Deactivate user account (admin only)"""
    try:
        deactivate_user(user_id)
        return {"success": True, "message": "User deactivated"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# ML / AI Endpoints
# ============================================================================

@app.get("/api/ml/clusters", tags=["ML"])
async def get_clusters():
    """Get all cluster zone profiles with stats"""
    if not ml_engine:
        raise HTTPException(status_code=503, detail="ML engine not available")
    summary = ml_engine.get_cluster_summary()
    return {"success": True, "clusters": summary}


@app.get("/api/ml/clusters/map", tags=["ML"])
async def get_cluster_map():
    """Get all localities with cluster assignments for map overlay"""
    if not ml_engine:
        raise HTTPException(status_code=503, detail="ML engine not available")
    data = ml_engine.get_cluster_map_data()
    return {"success": True, "localities": data, "count": len(data)}


@app.get("/api/ml/clusters/{locality_id}", tags=["ML"])
async def get_locality_cluster(locality_id: str):
    """Get cluster info for a specific locality"""
    if not ml_engine:
        raise HTTPException(status_code=503, detail="ML engine not available")
    info = ml_engine.get_locality_cluster(locality_id)
    if not info:
        raise HTTPException(status_code=404, detail="Locality not found or not clustered")
    return {"success": True, "cluster": info}


@app.get("/api/ml/smart-weights", tags=["ML"])
async def get_all_smart_weights():
    """Get ML-recommended weights for all business types"""
    if not ml_engine:
        raise HTTPException(status_code=503, detail="ML engine not available")
    recs = ml_engine.get_all_smart_weights()
    return {"success": True, "recommendations": recs}


@app.get("/api/ml/smart-weights/{business_type}", tags=["ML"])
async def get_smart_weights(business_type: str):
    """Get ML-recommended weights for a specific business type"""
    if not ml_engine:
        raise HTTPException(status_code=503, detail="ML engine not available")
    rec = ml_engine.get_smart_weights(business_type)
    if not rec:
        raise HTTPException(status_code=404, detail=f"No recommendation for '{business_type}'")
    return {"success": True, **rec}


@app.get("/api/ml/personalized", tags=["ML"])
async def get_personalized_recommendations(
    limit: int = 5,
    current_user: dict = Depends(get_current_user)
):
    """Get personalized location recommendations based on user history"""
    if not ml_engine:
        raise HTTPException(status_code=503, detail="ML engine not available")

    user_id = current_user["user_id"]

    # Fetch user data
    searches = get_user_searches(user_id, limit=50)
    favorites = get_user_favorites(user_id)

    if not searches and not favorites:
        return {
            "success": True,
            "recommendations": [],
            "message": "Use the app more to get personalized recommendations! Try analyzing a few locations and saving favorites."
        }

    recs = ml_engine.get_personalized_recommendations(
        user_searches=searches,
        user_favorites=favorites,
        limit=limit,
    )

    return {
        "success": True,
        "recommendations": recs,
        "based_on": {
            "searches": len(searches),
            "favorites": len(favorites),
        }
    }


@app.get("/api/ml/status", tags=["ML"])
async def ml_status():
    """Check ML engine status"""
    return {
        "available": ml_engine is not None,
        "features": {
            "clustering": ml_engine.clusterer.is_trained if ml_engine else False,
            "smart_weights": ml_engine.weight_recommender.is_trained if ml_engine else False,
            "personalized": True if ml_engine else False,
        }
    }


# ============================================================================
# For development
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
