import logging
import random
import secrets
from datetime import datetime, timedelta, timezone

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
    save_care_link,
    get_care_link,
    get_doctor_care_links,
    find_care_link_by_code,
    get_patient_lesion_records,
)
from src.risk_voice.main import router as risk_voice_router
from src.api.vocal_therapy import router as vocal_therapy_router
from src.meditation.router import router as meditation_router

try:
    from src.api.predict import router as predict_router
except ModuleNotFoundError as exc:
    predict_router = None
    _component1_import_error = str(exc)
else:
    _component1_import_error = None


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
app.include_router(vocal_therapy_router, tags=["vocal-therapy"])
app.include_router(meditation_router)
if predict_router is not None:
    app.include_router(predict_router, tags=["component-1"])
init_db()


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    mobile_number: str
    password: str
    role: str = "patient"
    therapy_stage: str | None = None


class RegisterResponse(BaseModel):
    token: str
    patient_id: str
    name: str
    surgery_date: str
    day_number: int
    role: str
    therapy_stage: str | None = None


class LoginRequest(BaseModel):
    mobile_number: str
    password: str
    role: str = "patient"


class LoginResponse(BaseModel):
    token: str
    patient_id: str
    name: str
    surgery_date: str
    day_number: int
    role: str


class PatientOut(BaseModel):
    patient_id: str
    name: str
    surgery_date: str
    day_number: int
    therapy_stage: str | None = None
    role: str = "patient"


class CareConnectRequest(BaseModel):
    code: str


class PhotoReminderRequest(BaseModel):
    reminder_date: str | None = None


class CarePlanRequest(BaseModel):
    diagnosis_status: str = "awaiting_confirmation"
    diagnosis: str = ""
    stage: str = ""
    treatment_type: str = ""
    treatment_status: str = "not_planned"
    next_appointment: str = ""
    instructions: str = ""
    tasks: list[dict] = []
    movement_ids: list[str] = []


class CareTaskUpdateRequest(BaseModel):
    completed: bool


def _care_notification(title: str, message: str) -> dict:
    return {"id": secrets.token_hex(8), "title": title, "message": message, "created_at": datetime.now(timezone.utc).isoformat(), "read": False}


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


if predict_router is None:
    @app.post("/predict", tags=["component-1"])
    def component1_unavailable() -> None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Component 1 image inference dependencies are unavailable. "
                f"Backend import error: {_component1_import_error}"
            ),
        )


@app.post("/auth/register", response_model=RegisterResponse, status_code=201)
def register(body: RegisterRequest) -> RegisterResponse:
    if not body.first_name.strip() or not body.last_name.strip():
        raise HTTPException(status_code=422, detail="First name and last name are required")
    if not body.mobile_number.strip():
        raise HTTPException(status_code=422, detail="Mobile number is required")
    if len(body.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    if body.role not in {"patient", "doctor"}:
        raise HTTPException(status_code=422, detail="Role must be patient or doctor")
    if body.role == "patient" and body.therapy_stage not in {"pre", "in", "post"}:
        raise HTTPException(status_code=422, detail="Therapy stage must be pre, in, or post")
    if mobile_exists(body.mobile_number.strip()):
        raise HTTPException(status_code=409, detail="An account with this mobile number already exists")

    for _ in range(20):
        candidate = f"{'DR' if body.role == 'doctor' else 'OC'}-{random.randint(1000, 9999)}"
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
            role=body.role,
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
        role=body.role,
        therapy_stage=body.therapy_stage,
    )


