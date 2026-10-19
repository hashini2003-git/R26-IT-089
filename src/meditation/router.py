from functools import lru_cache
from itertools import product
from pathlib import Path
from typing import Any, Literal

import joblib
import pandas as pd
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field


router = APIRouter(prefix="/meditation", tags=["meditation"])

MODEL_PATH = Path(__file__).with_name("models") / "meditation_model.pkl"

ENVIRONMENTS = ["Beach", "Forest", "Night Sky", "Rain"]
SOUND_TYPES = ["Music", "Nature", "Silence"]
SESSION_DURATIONS = ["5 min", "10 min", "15 min", "20 min"]
COMPLEXITY_LABELS = {0: "Medium", 1: "Simple"}

AGE_LABELS = {
    "below-25": "Below 25",
    "25-50": "25-50",
    "above-50": "Above 50",
}

PURPOSE_LABELS = {
    "relaxation": "Relaxation",
    "better-sleep": "Better Sleep",
    "calm-mind": "Calm Mind",
    "stress-relief": "Stress Relief",
    "focus-improvement": "Focus Improvement",
    "emotional-comfort": "Emotional Comfort",
}

INTERACTION_LABELS = {
    "tap": "Tap",
    "hold": "Hold",
    "swipe": "Swipe",
    "guided-breathing": "Guided Breathing",
}


class RecommendationRequest(BaseModel):
    age_group: Literal["below-25", "25-50", "above-50"]
    meditation_purpose: Literal[
        "relaxation",
        "better-sleep",
        "calm-mind",
        "stress-relief",
        "focus-improvement",
        "emotional-comfort",
    ]
    interaction_style: Literal["tap", "hold", "swipe", "guided-breathing"]


class RecommendationResponse(BaseModel):
    Recommended_Environment: str
    Recommended_Sound_Type: str
    Recommended_Session_Duration: str
    Recommended_Complexity: str
    confidence: float = Field(ge=0, le=1)


@lru_cache(maxsize=1)
def _load_model() -> Any:
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f"Meditation model is missing: {MODEL_PATH}")
    return joblib.load(MODEL_PATH)


def _encode_candidate(
    *,
    model: Any,
    age_group: str,
    meditation_purpose: str,
    interaction_style: str,
    environment: str,
    sound_type: str,
    duration: str,
) -> pd.DataFrame:
    feature_names = list(model.feature_names_in_)
    row = {feature: 0 for feature in feature_names}
    values = {
        "Age_Group": age_group,
        "Meditation_Purpose": meditation_purpose,
        "Interaction_Style": interaction_style,
        "Recommended_Environment": environment,
        "Recommended_Sound_Type": sound_type,
        "Recommended_Session_Duration": duration,
    }

    for column, value in values.items():
        feature = f"{column}_{value}"
        if feature in row:
            row[feature] = 1

    return pd.DataFrame([row], columns=feature_names)


def _preference_score(
    purpose: str,
    interaction: str,
    environment: str,
    sound_type: str,
    duration: str,
) -> float:
    purpose_matches = {
        "Relaxation": {"Forest": 0.9, "Beach": 0.7, "Rain": 0.6},
        "Better Sleep": {"Night Sky": 1.0, "Rain": 0.8, "Beach": 0.5},
        "Calm Mind": {"Forest": 1.0, "Beach": 0.7, "Night Sky": 0.6},
        "Stress Relief": {"Rain": 1.0, "Forest": 0.8, "Beach": 0.6},
        "Focus Improvement": {"Forest": 0.9, "Rain": 0.6, "Beach": 0.5},
        "Emotional Comfort": {"Night Sky": 0.9, "Beach": 0.8, "Forest": 0.6},
    }
    sound_matches = {
        "Relaxation": {"Nature": 0.8, "Music": 0.6},
        "Better Sleep": {"Silence": 0.9, "Nature": 0.7},
        "Calm Mind": {"Nature": 0.8, "Silence": 0.7},
        "Stress Relief": {"Nature": 0.9, "Music": 0.6},
        "Focus Improvement": {"Silence": 0.8, "Nature": 0.6},
        "Emotional Comfort": {"Music": 0.8, "Nature": 0.7},
    }
    duration_matches = {
        "Relaxation": {"10 min": 0.8, "15 min": 0.7},
        "Better Sleep": {"20 min": 0.9, "15 min": 0.8},
        "Calm Mind": {"10 min": 0.8, "15 min": 0.7},
        "Stress Relief": {"10 min": 0.8, "15 min": 0.7},
        "Focus Improvement": {"5 min": 0.8, "10 min": 0.7},
        "Emotional Comfort": {"15 min": 0.8, "10 min": 0.7},
    }

    score = purpose_matches.get(purpose, {}).get(environment, 0.2)
    score += sound_matches.get(purpose, {}).get(sound_type, 0.2)
    score += duration_matches.get(purpose, {}).get(duration, 0.2)

    if interaction == "Guided Breathing" and duration in {"10 min", "15 min"}:
        score += 0.25
    if interaction == "Tap" and duration == "5 min":
        score += 0.2
    if interaction == "Hold" and environment in {"Rain", "Night Sky"}:
        score += 0.2
    if interaction == "Swipe" and environment == "Beach":
        score += 0.2

    return score


@router.get("/health")
def meditation_health() -> dict[str, str]:
    try:
        _load_model()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Meditation recommendation model is unavailable: {exc}",
        ) from exc
    return {"status": "ok", "model": MODEL_PATH.name}


@router.post("/recommend", response_model=RecommendationResponse)
def recommend(payload: RecommendationRequest) -> RecommendationResponse:
    try:
        model = _load_model()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Meditation recommendation model is unavailable: {exc}",
        ) from exc

    age_group = AGE_LABELS[payload.age_group]
    purpose = PURPOSE_LABELS[payload.meditation_purpose]
    interaction = INTERACTION_LABELS[payload.interaction_style]

    best: dict[str, Any] | None = None
    for environment, sound_type, duration in product(
        ENVIRONMENTS, SOUND_TYPES, SESSION_DURATIONS
    ):
        encoded = _encode_candidate(
            model=model,
            age_group=age_group,
            meditation_purpose=purpose,
            interaction_style=interaction,
            environment=environment,
            sound_type=sound_type,
            duration=duration,
        )
        prediction = int(model.predict(encoded)[0])
        probabilities = (
            model.predict_proba(encoded)[0]
            if hasattr(model, "predict_proba")
            else [0.5, 0.5]
        )
        confidence = float(max(probabilities))
        score = confidence + _preference_score(
            purpose, interaction, environment, sound_type, duration
        )

        candidate = {
            "environment": environment,
            "sound_type": sound_type,
            "duration": duration,
            "complexity": COMPLEXITY_LABELS.get(prediction, str(prediction)),
            "confidence": confidence,
            "score": score,
        }
        if best is None or candidate["score"] > best["score"]:
            best = candidate

    if best is None:
        raise HTTPException(status_code=500, detail="No meditation recommendation was generated")

    return RecommendationResponse(
        Recommended_Environment=best["environment"],
        Recommended_Sound_Type=best["sound_type"],
        Recommended_Session_Duration=best["duration"],
        Recommended_Complexity=best["complexity"],
        confidence=round(best["confidence"], 3),
    )
