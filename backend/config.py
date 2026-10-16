from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent
# Single env file for the whole repo (frontend and backend). Absent in containers: Cloud Run sets real env vars.
ENV_FILE = BASE_DIR.parent / ".env"


class Settings(BaseSettings):
    """Runtime configuration. Values come from environment variables or the repo-root .env."""

    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

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
    # Hard cap on model calls per copilot question so a looping agent cannot drain credits.
    agent_max_llm_calls: int = 8

    cors_origins: list[str] = ["http://localhost:3000"]

    # Operational thresholds are configuration, not real banking limits.
    db_capacity_warning_pct: float = 80.0
    db_capacity_critical_pct: float = 90.0
    queue_backlog_warning: int = 1000
    max_step_retries: int = 2
    # Core banking health score (0-1): >= healthy is HEALTHY, >= warning is WARNING, else CRITICAL.
    core_health_healthy: float = 0.90
    core_health_warning: float = 0.75
    reconciliation_accuracy_target_pct: float = 99.5

    # Migration planner: uploads go to GCS when gcs_bucket is set, else to upload_dir.
    upload_dir: Path = BASE_DIR / "uploads"
    migration_max_upload_mb: int = 50
    migration_max_pages: int = 1500
    embedding_model: str = "text-embedding-004"
    migration_risk_buffer_pct: int = 20


@lru_cache
def get_settings() -> Settings:
    # The Gemini SDK reads GOOGLE_API_KEY / GOOGLE_GENAI_USE_VERTEXAI / GOOGLE_CLOUD_* from os.environ,
    # not from Settings, so export the .env into the process. Real env vars always win.
    load_dotenv(ENV_FILE, override=False)
    return Settings()


def gemini_credentials_problem() -> str | None:
    """Explain what is missing for Gemini calls, or None when credentials look configured."""
    import os

    vertex = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "").strip().lower() in ("1", "true", "yes")
    if os.getenv("GOOGLE_API_KEY", "").strip():
        return None  # AI Studio key, or Vertex AI express mode when GOOGLE_GENAI_USE_VERTEXAI=true
    if vertex and os.getenv("GOOGLE_CLOUD_PROJECT", "").strip():
        return None  # Vertex AI with Application Default Credentials (service account on Cloud Run)
    if vertex:
        return "GOOGLE_GENAI_USE_VERTEXAI=true needs GOOGLE_CLOUD_PROJECT (or a GOOGLE_API_KEY for express mode)."
    return "Set GOOGLE_API_KEY, or GOOGLE_GENAI_USE_VERTEXAI=true with GOOGLE_CLOUD_PROJECT."
