"""
src/api/progress_routes.py
Progress tracking — MongoDB Atlas version, matching the real db.py (plain
synchronous pymongo, NOT the async motor driver — no `await` on DB calls).
Visits are tied to the logged-in patient via your existing JWT token.
"""

import logging
from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from src.api.auth import decode_token
from src.api.db import db  # the pymongo Database object exported by db.py

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/progress", tags=["progress"])

visits_collection = db["ipe_visits"]


def init_visits_table():
    """No-op for MongoDB — collections are created implicitly on first
    insert, unlike SQLite which needed an explicit CREATE TABLE. Kept only
    so main.py's existing import line doesn't need to change."""
    pass


def _require_patient_id(authorization: str | None) -> str:
    """Extracts and validates patient_id from a `Bearer <token>` header —
    same JWT your login already issues, so patients can only touch their
    own visits."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = authorization.removeprefix("Bearer ").strip()
    patient_id = decode_token(token)
    if not patient_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return patient_id


class VisitIn(BaseModel):
    patient_id   : str
    visit_label  : str   = "Visit"
    class_name   : str
    confidence   : float
    ppi          : float
    ppi_label    : str
    fis_speech   : float
    fis_swallowing: float  # ← was fis_swallow
    fis_mouth    : float
    erythema     : float
    ulceration   : float
    texture      : float
    physio       : float
    urgency      : str   = ""
    
@router.post("/save")
def save_visit_route(visit: VisitIn, authorization: str = Header(None)):
    patient_id = _require_patient_id(authorization)
    doc = {
        **visit.dict(),
        "patient_id": patient_id,
        "visit_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "created_at": datetime.utcnow().isoformat(),
    }
    try:
        result = visits_collection.insert_one(doc)  # sync — no await
        return {"success": True, "id": str(result.inserted_id)}
    except Exception as e:
        logger.error(f"save_visit error: {e}")
        raise HTTPException(status_code=500, detail="Could not save visit.")


@router.get("/history")
def get_history_route(authorization: str = Header(None)):
    patient_id = _require_patient_id(authorization)
    try:
        cursor = visits_collection.find({"patient_id": patient_id})
        visits = []
        for v in cursor:
            v["id"] = str(v.pop("_id"))
            visits.append(v)
        visits.sort(key=lambda v: v.get("created_at", ""))
        return {"success": True, "visits": visits}
    except Exception as e:
        logger.error(f"get_history error: {e}")
        return {"success": False, "visits": [], "error": str(e)}


@router.delete("/visit/{visit_id}")
def delete_visit_route(visit_id: str, authorization: str = Header(None)):
    patient_id = _require_patient_id(authorization)
    try:
        oid = ObjectId(visit_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid visit id.")
    result = visits_collection.delete_one({"_id": oid, "patient_id": patient_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Visit not found.")
    return {"success": True}


@router.delete("/history")
def clear_history_route(authorization: str = Header(None)):
    patient_id = _require_patient_id(authorization)
    visits_collection.delete_many({"patient_id": patient_id})
    return {"success": True}