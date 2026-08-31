<<<<<<< Updated upstream
import json
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.datastructures import UploadFile as StarletteUploadFile

from src.api.auth import decode_token
from src.risk_voice.core.config import settings
from src.risk_voice.schemas.prediction import HistoryItem, MultimodalJsonRequest, PredictionRecord, PredictionResponse, RiskFactorsRequest, VoicePredictionResponse
from src.risk_voice.services.database_service import close_database, connect_database, database_status, get_history, get_prediction_records, save_prediction_record
from src.risk_voice.services.risk_service import build_structured_prediction, combine_predictions
from src.risk_voice.services.voice_service import predict_uploaded_voice


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        await connect_database()
    except Exception as exc:
        print(f"MongoDB connection unavailable: {exc}")
    yield
    await close_database()


app = FastAPI(title="Oral Cancer Risk Prediction API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def require_patient_authentication(request: Request, call_next):
    if "/api/" in request.url.path:
        authorization = request.headers.get("authorization", "")
        scheme, _, token = authorization.partition(" ")
        patient_id = decode_token(token) if scheme.lower() == "bearer" and token else None
        if patient_id is None:
            return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"detail": "A valid patient session is required."})
        request.state.patient_id = patient_id
    return await call_next(request)


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": exc.errors()})


@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(_: Request, exc: ValidationError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": exc.errors()})


def _history_summary(response: PredictionResponse) -> str:
    if response.finalScore < 35:
        return "Lifestyle markers mildly elevated" if response.finalScore >= 20 else "No severe symptom cluster"
    if response.finalScore < 65:
        return "Follow-up screening support suggested"
    return "Professional assessment strongly recommended"


def _voice_status(response: PredictionResponse) -> str:
    if response.voiceAnalysis is None:
        return "Unavailable"
    return response.voiceAnalysis.mfccPattern


def _build_history_item(response: PredictionResponse) -> HistoryItem:
    from datetime import datetime, timezone
    from uuid import uuid4

    return HistoryItem(
        id=str(uuid4()),
        date=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        riskPercentage=response.riskPercentage,
        level=response.level,
        summary=_history_summary(response),
        voiceStatus=_voice_status(response),
    )


def _parse_risk_factors(value: Any) -> RiskFactorsRequest:
    try:
        if isinstance(value, str):
            value = json.loads(value)
        return RiskFactorsRequest.model_validate(value)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="riskFactors must be valid JSON.") from exc
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.errors()) from exc


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.service_name, "database": await database_status()}


@app.post("/api/predict/risk-factors", response_model=PredictionResponse)
async def predict_risk_factors(request: Request, payload: RiskFactorsRequest) -> PredictionResponse:
    response = build_structured_prediction(payload)
    history_item = _build_history_item(response)
    await save_prediction_record(
        patient_id=request.state.patient_id,
        prediction_type="risk_factors",
        request_data=payload.model_dump(mode="json"),
        response_data=response.model_dump(mode="json"),
        history=history_item,
    )
    return response


@app.post("/api/predict/voice", response_model=VoicePredictionResponse)
async def predict_voice(request: Request, file: UploadFile, gender: str | None = Form(default=None)) -> VoicePredictionResponse:
    file_metadata = {"filename": file.filename, "contentType": file.content_type, "gender": gender}
    response = await predict_uploaded_voice(file, gender=gender)
    await save_prediction_record(
        patient_id=request.state.patient_id,
        prediction_type="voice",
        request_data={"file": file_metadata},
        response_data=response.model_dump(mode="json"),
        history=None,
    )
    return response


