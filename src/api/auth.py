"""
auth.py — JWT token creation and verification
"""

import os
from datetime import datetime, timedelta, timezone

import jwt

SECRET_KEY  = os.getenv("JWT_SECRET", "oc-speech-tracker-secret-2026")
ALGORITHM   = "HS256"
EXPIRE_DAYS = 30


def create_token(patient_id: str) -> str:
    payload = {
        "patient_id": patient_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=EXPIRE_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("patient_id")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
