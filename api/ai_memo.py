"""
AI Executive Due-Diligence & Investment Memo Generator.
Generates structured commercial real estate feasibility reports using Gemini Flash or local Spatial AI heuristics.
"""

import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

def generate_due_diligence_memo(
    locality_name: str,
    business_type: str,
    score: float,
    cluster_info: Optional[Dict[str, Any]] = None,
    features: Optional[Dict[str, Any]] = None,
    google_intel: Optional[Dict[str, Any]] = None,
    radius_km: float = 5.0
) -> Dict[str, Any]:
    """
    Generate an Executive Investment Memo for a candidate storefront location.
    Tries live Gemini API first if key exists, gracefully falling back to deterministic spatial analytics.
    """
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("FIREBASE_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY")
    cluster_info = cluster_info or {}
    features = features or {}
    google_intel = google_intel or {}

    # Attempt Live LLM Generation if key is set
    if gemini_key:
        try:
            live_report = _call_gemini_api(
                gemini_key=gemini_key,
                locality_name=locality_name,
                business_type=business_type,
                score=score,
                cluster_info=cluster_info,
                features=features,
                google_intel=google_intel,
                radius_km=radius_km
            )
            if live_report and "executive_summary" in live_report:
                live_report["powered_by"] = "Google Gemini Flash (Live AI)"
                return live_report
        except Exception as e:
            print(f"[AI Memo] Gemini API call exception, falling back to Spatial AI model: {e}")

    # Deterministic Spatial Economist Model Fallback
    return _generate_spatial_analyst_report(
        locality_name=locality_name,
        business_type=business_type,
        score=score,
        cluster_info=cluster_info,
        features=features,
        google_intel=google_intel,
        radius_km=radius_km
    )


def _call_gemini_api(
    gemini_key: str,
    locality_name: str,
    business_type: str,
    score: float,
    cluster_info: Dict[str, Any],
    features: Dict[str, Any],
    google_intel: Dict[str, Any],
    radius_km: float
) -> Optional[Dict[str, Any]]:
    """Calls Gemini REST endpoint with strict JSON schema."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
    
    prompt = f"""You are a Principal Commercial Real Estate Director in Chennai.
Evaluate this candidate storefront site and return a strictly valid JSON Investment Memorandum.

INPUT METRICS:
- Locality: {locality_name} (Chennai, India)
- Business Category: {business_type}
- Algorithmic Suitability Score: {score:.1f}% (0-100 scale)
- Search Catchment Radius: {radius_km} km
- Economic Archetype: {cluster_info.get('name', 'Commercial Hub')} - {cluster_info.get('description', '')}
- Commercial Rent: {features.get('rent', 'Survey Median')} per sq.ft
- Transit Stops: {features.get('transit_stops', 0)} CMRL/MTC points
- Nearby Retail Shops: {features.get('shops', 0)}
- Google Places Intel: {google_intel.get('competitor_count', 0)} verified competitors, average rating {google_intel.get('avg_competitor_rating', 0.0)}/5.0

Respond ONLY with a JSON object conforming to this exact structure:
{{
  "verdict": "Strong Buy" | "Calibrated Opportunity" | "High Risk / Caution",
  "confidence_score": "88% Model Confidence",
  "executive_summary": "2-3 crisp sentences evaluating site viability and trade catchment.",
  "trade_demographics": {{
    "target_customer": "Primary demographic profile",
    "peak_hours": "Peak pedestrian and sales windows",
    "dwell_time": "Estimated customer dwell duration"
  }},
  "competitor_vulnerability": {{
    "saturation_level": "Low" | "Moderate" | "Intense",
    "market_gap": "Specific whitespace or service deficiency among existing rivals to exploit",
    "competitor_summary": "Summary of existing competitor landscape"
  }},
  "financial_guardrails": {{
    "target_rent_sqft": "e.g. ₹60 - ₹75 / sq.ft",
    "walk_away_ceiling_rent": "e.g. ₹90 / sq.ft",
    "estimated_payback_months": "e.g. 12 - 16 months",
    "breakeven_daily_transactions": "e.g. 90 - 120 customers/day"
  }},
  "strategic_risks": [
    {{"risk": "Specific risk", "mitigation": "How operator should mitigate"}}
  ],
  "action_checklist": [
    "Step 1 to do before lease signing",
    "Step 2 to inspect physically",
    "Step 3 lease clause to negotiate"
  ]
}}"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    with urllib.request.urlopen(req, timeout=8) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        candidate_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(candidate_text)


