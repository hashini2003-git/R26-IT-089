"""src/api/assistant.py — AI Assistant Route"""

import sys
import logging
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel

MODELS_DIR = Path(__file__).parent / "models"
if str(MODELS_DIR) not in sys.path:
    sys.path.insert(0, str(MODELS_DIR))

from ipe_scoring import get_treatment_plan, get_appointment_urgency

logger = logging.getLogger(__name__)
router = APIRouter()

CLASS_NAMES = ["Normal","Variation from Normal","OPMD","Oral Cancer"]

class AssistantRequest(BaseModel):
    class_idx  : int
    class_name : str
    ppi        : float
    fis_speech : float
    fis_swallow: float
    fis_mouth  : float
    erythema   : float
    ulceration : float
    texture    : float
    physio     : float
    user_message: str = ""
    symptoms   : dict = {}

class AssistantResponse(BaseModel):
    message          : str
    voice_text       : str
    suggestions      : list
    symptom_validated: bool = False
    combined_score   : float = 0.0

@router.post("/assistant", response_model=AssistantResponse)
async def assistant(req: AssistantRequest):
    """AI Assistant — interprets IPE results for patient"""

    # Build voice message
    voice = (
        f"I have analyzed your image. "
        f"Your diagnosis is {req.class_name}. "
        f"Your pain score is {req.ppi:.1f} out of 10. "
    )

    if req.ppi <= 1.0:
        voice += "You are doing great! No significant pain detected. "
    elif req.ppi <= 3.0:
        voice += "Mild discomfort detected. Monitor regularly. "
    elif req.ppi <= 5.0:
        voice += "Moderate pain detected. Please see your doctor soon. "
    elif req.ppi <= 7.5:
        voice += "Significant pain detected. Please see your doctor now. "
    else:
        voice += "Critical pain detected! Urgent medical attention needed. "

    if req.erythema > 0.6:
        voice += "High inflammation detected causing your burning sensation. "
    if req.ulceration > 0.4:
        voice += "An open sore was found causing your sharp pain. "
    if req.texture > 0.5:
        voice += "Tissue stiffness detected restricting your movement. "

    # Symptom validation
    symptom_validated = False
    combined_score    = req.ppi

    if req.symptoms:
        burning  = req.symptoms.get("burning", False)
        eating   = req.symptoms.get("eating_pain", False)
        stiff    = req.symptoms.get("stiffness", False)

        confirmed = sum([
            burning  and req.erythema > 0.5,
            eating   and req.ulceration > 0.3,
            stiff    and req.texture > 0.4,
        ])

        if confirmed >= 2:
            symptom_validated = True
            combined_score    = min(10.0, req.ppi * 1.1)
            voice += (
                "Your symptoms confirm the AI findings. "
                "High confidence assessment. "
            )
        elif confirmed == 1:
            voice += (
                "Some symptoms match the AI findings. "
            )

    # Urgency
    urgency = get_appointment_urgency(req.class_idx, req.ppi)

    # Quick suggestions
    suggestions = []
    if req.ppi > 5:
        suggestions.append("Avoid spicy and hot foods")
        suggestions.append("Use warm salt water rinse")
    if req.ulceration > 0.4:
        suggestions.append("Apply topical anesthetic gel")
    if req.fis_speech > 0.5:
        suggestions.append("Speak slowly and rest your voice")
    if req.fis_swallow > 0.5:
        suggestions.append("Eat soft foods only")
    if req.class_idx == 3:
        suggestions.append("URGENT: Call your clinic immediately")
    elif req.class_idx == 2:
        suggestions.append("Book appointment within 3 days")

    suggestions.append(urgency["message"])

    # Display message
    message = (
        f"Based on your image analysis:\n"
        f"• Diagnosis: {req.class_name} "
        f"({req.ppi:.1f}/10 pain)\n"
        f"• Urgency: {urgency['timeframe']}\n"
        f"• {urgency['message']}"
    )

    return AssistantResponse(
        message          = message,
        voice_text       = voice,
        suggestions      = suggestions,
        symptom_validated= symptom_validated,
        combined_score   = combined_score,
    )