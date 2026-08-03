"""
db.py — MongoDB Atlas persistence layer
Tables: patients
"""

import hashlib
import os
from datetime import date, datetime
from typing import Optional, Dict, Any
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MongoDB Atlas connection
MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "speech_recovery")

# Initialize MongoDB client
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]
patients_collection = db["patients"]

# Create indexes for better performance
patients_collection.create_index("patient_id", unique=True)
patients_collection.create_index("mobile_number", unique=True, sparse=True)


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
        # Remove MongoDB's _id field for cleaner output
        patient.pop("_id", None)
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


# ── Database initialization ─────────────────────────────────────────────────

def init_db() -> None:
    """Initialize the database (create collections and indexes)."""
    # Create indexes if they don't exist
    patients_collection.create_index("patient_id", unique=True)
    patients_collection.create_index("mobile_number", unique=True, sparse=True)
    print("MongoDB Atlas connected and indexes created successfully")