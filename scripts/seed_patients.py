"""
scripts/seed_patients.py — Create test patients in the SQLite database.

Usage:
    make seed
    # or directly:
    python scripts/seed_patients.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.api.db import create_patient, init_db

# ── Test patients ─────────────────────────────────────────────────────────────
# Format: (patient_id, pin, name, surgery_date)
PATIENTS = [
    ("OC-0001", "1234", "Amara Perera",    "2026-03-01"),
    ("OC-0002", "5678", "Nuwan Silva",     "2026-02-15"),
    ("OC-0003", "9012", "Dilani Fernando", "2026-03-10"),
    ("OC-0004", "3456", "Kasun Rajapaksa", "2026-03-20"),
]

if __name__ == "__main__":
    init_db()
    print("Seeding patients...\n")
    for pid, pin, name, surgery_date in PATIENTS:
        try:
            create_patient(pid, pin, name, surgery_date)
            print(f"  [OK] {pid}  {name:<20}  PIN: {pin}  Surgery: {surgery_date}")
        except Exception as e:
            print(f"  [--] {pid}  already exists or error: {e}")
    print("\nDone. Use these credentials to log in:")
    print("  Patient ID: OC-0001   PIN: 1234")
