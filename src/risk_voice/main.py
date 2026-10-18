import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, Form, Header, HTTPException, Query, Request, UploadFile, status
from pydantic import ValidationError
from starlette.datastructures import UploadFile as StarletteUploadFile

from src.api.auth import decode_token
from src.risk_voice.schemas.prediction import (
    HistoryItem,
    MultimodalJsonRequest,
    PredictionRecord,
    PredictionResponse,
    RiskFactorsRequest,
    VoicePredictionResponse,
)
from src.risk_voice.services.database_service import (
    database_status,
    get_history,
    get_prediction_records,
    initialize_database,
    save_prediction_record,
)
from src.risk_voice.services.risk_service import build_structured_prediction, combine_predictions, model_metadata
from src.risk_voice.services.voice_service import predict_uploaded_voice


router = APIRouter()
initialize_database()


def authenticated_patient(authorization: str | None = Header(default=None)) -> str:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization token is required.")
    scheme, _, token = authorization.partition(" ")
    patient_id = decode_token(token) if scheme.lower() == "bearer" and token else None
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is invalid or expired.")
    return patient_id


def _history_summary(response: PredictionResponse) -> str:
    if response.finalScore < 35:
        return "Lifestyle markers mildly elevated" if response.finalScore >= 20 else "No severe symptom cluster"
    if response.finalScore < 65:
        return "Follow-up screening support suggested"
    return "Professional assessment strongly recommended"


def _voice_status(response: PredictionResponse) -> str:
    return "Unavailable" if response.voiceAnalysis is None else response.voiceAnalysis.mfccPattern


def _build_history_item(response: PredictionResponse) -> HistoryItem:
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
        raise HTTPException(status_code=400, detail="riskFactors must be valid JSON.") from exc
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=exc.errors()) from exc


@router.get("/health")
def health() -> dict[str, Any]:
    metadata = model_metadata()
    return {
        "status": "ok",
        "component": "risk-voice",
        "database": database_status(),
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
    response = build_structured_prediction(payload)
    save_prediction_record(
        patient_id=patient_id,
        prediction_type="risk_factors",
        request_data=payload.model_dump(mode="json"),
        response_data=response.model_dump(mode="json"),
        history=_build_history_item(response),
    )
    return response


@router.post("/api/predict/voice", response_model=VoicePredictionResponse)
async def predict_voice(
    file: UploadFile,
    gender: str | None = Form(default=None),
    patient_id: str = Depends(authenticated_patient),
) -> VoicePredictionResponse:
    response = await predict_uploaded_voice(file, gender=gender)
    save_prediction_record(
        patient_id=patient_id,
        prediction_type="voice",
        request_data={"file": {"filename": file.filename, "contentType": file.content_type, "gender": gender}},
        response_data=response.model_dump(mode="json"),
        history=None,
    )
    return response


@router.post("/api/predict/multimodal", response_model=PredictionResponse)
async def predict_multimodal(
    request: Request,
    patient_id: str = Depends(authenticated_patient),
) -> PredictionResponse:
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
            raise HTTPException(status_code=400, detail="Multipart requests require a riskFactors JSON field.")
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
            except ValueError as exc:
                raise HTTPException(status_code=400, detail="voiceScore must be a number between 0 and 100.") from exc
            request_data["voiceScore"] = voice_score

        raw_gender = form.get("gender")
        gender = str(raw_gender) if raw_gender not in (None, "") else None
        if gender is not None:
            request_data["gender"] = gender
    else:
        try:
            payload = MultimodalJsonRequest.model_validate(await request.json())
        except (json.JSONDecodeError, ValidationError) as exc:
            raise HTTPException(status_code=400, detail="Request body must contain valid multimodal JSON.") from exc
        risk_factors = payload.riskFactors
        voice_score = payload.voiceScore
        request_data = payload.model_dump(mode="json")

    if voice_score is not None and not 0 <= voice_score <= 100:
        raise HTTPException(status_code=400, detail="voiceScore must be between 0 and 100.")

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
    save_prediction_record(
        patient_id=patient_id,
        prediction_type="multimodal",
        request_data=request_data,
        response_data=response.model_dump(mode="json"),
        history=_build_history_item(response),
    )
    return response


@router.get("/api/history", response_model=list[HistoryItem])
def history(
    limit: int = Query(default=50, ge=1, le=200),
    patient_id: str = Depends(authenticated_patient),
) -> list[HistoryItem]:
    return get_history(patient_id=patient_id, limit=limit)


@router.get("/api/predictions", response_model=list[PredictionRecord])
def predictions(
    limit: int = Query(default=50, ge=1, le=200),
    patient_id: str = Depends(authenticated_patient),
) -> list[PredictionRecord]:
    return get_prediction_records(patient_id=patient_id, limit=limit)
