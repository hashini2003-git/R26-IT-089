"""
scripts/seed_sessions.py — Seed realistic demo sessions for a test patient.

Creates a demo patient (if not already present) and inserts 30 sessions
spread across the past 30 days, simulating a realistic recovery arc:
  Days 1-6  : severe concern (post-surgery) → voice_quality_prob very high
  Days 7-14 : moderate concern              → probs dropping
  Days 15-22: mild improvement              → approaching healthy
  Days 23-30: healthy range                 → mostly healthy

Usage:
    python scripts/seed_sessions.py
    python scripts/seed_sessions.py --patient-id OC-DEMO1 --reset
"""

import argparse
import random
import sqlite3
import sys
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.api.db import (
    DB_PATH,
    create_patient,
    get_db,
    init_db,
    mobile_exists,
    patient_id_exists,
)

# ── Demo patient ──────────────────────────────────────────────────────────────

DEMO = {
    "patient_id":    "OC-DEMO1",
    "first_name":    "Amara",
    "last_name":     "Perera",
    "mobile_number": "+94771234567",
    "password":      "demo1234",
    "therapy_stage": "post",
}

# ── Recovery arc (30 sessions over 30 days) ───────────────────────────────────
# Each tuple: (voice_quality_prob, stuttering_prob, dysarthria_prob, duration_s)
# Higher prob = more disordered.  Recovery: probs fall over time.

RECOVERY_ARC = [
    # Day 1-3  (immediate post-surgery, severe concern)
    (0.88, 0.62, 0.79, 6.1),
    (0.85, 0.66, 0.76, 5.8),
    (0.83, 0.58, 0.73, 6.9),
    # Day 4-6  (still severe)
    (0.80, 0.60, 0.70, 7.2),
    (0.78, 0.56, 0.68, 6.5),
    (0.75, 0.54, 0.65, 7.0),
    # Day 7-10 (moderate-severe)
    (0.70, 0.50, 0.62, 7.5),
    (0.68, 0.48, 0.59, 7.8),
    (0.65, 0.45, 0.56, 8.1),
    (0.62, 0.43, 0.54, 8.4),
    # Day 11-14 (moderate, therapy taking hold)
    (0.58, 0.40, 0.50, 8.4),
    (0.55, 0.38, 0.47, 8.7),
    (0.52, 0.35, 0.44, 9.0),
    (0.49, 0.33, 0.41, 9.3),
    # Day 15-18 (mild-moderate transition)
    (0.44, 0.30, 0.38, 9.6),
    (0.40, 0.28, 0.35, 9.8),
    (0.37, 0.25, 0.32, 10.1),
    (0.34, 0.23, 0.29, 10.3),
    # Day 19-22 (mild concern)
    (0.30, 0.20, 0.26, 10.5),
    (0.27, 0.18, 0.23, 10.7),
    (0.24, 0.16, 0.20, 11.0),
    (0.21, 0.14, 0.18, 11.2),
    # Day 23-26 (approaching healthy)
    (0.18, 0.13, 0.15, 11.4),
    (0.16, 0.11, 0.13, 11.6),
    (0.14, 0.10, 0.11, 11.9),
    (0.12, 0.09, 0.10, 12.0),
    # Day 27-30 (healthy range)
    (0.10, 0.08, 0.08, 12.1),
    (0.09, 0.07, 0.07, 12.3),
    (0.08, 0.07, 0.06, 12.5),
    (0.07, 0.06, 0.06, 12.8),
]


def _severity(vq: float, st: float, dy: float):
    """Mirror the server-side severity logic."""
    worst = max(vq, st, dy)
    if worst < 0.35:
        return 0.1, "none", True, "healthy", "Speech within the normal recovery range."
    elif worst < 0.55:
        score = round(worst * 0.7, 3)
        return score, "mild", False, (
            "parkinsons" if vq >= st and vq >= dy else
            "stuttering"  if st >= dy else "dysarthria"
        ), "Mild vocal concern detected. Keep attending therapy sessions."
    elif worst < 0.75:
        score = round(worst * 0.85, 3)
        label = (
            "parkinsons" if vq >= st and vq >= dy else
            "stuttering"  if st >= dy else "dysarthria"
        )
        return score, "moderate", False, label, "Moderate speech concern. Continue exercises as advised."
    else:
        score = round(worst * 1.0, 3)
        label = (
            "parkinsons" if vq >= st and vq >= dy else
            "stuttering"  if st >= dy else "dysarthria"
        )
        return score, "severe", False, label, "Significant vocal concern. Please discuss with your clinician."


