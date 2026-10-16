"""Mock service monitoring and cross-page aggregates (derived from shared state, not hardcoded)."""

from services.firestore_store import get_store
from tools import mock_database


def get_service_metrics(service_id: str | None = None) -> list[dict] | dict:
    """Return latency, error rate and availability for one or all services.

    Args:
        service_id: Optional service identifier, e.g. PAYMENT_API.
    """
    store = get_store()
    if service_id:
        return store.get("service_metrics", service_id) or {"error": f"Unknown service {service_id}"}
    return store.list("service_metrics")


def telemetry_summary() -> dict:
    store = get_store()
    db = mock_database.get_database_metrics()
    open_incidents = [i for i in store.list("incidents") if i["status"] != "RESOLVED"]
    controls = store.list("compliance_controls")
    modules = store.list("migration_modules")
    tasks = store.list("agent_tasks")
    exceptions = store.list("reconciliation_exceptions", status="OPEN")
    services = store.list("service_metrics")

    passed = sum(1 for c in controls if c["status"] == "PASSED")
    converted = sum(1 for m in modules if m["stage"] in ("TESTED", "APPROVED", "DEPLOYED"))
    discrepancy = sum(abs(e["expected_amount"] - e["actual_amount"]) for e in exceptions)
    health = round(sum(s["availability"] for s in services) / len(services), 1) if services else None

    return {
        "coreBankingHealth": health,
        "dbHoursToThreshold": db.get("hours_to_critical"),
        "activeCriticalIncidents": sum(1 for i in open_incidents if i["severity"] in ("P1", "P2")),
        "reconciliationDiscrepancyUsd": round(discrepancy, 2),
        "compliancePassedPct": round(passed / len(controls) * 100, 1) if controls else None,
        "modernizationJavaPct": round(converted / len(modules) * 100, 1) if modules else None,
        "commandTasksRunning": sum(1 for t in tasks if t["status"] == "RUNNING"),
        "earlyWarningSignals": int(bool(db.get("warning_breached"))) + sum(1 for i in open_incidents if i["severity"] == "P1"),
        "governancePending": len(store.list("approvals", decision="PENDING")),
    }


def overview_charts(timeframe: str = "This Month") -> dict:
    # Chart series for the overview page. Static demo series for now; derive from transactions later.
    return {
        "fraud": {
            "labels": ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
            "datasets": [
                {"label": "Fraud Prediction", "data": [420, 360, 480, 280, 410, 720, 520, 450, 530, 220, 560, 280]},
                {"label": "Fraud Detected", "data": [450, 280, 240, 320, 290, 780, 500, 430, 510, 180, 280, 400]},
            ],
        },
        "cashFlow": {
            "labels": ["s", "m", "t", "w", "t", "f", "s"],
            "datasets": [
                {"label": "Inflow", "data": [12, 18, 15, 14, 22, 19, 16]},
                {"label": "Outflow", "data": [10, 14, 11, 10, 16, 12, 13]},
            ],
        },
        "compliance": {"labels": ["AML", "KYC", "GDPR"], "datasets": [{"label": "Compliance", "data": [65, 80, 70]}]},
        "reconcile": {"labels": [str(i) for i in range(1, 9)], "datasets": [{"label": "Accuracy", "data": [40, 45, 83, 40, 78, 42, 65, 50]}]},
        "coreHealth": 0.93,
        "timeframe": timeframe,
    }
