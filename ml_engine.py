"""
ML Engine: Machine Learning features for Locus Copilot.

Features:
1. Location Clustering  — K-Means clustering of localities into zone profiles
2. Smart Weights        — ML-recommended weights per business type
3. Personalized Recs    — Content-based recommendations from user history
"""

import json
import numpy as np
from typing import Dict, List, Optional, Tuple
from pathlib import Path

# Optional: sklearn for clustering (graceful fallback if not installed)
try:
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


# ============================================================================
# 1. LOCATION CLUSTERING
# ============================================================================

# Cluster profile labels (assigned after analyzing centroids)
CLUSTER_PROFILES = {
    0: {"name": "Commercial Hub", "icon": "🏬", "color": "#e74c3c",
        "description": "High foot traffic, many shops, good transit access"},
    1: {"name": "Residential Zone", "icon": "🏘️", "color": "#3498db",
        "description": "Lower density, affordable rent, fewer shops"},
    2: {"name": "Transit Corridor", "icon": "🚇", "color": "#2ecc71",
        "description": "Well-connected by public transit, moderate activity"},
    3: {"name": "Emerging Area", "icon": "🌱", "color": "#f39c12",
        "description": "Developing area with growth potential, low competition"},
    4: {"name": "Premium District", "icon": "💎", "color": "#9b59b6",
        "description": "High rent but strong demand, established market"},
}


