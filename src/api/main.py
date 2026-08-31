"""
main.py — Oral Cancer Speech Recovery API  (FastAPI)

Endpoints:
  POST /auth/login       Patient ID + PIN → JWT token
  GET  /me               Current patient info (auth required)
  POST /analyze          Voice analysis (saves session if authenticated)
  GET  /sessions         Session history (auth required)
  GET  /sessions/{id}    Single session (auth required)
  GET  /progress         30-day trend data (auth required)
  GET  /health           Health check
"""

import io
import json
import logging
import random
import tempfile
from pathlib import Path
from typing import Optional

import joblib
import librosa
import numpy as np
import parselmouth
import soundfile as sf
import torch
import torch.nn as nn
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from transformers import AutoModel, AutoTokenizer
from fastapi.middleware.cors import CORSMiddleware
from parselmouth.praat import call
from pydantic import BaseModel
from src.api.model import load_model

from src.api.auth import create_token
from src.risk_voice.main import router as risk_voice_router

from src.api.db import (
    create_patient,
    get_patient,
    get_patient_by_mobile,
    get_progress,
    get_session,
    get_sessions,
    init_db,
    mobile_exists,
    patient_day_number,
    patient_display_name,
    patient_id_exists,
    save_session,
    verify_password,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Oral Cancer Speech Recovery API",
    description="Track speech recovery progress for oral cancer patients.",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(risk_voice_router, prefix="/risk-voice", tags=["risk-voice"])

# Initialize MongoDB connection
init_db()


@app.on_event("startup")
async def start_risk_voice_database() -> None:
    try:
        await connect_risk_voice_database()
    except Exception as exc:
        logger.warning("Risk/voice MongoDB connection unavailable; using memory fallback: %s", exc)


@app.on_event("shutdown")
async def stop_risk_voice_database() -> None:
    await close_risk_voice_database()

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


class PatientOut(BaseModel):
    patient_id:   str
    name:         str
    surgery_date: str
    day_number:   int


class AnalysisResult(BaseModel):
    is_healthy:         bool
    primary_disorder:   str
    severity_score:     float
    severity_label:     str
    severity_color:     str
    voice_quality_prob: float
    stuttering_prob:    float
    dysarthria_prob:    float
    duration_s:         float
    message:            str
    session_id:         Optional[str] = None


class SessionOut(BaseModel):
    session_id:         str
    patient_id:         str
    recorded_at:        str
    day_number:         int
    duration_s:         float
    vocal_clarity_prob: float
    fluency_prob:       float
    articulation_prob:  float
    severity_score:     float
    severity_label:     str
    is_healthy:         bool
    primary_disorder:   str
    message:            str


class ProgressPoint(BaseModel):
    day_number:    int
    vocal_clarity: float
    fluency:       float
    articulation:  float
    severity:      float
    session_count: int


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "models": list(MODELS.keys()), "version": "3.0.0"}


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

