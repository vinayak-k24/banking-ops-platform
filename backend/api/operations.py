"""Read endpoints for the shared mock environment, used by the nine UI pages."""

from fastapi import APIRouter, HTTPException

from agents.compliance_agent import list_compliance_controls
from agents.migration_agent import list_migration_modules
from models.schemas import IncidentStatusRequest
from services import audit
from services.firestore_store import get_store
from tools import mock_database, mock_incidents, mock_monitoring, mock_transactions

router = APIRouter(prefix="/api", tags=["operations"])


def _or_404(result):
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(404, result["error"])
    return result


@router.get("/telemetry")
def telemetry():
    return mock_monitoring.telemetry_summary()


@router.get("/charts/overview")
def overview_charts(timeframe: str = "This Month"):
    return mock_monitoring.overview_charts(timeframe[:40])


@router.get("/services")
def services():
    return mock_monitoring.get_service_metrics()


@router.get("/databases/{database_id}/metrics")
def database_metrics(database_id: str):
    return _or_404(mock_database.get_database_metrics(database_id))


@router.get("/databases/{database_id}/archival-jobs")
def archival_jobs(database_id: str):
    return mock_database.inspect_archival_job(database_id=database_id)


@router.get("/queues/{queue_id}")
def queue(queue_id: str):
    return _or_404(mock_database.get_queue_metrics(queue_id))


@router.get("/logs/{component}")
def logs(component: str, severity: str | None = None, limit: int = 20):
    return mock_database.query_mock_logs(component, severity, limit)


@router.get("/incidents")
def incidents(status: str | None = None):
    return mock_incidents.list_incidents(status)


@router.post("/incidents/{incident_id}/status")
def incident_status(incident_id: str, body: IncidentStatusRequest):
    current = get_store().get("incidents", incident_id)
    if current is None:
        raise HTTPException(404, f"Unknown incident {incident_id}")
    if current["status"] == "RESOLVED":
        raise HTTPException(409, f"Incident {incident_id} is already resolved")
    if body.action == "acknowledge":
        return mock_incidents.update_incident(incident_id, "INVESTIGATING", owner=body.actor, actor=body.actor)
    return mock_incidents.update_incident(incident_id, "RESOLVED", actor=body.actor)


@router.get("/transactions/summary")
def transactions_summary():
    return mock_transactions.transaction_summary()


@router.post("/reconciliation/run")
def run_reconciliation():
    return mock_transactions.run_reconciliation()


@router.get("/reconciliation/exceptions")
def reconciliation_exceptions(status: str | None = None):
    return mock_transactions.list_exceptions(status)


@router.get("/compliance/controls")
def compliance_controls(status: str | None = None):
    return list_compliance_controls(status)


@router.get("/migration/modules")
def migration_modules(stage: str | None = None):
    return list_migration_modules(stage)


@router.get("/audit-events")
def audit_events(limit: int = 50):
    return audit.recent(max(1, min(limit, 500)))
