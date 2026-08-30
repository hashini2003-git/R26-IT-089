from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from pymongo import DESCENDING

from src.api.db import db
from src.risk_voice.core.config import settings
from src.risk_voice.schemas.prediction import HistoryItem, PredictionRecord


_memory_records: list[PredictionRecord] = []


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _collection() -> Any | None:
    if db is None:
        return None
    return db[settings.predictions_collection]


def initialize_database() -> None:
    collection = _collection()
    if collection is None:
        return
    collection.create_index([("patientId", 1), ("date", DESCENDING)])
    collection.create_index([("predictionType", 1), ("date", DESCENDING)])


def database_status() -> str:
    collection = _collection()
    if collection is None:
        return "memory"
    try:
        collection.database.client.admin.command("ping")
    except Exception:
        return "unavailable"
    return "connected"


def _serialize(record: PredictionRecord) -> dict[str, Any]:
    document = record.model_dump(mode="json")
    document["_id"] = document.pop("id")
    return document


def _deserialize(document: dict[str, Any]) -> PredictionRecord:
    data = dict(document)
    data["id"] = str(data.pop("_id"))
    return PredictionRecord.model_validate(data)


def save_prediction_record(
    *,
    patient_id: str,
    prediction_type: str,
    request_data: dict[str, Any],
    response_data: dict[str, Any],
    history: HistoryItem | None,
) -> PredictionRecord:
    record = PredictionRecord(
        id=str(uuid4()),
        patientId=patient_id,
        date=_utc_now(),
        predictionType=prediction_type,
        request=request_data,
        response=response_data,
        history=history,
    )
    collection = _collection()
    if collection is None:
        _memory_records.insert(0, record)
        return record
    try:
        collection.insert_one(_serialize(record))
    except Exception:
        _memory_records.insert(0, record)
    return record


def get_prediction_records(patient_id: str, limit: int = 50) -> list[PredictionRecord]:
    limit = max(1, min(limit, 200))
    collection = _collection()
    if collection is None:
        return [record for record in _memory_records if record.patientId == patient_id][:limit]
    try:
        cursor = collection.find({"patientId": patient_id}).sort("date", DESCENDING).limit(limit)
        return [_deserialize(document) for document in cursor]
    except Exception:
        return [record for record in _memory_records if record.patientId == patient_id][:limit]


def get_history(patient_id: str, limit: int = 50) -> list[HistoryItem]:
    records = get_prediction_records(patient_id=patient_id, limit=limit)
    return [record.history for record in records if record.history is not None]
