"""Page 3 workflow: detect service degradation, correlate with dependencies, open an incident."""

from tools import mock_database, mock_incidents, mock_monitoring
from workflows.engine import StepDef, WorkflowDef, register

LATENCY_SLO_MS = 300
ERROR_RATE_SLO = 1.0


def check_service(ctx: dict) -> dict:
    svc = mock_monitoring.get_service_metrics(ctx["service_id"])
    svc["degraded"] = svc.get("latency_ms", 0) > LATENCY_SLO_MS or svc.get("error_rate", 0) > ERROR_RATE_SLO
    return svc


def check_dependencies(ctx: dict) -> dict:
    deps = ctx["check_service"].get("dependencies", [])
    return {"dependencies": [mock_monitoring.get_service_metrics(d) for d in deps]}


def retrieve_logs(ctx: dict) -> dict:
    return mock_database.query_mock_logs(ctx["service_id"], limit=10)


def open_incident(ctx: dict) -> dict:
    svc = ctx["check_service"]
    if not svc["degraded"]:
        return {"incident_created": False, "reason": "Service within SLO"}
    evidence = [f"latency {svc['latency_ms']}ms", f"error rate {svc['error_rate']}%"]
    evidence += [f"{d['service_id']} availability {d['availability']}%" for d in ctx["check_dependencies"]["dependencies"] if "service_id" in d]
    inc = mock_incidents.create_incident(f"{svc['name']} degradation", "P2", ctx["service_id"], evidence, "agent:incident_agent")
    return {"incident_created": True, "incident": inc}


WORKFLOW = register(WorkflowDef(
    name="incident_response",
    description="Investigate service degradation and open an evidence-backed incident",
    source_page="sre",
    build_context=lambda params: {"service_id": params.get("service_id", "PAYMENT_API")},
    steps=[
        StepDef("check_service", "incident_agent", "get_service_metrics", check_service),
        StepDef("check_dependencies", "incident_agent", "get_service_metrics", check_dependencies),
        StepDef("retrieve_logs", "incident_agent", "query_mock_logs", retrieve_logs),
        StepDef("open_incident", "incident_agent", "create_incident", open_incident),
    ],
))
