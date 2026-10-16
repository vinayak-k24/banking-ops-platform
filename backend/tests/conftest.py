import os
import sys
from pathlib import Path

import pytest

# Tests never call Gemini, even when the repo .env enables agents (real env vars override .env).
os.environ["AGENTS_ENABLED"] = "false"

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.firestore_store import get_store  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_store():
    get_store().reset()
    yield
