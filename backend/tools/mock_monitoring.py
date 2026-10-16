"""Mock service monitoring and cross-page aggregates (derived from shared state, not hardcoded)."""

from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

from config import get_settings
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
    """Return the cross-page KPI summary: core health, DB hours to threshold, open P1/P2 incidents,
    reconciliation discrepancy (USD), compliance pass rate, modernization progress and pending approvals."""
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


def _window_days(timeframe: str, latest: date) -> int:
    """Number of daily observations covered by a header timeframe, ending on the latest date."""
    return {"Today": 1, "7 Days": 7}.get(timeframe, latest.day)  # "This Month" = month to date


def core_health_status(score: float) -> dict:
    """Classify a 0-1 health score against the configured thresholds."""
    s = get_settings()
    status = "HEALTHY" if score >= s.core_health_healthy else "WARNING" if score >= s.core_health_warning else "CRITICAL"
    return {"value": score, "status": status,
            "thresholds": {"healthy": s.core_health_healthy, "warning": s.core_health_warning}}


def cash_flow_series() -> dict:
    """Trailing 7 daily inflow/outflow totals (USD) ending on the latest recorded day."""
    rows = sorted(get_store().list("cash_flow_daily"), key=lambda r: r["date"])[-7:]
    inflow = [Decimal(str(r["inflow_usd"])) for r in rows]
    outflow = [Decimal(str(r["outflow_usd"])) for r in rows]
    return {
        "labels": [date.fromisoformat(r["date"]).strftime("%a") for r in rows],
        "dates": [r["date"] for r in rows],
        "datasets": [
            {"label": "Inflow", "data": [float(v) for v in inflow]},
            {"label": "Outflow", "data": [float(v) for v in outflow]},
        ],
        "totals": {"inflow": float(sum(inflow, Decimal(0))), "outflow": float(sum(outflow, Decimal(0)))},
    }


def reconciliation_trend(timeframe: str = "This Month") -> dict:
    """Daily reconciliation accuracy (matched / total records, %) within the selected timeframe.

    Args:
        timeframe: Header timeframe: Today, 7 Days or This Month.
    """
    runs = sorted(get_store().list("reconciliation_runs"), key=lambda r: r["date"])
    target = get_settings().reconciliation_accuracy_target_pct
    if not runs:
        return {"observations": [], "target_pct": target, "latest": None}

    def pct(r: dict) -> Decimal:
        return (Decimal(r["matched_records"]) / Decimal(r["total_records"]) * 100).quantize(Decimal("0.01"), ROUND_HALF_UP)

    latest_date = date.fromisoformat(runs[-1]["date"])
    start = latest_date - timedelta(days=_window_days(timeframe, latest_date) - 1)
    in_window = [r for r in runs if date.fromisoformat(r["date"]) >= start]
    observations = [{"date": r["date"], "accuracy_pct": float(pct(r)), "matched": r["matched_records"],
                     "total": r["total_records"]} for r in in_window]
    # Change is measured against the previous run even if it falls outside the window.
    prev = pct(runs[-2]) if len(runs) > 1 else None
    last = pct(runs[-1])
    return {
        "observations": observations,
        "target_pct": target,
        "latest": {"date": runs[-1]["date"], "accuracy_pct": float(last),
                   "change_pct": float(last - prev) if prev is not None else None,
                   "meets_target": last >= Decimal(str(target))},
    }


def overview_charts(timeframe: str = "This Month") -> dict:
    # Fraud and compliance series are static demo data; cash flow and reconciliation come from the store.
    return {
        "fraud": {
            "labels": ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
            "datasets": [
                {"label": "Fraud Prediction", "data": [420, 360, 480, 280, 410, 720, 520, 450, 530, 220, 560, 280]},
                {"label": "Fraud Detected", "data": [450, 280, 240, 320, 290, 780, 500, 430, 510, 180, 280, 400]},
            ],
        },
        "cashFlow": cash_flow_series(),
        "compliance": {"labels": ["AML", "KYC", "GDPR"], "datasets": [{"label": "Compliance", "data": [65, 80, 70]}]},
        "reconcile": reconciliation_trend(timeframe),
        "coreHealth": core_health_status(0.93),
        "timeframe": timeframe,
    }
