from typing import Any

from models.schemas import AuditEvent
from services.firestore_store import get_store


def record(actor: str, action: str, target: str, outcome: str, task_id: str | None = None,
           details: dict[str, Any] | None = None) -> dict:
    """Persist an audit event. Never pass secrets in details."""
    event = AuditEvent(actor=actor, action=action, target=target, outcome=outcome, related_task_id=task_id, details=details or {})
    return get_store().put("audit_events", event.model_dump())


def recent(limit: int = 50) -> list[dict]:
    events = get_store().list("audit_events")
    return sorted(events, key=lambda e: e["timestamp"], reverse=True)[:limit]
