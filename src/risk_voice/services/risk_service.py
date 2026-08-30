from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import HTTPException, status

from src.risk_voice.core.config import settings
from src.risk_voice.schemas.prediction import (
    PredictionResponse,
    RiskFactorSummary,
    RiskFactorsRequest,
    StructuredModelInfo,
)
from src.risk_voice.services.preventive_risk_engine import calculate_preventive_risk


MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "risk_factor_score_model.joblib"

YES_VALUES = {
    "yes", "y", "true", "1", "current", "daily", "frequent", "regular",
    "occasional", "mild", "moderate", "severe", "poor",
}
NO_VALUES = {"no", "n", "false", "0", "never", "none", "normal", "good", "low-risk"}

ALLOWED_VALUES = {
    "gender": {"male", "female", "other", "prefer not to say", "prefer_not_to_say"},
    "smoking": YES_VALUES | NO_VALUES | {"former"},
    "alcohol": YES_VALUES | NO_VALUES | {"rare", "social"},
    "betelChewing": YES_VALUES | NO_VALUES | {"former"},
    "oralUlcer": YES_VALUES | NO_VALUES,
    "gumDisease": YES_VALUES | NO_VALUES,
    "oralPain": YES_VALUES | NO_VALUES,
    "hpvInfection": YES_VALUES | NO_VALUES | {"unknown"},
    "poorOralHygiene": YES_VALUES | NO_VALUES,
    "diet": {"low", "medium", "high", "poor", "average", "good"},
    "familyHistory": YES_VALUES | NO_VALUES | {"unknown"},
    "compromisedImmuneSystem": YES_VALUES | NO_VALUES | {"unknown"},
    "unexplainedBleeding": YES_VALUES | NO_VALUES,
    "difficultySwallowing": YES_VALUES | NO_VALUES,
    "whiteOrRedPatches": YES_VALUES | NO_VALUES,
}


def _key(value: str) -> str:
    return str(value).strip().lower()


def _validate_categories(payload: RiskFactorsRequest) -> None:
    errors: list[str] = []
    for field_name, allowed in ALLOWED_VALUES.items():
        if _key(getattr(payload, field_name)) not in allowed:
            errors.append(f"{field_name} has unsupported value '{getattr(payload, field_name)}'")
    if errors:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"errors": errors})


def _binary(value: str) -> str:
    value_key = _key(value)
    return "Yes" if value_key in YES_VALUES or value_key == "former" else "No"


def _diet(value: str) -> str:
    value_key = _key(value)
    if value_key in {"low", "poor"}:
        return "Low"
    if value_key in {"high", "good"}:
        return "High"
    return "Medium"


def _model_fields(payload: RiskFactorsRequest) -> dict[str, Any]:
    return {
        "Age": payload.age,
        "Gender": payload.gender,
        "Tobacco Use": _binary(payload.smoking),
        "Alcohol Consumption": _binary(payload.alcohol),
        "HPV Infection": _binary(payload.hpvInfection),
        "Betel Quid Use": _binary(payload.betelChewing),
        "Poor Oral Hygiene": "Yes" if _binary(payload.gumDisease) == "Yes" or _binary(payload.poorOralHygiene) == "Yes" else "No",
        "Diet (Fruits & Vegetables Intake)": _diet(payload.diet),
        "Family History of Cancer": _binary(payload.familyHistory),
        "Compromised Immune System": _binary(payload.compromisedImmuneSystem),
        "Oral Lesions": _binary(payload.oralUlcer),
        "Unexplained Bleeding": _binary(payload.unexplainedBleeding),
        "Difficulty Swallowing": _binary(payload.difficultySwallowing),
        "White or Red Patches in Mouth": _binary(payload.whiteOrRedPatches),
    }


