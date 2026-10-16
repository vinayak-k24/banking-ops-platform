"""Flagship workflow (Page 2): capacity warning -> investigation -> plan -> DBA approval -> execution -> verification."""

from config import get_settings
from models.schemas import TaskStatus
from tools import action_executor, mock_database, mock_incidents
from workflows.engine import PauseForApproval, StepDef, VerificationOutcome, WorkflowDef, register


def check_capacity(ctx: dict) -> dict:
    metrics = mock_database.get_database_metrics(ctx["database_id"])
    metrics.pop("history", None)
    return metrics


def inspect_archival(ctx: dict) -> dict:
    return mock_database.inspect_archival_job(database_id=ctx["database_id"])


def check_queue(ctx: dict) -> dict:
    return mock_database.get_queue_metrics("ARCHIVAL_QUEUE")


def retrieve_logs(ctx: dict) -> dict:
    return mock_database.query_mock_logs(ctx["database_id"], severity="ERROR", limit=10)


def correlate(ctx: dict) -> dict:
    cap, queue, arch = ctx["check_capacity"], ctx["check_queue"], ctx["inspect_archival"]
    observations = []
    if cap["warning_breached"]:
        observations.append(f"Utilization {cap['utilization_pct']}% exceeds warning threshold")
    if queue.get("backlog_growing"):
        observations.append(f"Archival queue backlog {queue['backlog']} and growing")
    if arch["delayed_or_failed"]:
        observations.append(f"Archival jobs delayed/failed: {', '.join(arch['delayed_or_failed'])}")

    incident = None
    if cap["warning_breached"]:
        incident = mock_incidents.create_incident(
            title="Database capacity warning",
            severity="P2",
            service_id=ctx["database_id"],
            evidence=observations,
            source="agent:database_agent",
        )
    return {
        "observations": observations,
        "hypothesis": "Delayed archival may be contributing to storage growth (correlation, not proven cause).",
        "missing_evidence": ["Table-level growth breakdown"],
        "incident_id": incident["incident_id"] if incident else None,
    }


def plan_action(ctx: dict) -> dict:
    cap = ctx["check_capacity"]
    if not cap["warning_breached"]:
        return {"action_required": False, "reason": "Utilization below warning threshold"}

    # Free enough space to land 5 points below the warning threshold.
    target_pct = get_settings().db_capacity_warning_pct - 5
    archive_gb = round(cap["used_gb"] - cap["allocated_gb"] * target_pct / 100, 1)
    params = {"database_id": ctx["database_id"], "archive_gb": archive_gb}
    approval = action_executor.request_approval(
        task_id=ctx["task_id"],
        action="execute_simulated_maintenance",
        target_system=ctx["database_id"],
        parameters=params,
        justification=f"Archive {archive_gb} GB of historical partitions to bring utilization to ~{target_pct}%.",
        evidence=ctx["correlate"]["observations"],
        requested_by="agent:database_agent",
    )
    raise PauseForApproval(approval["approval_id"], {"action_required": True, "proposal": params, "approval_id": approval["approval_id"]})


def execute(ctx: dict) -> dict:
    plan = ctx["plan_action"]
    if not plan.get("action_required"):
        return {"skipped": True}
    p = plan["proposal"]
    return action_executor.execute_simulated_maintenance(plan["approval_id"], p["database_id"], p["archive_gb"])


def verify(ctx: dict) -> dict:
    result = action_executor.verify_capacity_result(ctx["database_id"], ctx["check_capacity"]["utilization_pct"])
    incident_id = ctx["correlate"].get("incident_id")
    if incident_id and result["outcome"] == "SUCCEEDED":
        mock_incidents.update_incident(incident_id, status="RESOLVED", actor="agent:verification_agent")
    raise VerificationOutcome(TaskStatus(result["outcome"]), result)


WORKFLOW = register(WorkflowDef(
    name="database_investigation",
    description="Investigate database capacity and archival health, propose and verify maintenance",
    source_page="dba",
    build_context=lambda params: {"database_id": params.get("database_id", "DB2_MAIN")},
    steps=[
        StepDef("check_capacity", "database_agent", "get_database_metrics", check_capacity),
        StepDef("inspect_archival", "database_agent", "inspect_archival_job", inspect_archival),
        StepDef("check_queue", "database_agent", "get_queue_metrics", check_queue),
        StepDef("retrieve_logs", "database_agent", "query_mock_logs", retrieve_logs),
        StepDef("correlate", "operations_agent", "create_incident", correlate),
        StepDef("plan_action", "database_agent", "request_approval", plan_action),
        StepDef("execute", "executor", "execute_simulated_maintenance", execute),
        StepDef("verify", "verification_agent", "verify_capacity_result", verify),
    ],
))
