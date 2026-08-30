"""
db.py — MongoDB Atlas persistence layer
Tables: patients, sessions
"""

import hashlib
import os
from datetime import date, datetime
from typing import Optional, Dict, Any, List
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file in the project root
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# MongoDB Atlas connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "speech_recovery")

# Initialize MongoDB client
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]
patients_collection = db["patients"]
sessions_collection = db["sessions"]

# Create indexes for better performance
patients_collection.create_index("patient_id", unique=True)
patients_collection.create_index("mobile_number", unique=True, sparse=True)
sessions_collection.create_index("patient_id")
sessions_collection.create_index("recorded_at")
sessions_collection.create_index([("patient_id", 1), ("recorded_at", -1)])


# ── Password hashing ──────────────────────────────────────────────────────────

def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return salt.hex() + ":" + key.hex()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt_hex, key_hex = password_hash.split(":")
        salt = bytes.fromhex(salt_hex)
        key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
        return key.hex() == key_hex
    except Exception:
        return False


# Backward-compat alias (old PIN-based patients)
def verify_pin(pin: str, pin_hash: str) -> bool:
    return verify_password(pin, pin_hash)


# ── Patients ──────────────────────────────────────────────────────────────────

def create_patient(
    patient_id: str,
    first_name: str,
    last_name: str,
    mobile_number: str,
    password: str,
    therapy_stage: str,
) -> None:
    today = date.today().isoformat()
    fullname = f"{first_name} {last_name}".strip()
    
    patient_doc = {
        "patient_id": patient_id,
        "name": fullname,
        "first_name": first_name,
        "last_name": last_name,
        "mobile_number": mobile_number,
        "password_hash": _hash_password(password),
        "pin_hash": "",  # Legacy field for backward compatibility
        "therapy_stage": therapy_stage,
        "surgery_date": today,
        "created_at": datetime.utcnow().isoformat(),
    }
    
    try:
        patients_collection.insert_one(patient_doc)
    except DuplicateKeyError:
        raise Exception("Patient ID or mobile number already exists")


def patient_id_exists(patient_id: str) -> bool:
    return patients_collection.count_documents({"patient_id": patient_id}) > 0


def mobile_exists(mobile_number: str) -> bool:
    return patients_collection.count_documents({"mobile_number": mobile_number}) > 0


def get_patient(patient_id: str) -> Optional[Dict[str, Any]]:
    patient = patients_collection.find_one({"patient_id": patient_id})
    if patient:
        patient.pop("_id", None)  # Remove MongoDB's _id field
    return patient


def get_patient_by_mobile(mobile_number: str) -> Optional[Dict[str, Any]]:
    patient = patients_collection.find_one({"mobile_number": mobile_number})
    if patient:
        patient.pop("_id", None)
    return patient


def patient_display_name(patient: Dict[str, Any]) -> str:
    """Prefer first+last; fall back to legacy name column."""
    parts = f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip()
    return parts or patient.get("name", "")


def patient_day_number(created_at: str) -> int:
    """Days elapsed since the patient registered (Day 1 = registration day)."""
    try:
        d = date.fromisoformat(created_at[:10])
        return max(1, (date.today() - d).days + 1)
    except Exception:
        return 1


# ── Sessions ──────────────────────────────────────────────────────────────────

def save_session(patient_id: str, result: dict, duration_s: float) -> str:
    patient = get_patient(patient_id)
    if not patient:
        raise ValueError(f"Patient {patient_id} not found")

    import uuid
    session_id = uuid.uuid4().hex[:12]
    day_number = patient_day_number(patient["created_at"])

    session_doc = {
        "session_id": session_id,
        "patient_id": patient_id,
        "recorded_at": datetime.utcnow().isoformat(),
        "day_number": day_number,
        "duration_s": round(duration_s, 3),
        "vocal_clarity_prob": result["voice_quality_prob"],
        "fluency_prob": result["stuttering_prob"],
        "articulation_prob": result["dysarthria_prob"],
        "severity_score": result["severity_score"],
        "severity_label": result["severity_label"],
        "is_healthy": int(result["is_healthy"]),
        "primary_disorder": result["primary_disorder"],
        "message": result["message"],
    }
    
    sessions_collection.insert_one(session_doc)
    return session_id


def get_sessions(patient_id: str) -> List[Dict[str, Any]]:
    sessions = sessions_collection.find(
        {"patient_id": patient_id}
    ).sort("recorded_at", -1)
    
    result = []
    for session in sessions:
        session.pop("_id", None)
        result.append(session)
    return result


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    session = sessions_collection.find_one({"session_id": session_id})
    if session:
        session.pop("_id", None)
    return session


def get_progress(patient_id: str) -> List[Dict[str, Any]]:
    """Daily averages for the trend chart."""
    pipeline = [
        {"$match": {"patient_id": patient_id}},
        {"$group": {
            "_id": "$day_number",
            "vocal_clarity": {"$avg": "$vocal_clarity_prob"},
            "fluency": {"$avg": "$fluency_prob"},
            "articulation": {"$avg": "$articulation_prob"},
            "severity": {"$avg": "$severity_score"},
            "session_count": {"$sum": 1}
        }},
        {"$project": {
            "day_number": "$_id",
            "vocal_clarity": {"$round": ["$vocal_clarity", 4]},
            "fluency": {"$round": ["$fluency", 4]},
            "articulation": {"$round": ["$articulation", 4]},
            "severity": {"$round": ["$severity", 4]},
            "session_count": 1,
            "_id": 0
        }},
        {"$sort": {"day_number": 1}}
    ]
    
    result = list(sessions_collection.aggregate(pipeline))
    return result


# ── Database initialization ─────────────────────────────────────────────────

def init_db() -> None:
    """Initialize the database (create collections and indexes)."""
    # Create indexes if they don't exist
    patients_collection.create_index("patient_id", unique=True)
    patients_collection.create_index("mobile_number", unique=True, sparse=True)
    sessions_collection.create_index("patient_id")
    sessions_collection.create_index("recorded_at")
    sessions_collection.create_index([("patient_id", 1), ("recorded_at", -1)])
    print("MongoDB Atlas connected and indexes created successfully")