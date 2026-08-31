from datetime import datetime, timezone
from typing import Any
<<<<<<< Updated upstream
from uuid import uuid4

from pymongo import DESCENDING

from src.risk_voice.core.config import settings
from src.risk_voice.schemas.prediction import HistoryItem, PredictionRecord


_client: Any | None = None
_memory_records: list[PredictionRecord] = []


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _collection() -> Any | None:
    if _client is None:
        return None
    database = _client[settings.mongodb_database]
    return database[settings.predictions_collection]


def _serialize_record(record: PredictionRecord) -> dict[str, Any]:
    document = record.model_dump(mode="json")
    document["_id"] = document.pop("id")
    return document


def _record_from_document(document: dict[str, Any]) -> PredictionRecord:
    data = dict(document)
    data["id"] = str(data.pop("_id"))
    return PredictionRecord.model_validate(data)


async def connect_database() -> None:
    global _client
    if not settings.mongodb_uri:
        return
    from motor.motor_asyncio import AsyncIOMotorClient

    client = AsyncIOMotorClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=settings.connection_timeout_ms,
    )
    try:
        await client.admin.command("ping")
    except Exception:
        client.close()
        raise
    _client = client
    collection = _collection()
    if collection is not None:
        await collection.create_index([("date", -1)])
        await collection.create_index([("predictionType", -1), ("date", -1)])
        await collection.create_index([("patientId", 1), ("date", -1)])


async def close_database() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


async def database_status() -> str:
    if not settings.mongodb_uri:
        return "not_configured"
    if _client is None:
        return "disconnected"
    try:
        await _client.admin.command("ping")
    except Exception:
        return "unavailable"
    return "connected"


async def save_prediction_record(
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
        await collection.insert_one(_serialize_record(record))
    except Exception:
        _memory_records.insert(0, record)
    return record


async def get_prediction_records(patient_id: str, limit: int = 50) -> list[PredictionRecord]:
    limit = max(1, min(limit, 200))
    collection = _collection()
    if collection is None:
        return [record for record in _memory_records if record.patientId == patient_id][:limit]

    try:
        cursor = collection.find({"patientId": patient_id}).sort("date", DESCENDING).limit(limit)
        return [_record_from_document(document) async for document in cursor]
    except Exception:
        return [record for record in _memory_records if record.patientId == patient_id][:limit]


async def get_history(patient_id: str, limit: int = 50) -> list[HistoryItem]:
    records = await get_prediction_records(patient_id=patient_id, limit=limit)
    return [record.history for record in records if record.history is not None]
=======

from src.api.db import db
from src.risk_voice.schemas.prediction import PredictionResponse, RiskFactorsRequest


collection = db["risk_assessments"]
collection.create_index([("patient_id", 1), ("created_at", -1)])


def save_risk_assessment(
    patient_id: str,
    request: RiskFactorsRequest,
    response: PredictionResponse,
) -> str:
    document = {
        "patient_id": patient_id,
        "created_at": datetime.now(timezone.utc),
        "request": request.model_dump(mode="json"),
        "response": response.model_dump(mode="json"),
    }
    return str(collection.insert_one(document).inserted_id)


def get_risk_assessments(patient_id: str, limit: int) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    cursor = collection.find({"patient_id": patient_id}).sort("created_at", -1).limit(limit)
    for document in cursor:
        created_at = document["created_at"]
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        records.append(
            {
                "id": str(document["_id"]),
                "patientId": patient_id,
                "date": created_at.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
                "request": document["request"],
                "response": document["response"],
            }
        )
    return records
>>>>>>> Stashed changes