class LocationClusterer:
    """Groups localities into meaningful zones using K-Means."""

    def __init__(self, n_clusters: int = 5):
        self.n_clusters = n_clusters
        self.model = None
        self.scaler = None
        self.cluster_labels = {}  # locality_id -> cluster_id
        self.cluster_profiles = {}  # cluster_id -> profile info
        self.feature_names = [
            "poi_count", "shops", "transit_stops",
            "rent_normalized", "crowd_normalized",
            "accessibility_normalized", "competition_normalized"
        ]
        self.is_trained = False

    def train(self, localities_data: Dict) -> Dict:
        """
        Train K-Means on locality features.

        Args:
            localities_data: The full localities dict from localities.json

        Returns:
            Dict with cluster assignments and profiles
        """
        if not SKLEARN_AVAILABLE:
            return self._fallback_clustering(localities_data)

        localities = localities_data.get("localities", {})
        if not localities:
            return {"error": "No locality data available"}

        # Extract features
        ids = []
        features = []

        for loc_id, loc in localities.items():
            row = []
            for feat in self.feature_names:
                val = loc.get(feat, 0)
                if val is None or (isinstance(val, str) and val == "N/A"):
                    val = 0
                row.append(float(val))
            features.append(row)
            ids.append(loc_id)

        X = np.array(features)

        # Standardize features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # Fit K-Means
        n = min(self.n_clusters, len(X_scaled))
        self.model = KMeans(n_clusters=n, random_state=42, n_init=10)
        labels = self.model.fit_predict(X_scaled)

        # Assign labels
        self.cluster_labels = {ids[i]: int(labels[i]) for i in range(len(ids))}

        # Analyze centroids to assign meaningful profile names
        self._assign_profiles(X, labels, n)

        self.is_trained = True

        return self.get_cluster_summary(localities_data)

    def _assign_profiles(self, X: np.ndarray, labels: np.ndarray, n_clusters: int):
        """Analyze cluster centroids and assign descriptive profiles."""
        centroids_raw = []
        for c in range(n_clusters):
            mask = labels == c
            if mask.sum() > 0:
                centroid = X[mask].mean(axis=0)
            else:
                centroid = np.zeros(len(self.feature_names))
            centroids_raw.append(centroid)

        centroids = np.array(centroids_raw)

        # Feature indices
        idx = {name: i for i, name in enumerate(self.feature_names)}

        # Score each cluster on different traits
        scores = {}
        for c in range(n_clusters):
            scores[c] = {
                "commercial": centroids[c][idx["shops"]] + centroids[c][idx["poi_count"]] * 0.5,
                "transit": centroids[c][idx["transit_stops"]] + centroids[c][idx["accessibility_normalized"]] * 50,
                "affordable": centroids[c][idx["rent_normalized"]] * 100,
                "crowd": centroids[c][idx["crowd_normalized"]] * 100,
                "premium": (1 - centroids[c][idx["rent_normalized"]]) * 100 + centroids[c][idx["poi_count"]] * 0.3,
            }

        # Assign profiles based on dominant trait
        used_profiles = set()
        profile_keys = ["Commercial Hub", "Residential Zone", "Transit Corridor", "Emerging Area", "Premium District"]
        profile_map = {
            "Commercial Hub": "commercial",
            "Transit Corridor": "transit",
            "Residential Zone": "affordable",
            "Emerging Area": "crowd",
            "Premium District": "premium",
        }

        # Sort clusters by their highest-scoring trait
        assignments = []
        for c in range(n_clusters):
            best_trait = None
            best_score = -1
            for profile_name, trait_key in profile_map.items():
                if profile_name not in used_profiles and scores[c][trait_key] > best_score:
                    best_score = scores[c][trait_key]
                    best_trait = profile_name
            if best_trait:
                used_profiles.add(best_trait)
                assignments.append((c, best_trait))
            else:
                # Fallback
                remaining = [p for p in profile_keys if p not in used_profiles]
                if remaining:
                    used_profiles.add(remaining[0])
                    assignments.append((c, remaining[0]))

        # Build profiles
        base_profiles = {v["name"]: (k, v) for k, v in CLUSTER_PROFILES.items()}
        self.cluster_profiles = {}
        for cluster_id, profile_name in assignments:
            if profile_name in base_profiles:
                _, profile = base_profiles[profile_name]
                self.cluster_profiles[cluster_id] = {
                    "name": profile["name"],
                    "icon": profile["icon"],
                    "color": profile["color"],
                    "description": profile["description"],
                }
            else:
                self.cluster_profiles[cluster_id] = {
                    "name": f"Zone {cluster_id}",
                    "icon": "📍",
                    "color": "#95a5a6",
                    "description": "Mixed-use area",
                }

    def _fallback_clustering(self, localities_data: Dict) -> Dict:
        """Simple rule-based clustering when sklearn is not available."""
        localities = localities_data.get("localities", {})

        for loc_id, loc in localities.items():
            crowd = loc.get("crowd_normalized", 0)
            rent = loc.get("rent_normalized", 0)
            access = loc.get("accessibility_normalized", 0)
            shops = loc.get("shops", 0)

            if shops > 5 and crowd > 0.6:
                cluster = 0  # Commercial Hub
            elif rent > 0.7 and crowd < 0.3:
                cluster = 1  # Residential
            elif access > 0.6:
                cluster = 2  # Transit Corridor
            elif crowd < 0.3 and shops < 3:
                cluster = 3  # Emerging
            else:
                cluster = 4  # Premium

            self.cluster_labels[loc_id] = cluster

        self.cluster_profiles = {k: v for k, v in CLUSTER_PROFILES.items()}
        self.is_trained = True

        return self.get_cluster_summary(localities_data)

    def get_cluster_summary(self, localities_data: Dict) -> Dict:
        """Get summary of all clusters with counts and stats."""
        localities = localities_data.get("localities", {})
        summary = {}

        for cluster_id, profile in self.cluster_profiles.items():
            members = [
                loc_id for loc_id, c in self.cluster_labels.items()
                if c == cluster_id
            ]

            # Compute averages for members
            avg_stats = {"rent": 0, "crowd": 0, "access": 0, "competition": 0, "count": len(members)}
            if members:
                for loc_id in members:
                    loc = localities.get(loc_id, {})
                    avg_stats["rent"] += loc.get("rent_normalized", 0)
                    avg_stats["crowd"] += loc.get("crowd_normalized", 0)
                    avg_stats["access"] += loc.get("accessibility_normalized", 0)
                    avg_stats["competition"] += loc.get("competition_normalized", 0)

                n = len(members)
                avg_stats["rent"] = round(avg_stats["rent"] / n, 3)
                avg_stats["crowd"] = round(avg_stats["crowd"] / n, 3)
                avg_stats["access"] = round(avg_stats["access"] / n, 3)
                avg_stats["competition"] = round(avg_stats["competition"] / n, 3)

            summary[cluster_id] = {
                **profile,
                "locality_count": len(members),
                "avg_scores": avg_stats,
            }

        return summary

    def get_locality_cluster(self, locality_id: str) -> Optional[Dict]:
        """Get cluster info for a specific locality."""
        if not self.is_trained:
            return None
        cluster_id = self.cluster_labels.get(locality_id)
        if cluster_id is None:
            return None
        return {
            "cluster_id": cluster_id,
            **self.cluster_profiles.get(cluster_id, {}),
        }

    def get_all_with_clusters(self, localities_data: Dict) -> List[Dict]:
        """Get all localities with their cluster assignments (for map overlay)."""
        if not self.is_trained:
            return []

        localities = localities_data.get("localities", {})
        result = []

        for loc_id, loc in localities.items():
            cluster_id = self.cluster_labels.get(loc_id)
            profile = self.cluster_profiles.get(cluster_id, {})
            result.append({
                "id": loc_id,
                "lat": loc.get("lat"),
                "lon": loc.get("lon"),
                "name": loc.get("name", ""),
                "locality_name": loc.get("locality_name", ""),
                "cluster_id": cluster_id,
                "cluster_name": profile.get("name", "Unknown"),
                "cluster_color": profile.get("color", "#95a5a6"),
                "cluster_icon": profile.get("icon", "📍"),
            })

        return result


