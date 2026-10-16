from agents.base import build_agent
from services import audit
from services.firestore_store import get_store


def list_compliance_controls(status: str | None = None) -> list[dict]:
    """List configured compliance controls, optionally filtered by status (PASSED, GAP, OVERDUE)."""
    filters = {"status": status} if status else {}
    return get_store().list("compliance_controls", **filters)


def recent_audit_events(limit: int = 50) -> list[dict]:
    """Return the most recent audit events for traceability checks."""
    return audit.recent(limit)


def create_compliance_agent():
    """Page 5: Control Monitoring, Evidence Collection, Audit Preparation."""
    return build_agent(
        name="compliance_agent",
        description="Evaluates controls, finds evidence gaps and drafts audit packages.",
        instruction="""
        Check each control's status and evidence references, flag missing or expired evidence,
        and verify that agent actions and approvals have matching audit events.
        This is a prototype; do not claim formal regulatory compliance.
        """,
        tools=[list_compliance_controls, recent_audit_events],
    )
