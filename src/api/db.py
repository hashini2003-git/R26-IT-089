"""MongoDB persistence for patients and vocal-therapy sessions."""

from __future__ import annotations

import hashlib
import os
import uuid
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any, Optional

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError


load_dotenv()

MONGODB_URI = (os.getenv("MONGODB_URI") or "").strip()
DATABASE_NAME = os.getenv("DATABASE_NAME", "speech_recovery")

client = None
db = None
patients_collection = None
sessions_collection = None

_memory_patients: dict[str, dict[str, Any]] = {}
_memory_sessions: dict[str, dict[str, Any]] = {}

if MONGODB_URI:
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        db = client[DATABASE_NAME]
        patients_collection = db["patients"]
        sessions_collection = db["sessions"]
    except Exception as exc:
        print(f"MongoDB unavailable; using temporary in-memory storage: {exc}")
        client = None
        db = None
        patients_collection = None
        sessions_collection = None


def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return f"{salt.hex()}:{key.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt_hex, key_hex = password_hash.split(":", 1)
        key = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), 100_000
        )
        return key.hex() == key_hex
    except (AttributeError, TypeError, ValueError):
        return False


def verify_pin(pin: str, pin_hash: str) -> bool:
    return verify_password(pin, pin_hash)


def create_patient(
    patient_id: str,
    first_name: str,
    last_name: str,
    mobile_number: str,
    password: str,
    therapy_stage: str,
) -> None:
    today = date.today().isoformat()
    patient = {
        "patient_id": patient_id,
        "name": f"{first_name} {last_name}".strip(),
        "first_name": first_name,
        "last_name": last_name,
        "mobile_number": mobile_number,
        "password_hash": _hash_password(password),
        "therapy_stage": therapy_stage,
        "surgery_date": today,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if patients_collection is None:
        if patient_id_exists(patient_id) or mobile_exists(mobile_number):
            raise ValueError("Patient ID or mobile number already exists")
        _memory_patients[patient_id] = patient
        return

    try:
        patients_collection.insert_one(patient)
    except DuplicateKeyError as exc:
        raise ValueError("Patient ID or mobile number already exists") from exc


def patient_id_exists(patient_id: str) -> bool:
    if patients_collection is None:
        return patient_id in _memory_patients
    return patients_collection.count_documents({"patient_id": patient_id}, limit=1) > 0


def mobile_exists(mobile_number: str) -> bool:
    if patients_collection is None:
        return any(
            patient.get("mobile_number") == mobile_number
            for patient in _memory_patients.values()
        )
    return patients_collection.count_documents(
        {"mobile_number": mobile_number}, limit=1
    ) > 0


def _clean_document(document: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    if document is None:
        return None
    result = dict(document)
    result.pop("_id", None)
    return result


def get_patient(patient_id: str) -> Optional[dict[str, Any]]:
    if patients_collection is None:
        return _clean_document(_memory_patients.get(patient_id))
    return _clean_document(patients_collection.find_one({"patient_id": patient_id}))


def get_patient_by_mobile(mobile_number: str) -> Optional[dict[str, Any]]:
    if patients_collection is None:
        patient = next(
            (
                item
                for item in _memory_patients.values()
                if item.get("mobile_number") == mobile_number
            ),
            None,
        )
        return _clean_document(patient)
    return _clean_document(
        patients_collection.find_one({"mobile_number": mobile_number})
    )


def patient_display_name(patient: dict[str, Any]) -> str:
    parts = f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip()
    return parts or str(patient.get("name", ""))


def patient_day_number(created_at: str) -> int:
    try:
        registered = date.fromisoformat(created_at[:10])
        return max(1, (date.today() - registered).days + 1)
    except (TypeError, ValueError):
        return 1


def save_session(patient_id: str, result: dict[str, Any], duration_s: float) -> str:
    patient = get_patient(patient_id)
    if not patient:
        raise ValueError(f"Patient {patient_id} not found")

    session_id = uuid.uuid4().hex[:12]
    session = {
        "session_id": session_id,
        "patient_id": patient_id,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "day_number": patient_day_number(str(patient.get("created_at", ""))),
        "duration_s": round(duration_s, 3),
        "vocal_clarity_prob": result["voice_quality_prob"],
        "fluency_prob": result["stuttering_prob"],
        "articulation_prob": result["dysarthria_prob"],
        "severity_score": result["severity_score"],
        "severity_label": result["severity_label"],
        "is_healthy": bool(result["is_healthy"]),
        "primary_disorder": result["primary_disorder"],
        "message": result["message"],
    }

    if sessions_collection is None:
        _memory_sessions[session_id] = session
    else:
        sessions_collection.insert_one(session)
    return session_id


def get_sessions(patient_id: str) -> list[dict[str, Any]]:
    if sessions_collection is None:
        rows = [
            _clean_document(item)
            for item in _memory_sessions.values()
            if item.get("patient_id") == patient_id
        ]
        return sorted(
            (row for row in rows if row is not None),
            key=lambda row: str(row.get("recorded_at", "")),
            reverse=True,
        )
    return [
        _clean_document(row) or {}
        for row in sessions_collection.find({"patient_id": patient_id}).sort(
            "recorded_at", -1
        )
    ]


def get_session(session_id: str) -> Optional[dict[str, Any]]:
    if sessions_collection is None:
        return _clean_document(_memory_sessions.get(session_id))
    return _clean_document(
        sessions_collection.find_one({"session_id": session_id})
    )


def get_progress(patient_id: str) -> list[dict[str, Any]]:
    grouped: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for session in get_sessions(patient_id):
        grouped[int(session["day_number"])].append(session)

    progress = []
    for day_number, rows in sorted(grouped.items()):
        count = len(rows)
        progress.append(
            {
                "day_number": day_number,
                "vocal_clarity": round(
                    sum(float(row["vocal_clarity_prob"]) for row in rows) / count, 4
                ),
                "fluency": round(
                    sum(float(row["fluency_prob"]) for row in rows) / count, 4
                ),
                "articulation": round(
                    sum(float(row["articulation_prob"]) for row in rows) / count, 4
                ),
                "severity": round(
                    sum(float(row["severity_score"]) for row in rows) / count, 4
                ),
                "session_count": count,
            }
        )
    return progress


def init_db() -> None:
    if patients_collection is None or sessions_collection is None:
        print("MongoDB not configured; using temporary in-memory storage")
        return
    patients_collection.create_index("patient_id", unique=True)
    patients_collection.create_index("mobile_number", unique=True, sparse=True)
    sessions_collection.create_index("session_id", unique=True)
    sessions_collection.create_index([("patient_id", 1), ("recorded_at", -1)])
    print("MongoDB Atlas connected and indexes created successfully")
