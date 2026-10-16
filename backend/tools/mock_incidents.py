"""Mock incident tools."""

from models.schemas import new_id, utcnow
from services import audit
from services.firestore_store import get_store

SEVERITIES = {"P1", "P2", "P3", "P4"}


def list_incidents(status: str | None = None) -> list[dict]:
    """List incidents, optionally filtered by status (OPEN, INVESTIGATING, RESOLVED)."""
    filters = {"status": status} if status else {}
    return sorted(get_store().list("incidents", **filters), key=lambda i: i["created_at"], reverse=True)


def create_incident(title: str, severity: str, service_id: str, evidence: list[str], source: str = "agent:incident") -> dict:
    """Create a persistent incident record, or return the existing open one for the same service and title.

    Args:
        title: Short incident title.
        severity: One of P1, P2, P3, P4.
        service_id: Affected service or system identifier.
        evidence: References or short observations that support the incident.
        source: Actor that raised it.
    """
    if severity not in SEVERITIES:
        return {"error": f"Invalid severity {severity}"}
    store = get_store()
    for inc in store.list("incidents", service_id=service_id, title=title):
        if inc["status"] != "RESOLVED":
            store.update("incidents", inc["incident_id"], {"evidence": sorted(set(inc["evidence"]) | set(evidence)), "updated_at": utcnow()})
            return {**store.get("incidents", inc["incident_id"]), "deduplicated": True}

    incident = {
        "incident_id": new_id("INC"),
        "title": title,
        "severity": severity,
        "service_id": service_id,
        "status": "OPEN",
        "owner": None,
        "evidence": evidence,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    store.put("incidents", incident)
    audit.record(source, "incident.created", incident["incident_id"], "OPEN", details={"severity": severity})
    return incident


def update_incident(incident_id: str, status: str | None = None, owner: str | None = None, actor: str = "system") -> dict:
    changes = {"updated_at": utcnow()}
    if status:
        changes["status"] = status
    if owner:
        changes["owner"] = owner
    updated = get_store().update("incidents", incident_id, changes)
    if updated:
        audit.record(actor, "incident.updated", incident_id, updated["status"])
    return updated or {"error": f"Unknown incident {incident_id}"}
