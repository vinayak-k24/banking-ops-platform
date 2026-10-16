from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    """Runtime configuration. Values come from environment variables or backend/.env."""

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    environment: str = "demo"
    # "memory" loads mock_data/*.json into process memory; "firestore" uses Google Cloud Firestore.
    store_backend: str = "memory"
    mock_data_dir: Path = BASE_DIR / "mock_data"

    gcp_project: str | None = None
    gcp_location: str = "us-central1"
    gcs_bucket: str | None = None

    # Gemini via Vertex AI (GOOGLE_GENAI_USE_VERTEXAI=true) or an API key (GOOGLE_API_KEY).
    gemini_model: str = "gemini-2.0-flash"
    agents_enabled: bool = False

    cors_origins: list[str] = ["http://localhost:3000"]

    # Operational thresholds are configuration, not real banking limits.
    db_capacity_warning_pct: float = 80.0
    db_capacity_critical_pct: float = 90.0
    queue_backlog_warning: int = 1000
    max_step_retries: int = 2


@lru_cache
def get_settings() -> Settings:
    return Settings()