@lru_cache(maxsize=1)
def load_model() -> dict[str, Any]:
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail="Trained risk-factor model file is missing.")
    try:
        artifact = joblib.load(MODEL_PATH)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Trained risk-factor model could not be loaded.") from exc
    if not isinstance(artifact, dict) or not {"model", "feature_columns", "metadata"}.issubset(artifact):
        raise HTTPException(status_code=503, detail="Trained risk-factor model artifact is invalid.")
    return artifact


def model_metadata() -> dict[str, Any]:
    return dict(load_model()["metadata"])


def _predict_score(artifact: dict[str, Any], fields: dict[str, Any]) -> float:
    row = pd.DataFrame([{column: fields.get(column) for column in artifact["feature_columns"]}])
    try:
        score = float(artifact["model"].predict(row)[0])
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Risk-factor model inference failed.") from exc
    return round(max(0.0, min(100.0, score)), 2)


def level_from_score(score: float) -> str:
    if score < 35:
        return "low"
    if score < 65:
        return "moderate"
    return "high"


def build_structured_prediction(payload: RiskFactorsRequest) -> PredictionResponse:
    _validate_categories(payload)
    artifact = load_model()
    fields = _model_fields(payload)
    explanation = calculate_preventive_risk(fields)
    score = _predict_score(artifact, fields)
    insights = list(explanation.reasons)

    if _binary(payload.oralPain) == "Yes":
        insights.append("Oral pain was reported and should be monitored if persistent.")

    metadata = artifact["metadata"]
    return PredictionResponse(
        riskPercentage=score,
        level=level_from_score(score),
        structuredScore=score,
        voiceScore=None,
        finalScore=score,
        insights=list(dict.fromkeys(insights)),
        recommendations=list(explanation.recommendations),
        riskFactorSummary=RiskFactorSummary(
            age=payload.age,
            smoking=payload.smoking,
            alcohol=payload.alcohol,
            betelChewing=payload.betelChewing,
            oralUlcer=payload.oralUlcer,
            gumDisease=payload.gumDisease,
            oralPain=payload.oralPain,
        ),
        structuredModel=StructuredModelInfo(
            modelType="machine_learning",
            algorithm=str(metadata["algorithm"]),
            target=str(metadata["target"]),
            targetSource="rule_derived",
            trainedRows=int(metadata["trained_rows"]),
            heldOutMetrics={key: float(value) for key, value in metadata["held_out_metrics"].items()},
        ),
        voiceAnalysis=None,
        disclaimer=settings.disclaimer,
    )


def combine_predictions(
    *,
    structured: PredictionResponse,
    voice_score: float | None,
    voice_analysis: Any | None,
    raw_features: dict[str, float] | None = None,
    gender_pitch_reference: Any | None = None,
) -> PredictionResponse:
    if voice_score is None:
        final_score = structured.structuredScore
        voice_insights = ["Voice analysis was not provided; final score uses structured risk factors only."]
    else:
        final_score = (0.70 * structured.structuredScore) + (0.30 * voice_score)
        if voice_score < 35:
            voice_insights = ["Voice signal markers are within expected range."]
        elif voice_score < 65:
            voice_insights = ["Voice signal markers show slight variation."]
        else:
            voice_insights = ["Voice signal markers include abnormality indicators."]

    recommendations = list(structured.recommendations)
    if structured.level in {"moderate", "high"} or (voice_score is not None and voice_score >= 35):
        recommendations.append("Consult a qualified healthcare professional for persistent symptoms.")

    final_score = round(final_score, 2)
    return structured.model_copy(
        update={
            "riskPercentage": final_score,
            "level": level_from_score(final_score),
            "voiceScore": round(float(voice_score), 2) if voice_score is not None else None,
            "finalScore": final_score,
            "insights": list(dict.fromkeys(voice_insights + structured.insights)),
            "recommendations": list(dict.fromkeys(recommendations)),
            "voiceAnalysis": voice_analysis,
            "rawFeatures": raw_features,
            "genderPitchReference": gender_pitch_reference,
        }
    )
