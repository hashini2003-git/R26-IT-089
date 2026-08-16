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

from src.api.predict import router as predict_router
from src.api.assistant import router as assistant_router
from src.api.report    import router as report_router
from src.api.progress_routes import router as progress_router, init_visits_table

from src.api.auth import create_token, decode_token
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

app.include_router(predict_router)
app.include_router(assistant_router)
app.include_router(report_router)
app.include_router(progress_router)

init_db()

# ── Model loading ─────────────────────────────────────────────────────────────

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"
MODELS: dict = {}


def load_models() -> None:
    paths = {
        "voice_quality": MODELS_DIR / "voice_quality" / "voice_quality_model.pkl",
        "stuttering":    MODELS_DIR / "stuttering"    / "stuttering_model.pkl",
        "dysarthria":    MODELS_DIR / "dysarthria"    / "dysarthria_model.pkl",
        "severity":      MODELS_DIR / "severity"      / "severity_model.pkl",
    }
    for name, path in paths.items():
        if path.exists():
            MODELS[name] = joblib.load(str(path))
            logger.info(f"Loaded: {name}")
        else:
            logger.warning(f"Model not found: {path}")


load_models()

# ── Sentiment models ──────────────────────────────────────────────────────────

SENTIMENT_CLASSICAL_DIR = MODELS_DIR / "sentiment"
LABEL_ORDER    = ["negative", "neutral", "positive"]

# Holds all loaded sentiment models keyed by slug
SENT_MODELS: dict = {}
LSTM_SCRATCH_META: dict = {}


