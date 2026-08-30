"""Speech analysis, session history, progress, and sentiment endpoints."""

from __future__ import annotations

import io
import json
import logging
import math
import os
import tempfile
from pathlib import Path

import joblib
import librosa
import numpy as np
import parselmouth
import soundfile as sf
import torch
import torch.nn as nn
from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from parselmouth.praat import call
from pydantic import BaseModel

from src.api.auth import decode_token
from src.api.db import get_progress, get_session, get_sessions, save_session


logger = logging.getLogger(__name__)
router = APIRouter()

MODELS_DIR = Path(__file__).resolve().parents[2] / "models"
FEATURE_COLS = [
    "f0_mean", "f0_std", "f0_min", "f0_max", "f0_range",
    "jitter_local", "jitter_abs", "jitter_rap", "jitter_ppq5",
    "shimmer_local", "shimmer_local_db", "shimmer_apq3", "shimmer_apq5",
    "shimmer_apq11", "hnr",
    *[f"mfcc_{index:02d}_mean" for index in range(1, 14)],
    *[f"mfcc_{index:02d}_std" for index in range(1, 14)],
    *[f"delta_mfcc_{index:02d}_mean" for index in range(1, 14)],
    "zcr_mean", "zcr_std", "rms_mean", "rms_std",
    "spectral_centroid_mean", "spectral_centroid_std",
    "spectral_rolloff_mean",
]

SEVERITY_LABELS = {0: "none", 1: "mild", 2: "moderate", 3: "severe"}
SEVERITY_COLORS = {0: "green", 1: "yellow", 2: "orange", 3: "red"}


def _load_voice_models() -> dict[str, object]:
    paths = {
        "voice_quality": MODELS_DIR / "voice_quality" / "voice_quality_model.pkl",
        "stuttering": MODELS_DIR / "stuttering" / "stuttering_model.pkl",
        "dysarthria": MODELS_DIR / "dysarthria" / "dysarthria_model.pkl",
        "severity": MODELS_DIR / "severity" / "severity_model.pkl",
    }
    loaded: dict[str, object] = {}
    for name, path in paths.items():
        if not path.exists():
            logger.warning("Vocal-therapy model is missing: %s", path)
            continue
        try:
            loaded[name] = joblib.load(path)
            logger.info("Loaded vocal-therapy model: %s", name)
        except Exception:
            logger.exception("Could not load vocal-therapy model: %s", path)
    return loaded


VOICE_MODELS = _load_voice_models()


def _finite(value: object) -> float:
    try:
        number = float(value)
        return number if math.isfinite(number) else 0.0
    except (TypeError, ValueError):
        return 0.0


def extract_features(wav_path: str) -> dict[str, float]:
    features: dict[str, float] = {}
    try:
        sound = parselmouth.Sound(wav_path)
        pitch = call(sound, "To Pitch", 0.0, 75, 600)
        f0 = pitch.selected_array["frequency"]
        f0 = f0[f0 > 0]
        if len(f0):
            features.update(
                f0_mean=_finite(np.mean(f0)),
                f0_std=_finite(np.std(f0)),
                f0_min=_finite(np.min(f0)),
                f0_max=_finite(np.max(f0)),
                f0_range=_finite(np.ptp(f0)),
            )
        point_process = call(sound, "To PointProcess (periodic, cc)", 75, 600)
        features.update(
            jitter_local=_finite(call(point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)),
            jitter_abs=_finite(call(point_process, "Get jitter (local, absolute)", 0, 0, 0.0001, 0.02, 1.3)),
            jitter_rap=_finite(call(point_process, "Get jitter (rap)", 0, 0, 0.0001, 0.02, 1.3)),
            jitter_ppq5=_finite(call(point_process, "Get jitter (ppq5)", 0, 0, 0.0001, 0.02, 1.3)),
            shimmer_local=_finite(call([sound, point_process], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6)),
            shimmer_local_db=_finite(call([sound, point_process], "Get shimmer (local_dB)", 0, 0, 0.0001, 0.02, 1.3, 1.6)),
            shimmer_apq3=_finite(call([sound, point_process], "Get shimmer (apq3)", 0, 0, 0.0001, 0.02, 1.3, 1.6)),
            shimmer_apq5=_finite(call([sound, point_process], "Get shimmer (apq5)", 0, 0, 0.0001, 0.02, 1.3, 1.6)),
            shimmer_apq11=_finite(call([sound, point_process], "Get shimmer (apq11)", 0, 0, 0.0001, 0.02, 1.3, 1.6)),
        )
        harmonicity = call(sound, "To Harmonicity (cc)", 0.01, 75, 0.1, 1.0)
        features["hnr"] = _finite(call(harmonicity, "Get mean", 0, 0))
    except Exception as exc:
        logger.warning("Praat feature extraction failed: %s", exc)

    try:
        audio, sample_rate = librosa.load(wav_path, sr=16000, mono=True)
        mfcc = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=13)
        delta = librosa.feature.delta(mfcc)
        for index in range(13):
            features[f"mfcc_{index + 1:02d}_mean"] = _finite(np.mean(mfcc[index]))
            features[f"mfcc_{index + 1:02d}_std"] = _finite(np.std(mfcc[index]))
            features[f"delta_mfcc_{index + 1:02d}_mean"] = _finite(np.mean(delta[index]))
        zcr = librosa.feature.zero_crossing_rate(audio)
        rms = librosa.feature.rms(y=audio)
        centroid = librosa.feature.spectral_centroid(y=audio, sr=sample_rate)
        rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sample_rate)
        features.update(
            zcr_mean=_finite(np.mean(zcr)),
            zcr_std=_finite(np.std(zcr)),
            rms_mean=_finite(np.mean(rms)),
            rms_std=_finite(np.std(rms)),
            spectral_centroid_mean=_finite(np.mean(centroid)),
            spectral_centroid_std=_finite(np.std(centroid)),
            spectral_rolloff_mean=_finite(np.mean(rolloff)),
        )
    except Exception as exc:
        logger.warning("Librosa feature extraction failed: %s", exc)

    return {name: _finite(features.get(name, 0.0)) for name in FEATURE_COLS}


