"""Approval requests, simulated execution, and verification. Execution checks the approval server-side."""

from models.schemas import Approval, ApprovalDecision, new_id, utcnow
from services import audit, authorization
from services.firestore_store import get_store
from tools import mock_database


class ExecutionNotAuthorized(Exception):
    pass


def request_approval(task_id: str, action: str, target_system: str, parameters: dict, justification: str,
                     evidence: list[str], requested_by: str) -> dict:
    """Create an approval request for a sensitive action. Execution cannot proceed until a human approves."""
    approval = Approval(
        task_id=task_id,
        action=action,
        target_system=target_system,
        parameters=parameters,
        justification=justification,
        evidence=evidence,
        required_role=authorization.required_role(action),
        requested_by=requested_by,
    )
    get_store().put("approvals", approval.model_dump(mode="json"))
    audit.record(requested_by, "approval.requested", approval.approval_id, "PENDING", task_id, {"action": action})
    return approval.model_dump(mode="json")


def _assert_approved(approval_id: str, action: str, parameters: dict) -> dict:
    approval = get_store().get("approvals", approval_id)
    if not approval or approval["decision"] != ApprovalDecision.APPROVED.value:
        raise ExecutionNotAuthorized("Action has no granted approval.")
    # Approval applies only to the exact action and parameters that were reviewed.
    if approval["action"] != action or approval["parameters"] != parameters:
        raise ExecutionNotAuthorized("Approval scope does not match the requested execution.")
    return approval


def execute_simulated_maintenance(approval_id: str, database_id: str, archive_gb: float) -> dict:
    """Simulate archiving data to free capacity. Only runs with a matching granted approval."""
    params = {"database_id": database_id, "archive_gb": archive_gb}
    _assert_approved(approval_id, "execute_simulated_maintenance", params)

    store = get_store()
    snaps = sorted(store.list("database_metrics", database_id=database_id), key=lambda s: s["seq"])
    latest = snaps[-1]
    new_snap = {
        **latest,
        "snapshot_id": new_id("SNAP"),
        "seq": latest["seq"] + 1,
        "used_gb": round(max(latest["used_gb"] - archive_gb, 0), 1),
        "timestamp": utcnow(),
        "day": latest["day"],
        "note": f"post-maintenance (approval {approval_id})",
    }
    store.put("database_metrics", new_snap)
    for job in store.list("archival_jobs", database_id=database_id):
        if job["status"] in ("DELAYED", "LOCK_DELAY", "FAILED"):
            store.update("archival_jobs", job["job_id"], {"status": "COMPLETED", "last_error": None})
    queue = store.get("queue_metrics", "ARCHIVAL_QUEUE")
    if queue:
        store.update("queue_metrics", "ARCHIVAL_QUEUE", {"backlog": max(queue["backlog"] // 4, 0), "processing_rate_per_min": queue["arrival_rate_per_min"] + 5})

    execution = {"execution_id": new_id("EXE"), "approval_id": approval_id, "action": "execute_simulated_maintenance", "parameters": params, "finished_at": utcnow()}
    audit.record("agent:executor", "action.executed", database_id, "COMPLETED", details=execution)
    return execution


def verify_capacity_result(database_id: str, before_utilization_pct: float) -> dict:
    """Check post-action conditions against completion criteria. Never assumes success."""
    after = mock_database.get_database_metrics(database_id)
    queue = mock_database.get_queue_metrics("ARCHIVAL_QUEUE")
    checks = {
        "utilization_reduced": after["utilization_pct"] < before_utilization_pct,
        "below_warning_threshold": not after["warning_breached"],
        "queue_not_growing": not queue.get("backlog_growing", True),
    }
    outcome = "SUCCEEDED" if all(checks.values()) else ("NEEDS_INVESTIGATION" if checks["utilization_reduced"] else "FAILED")
    return {"checks": checks, "outcome": outcome, "after_utilization_pct": after["utilization_pct"], "verified_at": utcnow()}
