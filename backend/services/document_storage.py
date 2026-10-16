"""Stores uploaded migration documents in Cloud Storage (gcs_bucket set) or a local folder."""

import re
from pathlib import Path

from config import get_settings

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".md", ".markdown", ".txt"}


def safe_filename(filename: str) -> str:
    """Strip any path and unsafe characters from a client-supplied file name."""
    name = Path(filename or "upload").name
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)[:120]
    return name or "upload"


def extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def save(document_id: str, filename: str, data: bytes) -> str:
    """Persist raw bytes and return a storage URI (gs://... or file://...)."""
    settings = get_settings()
    key = f"migration/{document_id}/{safe_filename(filename)}"
    if settings.gcs_bucket:
        from google.cloud import storage

        blob = storage.Client(project=settings.gcp_project).bucket(settings.gcs_bucket).blob(key)
        blob.upload_from_string(data)
        return f"gs://{settings.gcs_bucket}/{key}"
    path = settings.upload_dir / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return f"file://{key}"


def load(uri: str) -> bytes:
    settings = get_settings()
    if uri.startswith("gs://"):
        from google.cloud import storage

        bucket, _, key = uri[5:].partition("/")
        return storage.Client(project=settings.gcp_project).bucket(bucket).blob(key).download_as_bytes()
    if uri.startswith("file://"):
        root = settings.upload_dir.resolve()
        path = (root / uri[7:]).resolve()
        if root not in path.parents:
            raise ValueError("Invalid storage path")
        return path.read_bytes()
    raise ValueError("Unsupported storage URI")
