import os

from pydantic import BaseModel


def _cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS")
    if configured:
        return [origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip()]
    return [
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
    ]


class Settings(BaseModel):
    service_name: str = "oral-cancer-risk-api"
    cors_origins: list[str] = _cors_origins()
    disclaimer: str = "This is AI-assisted screening support and not a medical diagnosis."
    mongodb_uri: str | None = os.getenv("MONGODB_URI")
    mongodb_database: str = os.getenv("MONGODB_DATABASE", os.getenv("DATABASE_NAME", "oral_cancer_screening"))
    predictions_collection: str = os.getenv("MONGODB_PREDICTIONS_COLLECTION", "predictions")
    connection_timeout_ms: int = int(os.getenv("MONGODB_TIMEOUT_MS", "5000"))


settings = Settings()
