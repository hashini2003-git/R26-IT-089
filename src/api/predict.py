"""
src/api/predict.py
IPE Model Inference Route
"""

import io
import sys
import logging
from pathlib import Path

import torch
from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image
from pydantic import BaseModel
from torchvision import transforms

from src.api.model import get_model, DEVICE

# ── Add models folder to path for ipe_scoring ─────────────────
MODELS_DIR = Path(__file__).parent / "models"
if str(MODELS_DIR) not in sys.path:
    sys.path.insert(0, str(MODELS_DIR))

from ipe_scoring import (
    compute_ppi,
    compute_fis,
    get_pain_label,
    get_pain_color,
    get_appointment_urgency,
    get_treatment_plan,
    get_assistant_response,
)

logger = logging.getLogger(__name__)
router  = APIRouter()

# ── Class labels ──────────────────────────────────────────────
CLASS_NAMES = [
    "Normal",
    "Variation from Normal",
    "OPMD",
    "Oral Cancer"
]

UNKNOWN_SITE = -1

# ── Preprocessing ─────────────────────────────────────────────
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std =[0.229, 0.224, 0.225],
    ),
])


# ── Response Models ───────────────────────────────────────────
class VisualFeatures(BaseModel):
    erythema   : float
    ulceration : float
    texture    : float
    physio     : float

class PPIScore(BaseModel):
    score : float
    label : str
    color : str
    max   : int = 10

class FISScore(BaseModel):
    speech    : float
    swallowing: float
    mouth     : float

class ClassResult(BaseModel):
    name      : str
    index     : int
    confidence: float
    all_probs : dict

class Urgency(BaseModel):
    level    : str
    timeframe: str
    color    : str
    emoji    : str
    message  : str
    days     : int

class TreatmentPlan(BaseModel):
    immediate  : list
    short_term : list
    clinical   : list
    lifestyle  : list

class PredictionResponse(BaseModel):
    success            : bool
    filename           : str
    classification     : ClassResult
    ppi                : PPIScore
    fis                : FISScore
    visual_features    : VisualFeatures
    urgency            : Urgency
    treatment_plan     : TreatmentPlan
    assistant_message  : str


# ── Predict Route ─────────────────────────────────────────────
@router.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    """
    Upload oral cavity image → get full IPE analysis.
    Returns: class, PPI, FIS, visual features,
             urgency, treatment plan, assistant message
    """

    # ── Validate file ─────────────────────────────────────────
    if not file.content_type or \
       not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image."
        )

    # ── Load image ────────────────────────────────────────────
    try:
        image_bytes = await file.read()
        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")
    except Exception as e:
        logger.warning(f"Failed to read image: {e}")
        raise HTTPException(
            status_code=400,
            detail="Could not read image file."
        )

    # ── Model inference ───────────────────────────────────────
    model  = get_model()
    tensor = preprocess(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        output = model(tensor)

    # ── Extract raw values ────────────────────────────────────
    class_probs = torch.softmax(
        output["class_logits"], dim=1
    ).squeeze(0)

    pred_idx   = int(torch.argmax(class_probs).item())
    confidence = round(float(class_probs[pred_idx]), 4)
    erythema   = round(float(output["erythema"].item()),    4)
    ulceration = round(float(output["ulceration"].item()),  4)
    texture    = round(float(output["texture"].item()),     4)
    physio     = round(float(output["physio_score"].item()),4)

    all_probs = {
        CLASS_NAMES[i]: round(float(p), 4)
        for i, p in enumerate(class_probs)
    }

    # ── IPE Scoring (from ipe_scoring.py) ─────────────────────
    ppi_score = compute_ppi(
        pred_idx, UNKNOWN_SITE,
        erythema, ulceration, texture
    )
    fis_scores = compute_fis(pred_idx, UNKNOWN_SITE)
    pain_label = get_pain_label(ppi_score)
    pain_color = get_pain_color(ppi_score)
    urgency    = get_appointment_urgency(pred_idx, ppi_score)
    if "urgency" in urgency and "level" not in urgency:
        urgency["level"] = urgency.pop("urgency")
    treatment  = get_treatment_plan(
        pred_idx, ppi_score,
        fis_scores[0], fis_scores[1], fis_scores[2],
        erythema, ulceration, texture
    )
    assistant_msg = get_assistant_response(
        ppi_score, pred_idx,
        CLASS_NAMES[pred_idx],
        erythema, ulceration, texture, physio
    )

    # ── Build response ────────────────────────────────────────
    return PredictionResponse(
        success  = True,
        filename = file.filename or "image.jpg",

        classification = ClassResult(
            name      = CLASS_NAMES[pred_idx],
            index     = pred_idx,
            confidence= round(confidence * 100, 1),
            all_probs = {
                k: round(v * 100, 1)
                for k, v in all_probs.items()
            },
        ),

        ppi = PPIScore(
            score = ppi_score,
            label = pain_label,
            color = pain_color,
        ),

        fis = FISScore(
            speech     = round(fis_scores[0], 3),
            swallowing = round(fis_scores[1], 3),
            mouth      = round(fis_scores[2], 3),
        ),

        visual_features = VisualFeatures(
            erythema  = erythema,
            ulceration= ulceration,
            texture   = texture,
            physio    = physio,
        ),

        urgency = Urgency(**urgency),

        treatment_plan = TreatmentPlan(**treatment),

        assistant_message = assistant_msg,
    )