# ============================================================================
# 2. SMART WEIGHT RECOMMENDATION
# ============================================================================

class SmartWeightRecommender:
    """
    Recommends optimal criterion weights per business type.

    Analyzes correlation between business type POI density and
    the 4 criteria scores across all localities to find patterns.
    """

    def __init__(self):
        self.recommendations = {}  # business_type -> weights
        self.is_trained = False

    def train(self, localities_data: Dict) -> Dict:
        """
        Learn weight recommendations from locality data.

        For each business type, find which criteria correlate most
        with high POI counts of that type.
        """
        localities = localities_data.get("localities", {})
        if not localities:
            return {"error": "No data"}

        business_types = ["medical", "restaurant", "laptop", "mobile", "automobile", "stationary"]
        criteria = ["rent_normalized", "crowd_normalized", "competition_normalized", "accessibility_normalized"]
        criteria_keys = ["rent", "crowd", "competition", "accessibility"]

        for btype in business_types:
            # Collect arrays
            poi_counts = []
            criteria_vals = {c: [] for c in criteria}

            for loc in localities.values():
                bt = loc.get("business_types", {})
                count = bt.get(btype, 0)
                poi_counts.append(count)
                for c in criteria:
                    criteria_vals[c].append(loc.get(c, 0))

            poi_arr = np.array(poi_counts, dtype=float)

            if poi_arr.sum() == 0:
                # No data for this type — use balanced
                self.recommendations[btype] = {
                    "rent": 0.25, "crowd": 0.25,
                    "competition": 0.25, "accessibility": 0.25
                }
                continue

            # Compute correlation of each criterion with POI count
            correlations = {}
            for c, key in zip(criteria, criteria_keys):
                c_arr = np.array(criteria_vals[c], dtype=float)
                if c_arr.std() > 0 and poi_arr.std() > 0:
                    corr = np.corrcoef(poi_arr, c_arr)[0, 1]
                    # Use absolute correlation — both positive and negative matter
                    correlations[key] = abs(corr) if not np.isnan(corr) else 0.1
                else:
                    correlations[key] = 0.1

            # Normalize correlations to weights (sum to 1.0)
            total = sum(correlations.values())
            if total > 0:
                weights = {k: round(v / total, 2) for k, v in correlations.items()}
            else:
                weights = {"rent": 0.25, "crowd": 0.25, "competition": 0.25, "accessibility": 0.25}

            # Ensure they sum to 1.0 exactly
            diff = 1.0 - sum(weights.values())
            max_key = max(weights, key=weights.get)
            weights[max_key] = round(weights[max_key] + diff, 2)

            self.recommendations[btype] = weights

        self.is_trained = True
        return self.get_all_recommendations()

    def get_recommendation(self, business_type: str) -> Optional[Dict]:
        """Get recommended weights for a business type."""
        if not self.is_trained:
            return None

        weights = self.recommendations.get(business_type)
        if not weights:
            return None

        # Add human-readable explanation
        sorted_criteria = sorted(weights.items(), key=lambda x: x[1], reverse=True)
        top = sorted_criteria[0]
        explanation = f"For {business_type} businesses, {top[0]} is the most impactful factor ({int(top[1]*100)}% weight)."

        return {
            "business_type": business_type,
            "recommended_weights": weights,
            "explanation": explanation,
            "confidence": "high" if self.recommendations.get(business_type) else "low",
        }

    def get_all_recommendations(self) -> Dict:
        """Get all recommendation summaries."""
        result = {}
        for btype, weights in self.recommendations.items():
            sorted_c = sorted(weights.items(), key=lambda x: x[1], reverse=True)
            top = sorted_c[0]
            result[btype] = {
                "weights": weights,
                "top_factor": top[0],
                "top_weight": top[1],
                "explanation": f"Best results when {top[0]} weighted at {int(top[1]*100)}%",
            }
        return result


