import asyncio
import uuid

import httpx

from api.index import app


def request(method: str, path: str, payload=None, headers=None):
    async def _run():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path, json=payload, headers=headers)

    return asyncio.run(_run())


def test_health_contract():
    response = request("GET", "/health")
    assert response.status_code == 200

    payload = response.json()
    assert "status" in payload
    assert "service" in payload
    assert "data_loaded" in payload


def test_analyze_contract_fields():
    body = {
        "reference_lat": 13.0062,
        "reference_lon": 80.2433,
        "search_radius_km": 5.0,
        "weights": {
            "rent": 0.25,
            "crowd": 0.25,
            "competition": 0.25,
            "accessibility": 0.25,
        },
        "business_type": "restaurant",
        "limit": 5,
    }

    response = request("POST", "/api/analyze", body)
    assert response.status_code == 200

    payload = response.json()
    assert payload.get("success") is True
    assert isinstance(payload.get("results"), list)

    # Contract: data quality indicator exists for UI confidence rendering
    dq = payload.get("data_quality")
    assert isinstance(dq, dict)
    for key in [
        "coverage_percent",
        "confidence",
        "radius_candidates",
        "poi_coverage_percent",
        "transit_coverage_percent",
        "market_coverage_percent",
        "note",
    ]:
        assert key in dq

    if payload["results"]:
        result = payload["results"][0]
        for key in [
            "id",
            "name",
            "locality_name",
            "lat",
            "lon",
            "display_lat",
            "display_lon",
            "score",
            "score_percent",
            "breakdown",
            "distance_km",
            "features",
            "constraint_details",
        ]:
            assert key in result

        # Use-case semantics: business-specific competition label should reflect strategy mode
        label = result["constraint_details"]["competition"]["label"]
        assert any(token in label for token in ["Opportunity", "Demand Signal", "Market Fit"])


def test_register_accepts_6_char_password():
    unique_email = f"test_{uuid.uuid4().hex[:10]}@example.com"
    payload = {
        "email": unique_email,
        "password": "abc123",
        "full_name": "Test User",
    }

    response = request("POST", "/api/auth/register", payload)
    assert response.status_code == 200
    body = response.json()
    assert body.get("success") is True


def test_register_rejects_password_longer_than_16():
    unique_email = f"test_{uuid.uuid4().hex[:10]}@example.com"
    payload = {
        "email": unique_email,
        "password": "abcdefghijklmnopq",  # 17 chars
        "full_name": "Test User",
    }

    response = request("POST", "/api/auth/register", payload)
    assert response.status_code in (400, 422)
    body = response.json()
    assert "72 bytes" not in str(body).lower()


def test_contact_submission_and_retrieval():
    payload = {
        "name": "Audit Tester",
        "email": "auditor@example.com",
        "subject": "Automated Quality Test",
        "message": "Testing contact form endpoint contract and persistence."
    }
    post_res = request("POST", "/api/contact", payload)
    assert post_res.status_code == 200
    post_data = post_res.json()
    assert post_data.get("success") is True
    assert post_data.get("data", {}).get("name") == "Audit Tester"

    get_res = request("GET", "/api/contact?limit=5")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data.get("success") is True
    assert "messages" in get_data
    assert isinstance(get_data.get("messages"), list)


def test_favorites_accepts_alphanumeric_string_id():
    from api.auth import create_token
    token = create_token(user_id=1, email="admin@locuscopilot.com", is_admin=True)
    headers = {"Authorization": f"Bearer {token}"}

    # Test that alphanumeric Firestore doc ID does NOT fail with HTTP 422
    alphanumeric_doc_id = "doc_test_abc123xyz"
    delete_res = request("DELETE", f"/api/user/favorites/{alphanumeric_doc_id}", headers=headers)
    assert delete_res.status_code != 422
    assert delete_res.status_code == 200
    assert delete_res.json().get("success") is True


def test_admin_self_deactivation_blocked():
    from api.auth import create_token
    admin_id = 1
    token = create_token(user_id=admin_id, email="admin@locuscopilot.com", is_admin=True)
    headers = {"Authorization": f"Bearer {token}"}

    # Attempting to deactivate own account should be blocked with HTTP 400
    deact_res = request("POST", f"/api/admin/users/{admin_id}/deactivate", headers=headers)
    assert deact_res.status_code == 400
    assert "Cannot deactivate your own" in deact_res.json().get("detail", "")


def test_stationery_spelling_mapping():
    from api.google_maps import TYPE_MAPPING
    assert "stationery" in TYPE_MAPPING
    assert "stationary" in TYPE_MAPPING
    assert TYPE_MAPPING["stationery"] == TYPE_MAPPING["stationary"]

