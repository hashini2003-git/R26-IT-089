"""
db.py — SQLite persistence layer
Tables: patients
"""

import hashlib
import os
import sqlite3
from datetime import date, datetime
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "app.db"

<<<<<<< Updated upstream

# ── Connection ────────────────────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


# ── Schema ────────────────────────────────────────────────────────────────────

def init_db() -> None:
    conn = get_db()
    # Create patients table
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS patients (
            patient_id     TEXT PRIMARY KEY,
            name           TEXT NOT NULL DEFAULT '',
            first_name     TEXT NOT NULL DEFAULT '',
            last_name      TEXT NOT NULL DEFAULT '',
            mobile_number  TEXT,
            password_hash  TEXT,
            therapy_stage  TEXT NOT NULL DEFAULT 'in',
            surgery_date   TEXT NOT NULL,
            created_at     TEXT NOT NULL
        );
    """)
    # Add columns if they don't exist (for backwards compatibility)
    for col, defn in [
        ("first_name",    "TEXT NOT NULL DEFAULT ''"),
        ("last_name",     "TEXT NOT NULL DEFAULT ''"),
        ("mobile_number", "TEXT"),
        ("password_hash", "TEXT"),
        ("therapy_stage", "TEXT NOT NULL DEFAULT 'in'"),
    ]:
        try:
            conn.execute(f"ALTER TABLE patients ADD COLUMN {col} {defn}")
        except Exception:
            pass  # already exists
    conn.commit()
    conn.close()
=======
# MongoDB Atlas connection
MONGODB_URI = (os.getenv("MONGODB_URI") or "").strip()
DATABASE_NAME = os.getenv("DATABASE_NAME", "speech_recovery")

# MongoDB is used when configured. The memory fallback keeps local development
# available without changing production persistence behavior.
client = None
db = None
patients_collection = None
_memory_patients: dict[str, Dict[str, Any]] = {}

if MONGODB_URI:
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        db = client[DATABASE_NAME]
        patients_collection = db["patients"]
        patients_collection.create_index("patient_id", unique=True)
        patients_collection.create_index("mobile_number", unique=True, sparse=True)
    except Exception as exc:
        print(f"MongoDB unavailable; using temporary in-memory authentication: {exc}")
        client = None
        db = None
        patients_collection = None
>>>>>>> Stashed changes


# ── Password hashing ──────────────────────────────────────────────────────────

def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    key  = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return salt.hex() + ":" + key.hex()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt_hex, key_hex = password_hash.split(":")
        salt = bytes.fromhex(salt_hex)
        key  = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
        return key.hex() == key_hex
    except Exception:
        return False


# ── Patients ──────────────────────────────────────────────────────────────────

def create_patient(
    patient_id:    str,
    first_name:    str,
    last_name:     str,
    mobile_number: str,
    password:      str,
    therapy_stage: str,
) -> None:
    today    = date.today().isoformat()
    fullname = f"{first_name} {last_name}".strip()
<<<<<<< Updated upstream
    conn     = get_db()
    conn.execute(
        """INSERT INTO patients
               (patient_id, name, first_name, last_name, mobile_number,
                password_hash, therapy_stage, surgery_date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            patient_id, fullname, first_name, last_name, mobile_number,
            _hash_password(password), therapy_stage, today,
            datetime.utcnow().isoformat(),
        ),
    )
    conn.commit()
    conn.close()


def patient_id_exists(patient_id: str) -> bool:
    conn = get_db()
    row  = conn.execute(
        "SELECT 1 FROM patients WHERE patient_id = ?", (patient_id,)
    ).fetchone()
    conn.close()
    return row is not None


def mobile_exists(mobile_number: str) -> bool:
    conn = get_db()
    row  = conn.execute(
        "SELECT 1 FROM patients WHERE mobile_number = ?", (mobile_number,)
    ).fetchone()
    conn.close()
    return row is not None


def get_patient(patient_id: str) -> dict | None:
    conn = get_db()
    row  = conn.execute(
        "SELECT * FROM patients WHERE patient_id = ?", (patient_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def get_patient_by_mobile(mobile_number: str) -> dict | None:
    conn = get_db()
    row  = conn.execute(
        "SELECT * FROM patients WHERE mobile_number = ?", (mobile_number,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None
=======
    
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
    
    if patients_collection is None:
        if patient_id_exists(patient_id) or mobile_exists(mobile_number):
            raise Exception("Patient ID or mobile number already exists")
        _memory_patients[patient_id] = patient_doc
        return
    try:
        patients_collection.insert_one(patient_doc)
    except DuplicateKeyError:
        raise Exception("Patient ID or mobile number already exists")


def patient_id_exists(patient_id: str) -> bool:
    if patients_collection is None:
        return patient_id in _memory_patients
    return patients_collection.count_documents({"patient_id": patient_id}) > 0


def mobile_exists(mobile_number: str) -> bool:
    if patients_collection is None:
        return any(patient.get("mobile_number") == mobile_number for patient in _memory_patients.values())
    return patients_collection.count_documents({"mobile_number": mobile_number}) > 0


def get_patient(patient_id: str) -> Optional[Dict[str, Any]]:
    if patients_collection is None:
        patient = _memory_patients.get(patient_id)
        return dict(patient) if patient else None
    patient = patients_collection.find_one({"patient_id": patient_id})
    if patient:
        # Remove MongoDB's _id field for cleaner output
        patient.pop("_id", None)
    return patient


def get_patient_by_mobile(mobile_number: str) -> Optional[Dict[str, Any]]:
    if patients_collection is None:
        patient = next((item for item in _memory_patients.values() if item.get("mobile_number") == mobile_number), None)
        return dict(patient) if patient else None
    patient = patients_collection.find_one({"mobile_number": mobile_number})
    if patient:
        patient.pop("_id", None)
    return patient
>>>>>>> Stashed changes


def patient_display_name(patient: dict) -> str:
    """Prefer first+last; fall back to legacy name column."""
    parts = f"{patient.get('first_name','')} {patient.get('last_name','')}".strip()
    return parts or patient.get("name", "")


def patient_day_number(created_at: str) -> int:
    """Days elapsed since the patient registered (Day 1 = registration day)."""
    try:
        d = date.fromisoformat(created_at[:10])
        return max(1, (date.today() - d).days + 1)
    except Exception:
<<<<<<< Updated upstream
        return 1
=======
        return 1


# ── Database initialization ─────────────────────────────────────────────────

def init_db() -> None:
    """Initialize the database (create collections and indexes)."""
    if patients_collection is None:
        print("MongoDB not configured; using temporary in-memory authentication")
        return
    # Create indexes if they don't exist
    patients_collection.create_index("patient_id", unique=True)
    patients_collection.create_index("mobile_number", unique=True, sparse=True)
    print("MongoDB Atlas connected and indexes created successfully")
>>>>>>> Stashed changes