# ============================================================================
# 3. PERSONALIZED RECOMMENDATIONS
# ============================================================================

class PersonalizedRecommender:
    """
    Content-based recommendations from user search history and favorites.

    Analyzes a user's past searches (locations, weights, business types)
    to suggest new locations they might like.
    """

    def __init__(self):
        pass

    def recommend_from_history(
        self,
        user_searches: List[Dict],
        user_favorites: List[Dict],
        localities_data: Dict,
        limit: int = 5,
    ) -> List[Dict]:
        """
        Generate recommendations based on user's past behavior.

        Strategy:
        1. Build a user preference profile from search weights + favorite locations
        2. Score all localities against this profile
        3. Filter out already-visited localities
        4. Return top unvisited matches
        """
        localities = localities_data.get("localities", {})
        if not localities:
            return []

        # Step 1: Build user preference profile
        profile = self._build_user_profile(user_searches, user_favorites, localities)

        if not profile:
            return []

        # Step 2: Score all localities
        scored = []
        visited_coords = set()

        # Track visited locations
        for s in user_searches:
            lat = s.get("lat") or s.get("latitude")
            lon = s.get("lon") or s.get("longitude")
            if lat and lon:
                visited_coords.add((round(float(lat), 3), round(float(lon), 3)))

        for f in user_favorites:
            lat = f.get("lat") or f.get("latitude")
            lon = f.get("lon") or f.get("longitude")
            if lat and lon:
                visited_coords.add((round(float(lat), 3), round(float(lon), 3)))

        for loc_id, loc in localities.items():
            lat = loc.get("lat")
            lon = loc.get("lon")

            if not lat or not lon:
                continue

            # Skip visited
            coord_key = (round(float(lat), 3), round(float(lon), 3))
            if coord_key in visited_coords:
                continue

            # Compute similarity to user profile
            score = self._compute_similarity(loc, profile)

            scored.append({
                "id": loc_id,
                "name": loc.get("name", ""),
                "locality_name": loc.get("locality_name", ""),
                "lat": lat,
                "lon": lon,
                "match_score": round(score * 100, 1),
                "reason": self._generate_reason(loc, profile),
                "features": {
                    "poi_count": loc.get("poi_count", 0),
                    "transit_stops": loc.get("transit_stops", 0),
                    "rent": loc.get("rent", "N/A"),
                    "shops": loc.get("shops", 0),
                },
            })

        # Sort by match score
        scored.sort(key=lambda x: x["match_score"], reverse=True)

        return scored[:limit]

    def _build_user_profile(
        self,
        searches: List[Dict],
        favorites: List[Dict],
        localities: Dict,
    ) -> Optional[Dict]:
        """Build a user preference vector from their history."""

        if not searches and not favorites:
            return None

        # Average weights from searches
        weight_sums = {"rent": 0, "crowd": 0, "competition": 0, "accessibility": 0}
        weight_count = 0

        for s in searches:
            weights = s.get("weights", {})
            if isinstance(weights, str):
                try:
                    weights = json.loads(weights)
                except (json.JSONDecodeError, TypeError):
                    continue

            if weights:
                for k in weight_sums:
                    weight_sums[k] += weights.get(k, 0.25)
                weight_count += 1

        if weight_count > 0:
            avg_weights = {k: v / weight_count for k, v in weight_sums.items()}
        else:
            avg_weights = {"rent": 0.25, "crowd": 0.25, "competition": 0.25, "accessibility": 0.25}

        # Preferred business type (most searched)
        btype_counts = {}
        for s in searches:
            bt = s.get("business_type")
            if bt:
                btype_counts[bt] = btype_counts.get(bt, 0) + 1

        preferred_btype = max(btype_counts, key=btype_counts.get) if btype_counts else None

        # Average location features from favorites (what they like)
        fav_features = {"rent_normalized": 0, "crowd_normalized": 0,
                        "accessibility_normalized": 0, "competition_normalized": 0}
        fav_count = 0

        for f in favorites:
            lat = f.get("lat") or f.get("latitude")
            lon = f.get("lon") or f.get("longitude")
            if lat and lon:
                # Find closest locality
                closest = self._find_closest_locality(float(lat), float(lon), localities)
                if closest:
                    for k in fav_features:
                        fav_features[k] += closest.get(k, 0)
                    fav_count += 1

        if fav_count > 0:
            fav_features = {k: v / fav_count for k, v in fav_features.items()}

        return {
            "avg_weights": avg_weights,
            "preferred_business_type": preferred_btype,
            "fav_features": fav_features,
            "has_favorites": fav_count > 0,
            "search_count": weight_count,
        }

    def _find_closest_locality(self, lat: float, lon: float, localities: Dict) -> Optional[Dict]:
        """Find the closest locality to given coordinates."""
        best = None
        best_dist = float("inf")

        locs = localities if not isinstance(localities, dict) or "localities" not in localities else localities.get("localities", {})

        for loc in (locs.values() if isinstance(locs, dict) else locs):
            loc_lat = loc.get("lat")
            loc_lon = loc.get("lon")
            if loc_lat is None or loc_lon is None:
                continue
            dist = ((lat - loc_lat) ** 2 + (lon - loc_lon) ** 2) ** 0.5
            if dist < best_dist:
                best_dist = dist
                best = loc

        return best

    def _compute_similarity(self, locality: Dict, profile: Dict) -> float:
        """Compute how well a locality matches the user profile."""
        score = 0.0
        weights = profile["avg_weights"]

        # Weighted criteria match
        score += weights.get("rent", 0.25) * locality.get("rent_normalized", 0)
        score += weights.get("crowd", 0.25) * locality.get("crowd_normalized", 0)
        score += weights.get("competition", 0.25) * locality.get("competition_normalized", 0)
        score += weights.get("accessibility", 0.25) * locality.get("accessibility_normalized", 0)

        # Bonus for preferred business type
        if profile.get("preferred_business_type"):
            bt = profile["preferred_business_type"]
            bt_count = locality.get("business_types", {}).get(bt, 0)
            if bt_count > 0:
                score += 0.15  # 15% bonus

        # Bonus for similarity to favorited locations
        if profile.get("has_favorites"):
            fav = profile["fav_features"]
            similarity = 0
            for key in ["rent_normalized", "crowd_normalized", "accessibility_normalized", "competition_normalized"]:
                diff = abs(locality.get(key, 0) - fav.get(key, 0))
                similarity += (1 - diff) * 0.25
            score = score * 0.7 + similarity * 0.3  # Blend

        return min(score, 1.0)

    def _generate_reason(self, locality: Dict, profile: Dict) -> str:
        """Generate a human-readable reason for the recommendation."""
        reasons = []

        weights = profile["avg_weights"]
        top_criterion = max(weights, key=weights.get)

        criterion_map = {
            "rent": ("affordable", "rent_normalized"),
            "crowd": ("high foot traffic", "crowd_normalized"),
            "competition": ("strong market activity", "competition_normalized"),
            "accessibility": ("well-connected transit", "accessibility_normalized"),
        }

        if top_criterion in criterion_map:
            label, field = criterion_map[top_criterion]
            val = locality.get(field, 0)
            if val > 0.5:
                reasons.append(f"Matches your preference for {label}")

        if profile.get("preferred_business_type"):
            bt = profile["preferred_business_type"]
            count = locality.get("business_types", {}).get(bt, 0)
            if count > 0:
                reasons.append(f"Has {count} {bt} businesses nearby")

        if not reasons:
            reasons.append("Similar to locations you've explored")

        return ". ".join(reasons)