async def audio_to_wav(file: UploadFile) -> tuple[str, float]:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded audio file is empty.")
    try:
        audio, _ = librosa.load(io.BytesIO(content), sr=16000, mono=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not decode the audio file.") from exc

    duration = float(len(audio) / 16000)
    if duration < 1.5:
        raise HTTPException(status_code=422, detail="Recording too short. Please record at least 2 seconds of speech.")
    rms = float(np.sqrt(np.mean(audio**2)))
    if not math.isfinite(rms) or rms < 0.005:
        raise HTTPException(status_code=422, detail="No voice detected. Please speak clearly and try again.")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temporary:
        path = temporary.name
    sf.write(path, audio, 16000, subtype="PCM_16")
    return path, duration


def _patient_id(authorization: str | None, required: bool = True) -> str | None:
    scheme, _, token = (authorization or "").partition(" ")
    patient_id = decode_token(token) if scheme.lower() == "bearer" and token else None
    if required and not patient_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return patient_id


class AnalysisResult(BaseModel):
    is_healthy: bool
    primary_disorder: str
    severity_score: float
    severity_label: str
    severity_color: str
    voice_quality_prob: float
    stuttering_prob: float
    dysarthria_prob: float
    duration_s: float
    message: str
    session_id: str | None = None


class SessionOut(BaseModel):
    session_id: str
    patient_id: str
    recorded_at: str
    day_number: int
    duration_s: float
    vocal_clarity_prob: float
    fluency_prob: float
    articulation_prob: float
    severity_score: float
    severity_label: str
    is_healthy: bool
    primary_disorder: str
    message: str


class ProgressPoint(BaseModel):
    day_number: int
    vocal_clarity: float
    fluency: float
    articulation: float
    severity: float
    session_count: int


def _positive_probability(model: object, matrix: np.ndarray) -> float:
    probabilities = model.predict_proba(matrix)  # type: ignore[attr-defined]
    return _finite(probabilities[0, 1])


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_voice(
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
) -> AnalysisResult:
    required = {"voice_quality", "stuttering", "dysarthria", "severity"}
    missing = sorted(required - VOICE_MODELS.keys())
    if missing:
        raise HTTPException(status_code=503, detail=f"Voice models unavailable: {', '.join(missing)}")

    wav_path, duration = await audio_to_wav(file)
    try:
        features = extract_features(wav_path)
        matrix = np.asarray(
            [[features[name] for name in FEATURE_COLS]],
            dtype=float,
        )
        voice_quality = _positive_probability(VOICE_MODELS["voice_quality"], matrix)
        stuttering = _positive_probability(VOICE_MODELS["stuttering"], matrix)
        dysarthria = _positive_probability(VOICE_MODELS["dysarthria"], matrix)
        severity_score = max(
            0.0,
            min(3.0, _finite(VOICE_MODELS["severity"].predict(matrix)[0])),  # type: ignore[attr-defined]
        )
    except Exception as exc:
        logger.exception("Voice-model inference failed")
        raise HTTPException(status_code=500, detail="Voice analysis failed.") from exc
    finally:
        try:
            os.unlink(wav_path)
        except OSError:
            pass

    disorder_scores = {
        "parkinsons": voice_quality,
        "stuttering": stuttering,
        "dysarthria": dysarthria,
    }
    is_healthy = all(score < 0.5 for score in disorder_scores.values())
    primary_disorder = "healthy" if is_healthy else max(disorder_scores, key=disorder_scores.get)
    severity_index = 0 if is_healthy else max(0, min(3, round(severity_score)))
    severity_label = SEVERITY_LABELS[severity_index]
    severity_color = SEVERITY_COLORS[severity_index]
    if is_healthy:
        message = "Your speech sounds clear today. Keep up your recovery exercises."
    else:
        concern = {
            "parkinsons": "Vocal clarity concern",
            "stuttering": "Speech fluency concern",
            "dysarthria": "Articulation concern",
        }[primary_disorder]
        message = f"{concern} detected. Recovery stage: {severity_label}. Continue your speech therapy exercises."

    result = {
        "is_healthy": is_healthy,
        "primary_disorder": primary_disorder,
        "severity_score": round(severity_score, 3),
        "severity_label": severity_label,
        "severity_color": severity_color,
        "voice_quality_prob": round(voice_quality, 4),
        "stuttering_prob": round(stuttering, 4),
        "dysarthria_prob": round(dysarthria, 4),
        "duration_s": round(duration, 3),
        "message": message,
    }
    session_id = None
    patient_id = _patient_id(authorization, required=False)
    if patient_id:
        try:
            session_id = save_session(patient_id, result, duration)
        except Exception as exc:
            logger.warning("Could not save voice session for %s: %s", patient_id, exc)
    return AnalysisResult(**result, session_id=session_id)


@router.get("/sessions", response_model=list[SessionOut])
def list_sessions(authorization: str | None = Header(default=None)) -> list[SessionOut]:
    patient_id = _patient_id(authorization)
    return [SessionOut(**row) for row in get_sessions(patient_id or "")]


@router.get("/sessions/{session_id}", response_model=SessionOut)
def session_detail(
    session_id: str,
    authorization: str | None = Header(default=None),
) -> SessionOut:
    patient_id = _patient_id(authorization)
    row = get_session(session_id)
    if not row or row.get("patient_id") != patient_id:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionOut(**row)


@router.get("/progress", response_model=list[ProgressPoint])
def progress(authorization: str | None = Header(default=None)) -> list[ProgressPoint]:
    patient_id = _patient_id(authorization)
    return [ProgressPoint(**row) for row in get_progress(patient_id or "")]


LABEL_ORDER = ["negative", "neutral", "positive"]
SENTIMENT_MESSAGES = {
    "positive": "You sound optimistic today — that positive mindset supports recovery!",
    "neutral": "You seem calm and steady. Keep going with your daily exercises.",
    "negative": "It sounds like today is tough. Recovery takes time; contact your care team if you need support.",
}
SENTIMENT_NAMES = {
    "naivebayes": "Naive Bayes",
    "logreg": "Logistic Regression",
    "svm": "LinearSVC",
    "xgboost": "TF-IDF + XGBoost",
    "lstm_scratch": "LSTM (scratch)",
    "ensemble": "Ensemble (average)",
}


class _LSTMScratchNet(nn.Module):
    def __init__(self, vocab_size: int, embed_dim: int, hidden_dim: int, n_layers: int, dropout: float = 0.4):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.dropout = nn.Dropout(dropout)
        self.lstm = nn.LSTM(
            embed_dim,
            hidden_dim,
            n_layers,
            batch_first=True,
            dropout=dropout if n_layers > 1 else 0.0,
            bidirectional=True,
        )
        self.fc = nn.Linear(hidden_dim * 2, 3)

    def forward(self, values: torch.Tensor) -> torch.Tensor:
        embedded = self.dropout(self.embedding(values))
        _, (hidden, _) = self.lstm(embedded)
        return self.fc(self.dropout(torch.cat([hidden[-2], hidden[-1]], dim=1)))


def _load_sentiment_models() -> tuple[dict[str, object], dict[str, object]]:
    directory = MODELS_DIR / "sentiment"
    models: dict[str, object] = {}
    for key, filename in {
        "naivebayes": "naivebayes_sentiment.pkl",
        "logreg": "logreg_sentiment.pkl",
        "svm": "svm_sentiment.pkl",
        "xgboost": "xgboost_sentiment.pkl",
    }.items():
        path = directory / filename
        if path.exists():
            try:
                models[key] = joblib.load(path)
                if key == "logreg":
                    estimator = models[key].steps[-1][1]  # type: ignore[attr-defined]
                    if not hasattr(estimator, "multi_class"):
                        estimator.multi_class = "auto"
            except Exception:
                logger.exception("Could not load sentiment model: %s", path)

    metadata_path = directory / "lstm_scratch_meta.json"
    weights_path = directory / "lstm_scratch_sentiment.pt"
    metadata: dict[str, object] = {}
    if metadata_path.exists() and weights_path.exists():
        try:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            network = _LSTMScratchNet(
                vocab_size=int(metadata["vocab_size"]),
                embed_dim=int(metadata["embed_dim"]),
                hidden_dim=int(metadata["hidden_dim"]),
                n_layers=int(metadata["n_layers"]),
            )
            network.load_state_dict(torch.load(weights_path, map_location="cpu", weights_only=True))
            network.eval()
            models["lstm_scratch"] = network
        except Exception:
            logger.exception("Could not load LSTM sentiment model")
    return models, metadata


SENTIMENT_MODELS, SENTIMENT_METADATA = _load_sentiment_models()


def _sentiment_probabilities(key: str, text: str) -> list[float]:
    model = SENTIMENT_MODELS[key]
    if key == "xgboost":
        bundle = model  # type: ignore[assignment]
        values = bundle["tfidf"].transform([text])  # type: ignore[index]
        return [float(value) for value in bundle["clf"].predict_proba(values)[0]]  # type: ignore[index]
    if key == "lstm_scratch":
        vocabulary = SENTIMENT_METADATA["vocab"]
        maximum = int(SENTIMENT_METADATA["max_len"])
        unknown = vocabulary.get("<UNK>", 1)  # type: ignore[union-attr]
        padding = vocabulary.get("<PAD>", 0)  # type: ignore[union-attr]
        ids = [vocabulary.get(token, unknown) for token in text.lower().split()][:maximum]  # type: ignore[union-attr]
        ids += [padding] * (maximum - len(ids))
        with torch.no_grad():
            return torch.softmax(model(torch.tensor([ids], dtype=torch.long)), dim=-1)[0].tolist()  # type: ignore[operator]
    probabilities = model.predict_proba([text])[0]  # type: ignore[attr-defined]
    classes = list(model.classes_)  # type: ignore[attr-defined]
    return [float(probabilities[classes.index(label)]) for label in LABEL_ORDER]


class SentimentRequest(BaseModel):
    text: str
    model: str = "ensemble"


class ModelScore(BaseModel):
    model: str
    sentiment: str
    positive: float
    neutral: float
    negative: float


class SentimentResponse(BaseModel):
    sentiment: str
    positive: float
    neutral: float
    negative: float
    message: str
    model_used: str
    all_models: list[ModelScore]


@router.post("/sentiment", response_model=SentimentResponse)
def sentiment(body: SentimentRequest) -> SentimentResponse:
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Text cannot be empty")
    if not SENTIMENT_MODELS:
        raise HTTPException(status_code=503, detail="Sentiment models are unavailable")
    requested = body.model.lower()
    if requested != "ensemble" and requested not in SENTIMENT_MODELS:
        available = ", ".join(["ensemble", *sorted(SENTIMENT_MODELS)])
        raise HTTPException(status_code=422, detail=f"Model unavailable. Choose from: {available}")

    per_model: dict[str, list[float]] = {}
    for key in SENTIMENT_MODELS:
        try:
            per_model[key] = _sentiment_probabilities(key, text)
        except Exception as exc:
            logger.warning("Sentiment model %s failed: %s", key, exc)
    if not per_model:
        raise HTTPException(status_code=503, detail="All sentiment models failed")

    probabilities = (
        np.asarray(list(per_model.values()), dtype=float).mean(axis=0).tolist()
        if requested == "ensemble"
        else per_model[requested]
    )
    predicted = LABEL_ORDER[int(np.argmax(probabilities))]
    scores = [
        ModelScore(
            model=SENTIMENT_NAMES.get(key, key),
            sentiment=LABEL_ORDER[int(np.argmax(values))],
            negative=round(values[0], 4),
            neutral=round(values[1], 4),
            positive=round(values[2], 4),
        )
        for key, values in per_model.items()
    ]
    return SentimentResponse(
        sentiment=predicted,
        negative=round(probabilities[0], 4),
        neutral=round(probabilities[1], 4),
        positive=round(probabilities[2], 4),
        message=SENTIMENT_MESSAGES[predicted],
        model_used=SENTIMENT_NAMES.get(requested, requested),
        all_models=scores,
    )
