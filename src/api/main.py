import logging
import random

from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.api.auth import create_token, decode_token
from src.api.db import (
    create_patient,
    get_patient,
    get_patient_by_mobile,
    init_db,
    mobile_exists,
    patient_day_number,
    patient_display_name,
    patient_id_exists,
    verify_password,
)
from src.risk_voice.main import router as risk_voice_router


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Oral Health Care AI API",
    description="Authentication and integrated oral-health research components.",
    version="3.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(risk_voice_router, prefix="/risk-voice", tags=["risk-voice"])
init_db()


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    mobile_number: str
    password: str
    therapy_stage: str


class RegisterResponse(BaseModel):
    token: str
    patient_id: str
    name: str
    surgery_date: str
    day_number: int
    therapy_stage: str


class LoginRequest(BaseModel):
    mobile_number: str
    password: str


class LoginResponse(BaseModel):
    token: str
    patient_id: str
    name: str
    surgery_date: str
    day_number: int


class PatientOut(BaseModel):
    patient_id: str
    name: str
    surgery_date: str
    day_number: int
    therapy_stage: str | None = None


def _patient_from_authorization(authorization: str | None) -> dict:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization token is required.")
    scheme, _, token = authorization.partition(" ")
    patient_id = decode_token(token) if scheme.lower() == "bearer" and token else None
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is invalid or expired.")
    patient = get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient was not found.")
    return patient


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": "3.1.0"}


@app.post("/auth/register", response_model=RegisterResponse, status_code=201)
def register(body: RegisterRequest) -> RegisterResponse:
    if not body.first_name.strip() or not body.last_name.strip():
        raise HTTPException(status_code=422, detail="First name and last name are required")
    if not body.mobile_number.strip():
        raise HTTPException(status_code=422, detail="Mobile number is required")
    if len(body.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    if body.therapy_stage not in {"pre", "in", "post"}:
        raise HTTPException(status_code=422, detail="Therapy stage must be pre, in, or post")
    if mobile_exists(body.mobile_number.strip()):
        raise HTTPException(status_code=409, detail="An account with this mobile number already exists")

    for _ in range(20):
        candidate = f"OC-{random.randint(1000, 9999)}"
        if not patient_id_exists(candidate):
            patient_id = candidate
            break
    else:
        raise HTTPException(status_code=500, detail="Could not generate unique Patient ID")

    try:
        create_patient(
            patient_id=patient_id,
            first_name=body.first_name.strip(),
            last_name=body.last_name.strip(),
            mobile_number=body.mobile_number.strip(),
            password=body.password,
            therapy_stage=body.therapy_stage,
        )
    except Exception as exc:
        logger.exception("Registration failed")
        raise HTTPException(status_code=500, detail="Registration failed") from exc

    patient = get_patient(patient_id)
    return RegisterResponse(
        token=create_token(patient_id),
        patient_id=patient_id,
        name=f"{body.first_name.strip()} {body.last_name.strip()}",
        surgery_date=patient["surgery_date"],
        day_number=1,
        therapy_stage=body.therapy_stage,
    )


@app.post("/auth/login", response_model=LoginResponse)
def login(body: LoginRequest) -> LoginResponse:
    patient = get_patient_by_mobile(body.mobile_number.strip())
    if not patient or not patient.get("password_hash") or not verify_password(body.password, patient["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid mobile number or password")
    return LoginResponse(
        token=create_token(patient["patient_id"]),
        patient_id=patient["patient_id"],
        name=patient_display_name(patient),
        surgery_date=patient["surgery_date"],
        day_number=patient_day_number(patient["created_at"]),
    )


@app.get("/me", response_model=PatientOut)
def me(authorization: str | None = Header(default=None)) -> PatientOut:
    patient = _patient_from_authorization(authorization)
    return PatientOut(
        patient_id=patient["patient_id"],
        name=patient_display_name(patient),
        surgery_date=patient["surgery_date"],
        day_number=patient_day_number(patient["created_at"]),
        therapy_stage=patient.get("therapy_stage"),
    )
