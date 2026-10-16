import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.firestore_store import get_store  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_store():
    get_store().reset()
    yield
