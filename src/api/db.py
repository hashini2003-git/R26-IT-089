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
        return 1