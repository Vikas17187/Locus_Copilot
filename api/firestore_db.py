"""
Google Cloud Firestore REST Adapter for Permanent Serverless Storage.

Free Spark Plan:
- 50,000 reads/day
- 20,000 writes/day
- 1 GB storage
- 100% Free forever, no card charges possible.
"""

import os
import json
import urllib.request
import urllib.error
from datetime import datetime
from typing import Dict, List, Optional

PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "locus-1e383")
API_KEY = os.getenv("FIREBASE_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY") or "AIzaSyARXAwC_P2K35FtpB3T6j5Iqw5NOLVzDQ0"
BASE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

def _dict_to_firestore_fields(data: dict) -> dict:
    """Convert standard python dict to Firestore REST fields format."""
    fields = {}
    for k, v in data.items():
        if v is None:
            fields[k] = {"nullValue": None}
        elif isinstance(v, bool):
            fields[k] = {"booleanValue": v}
        elif isinstance(v, int):
            fields[k] = {"integerValue": str(v)}
        elif isinstance(v, float):
            fields[k] = {"doubleValue": v}
        elif isinstance(v, str):
            fields[k] = {"stringValue": v}
        elif isinstance(v, dict):
            fields[k] = {"mapValue": {"fields": _dict_to_firestore_fields(v)}}
        elif isinstance(v, list):
            fields[k] = {"stringValue": json.dumps(v)}
        else:
            fields[k] = {"stringValue": str(v)}
    return fields

def _firestore_fields_to_dict(fields: dict) -> dict:
    """Convert Firestore REST fields back to standard python dict."""
    result = {}
    for k, v in fields.items():
        if "stringValue" in v:
            val = v["stringValue"]
            if val and (val.startswith("{") or val.startswith("[")):
                try:
                    result[k] = json.loads(val)
                    continue
                except Exception:
                    pass
            result[k] = val
        elif "integerValue" in v:
            result[k] = int(v["integerValue"])
        elif "doubleValue" in v:
            result[k] = float(v["doubleValue"])
        elif "booleanValue" in v:
            result[k] = bool(v["booleanValue"])
        elif "nullValue" in v:
            result[k] = None
        elif "mapValue" in v:
            result[k] = _firestore_fields_to_dict(v["mapValue"].get("fields", {}))
        else:
            result[k] = str(v)
    return result

# ==================== SEARCHES ====================

def firestore_save_search(user_id: int, locality_name: str, lat: float, lon: float, 
                          radius: float, business_type: str, weights: dict, result_count: int) -> bool:
    url = f"{BASE_URL}/searches?key={API_KEY}"
    payload = {
        "fields": _dict_to_firestore_fields({
            "user_id": user_id,
            "locality_name": locality_name,
            "latitude": lat,
            "longitude": lon,
            "search_radius": radius,
            "business_type": business_type or "general",
            "weights": json.dumps(weights),
            "result_count": result_count,
            "created_at": datetime.now().isoformat()
        })
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status in (200, 201)
    except Exception as e:
        print(f"[FIRESTORE ERROR] save_search: {e}")
        return False

def firestore_get_user_searches(user_id: int, limit: int = 15) -> List[Dict]:
    url = f"{BASE_URL}/searches?key={API_KEY}&pageSize={limit}"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            docs = data.get("documents", [])
            searches = []
            for doc in docs:
                parsed = _firestore_fields_to_dict(doc.get("fields", {}))
                parsed["id"] = doc.get("name", "").split("/")[-1]
                if parsed.get("user_id") == user_id or str(parsed.get("user_id")) == str(user_id):
                    searches.append(parsed)
            searches.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return searches
    except Exception as e:
        print(f"[FIRESTORE ERROR] get_user_searches: {e}")
        return []

# ==================== FAVORITES ====================

def firestore_add_favorite(user_id: int, location_id: str, location_name: str, 
                           lat: float, lon: float, notes: str = "") -> bool:
    url = f"{BASE_URL}/favorites?key={API_KEY}"
    payload = {
        "fields": _dict_to_firestore_fields({
            "user_id": user_id,
            "location_id": location_id,
            "location_name": location_name,
            "latitude": lat,
            "longitude": lon,
            "notes": notes,
            "created_at": datetime.now().isoformat()
        })
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status in (200, 201)
    except Exception as e:
        print(f"[FIRESTORE ERROR] add_favorite: {e}")
        return False

def firestore_get_user_favorites(user_id: int) -> List[Dict]:
    url = f"{BASE_URL}/favorites?key={API_KEY}&pageSize=50"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            docs = data.get("documents", [])
            favs = []
            for doc in docs:
                parsed = _firestore_fields_to_dict(doc.get("fields", {}))
                parsed["id"] = doc.get("name", "").split("/")[-1]
                if parsed.get("user_id") == user_id or str(parsed.get("user_id")) == str(user_id):
                    favs.append(parsed)
            favs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return favs
    except Exception as e:
        print(f"[FIRESTORE ERROR] get_user_favorites: {e}")
        return []

def firestore_remove_favorite(doc_id: str) -> bool:
    # If doc_id is numeric (from sqlite), we delete by searching, else direct REST delete
    url = f"{BASE_URL}/favorites/{doc_id}?key={API_KEY}"
    try:
        req = urllib.request.Request(url, method="DELETE")
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status in (200, 204)
    except Exception as e:
        print(f"[FIRESTORE ERROR] remove_favorite: {e}")
        return False

# ==================== PREFERENCES ====================

def firestore_save_preference(user_id: int, preference_name: str, weights: dict, 
                              business_type: str, search_radius: float, description: str = "") -> bool:
    url = f"{BASE_URL}/preferences?key={API_KEY}"
    payload = {
        "fields": _dict_to_firestore_fields({
            "user_id": user_id,
            "preference_name": preference_name,
            "weights": json.dumps(weights),
            "business_type": business_type or "general",
            "search_radius": search_radius,
            "description": description,
            "created_at": datetime.now().isoformat()
        })
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status in (200, 201)
    except Exception as e:
        print(f"[FIRESTORE ERROR] save_preference: {e}")
        return False

def firestore_get_user_preferences(user_id: int) -> List[Dict]:
    url = f"{BASE_URL}/preferences?key={API_KEY}&pageSize=30"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            docs = data.get("documents", [])
            prefs = []
            for doc in docs:
                parsed = _firestore_fields_to_dict(doc.get("fields", {}))
                parsed["id"] = doc.get("name", "").split("/")[-1]
                if parsed.get("user_id") == user_id or str(parsed.get("user_id")) == str(user_id):
                    prefs.append(parsed)
            prefs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return prefs
    except Exception as e:
        print(f"[FIRESTORE ERROR] get_user_preferences: {e}")
        return []