def _generate_spatial_analyst_report(
    locality_name: str,
    business_type: str,
    score: float,
    cluster_info: Dict[str, Any],
    features: Dict[str, Any],
    google_intel: Dict[str, Any],
    radius_km: float
) -> Dict[str, Any]:
    """
    Deterministic Spatial Economist synthesis engine.
    Calculates empirical financial guardrails, trade demographics, and competitor vulnerability.
    """
    btype = (business_type or "general").lower()
    raw_rent = features.get("rent")
    try:
        base_rent = float(raw_rent) if raw_rent and raw_rent != "N/A" else 65.0
    except (ValueError, TypeError):
        base_rent = 65.0

    cluster_name = cluster_info.get("name", "Commercial Hub")
    comp_count = google_intel.get("competitor_count", 0)
    avg_rating = google_intel.get("avg_competitor_rating", 0.0)

    # Calculate Verdict
    if score >= 82.0:
        verdict = "Strong Buy"
        conf = "91% High Conviction"
    elif score >= 68.0:
        verdict = "Calibrated Opportunity"
        conf = "83% Moderate Conviction"
    else:
        verdict = "High Risk / Caution"
        conf = "74% Conditional Conviction"

    # Business profile specific calculations
    profiles = {
        "restaurant": {
            "target": "Young professionals, tech workforce & evening residential diners",
            "peak": "1:00 PM – 3:30 PM (Lunch) & 7:30 PM – 11:00 PM (Dinner Surges)",
            "dwell": "35 – 55 minutes",
            "margin_rent_mult": 1.15,
            "payback": "12 – 16 months",
            "tx_factor": 110
        },
        "medical": {
            "target": "Multi-generational families, elderly residents & health-conscious commuters",
            "peak": "8:00 AM – 11:30 AM (Morning Diagnostic) & 5:00 PM – 8:30 PM (Consultations)",
            "dwell": "20 – 40 minutes",
            "margin_rent_mult": 1.25,
            "payback": "14 – 18 months",
            "tx_factor": 45
        },
        "laptop": {
            "target": "Tech students, freelance developers & enterprise repair clients",
            "peak": "11:30 AM – 2:00 PM & 5:00 PM – 8:30 PM (Post-work rush)",
            "dwell": "15 – 30 minutes",
            "margin_rent_mult": 1.1,
            "payback": "10 – 14 months",
            "tx_factor": 30
        },
        "mobile": {
            "target": "Impulse retail shoppers, transit commuters & upgrade buyers",
            "peak": "4:30 PM – 9:30 PM (Evening footfall corridors)",
            "dwell": "10 – 20 minutes",
            "margin_rent_mult": 1.2,
            "payback": "9 – 12 months",
            "tx_factor": 65
        },
        "automobile": {
            "target": "Commercial fleet operators, private car owners & daily highway commuters",
            "peak": "8:30 AM – 11:00 AM (Service drop-off) & 5:00 PM – 7:30 PM (Pick-up)",
            "dwell": "10 – 25 minutes",
            "margin_rent_mult": 0.85,
            "payback": "16 – 22 months",
            "tx_factor": 25
        },
        "stationery": {
            "target": "School students, competitive exam aspirants & institutional buyers",
            "peak": "8:00 AM – 9:30 AM & 3:30 PM – 6:30 PM (Academic release hours)",
            "dwell": "8 – 15 minutes",
            "margin_rent_mult": 0.95,
            "payback": "10 – 14 months",
            "tx_factor": 95
        }
    }

    prof = profiles.get(btype, profiles["restaurant"])

    target_min = round(base_rent * 0.9)
    target_max = round(base_rent * prof["margin_rent_mult"])
    walk_away = round(target_max * 1.28)

    # Competitor saturation synthesis
    if comp_count > 8:
        sat = "Intense"
        gap = "High competitor density forces differentiation on service velocity, modern storefront aesthetics, or digital delivery integration."
    elif comp_count >= 3:
        sat = "Moderate"
        gap = "Healthy customer gravity with evident white-space for specialized offerings and superior customer experience."
    else:
        sat = "Low"
        gap = "First-mover advantage in an underserved micro-catchment with minimal direct brand interference."

    return {
        "verdict": verdict,
        "confidence_score": conf,
        "executive_summary": (
            f"{locality_name} scores {score:.1f}% suitability for a {btype} format within a {radius_km} km radius. "
            f"Classified under '{cluster_name}', the site balances sustainable baseline footfall against manageable rental overhead. "
            f"Existing competitive presence ({comp_count} verified spots at {avg_rating:.1f}/5.0 avg) indicates validated demand with clear market headroom."
        ),
        "trade_demographics": {
            "target_customer": prof["target"],
            "peak_hours": prof["peak"],
            "dwell_time": prof["dwell"]
        },
        "competitor_vulnerability": {
            "saturation_level": sat,
            "market_gap": gap,
            "competitor_summary": f"{comp_count} direct competitors detected in immediate radial boundary with average market rating of {avg_rating:.1f} / 5.0."
        },
        "financial_guardrails": {
            "target_rent_sqft": f"₹{target_min} – ₹{target_max} / sq.ft",
            "walk_away_ceiling_rent": f"₹{walk_away} / sq.ft",
            "estimated_payback_months": prof["payback"],
            "breakeven_daily_transactions": f"{prof['tx_factor']} – {round(prof['tx_factor'] * 1.35)} orders / day"
        },
        "strategic_risks": [
            {
                "risk": "Peak-Hour Frontage Congestion & Parking Friction",
                "mitigation": "Secure designated two-wheeler parking frontage or negotiate shared bays with neighboring commercial lots."
            },
            {
                "risk": "Utility & Power Load Escalation",
                "mitigation": "Mandate commercial 3-phase power load (min 15-20 kW) and DG backup allowance explicitly in the LOI."
            },
            {
                "risk": "Rental Rate Creep on Year-2 Renewal",
                "mitigation": "Cap annual rent escalations strictly at 5% per annum with a mandatory 3-year lock-in period."
            }
        ],
        "action_checklist": [
            "Conduct physical footfall tally on 1 weekday evening (7-9 PM) and 1 Sunday afternoon",
            "Verify clear frontage visibility from primary arterial road without tree or hoarding obstruction",
            "Validate commercial zoning occupancy certificate (Form C) with Chennai Corporation before signing"
        ],
        "powered_by": "Locus Spatial AI Engine (Deterministic Economist Model)"
    }
