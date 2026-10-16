"""Seeds Firestore from backend/mock_data/*.json. Requires GCP credentials (gcloud auth application-default login).

    python scripts/seed_firestore.py --project YOUR_PROJECT_ID
"""

import argparse
import json
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from services.firestore_store import COLLECTIONS, ID_FIELDS  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True)
    args = parser.parse_args()

    from google.cloud import firestore

    db = firestore.Client(project=args.project)
    for collection in COLLECTIONS:
        path = BACKEND / "mock_data" / f"{collection}.json"
        docs = json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
        batch = db.batch()
        for doc in docs:
            batch.set(db.collection(collection).document(doc[ID_FIELDS[collection]]), doc)
        batch.commit()
        print(f"{collection}: {len(docs)} documents")


if __name__ == "__main__":
    main()
