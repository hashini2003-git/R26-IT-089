"""
main.py — Authentication Service (FastAPI)

Endpoints:
  POST /auth/register  Register new patient
  POST /auth/login     Patient login → JWT token
"""

import logging
import random
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.api.auth import create_token
from src.api.db import (
    create_patient,
    get_patient_by_mobile,
    init_db,
    mobile_exists,
    patient_display_name,
    patient_id_exists,
    patient_day_number,
    verify_password,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Authentication Service",
    description="User authentication for Oral Cancer Speech Recovery",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    first_name:    str
    last_name:     str
    mobile_number: str
    password:      str   # at least 8 characters
    therapy_stage: str   # "pre" | "in" | "post"


class RegisterResponse(BaseModel):
    token:         str
    patient_id:    str
    name:          str
    surgery_date:  str
    day_number:    int
    therapy_stage: str


class LoginRequest(BaseModel):
    mobile_number: str
    password:      str


class LoginResponse(BaseModel):
    token:        str
    patient_id:   str
    name:         str
    surgery_date: str
    day_number:   int


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/auth/register", response_model=RegisterResponse, status_code=201)
def register(body: RegisterRequest):
    if not body.first_name.strip() or not body.last_name.strip():
        raise HTTPException(status_code=422, detail="First name and last name are required")
    if not body.mobile_number.strip():
        raise HTTPException(status_code=422, detail="Mobile number is required")
    if len(body.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    if body.therapy_stage not in ("pre", "in", "post"):
        raise HTTPException(status_code=422, detail="Therapy stage must be pre, in, or post")
    if mobile_exists(body.mobile_number.strip()):
        raise HTTPException(status_code=409, detail="An account with this mobile number already exists")

    # Generate a unique patient ID: OC-XXXX
    for _ in range(20):
        candidate = f"OC-{random.randint(1000, 9999)}"
        if not patient_id_exists(candidate):
            patient_id = candidate
            break
    else:
        raise HTTPException(status_code=500, detail="Could not generate unique Patient ID")

    try:
        create_patient(
            patient_id    = patient_id,
            first_name    = body.first_name.strip(),
            last_name     = body.last_name.strip(),
            mobile_number = body.mobile_number.strip(),
            password      = body.password,
            therapy_stage = body.therapy_stage,
        )
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

    from datetime import date as _date
    today = _date.today().isoformat()
    name  = f"{body.first_name.strip()} {body.last_name.strip()}"
    return RegisterResponse(
        token         = create_token(patient_id),
        patient_id    = patient_id,
        name          = name,
        surgery_date  = today,
        day_number    = 1,
        therapy_stage = body.therapy_stage,
    )


@app.post("/auth/login", response_model=LoginResponse)
def login(body: LoginRequest):
    patient = get_patient_by_mobile(body.mobile_number.strip())
    if not patient or not patient.get("password_hash") or \
            not verify_password(body.password, patient["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid mobile number or password")
    return LoginResponse(
        token        = create_token(patient["patient_id"]),
        patient_id   = patient["patient_id"],
        name         = patient_display_name(patient),
        surgery_date = patient["surgery_date"],
        day_number   = patient_day_number(patient["created_at"]),
    )