@app.post("/api/predict/multimodal", response_model=PredictionResponse)
async def predict_multimodal(request: Request) -> PredictionResponse:
    content_type = request.headers.get("content-type", "").lower()
    file: UploadFile | None = None
    voice_score: float | None = None
    voice_analysis = None
    raw_features = None
    gender_pitch_reference = None
    gender: str | None = None

    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        if "riskFactors" not in form:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Multipart requests require a riskFactors JSON field.")
        risk_factors = _parse_risk_factors(form["riskFactors"])
        request_data: dict[str, Any] = {"riskFactors": risk_factors.model_dump(mode="json")}

        uploaded = form.get("file")
        if isinstance(uploaded, (UploadFile, StarletteUploadFile)):
            file = uploaded
            request_data["file"] = {"filename": uploaded.filename, "contentType": uploaded.content_type}

        raw_voice_score = form.get("voiceScore")
        if raw_voice_score not in (None, ""):
            try:
                voice_score = float(str(raw_voice_score))
                request_data["voiceScore"] = voice_score
            except ValueError as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="voiceScore must be a number between 0 and 100.") from exc

        raw_gender = form.get("gender")
        gender = str(raw_gender) if raw_gender not in (None, "") else None
        if gender is not None:
            request_data["gender"] = gender
    else:
        try:
            body = await request.json()
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request body must be valid JSON.") from exc
        payload = MultimodalJsonRequest.model_validate(body)
        risk_factors = payload.riskFactors
        voice_score = payload.voiceScore
        request_data = payload.model_dump(mode="json")

    if voice_score is not None and not 0 <= voice_score <= 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="voiceScore must be between 0 and 100.")

    structured = build_structured_prediction(risk_factors)

    if file is not None:
        voice_result = await predict_uploaded_voice(file, gender=gender)
        voice_score = voice_result.voiceScore
        voice_analysis = voice_result.voiceAnalysis
        raw_features = voice_result.rawFeatures
        gender_pitch_reference = voice_result.genderPitchReference

    response = combine_predictions(
        structured=structured,
        voice_score=voice_score,
        voice_analysis=voice_analysis,
        raw_features=raw_features,
        gender_pitch_reference=gender_pitch_reference,
    )
    history_item = _build_history_item(response)
    await save_prediction_record(
        patient_id=request.state.patient_id,
        prediction_type="multimodal",
        request_data=request_data,
        response_data=response.model_dump(mode="json"),
        history=history_item,
    )
    return response


@app.get("/api/history", response_model=list[HistoryItem])
async def history(request: Request, limit: int = Query(default=50, ge=1, le=200)) -> list[HistoryItem]:
    return await get_history(patient_id=request.state.patient_id, limit=limit)


@app.get("/api/predictions", response_model=list[PredictionRecord])
async def predictions(request: Request, limit: int = Query(default=50, ge=1, le=200)) -> list[PredictionRecord]:
    return await get_prediction_records(patient_id=request.state.patient_id, limit=limit)
=======
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from src.api.auth import decode_token
from src.risk_voice.schemas.prediction import PredictionResponse, RiskFactorsRequest, StoredRiskAssessment
from src.risk_voice.services.database_service import get_risk_assessments, save_risk_assessment
from src.risk_voice.services.risk_service import model_metadata, predict_risk


router = APIRouter()


def authenticated_patient(authorization: str | None = Header(default=None)) -> str:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization token is required.")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="A valid Bearer token is required.")
    patient_id = decode_token(token)
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is invalid or expired.")
    return patient_id


@router.get("/health")
def health() -> dict:
    metadata = model_metadata()
    return {
        "status": "ok",
        "component": "risk-voice",
        "riskModel": {
            "algorithm": metadata["algorithm"],
            "target": metadata["target"],
            "targetSource": metadata["target_source"],
        },
    }


@router.post("/api/predict/risk-factors", response_model=PredictionResponse)
def predict_risk_factors(
    payload: RiskFactorsRequest,
    patient_id: str = Depends(authenticated_patient),
) -> PredictionResponse:
    response = predict_risk(payload)
    save_risk_assessment(patient_id, payload, response)
    return response


@router.get("/api/risk-assessments", response_model=list[StoredRiskAssessment])
def risk_assessments(
    limit: int = Query(default=50, ge=1, le=200),
    patient_id: str = Depends(authenticated_patient),
) -> list[StoredRiskAssessment]:
    return [StoredRiskAssessment.model_validate(item) for item in get_risk_assessments(patient_id, limit)]
>>>>>>> Stashed changes