class _LSTMScratchNet(nn.Module):
    """BiLSTM trained from scratch on the reviews dataset."""
    def __init__(self, vocab_size: int, embed_dim: int, hidden_dim: int,
                 n_layers: int, n_classes: int, dropout: float = 0.4):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.dropout   = nn.Dropout(dropout)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, n_layers,
                            batch_first=True,
                            dropout=dropout if n_layers > 1 else 0.0,
                            bidirectional=True)
        self.fc = nn.Linear(hidden_dim * 2, n_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        emb = self.dropout(self.embedding(x))
        _, (h, _) = self.lstm(emb)
        return self.fc(self.dropout(torch.cat([h[-2], h[-1]], dim=1)))


def _tokenize(text: str) -> torch.Tensor:
    vocab   = SENTIMENT_META["vocab"]
    max_len = SENTIMENT_META["max_len"]
    unk     = vocab.get("<UNK>", 1)
    pad     = vocab.get("<PAD>", 0)
    ids = [vocab.get(t, unk) for t in text.lower().split()][:max_len]
    ids += [pad] * (max_len - len(ids))
    return torch.tensor([ids], dtype=torch.long)


def _lstm_predict(text: str) -> list[float]:
    """Returns [neg_prob, neu_prob, pos_prob] ordered by LABEL_ORDER."""
    with torch.no_grad():
        logits = SENT_MODELS["lstm"](_tokenize(text))
        probs  = torch.softmax(logits, dim=-1)[0].tolist()
    # lstm output order matches label_map: neg=0, neu=1, pos=2
    return probs


def _classical_predict(key: str, text: str) -> list[float]:
    """Returns probs reordered to LABEL_ORDER."""
    model   = SENT_MODELS[key]
    probs   = model.predict_proba([text])[0]        # shape (3,) — sklearn class order
    classes = list(model.classes_)
    return [float(probs[classes.index(l)]) for l in LABEL_ORDER]


def _xgboost_predict(text: str) -> list[float]:
    """TF-IDF + XGBoost → [neg, neu, pos] aligned to LABEL_ORDER."""
    bundle = SENT_MODELS["xgboost"]
    X      = bundle["tfidf"].transform([text])
    probs  = bundle["clf"].predict_proba(X)[0]  # order matches LABEL2IDX == LABEL_ORDER
    return [float(p) for p in probs]


def _lstm_scratch_predict(text: str) -> list[float]:
    """BiLSTM-scratch → [neg, neu, pos]."""
    vocab   = LSTM_SCRATCH_META["vocab"]
    max_len = LSTM_SCRATCH_META["max_len"]
    unk = vocab.get("<UNK>", 1)
    pad = vocab.get("<PAD>", 0)
    ids = [vocab.get(t, unk) for t in text.lower().split()][:max_len]
    ids += [pad] * (max_len - len(ids))
    x = torch.tensor([ids], dtype=torch.long)
    with torch.no_grad():
        probs = torch.softmax(SENT_MODELS["lstm_scratch"](x), dim=-1)[0].tolist()
    return probs  # neg=0, neu=1, pos=2 matches LABEL_ORDER


def _bert_predict(text: str) -> list[float]:
    """DistilBERT CLS + LogReg head → [neg, neu, pos]."""
    bundle    = SENT_MODELS["bert"]
    clf       = bundle["clf"]
    tokenizer = bundle["tokenizer"]
    bert_mdl  = bundle["bert_model"]
    max_len   = bundle["max_len"]
    classes   = bundle["classes"]

    enc = tokenizer([text], padding=True, truncation=True,
                    max_length=max_len, return_tensors="pt")
    with torch.no_grad():
        out = bert_mdl(**enc)
    cls_emb = out.last_hidden_state[:, 0, :].numpy()
    probs   = clf.predict_proba(cls_emb)[0]
    return [float(probs[classes.index(l)]) for l in LABEL_ORDER]


def load_sentiment_models() -> None:
    global LSTM_SCRATCH_META

    # 1-3. Classical sklearn pipelines
    for key, filename in [
        ("naivebayes", "naivebayes_sentiment.pkl"),
        ("logreg",     "logreg_sentiment.pkl"),
        ("svm",        "svm_sentiment.pkl"),
    ]:
        path = SENTIMENT_CLASSICAL_DIR / filename
        if path.exists():
            SENT_MODELS[key] = joblib.load(str(path))
            logger.info(f"Loaded: sentiment {key}")
        else:
            logger.warning(f"Sentiment model not found: {path}")

    # 5. TF-IDF + XGBoost
    xgb_path = SENTIMENT_CLASSICAL_DIR / "xgboost_sentiment.pkl"
    if xgb_path.exists():
        SENT_MODELS["xgboost"] = joblib.load(str(xgb_path))
        logger.info("Loaded: sentiment XGBoost")
    else:
        logger.warning(f"Sentiment model not found: {xgb_path}")

    # 6. LSTM from scratch
    lstm_meta_path  = SENTIMENT_CLASSICAL_DIR / "lstm_scratch_meta.json"
    lstm_model_path = SENTIMENT_CLASSICAL_DIR / "lstm_scratch_sentiment.pt"
    if lstm_meta_path.exists() and lstm_model_path.exists():
        LSTM_SCRATCH_META = json.loads(lstm_meta_path.read_text())
        m = _LSTMScratchNet(
            vocab_size = LSTM_SCRATCH_META["vocab_size"],
            embed_dim  = LSTM_SCRATCH_META["embed_dim"],
            hidden_dim = LSTM_SCRATCH_META["hidden_dim"],
            n_layers   = LSTM_SCRATCH_META["n_layers"],
            n_classes  = 3,
        )
        m.load_state_dict(torch.load(str(lstm_model_path), map_location="cpu", weights_only=True))
        m.eval()
        SENT_MODELS["lstm_scratch"] = m
        logger.info("Loaded: sentiment LSTM (scratch)")
    else:
        logger.warning(f"Sentiment LSTM-scratch not found")

    # 7. BERT (DistilBERT CLS + LogReg)
    bert_path = SENTIMENT_CLASSICAL_DIR / "bert_sentiment.pkl"
    if bert_path.exists():
        try:
            bundle    = joblib.load(str(bert_path))
            bert_name = bundle.get("bert_model", "distilbert-base-uncased")
            tokenizer = AutoTokenizer.from_pretrained(bert_name)
            bert_mdl  = AutoModel.from_pretrained(bert_name)
            bert_mdl.eval()
            SENT_MODELS["bert"] = {
                "clf":        bundle["clf"],
                "tokenizer":  tokenizer,
                "bert_model": bert_mdl,
                "max_len":    bundle.get("max_len", 128),
                "classes":    bundle["classes"],
            }
            logger.info("Loaded: sentiment BERT (DistilBERT)")
        except Exception as e:
            logger.warning(f"BERT sentiment model failed to load: {e}")
    else:
        logger.warning(f"Sentiment model not found: {bert_path}")


load_sentiment_models()


# ── Feature extraction ────────────────────────────────────────────────────────

FEATURE_COLS = [
    "f0_mean", "f0_std", "f0_min", "f0_max", "f0_range",
    "jitter_local", "jitter_abs", "jitter_rap", "jitter_ppq5",
    "shimmer_local", "shimmer_local_db", "shimmer_apq3", "shimmer_apq5", "shimmer_apq11",
    "hnr",
    *[f"mfcc_{i+1:02d}_mean" for i in range(13)],
    *[f"mfcc_{i+1:02d}_std"  for i in range(13)],
    *[f"delta_mfcc_{i+1:02d}_mean" for i in range(13)],
    "zcr_mean", "zcr_std", "rms_mean", "rms_std",
    "spectral_centroid_mean", "spectral_centroid_std", "spectral_rolloff_mean",
]

SEVERITY_LABELS = {0: "none", 1: "mild", 2: "moderate", 3: "severe"}
SEVERITY_COLORS = {0: "green", 1: "yellow", 2: "orange", 3: "red"}


def extract_features(wav_path: str) -> dict:
    feats: dict = {}
    try:
        sound = parselmouth.Sound(wav_path)
        pitch = call(sound, "To Pitch", 0.0, 75, 600)
        f0    = pitch.selected_array["frequency"]
        f0    = f0[f0 > 0]
        if len(f0) > 0:
            feats.update({
                "f0_mean":  float(np.mean(f0)), "f0_std":   float(np.std(f0)),
                "f0_min":   float(np.min(f0)),  "f0_max":   float(np.max(f0)),
                "f0_range": float(np.ptp(f0)),
            })
        else:
            for k in ["f0_mean", "f0_std", "f0_min", "f0_max", "f0_range"]:
                feats[k] = 0.0
        pp = call(sound, "To PointProcess (periodic, cc)", 75, 600)
        feats["jitter_local"]     = call(pp, "Get jitter (local)",           0, 0, 0.0001, 0.02, 1.3)
        feats["jitter_abs"]       = call(pp, "Get jitter (local, absolute)", 0, 0, 0.0001, 0.02, 1.3)
        feats["jitter_rap"]       = call(pp, "Get jitter (rap)",             0, 0, 0.0001, 0.02, 1.3)
        feats["jitter_ppq5"]      = call(pp, "Get jitter (ppq5)",            0, 0, 0.0001, 0.02, 1.3)
        feats["shimmer_local"]    = call([sound, pp], "Get shimmer (local)",    0, 0, 0.0001, 0.02, 1.3, 1.6)
        feats["shimmer_local_db"] = call([sound, pp], "Get shimmer (local_dB)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
        feats["shimmer_apq3"]     = call([sound, pp], "Get shimmer (apq3)",     0, 0, 0.0001, 0.02, 1.3, 1.6)
        feats["shimmer_apq5"]     = call([sound, pp], "Get shimmer (apq5)",     0, 0, 0.0001, 0.02, 1.3, 1.6)
        feats["shimmer_apq11"]    = call([sound, pp], "Get shimmer (apq11)",    0, 0, 0.0001, 0.02, 1.3, 1.6)
        har = call(sound, "To Harmonicity (cc)", 0.01, 75, 0.1, 1.0)
        feats["hnr"] = call(har, "Get mean", 0, 0)
    except Exception as e:
        logger.warning(f"Praat error: {e}")
        for k in ["f0_mean", "f0_std", "f0_min", "f0_max", "f0_range",
                  "jitter_local", "jitter_abs", "jitter_rap", "jitter_ppq5",
                  "shimmer_local", "shimmer_local_db", "shimmer_apq3",
                  "shimmer_apq5", "shimmer_apq11", "hnr"]:
            feats.setdefault(k, 0.0)
    try:
        y, sr = librosa.load(wav_path, sr=16000, mono=True)
        mfcc  = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        delta = librosa.feature.delta(mfcc)
        for i in range(13):
            feats[f"mfcc_{i+1:02d}_mean"]       = float(np.mean(mfcc[i]))
            feats[f"mfcc_{i+1:02d}_std"]        = float(np.std(mfcc[i]))
            feats[f"delta_mfcc_{i+1:02d}_mean"] = float(np.mean(delta[i]))
        zcr = librosa.feature.zero_crossing_rate(y)
        rms = librosa.feature.rms(y=y)
        cen = librosa.feature.spectral_centroid(y=y, sr=sr)
        rol = librosa.feature.spectral_rolloff(y=y, sr=sr)
        feats.update({
            "zcr_mean": float(np.mean(zcr)), "zcr_std": float(np.std(zcr)),
            "rms_mean": float(np.mean(rms)), "rms_std": float(np.std(rms)),
            "spectral_centroid_mean": float(np.mean(cen)),
            "spectral_centroid_std":  float(np.std(cen)),
            "spectral_rolloff_mean":  float(np.mean(rol)),
        })
    except Exception as e:
        logger.warning(f"Librosa error: {e}")
    return feats


def feats_to_array(feats: dict) -> np.ndarray:
    return np.array([[feats.get(k, 0.0) for k in FEATURE_COLS]])


async def audio_to_wav(file: UploadFile) -> str:
    content = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = tmp.name
    audio, _ = librosa.load(io.BytesIO(content), sr=16000, mono=True)

    # Reject silence / near-silent recordings
    rms = float(np.sqrt(np.mean(audio ** 2)))
    if rms < 0.005:
        raise HTTPException(
            status_code=422,
            detail="No voice detected in the recording. Please speak clearly and try again.",
        )
    # Minimum duration guard (at least 1.5 s of real speech)
    if len(audio) / 16000 < 1.5:
        raise HTTPException(
            status_code=422,
            detail="Recording too short. Please record at least 2 seconds of speech.",
        )

    sf.write(tmp_path, audio, 16000, subtype="PCM_16")
    return tmp_path


def determine_primary_disorder(vq: float, st: float, dy: float) -> str:
    if vq < 0.5 and st < 0.5 and dy < 0.5:
        return "healthy"
    probs = {"parkinsons": vq, "stuttering": st, "dysarthria": dy}
    return max(probs, key=probs.get)  # type: ignore[arg-type]


# ── Auth helpers ──────────────────────────────────────────────────────────────

def _get_patient_id(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return decode_token(authorization.removeprefix("Bearer "))


def _require_patient_id(authorization: Optional[str]) -> str:
    pid = _get_patient_id(authorization)
    if not pid:
        raise HTTPException(status_code=401, detail="Authentication required")
    return pid


init_visits_table()

# Load IPE model at startup
try:
    load_model()
    logger.info("IPE model ready!")
except Exception as e:
    logger.warning(f"Model load failed: {e}")

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


@app.get("/me", response_model=PatientOut)
def me(authorization: Optional[str] = Header(None)):
    pid     = _require_patient_id(authorization)
    patient = get_patient(pid)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return PatientOut(
        patient_id   = patient["patient_id"],
        name         = patient_display_name(patient),
        surgery_date = patient["surgery_date"],
        day_number   = patient_day_number(patient["created_at"]),
    )


@app.post("/analyze", response_model=AnalysisResult)
async def analyze(
    file:          UploadFile        = File(...),
    authorization: Optional[str]     = Header(None),
):
    tmp   = await audio_to_wav(file)
    feats = extract_features(tmp)
    X     = feats_to_array(feats)

    y, _     = librosa.load(tmp, sr=16000)
    duration = float(len(y) / 16000)

    vq_prob = float(MODELS["voice_quality"].predict_proba(X)[0, 1]) if "voice_quality" in MODELS else 0.0
    st_prob = float(MODELS["stuttering"].predict_proba(X)[0, 1])    if "stuttering"    in MODELS else 0.0
    dy_prob = float(MODELS["dysarthria"].predict_proba(X)[0, 1])    if "dysarthria"    in MODELS else 0.0
    sev_raw = float(MODELS["severity"].predict(X)[0])               if "severity"      in MODELS else 0.0
    sev_raw = max(0.0, min(3.0, sev_raw))

    disorder   = determine_primary_disorder(vq_prob, st_prob, dy_prob)
    is_healthy = disorder == "healthy"
    sev_idx    = round(sev_raw)
    sev_label  = SEVERITY_LABELS[sev_idx] if not is_healthy else "none"
    sev_color  = SEVERITY_COLORS[sev_idx] if not is_healthy else "green"

    if is_healthy:
        message = "Your speech sounds clear today. Keep up the great work with your recovery exercises."
    else:
        concern_map = {
            "parkinsons": "Vocal clarity concern",
            "stuttering":  "Speech fluency concern",
            "dysarthria":  "Articulation concern",
        }
        concern = concern_map.get(disorder, "Speech difficulty")
        message = (
            f"{concern} detected. Recovery stage: {sev_label}. "
            "Continue your speech therapy exercises."
        )

    result_dict = dict(
        is_healthy=is_healthy,
        primary_disorder=disorder,
        severity_score=round(sev_raw, 3),
        severity_label=sev_label,
        severity_color=sev_color,
        voice_quality_prob=round(vq_prob, 4),
        stuttering_prob=round(st_prob, 4),
        dysarthria_prob=round(dy_prob, 4),
        duration_s=round(duration, 3),
        message=message,
    )

    session_id: Optional[str] = None
    pid = _get_patient_id(authorization)
    if pid:
        try:
            session_id = save_session(pid, result_dict, duration)
        except Exception as e:
            logger.warning(f"Session save failed for {pid}: {e}")

    return AnalysisResult(**result_dict, session_id=session_id)


@app.get("/sessions", response_model=list[SessionOut])
def list_sessions(authorization: Optional[str] = Header(None)):
    pid  = _require_patient_id(authorization)
    rows = get_sessions(pid)
    return [SessionOut(**{**r, "is_healthy": bool(r["is_healthy"])}) for r in rows]


@app.get("/sessions/{session_id}", response_model=SessionOut)
def session_detail(session_id: str, authorization: Optional[str] = Header(None)):
    pid = _require_patient_id(authorization)
    row = get_session(session_id)
    if not row or row["patient_id"] != pid:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionOut(**{**row, "is_healthy": bool(row["is_healthy"])})


@app.get("/progress", response_model=list[ProgressPoint])
def progress(authorization: Optional[str] = Header(None)):
    pid = _require_patient_id(authorization)
    return get_progress(pid)


# ── Sentiment ──────────────────────────────────────────────────────────────────

SENTIMENT_MESSAGES = {
    "positive": "You sound optimistic today — that positive mindset supports recovery!",
    "neutral":  "You seem calm and steady. Keep going with your daily exercises.",
    "negative": "It sounds like today is tough. That's okay — recovery takes time. Reach out to your care team if you need support.",
}

SENTIMENT_MODEL_NAMES = {
    "naivebayes":   "Naive Bayes",
    "logreg":       "Logistic Regression",
    "svm":          "LinearSVC",
    "xgboost":      "TF-IDF + XGBoost",
    "lstm_scratch": "LSTM (scratch)",
    "bert":         "DistilBERT + LogReg",
    "ensemble":     "Ensemble (avg)",
}


class SentimentRequest(BaseModel):
    text:  str
    model: str = "ensemble"   # "naivebayes"|"logreg"|"svm"|"xgboost"|"lstm_scratch"|"bert"|"ensemble"


class ModelScore(BaseModel):
    model:     str
    sentiment: str
    positive:  float
    neutral:   float
    negative:  float


class SentimentResponse(BaseModel):
    sentiment:    str
    positive:     float
    neutral:      float
    negative:     float
    message:      str
    model_used:   str
    all_models:   list[ModelScore]


def _run_model(key: str, text: str) -> list[float]:
    """Returns [neg, neu, pos] probs."""
    if key == "lstm":
        return _lstm_predict(text)
    if key == "xgboost":
        return _xgboost_predict(text)
    if key == "lstm_scratch":
        return _lstm_scratch_predict(text)
    if key == "bert":
        return _bert_predict(text)
    return _classical_predict(key, text)


@app.post("/sentiment", response_model=SentimentResponse)
def sentiment(body: SentimentRequest):
    if not SENT_MODELS:
        raise HTTPException(status_code=503, detail="Sentiment models not available")
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Text cannot be empty")

    available = list(SENT_MODELS.keys())
    req_model = body.model.lower()

    if req_model not in SENTIMENT_MODEL_NAMES:
        raise HTTPException(status_code=422,
            detail=f"Unknown model '{req_model}'. Choose from: {list(SENTIMENT_MODEL_NAMES)}")

    # Run all available models
    per_model: dict[str, list[float]] = {}
    for key in available:
        try:
            per_model[key] = _run_model(key, text)
        except Exception as e:
            logger.warning(f"Sentiment {key} failed: {e}")

    if not per_model:
        raise HTTPException(status_code=503, detail="All sentiment models failed")

    # Determine final probs
    if req_model == "ensemble" or req_model not in per_model:
        arr  = np.array(list(per_model.values()))   # (n_models, 3)
        probs = arr.mean(axis=0).tolist()            # average
    else:
        probs = per_model[req_model]

    # neg=0, neu=1, pos=2 (LABEL_ORDER)
    predicted = LABEL_ORDER[int(np.argmax(probs))]

    all_scores = [
        ModelScore(
            model     = SENTIMENT_MODEL_NAMES.get(k, k),
            sentiment = LABEL_ORDER[int(np.argmax(v))],
            negative  = round(v[0], 4),
            neutral   = round(v[1], 4),
            positive  = round(v[2], 4),
        )
        for k, v in per_model.items()
    ]

    return SentimentResponse(
        sentiment  = predicted,
        negative   = round(probs[0], 4),
        neutral    = round(probs[1], 4),
        positive   = round(probs[2], 4),
        message    = SENTIMENT_MESSAGES[predicted],
        model_used = SENTIMENT_MODEL_NAMES.get(req_model, req_model),
        all_models = all_scores,
    )
