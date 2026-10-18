# ipe_scoring.py
# IPE Framework v2.0 — Scoring Functions
# Auto-exported from Colab Notebook

from ipe_constants import *

def get_physio_score(class_idx, site_idx):
    key = (class_idx, site_idx)
    if key in PROXY_PHYSIO_SCORE:
        return PROXY_PHYSIO_SCORE[key]
    class_avg = {0:0.81,1:0.38,2:0.09,3:0.05}
    return class_avg.get(class_idx, 0.10)


def compute_ppi(class_idx, site_idx,
                erythema=0.3,
                ulceration=0.2,
                texture=0.2):
    base       = CLASS_PAIN_BASE.get(class_idx, 0.0)
    site_bonus = SITE_PAIN_BONUS.get(site_idx, 0.05)
    physio     = get_physio_score(class_idx, site_idx)
    attenuation= 1.0 - (0.9 * physio)
    bonus = (
        erythema   * ERYTHEMA_WEIGHT   +
        ulceration * ULCERATION_WEIGHT +
        texture    * TEXTURE_WEIGHT
    ) * attenuation
    raw = base + site_bonus + bonus
    if class_idx == 0 and physio >= 0.75:
        return round(min(0.5, raw), 4)
    return round(min(10.0, raw), 4)


def compute_fis(class_idx, site_idx):
    weights    = SITE_FIS_WEIGHT.get(
        site_idx, SITE_FIS_WEIGHT[-1]
    )
    multiplier = CLASS_FIS_MULTIPLIER.get(
        class_idx, 0.0
    )
    return [
        round(min(w * multiplier, 1.0), 4)
        for w in weights
    ]


def get_pain_label(ppi):
    if ppi <= 1.0: return "No/Minimal Pain"
    if ppi <= 3.0: return "Mild Pain"
    if ppi <= 5.0: return "Moderate Pain"
    if ppi <= 7.5: return "Severe Pain"
    return "Very Severe Pain"


def get_pain_color(ppi):
    if ppi <= 1.0: return "#27AE60"
    if ppi <= 3.0: return "#F1C40F"
    if ppi <= 5.0: return "#E67E22"
    if ppi <= 7.5: return "#E74C3C"
    return "#C0392B"


def get_appointment_urgency(class_idx, ppi):
    if class_idx == 3:
        return {
            "urgency"  : "EMERGENCY",
            "timeframe": "TODAY",
            "color"    : "#C0392B",
            "emoji"    : "🚨",
            "message"  : "Call your clinic NOW.",
            "days"     : 0,
        }
    if ppi >= 8.0:
        return {
            "urgency"  : "URGENT",
            "timeframe": "Today or Tomorrow",
            "color"    : "#E74C3C",
            "emoji"    : "🔴",
            "message"  : "See a doctor today.",
            "days"     : 1,
        }
    if ppi >= 6.0:
        return {
            "urgency"  : "SOON",
            "timeframe": "Within 3 Days",
            "color"    : "#E67E22",
            "emoji"    : "🟠",
            "message"  : "Book within 3 days.",
            "days"     : 3,
        }
    if ppi >= 4.0 or class_idx == 2:
        return {
            "urgency"  : "THIS WEEK",
            "timeframe": "Within 2 Weeks",
            "color"    : "#F1C40F",
            "emoji"    : "🟡",
            "message"  : "Schedule within 2 weeks.",
            "days"     : 14,
        }
    return {
        "urgency"  : "ROUTINE",
        "timeframe": "Next Regular Visit",
        "color"    : "#27AE60",
        "emoji"    : "🟢",
        "message"  : "Continue routine checkups.",
        "days"     : 90,
    }


def get_treatment_plan(class_idx, ppi,
                       fis_speech, fis_swallow,
                       fis_mouth, erythema,
                       ulceration, texture):
    plan = {
        "immediate" : [],
        "short_term": [],
        "clinical"  : [],
        "lifestyle" : [],
    }
    # Immediate
    if ppi > 5:
        plan["immediate"].append(
            "Avoid spicy and hot foods"
        )
        plan["immediate"].append(
            "Warm salt water rinse 3x daily"
        )
    if ulceration > 0.4:
        plan["immediate"].append(
            "Apply topical anesthetic gel"
        )
    if texture > 0.5:
        plan["immediate"].append(
            "Gentle jaw stretching exercises"
        )
    # Short term
    if erythema > 0.5:
        plan["short_term"].append(
            "Anti-inflammatory mouthwash"
        )
    if ppi > 4:
        plan["short_term"].append(
            "Book dental appointment"
        )
    if ulceration > 0.3:
        plan["short_term"].append(
            "Ulcer protective gel (Orabase)"
        )
    # Clinical
    if class_idx == 3:
        plan["clinical"].append(
            "URGENT biopsy required"
        )
        plan["clinical"].append(
            "Immediate specialist referral"
        )
    elif class_idx == 2:
        plan["clinical"].append(
            "Biopsy recommended"
        )
        plan["clinical"].append(
            "Pain management: NSAIDs"
        )
    if fis_speech > 0.5:
        plan["clinical"].append(
            "Speech therapy referral"
        )
    if fis_swallow > 0.5:
        plan["clinical"].append(
            "Dietary modification needed"
        )
    if fis_mouth > 0.5:
        plan["clinical"].append(
            "Physiotherapy for jaw mobility"
        )
    # Lifestyle
    plan["lifestyle"].append(
        "Stop betel quid use if applicable"
    )
    plan["lifestyle"].append(
        "Quit smoking if applicable"
    )
    plan["lifestyle"].append(
        "Reduce alcohol consumption"
    )
    plan["lifestyle"].append(
        "Maintain good oral hygiene"
    )
    return plan


def get_assistant_response(ppi, class_idx,
                           class_name,
                           erythema, ulceration,
                           texture, physio):
    urgency = get_appointment_urgency(
        class_idx, ppi
    )
    pain_label = get_pain_label(ppi)

    response = (
        f"I have analyzed your image. "
        f"Your diagnosis is {class_name} "
        f"with a pain score of "
        f"{ppi:.1f} out of 10. "
        f"This is {pain_label}. "
    )

    if erythema > 0.6:
        response += (
            "I detected significant inflammation "
            "causing your burning sensation. "
        )
    if ulceration > 0.4:
        response += (
            "An open sore was found which is "
            "causing your sharp pain. "
        )
    if texture > 0.5:
        response += (
            "Tissue stiffness was detected "
            "which may restrict your mouth movement. "
        )

    response += urgency["message"]
    return response