def seed_sessions(patient_id: str, reset: bool = False) -> None:
    conn = get_db()

    if reset:
        conn.execute("DELETE FROM sessions WHERE patient_id = ?", (patient_id,))
        conn.commit()
        print(f"  [reset] Cleared existing sessions for {patient_id}")

    today = date.today()
    inserted = 0

    for i, (vq, st, dy, dur) in enumerate(RECOVERY_ARC):
        # Add small jitter so charts look natural
        vq2 = round(max(0.05, min(0.99, vq + random.uniform(-0.03, 0.03))), 4)
        st2 = round(max(0.05, min(0.99, st + random.uniform(-0.03, 0.03))), 4)
        dy2 = round(max(0.05, min(0.99, dy + random.uniform(-0.03, 0.03))), 4)
        dur2 = round(dur + random.uniform(-0.5, 0.5), 2)

        sev_score, sev_label, is_healthy, primary, message = _severity(vq2, st2, dy2)

        session_id  = uuid.uuid4().hex[:12]
        day_number  = i + 1
        recorded_at = (today - timedelta(days=29 - i)).isoformat() + "T09:00:00"

        try:
            conn.execute(
                """INSERT INTO sessions (
                       session_id, patient_id, recorded_at, day_number, duration_s,
                       vocal_clarity_prob, fluency_prob, articulation_prob,
                       severity_score, severity_label, is_healthy, primary_disorder, message
                   ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    session_id, patient_id, recorded_at, day_number, dur2,
                    vq2, st2, dy2,
                    sev_score, sev_label, int(is_healthy), primary, message,
                ),
            )
            status = "✅ healthy" if is_healthy else f"⚠️ {sev_label}"
            print(f"  Day {day_number:2d}  {status:<15}  vq={vq2:.2f} st={st2:.2f} dy={dy2:.2f}")
            inserted += 1
        except sqlite3.IntegrityError as e:
            print(f"  [skip] Day {day_number}: {e}")

    conn.commit()
    conn.close()
    print(f"\n  {inserted} sessions seeded for patient {patient_id}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed demo sessions")
    parser.add_argument("--patient-id", default=DEMO["patient_id"],
                        help="Patient ID to seed sessions for (default: OC-DEMO1)")
    parser.add_argument("--reset", action="store_true",
                        help="Delete existing sessions for this patient before seeding")
    args = parser.parse_args()

    init_db()

    # Create demo patient if it doesn't exist
    if not patient_id_exists(DEMO["patient_id"]):
        if mobile_exists(DEMO["mobile_number"]):
            print(f"  [--] Mobile {DEMO['mobile_number']} already registered under a different ID")
        else:
            # Backdate created_at so day numbers work correctly
            # (patient was "registered" 30 days ago)
            fourteen_days_ago = (date.today() - timedelta(days=29)).isoformat()
            conn = get_db()
            import hashlib, os
            def _hash(pw):
                salt = os.urandom(16)
                key  = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, 100_000)
                return salt.hex() + ":" + key.hex()

            conn.execute(
                """INSERT INTO patients
                       (patient_id, name, first_name, last_name, mobile_number,
                        password_hash, therapy_stage, surgery_date, created_at, pin_hash)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    DEMO["patient_id"],
                    f"{DEMO['first_name']} {DEMO['last_name']}",
                    DEMO["first_name"],
                    DEMO["last_name"],
                    DEMO["mobile_number"],
                    _hash(DEMO["password"]),
                    DEMO["therapy_stage"],
                    fourteen_days_ago,
                    datetime.utcnow().isoformat(),
                    "",
                ),
            )
            conn.commit()
            conn.close()
            print(f"  [created] Demo patient {DEMO['patient_id']} · {DEMO['first_name']} {DEMO['last_name']}")
            print(f"            Mobile: {DEMO['mobile_number']}  Password: {DEMO['password']}")
    else:
        print(f"  [exists] Patient {DEMO['patient_id']} already in DB — skipping creation")

    print(f"\nSeeding sessions for {args.patient_id}...\n")
    seed_sessions(args.patient_id, reset=args.reset)

    print(
        f"\nLogin credentials:\n"
        f"  Mobile:   {DEMO['mobile_number']}\n"
        f"  Password: {DEMO['password']}\n"
    )


if __name__ == "__main__":
    random.seed(42)
    main()