@app.post("/auth/login", response_model=LoginResponse)
def login(body: LoginRequest) -> LoginResponse:
    if body.role not in {"patient", "doctor"}:
        raise HTTPException(status_code=422, detail="Role must be patient or doctor")
    patient = get_patient_by_mobile(body.mobile_number.strip(), body.role)
    if not patient or not patient.get("password_hash") or not verify_password(body.password, patient["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid mobile number or password")
    return LoginResponse(
        token=create_token(patient["patient_id"]),
        patient_id=patient["patient_id"],
        name=patient_display_name(patient),
        surgery_date=patient["surgery_date"],
        day_number=patient_day_number(patient["created_at"]),
        role=patient.get("role", "patient"),
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
        role=patient.get("role", "patient"),
    )


def _require_role(patient: dict, role: str) -> None:
    if patient.get("role", "patient") != role:
        raise HTTPException(status_code=403, detail=f"This action is for {role} accounts")


@app.post("/care/share-code")
def create_care_share_code(authorization: str | None = Header(default=None)) -> dict:
    patient = _patient_from_authorization(authorization)
    _require_role(patient, "patient")
    for _ in range(10):
        code = f"{secrets.randbelow(1_000_000):06d}"
        if not find_care_link_by_code(code):
            break
    else:
        raise HTTPException(status_code=503, detail="Could not create a sharing code. Please try again.")
    link = get_care_link(patient["patient_id"]) or {"patient_id": patient["patient_id"], "doctor_id": None, "doctor_name": None, "plan": None, "acknowledged_at": None}
    link.update({"share_code": code, "share_code_expires": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()})
    save_care_link(link)
    return {"code": code, "expires_at": link["share_code_expires"]}


@app.post("/care/connect")
def connect_care(body: CareConnectRequest, authorization: str | None = Header(default=None)) -> dict:
    doctor = _patient_from_authorization(authorization)
    _require_role(doctor, "doctor")
    link = find_care_link_by_code(body.code.strip())
    if not link or not link.get("share_code_expires") or datetime.fromisoformat(link["share_code_expires"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=404, detail="That sharing code is invalid or expired. Ask the patient for a new one.")
    if link.get("doctor_id") and link["doctor_id"] != doctor["patient_id"]:
        raise HTTPException(status_code=409, detail="This patient is already connected to another doctor.")
    patient = get_patient(link["patient_id"])
    if not patient:
        raise HTTPException(status_code=404, detail="Patient account not found")
    link.update({"doctor_id": doctor["patient_id"], "doctor_name": patient_display_name(doctor), "share_code": None, "share_code_expires": None, "updated_at": datetime.now(timezone.utc).isoformat()})
    link.setdefault("notifications", []).append(_care_notification("Doctor connected", f"{patient_display_name(doctor)} is now connected to your care plan."))
    save_care_link(link)
    return {"patient_id": patient["patient_id"], "patient_name": patient_display_name(patient)}


@app.get("/care/patients")
def doctor_care_patients(authorization: str | None = Header(default=None)) -> list[dict]:
    doctor = _patient_from_authorization(authorization)
    _require_role(doctor, "doctor")
    result = []
    for link in get_doctor_care_links(doctor["patient_id"]):
        patient = get_patient(link["patient_id"])
        if patient:
            latest_uploads = get_patient_lesion_records(patient["patient_id"], limit=1)
            latest_upload_at = latest_uploads[0].get("created_at") if latest_uploads else None
            result.append({"patient_id": patient["patient_id"], "patient_name": patient_display_name(patient), "plan": link.get("plan"), "updated_at": link.get("updated_at"), "acknowledged_at": link.get("acknowledged_at"), "latest_upload_at": latest_upload_at, "photo_reminder_date": link.get("photo_reminder_date"), "has_new_upload": bool(latest_upload_at and latest_upload_at > str(link.get("doctor_last_viewed_upload_at") or ""))})
    return result


@app.get("/care/plan")
def patient_care_plan(authorization: str | None = Header(default=None)) -> dict:
    patient = _patient_from_authorization(authorization)
    _require_role(patient, "patient")
    link = get_care_link(patient["patient_id"])
    if link and link.get("plan"):
        changed = False
        for task in link["plan"].get("tasks", []):
            if not task.get("task_id"):
                task["task_id"] = secrets.token_hex(8)
                task.setdefault("completed", False)
                task.setdefault("completed_at", None)
                changed = True
        if changed:
            save_care_link(link)
    return {"connected": bool(link and link.get("doctor_id")), "doctor_name": link.get("doctor_name") if link else None, "plan": link.get("plan") if link else None, "acknowledged_at": link.get("acknowledged_at") if link else None, "notifications": (link or {}).get("notifications", [])}


@app.get("/care/notifications")
def patient_care_notifications(authorization: str | None = Header(default=None)) -> dict:
    patient = _patient_from_authorization(authorization)
    _require_role(patient, "patient")
    notifications = (get_care_link(patient["patient_id"]) or {}).get("notifications", [])
    return {"notifications": notifications, "unread_count": sum(1 for item in notifications if not item.get("read"))}


@app.post("/care/notifications/read")
def mark_care_notifications_read(authorization: str | None = Header(default=None)) -> dict:
    patient = _patient_from_authorization(authorization)
    _require_role(patient, "patient")
    link = get_care_link(patient["patient_id"])
    if link:
        for item in link.get("notifications", []):
            item["read"] = True
        save_care_link(link)
    return {"success": True}


@app.get("/care/patients/{patient_id}/records")
def doctor_patient_records(patient_id: str, authorization: str | None = Header(default=None)) -> dict:
    doctor = _patient_from_authorization(authorization)
    _require_role(doctor, "doctor")
    link = get_care_link(patient_id)
    if not link or link.get("doctor_id") != doctor["patient_id"]:
        raise HTTPException(status_code=403, detail="You are not connected to this patient")
    records = get_patient_lesion_records(patient_id, limit=20)
    if records:
        link["doctor_last_viewed_upload_at"] = records[0].get("created_at")
        save_care_link(link)
    return {"records": records}


@app.get("/care/records")
def patient_lesion_records(authorization: str | None = Header(default=None)) -> dict:
    patient = _patient_from_authorization(authorization)
    _require_role(patient, "patient")
    return {"records": get_patient_lesion_records(patient["patient_id"], limit=20)}


@app.get("/care/photo-reminder")
def get_photo_reminder(authorization: str | None = Header(default=None)) -> dict:
    patient = _patient_from_authorization(authorization)
    _require_role(patient, "patient")
    link = get_care_link(patient["patient_id"]) or {}
    latest_uploads = get_patient_lesion_records(patient["patient_id"], limit=1)
    return {
        "reminder_date": link.get("photo_reminder_date"),
        "last_upload_at": latest_uploads[0].get("created_at") if latest_uploads else None,
        "doctor_connected": bool(link.get("doctor_id")),
        "doctor_name": link.get("doctor_name"),
    }


@app.put("/care/photo-reminder")
def update_photo_reminder(body: PhotoReminderRequest, authorization: str | None = Header(default=None)) -> dict:
    patient = _patient_from_authorization(authorization)
    _require_role(patient, "patient")
    reminder_date = body.reminder_date.strip() if body.reminder_date else ""
    if reminder_date:
        try:
            datetime.strptime(reminder_date, "%Y-%m-%d")
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="Reminder date must use YYYY-MM-DD format.") from exc
    link = get_care_link(patient["patient_id"]) or {
        "patient_id": patient["patient_id"], "doctor_id": None,
        "doctor_name": None, "plan": None, "acknowledged_at": None,
    }
    link["photo_reminder_date"] = reminder_date or None
    link["updated_at"] = datetime.now(timezone.utc).isoformat()
    save_care_link(link)
    return {"reminder_date": link["photo_reminder_date"]}


@app.post("/care/disconnect")
def disconnect_care_team(authorization: str | None = Header(default=None)) -> dict:
    patient = _patient_from_authorization(authorization)
    _require_role(patient, "patient")
    link = get_care_link(patient["patient_id"])
    if link:
        link.update({"doctor_id": None, "doctor_name": None, "plan": None, "acknowledged_at": None, "notifications": [], "share_code": None, "share_code_expires": None, "updated_at": datetime.now(timezone.utc).isoformat()})
        save_care_link(link)
    return {"disconnected": True}


@app.put("/care/plan/{patient_id}")
def update_patient_care_plan(patient_id: str, body: CarePlanRequest, authorization: str | None = Header(default=None)) -> dict:
    doctor = _patient_from_authorization(authorization)
    _require_role(doctor, "doctor")
    link = get_care_link(patient_id)
    if not link or link.get("doctor_id") != doctor["patient_id"]:
        raise HTTPException(status_code=403, detail="You are not connected to this patient")
    if body.diagnosis_status not in {"awaiting_confirmation", "confirmed"}:
        raise HTTPException(status_code=422, detail="Invalid diagnosis status")
    plan = body.model_dump()
    previous_tasks = (link.get("plan") or {}).get("tasks", [])
    by_title: dict[str, list[dict]] = {}
    for task in previous_tasks:
        by_title.setdefault(str(task.get("title", "")).strip().casefold(), []).append(task)
    normalized_tasks = []
    for task in plan["tasks"]:
        title = str(task.get("title", "")).strip()
        if not title:
            continue
        prior = by_title.get(title.casefold(), []).pop(0) if by_title.get(title.casefold()) else {}
        normalized_tasks.append({
            **task,
            "task_id": prior.get("task_id") or secrets.token_hex(8),
            "title": title,
            "completed": bool(prior.get("completed", False)),
            "completed_at": prior.get("completed_at"),
        })
    plan["tasks"] = normalized_tasks
    plan["updated_at"] = datetime.now(timezone.utc).isoformat()
    plan["doctor_name"] = patient_display_name(doctor)
    link.update({"plan": plan, "acknowledged_at": None, "updated_at": plan["updated_at"]})
    notification_message = body.instructions.strip() or "Your doctor updated your care plan and next steps."
    link.setdefault("notifications", []).append(_care_notification("New care instructions", notification_message))
    save_care_link(link)
    return plan


@app.post("/care/tasks/{task_id}/completion")
def update_care_task_completion(task_id: str, body: CareTaskUpdateRequest, authorization: str | None = Header(default=None)) -> dict:
    patient = _patient_from_authorization(authorization)
    _require_role(patient, "patient")
    link = get_care_link(patient["patient_id"])
    if not link or not link.get("doctor_id") or not link.get("plan"):
        raise HTTPException(status_code=404, detail="There is no connected care plan")
    plan = link["plan"]
    task = next((item for item in plan.get("tasks", []) if item.get("task_id") == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="That care task is no longer on your plan. Refresh and try again.")
    task["completed"] = body.completed
    task["completed_at"] = datetime.now(timezone.utc).isoformat() if body.completed else None
    link.update({"plan": plan, "updated_at": datetime.now(timezone.utc).isoformat()})
    save_care_link(link)
    return plan


@app.post("/care/acknowledge")
def acknowledge_care_plan(authorization: str | None = Header(default=None)) -> dict:
    patient = _patient_from_authorization(authorization)
    _require_role(patient, "patient")
    link = get_care_link(patient["patient_id"])
    if not link or not link.get("doctor_id") or not link.get("plan"):
        raise HTTPException(status_code=404, detail="There is no care plan to acknowledge")
    link["acknowledged_at"] = datetime.now(timezone.utc).isoformat()
    save_care_link(link)
    return {"acknowledged_at": link["acknowledged_at"]}
