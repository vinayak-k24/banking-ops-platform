"""Shared state store for every mock entity (systems, metrics, incidents, tasks, approvals, audit events).

All pages read from the same collections so a single event (e.g. a capacity warning)
is consistent across the Database, Incident and Overview pages.
"""

import copy
import json
import threading
from abc import ABC, abstractmethod
from functools import lru_cache
from typing import Any

from config import get_settings

COLLECTIONS = [
    "systems",
    "database_metrics",
    "archival_jobs",
    "queue_metrics",
    "service_metrics",
    "incidents",
    "transactions",
    "reconciliation_exceptions",
    "reconciliation_runs",
    "cash_flow_daily",
    "compliance_controls",
    "migration_modules",
    "mock_logs",
    "agent_tasks",
    "approvals",
    "audit_events",
    "migration_documents",
    "migration_chunks",
    "migration_plans",
]

# Primary key field for each collection.
ID_FIELDS = {
    "systems": "system_id",
    "database_metrics": "snapshot_id",
    "archival_jobs": "job_id",
    "queue_metrics": "queue_id",
    "service_metrics": "service_id",
    "incidents": "incident_id",
    "transactions": "reference_id",
    "reconciliation_exceptions": "exception_id",
    "reconciliation_runs": "run_id",
    "cash_flow_daily": "date",
    "compliance_controls": "control_id",
    "migration_modules": "module_id",
    "mock_logs": "log_id",
    "agent_tasks": "task_id",
    "approvals": "approval_id",
    "audit_events": "event_id",
    "migration_documents": "document_id",
    "migration_chunks": "chunk_id",
    "migration_plans": "plan_id",
}


class Store(ABC):
    @abstractmethod
    def list(self, collection: str, **filters: Any) -> list[dict]: ...

    @abstractmethod
    def get(self, collection: str, doc_id: str) -> dict | None: ...

    @abstractmethod
    def put(self, collection: str, doc: dict) -> dict: ...

    @abstractmethod
    def update(self, collection: str, doc_id: str, changes: dict) -> dict | None: ...


class MemoryStore(Store):
    """Loads mock_data/*.json at startup. State is per process and resets on restart."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._data: dict[str, dict[str, dict]] = {c: {} for c in COLLECTIONS}
        self.reset()

    def reset(self) -> None:
        settings = get_settings()
        with self._lock:
            for collection in COLLECTIONS:
                path = settings.mock_data_dir / f"{collection}.json"
                docs = json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
                key = ID_FIELDS[collection]
                self._data[collection] = {d[key]: d for d in docs}

    def list(self, collection: str, **filters: Any) -> list[dict]:
        with self._lock:
            docs = self._data[collection].values()
            return [copy.deepcopy(d) for d in docs if all(d.get(k) == v for k, v in filters.items())]

    def get(self, collection: str, doc_id: str) -> dict | None:
        with self._lock:
            doc = self._data[collection].get(doc_id)
            return copy.deepcopy(doc) if doc else None

    def put(self, collection: str, doc: dict) -> dict:
        with self._lock:
            self._data[collection][doc[ID_FIELDS[collection]]] = copy.deepcopy(doc)
            return doc

    def update(self, collection: str, doc_id: str, changes: dict) -> dict | None:
        with self._lock:
            doc = self._data[collection].get(doc_id)
            if doc is None:
                return None
            doc.update(copy.deepcopy(changes))
            return copy.deepcopy(doc)


class FirestoreStore(Store):
    """Google Cloud Firestore implementation. Seed it with scripts/seed_firestore.py."""

    def __init__(self, project: str | None) -> None:
        from google.cloud import firestore

        self._db = firestore.Client(project=project)

    def list(self, collection: str, **filters: Any) -> list[dict]:
        query = self._db.collection(collection)
        for field, value in filters.items():
            query = query.where(field, "==", value)
        return [snap.to_dict() for snap in query.stream()]

    def get(self, collection: str, doc_id: str) -> dict | None:
        snap = self._db.collection(collection).document(doc_id).get()
        return snap.to_dict() if snap.exists else None

    def put(self, collection: str, doc: dict) -> dict:
        self._db.collection(collection).document(doc[ID_FIELDS[collection]]).set(doc)
        return doc

    def update(self, collection: str, doc_id: str, changes: dict) -> dict | None:
        ref = self._db.collection(collection).document(doc_id)
        if not ref.get().exists:
            return None
        ref.update(changes)
        return ref.get().to_dict()


@lru_cache
def get_store() -> Store:
    settings = get_settings()
    if settings.store_backend == "firestore":
        return FirestoreStore(settings.gcp_project)
    return MemoryStore()