# ============================================================================
# UNIFIED ML ENGINE
# ============================================================================

class MLEngine:
    """Unified interface for all ML features."""

    def __init__(self, localities_data: Dict):
        self.localities_data = localities_data
        self.clusterer = LocationClusterer(n_clusters=5)
        self.weight_recommender = SmartWeightRecommender()
        self.personalizer = PersonalizedRecommender()

        # Auto-train on initialization
        self._train_all()

    def _train_all(self):
        """Train all models on startup."""
        print("🧠 Training ML models...")

        # Train clustering
        try:
            summary = self.clusterer.train(self.localities_data)
            cluster_count = len(self.clusterer.cluster_profiles)
            print(f"   ✅ Clustering: {cluster_count} zone profiles created")
        except Exception as e:
            print(f"   ⚠️ Clustering failed: {e}")

        # Train weight recommender
        try:
            recs = self.weight_recommender.train(self.localities_data)
            print(f"   ✅ Smart Weights: {len(recs)} business type profiles learned")
        except Exception as e:
            print(f"   ⚠️ Smart Weights failed: {e}")

        print("🧠 ML models ready!")

    def get_cluster_summary(self) -> Dict:
        """Get cluster overview."""
        return self.clusterer.get_cluster_summary(self.localities_data)

    def get_cluster_map_data(self) -> List[Dict]:
        """Get all localities with cluster colors for map overlay."""
        return self.clusterer.get_all_with_clusters(self.localities_data)

    def get_locality_cluster(self, locality_id: str) -> Optional[Dict]:
        """Get cluster for a specific locality."""
        return self.clusterer.get_locality_cluster(locality_id)

    def get_smart_weights(self, business_type: str) -> Optional[Dict]:
        """Get ML-recommended weights for a business type."""
        return self.weight_recommender.get_recommendation(business_type)

    def get_all_smart_weights(self) -> Dict:
        """Get all weight recommendations."""
        return self.weight_recommender.get_all_recommendations()

    def get_personalized_recommendations(
        self,
        user_searches: List[Dict],
        user_favorites: List[Dict],
        limit: int = 5,
    ) -> List[Dict]:
        """Get personalized location recommendations for a user."""
        return self.personalizer.recommend_from_history(
            user_searches=user_searches,
            user_favorites=user_favorites,
            localities_data=self.localities_data,
            limit=limit,
        )
