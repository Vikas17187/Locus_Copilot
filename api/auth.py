"""
JWT Token handling for Locus Copilot
"""

import os
import jwt
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional

logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("LOCUS_SECRET_KEY", "locus_copilot_demo_secret_change_me")
if os.getenv("VERCEL") and SECRET_KEY == "locus_copilot_demo_secret_change_me":
    logger.warning("WARNING: Vercel production environment detected but fallback SECRET_KEY is active. Please configure LOCUS_SECRET_KEY!")

ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 24

def create_token(user_id: int, email: str, is_admin: bool = False) -> str:
    """Create JWT token"""
    now_utc = datetime.now(timezone.utc)
    payload = {
        "user_id": user_id,
        "email": email,
        "is_admin": is_admin,
        "exp": now_utc + timedelta(hours=TOKEN_EXPIRY_HOURS),
        "iat": now_utc
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token


def verify_token(token: str) -> Optional[Dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def extract_token_from_header(auth_header: str) -> Optional[str]:
    """Extract token from Authorization header"""
    if not auth_header:
        return None
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]
