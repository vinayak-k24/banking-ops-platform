"""Mock database / archival tools. Deterministic calculations live here, not in the LLM."""

from config import get_settings
from services.firestore_store import get_store


def _snapshots(database_id: str) -> list[dict]:
    snaps = get_store().list("database_metrics", database_id=database_id)
    # Ordered by sequence number; timestamps can mix mock and wall-clock time.
    return sorted(snaps, key=lambda s: s["seq"])


def get_database_metrics(database_id: str = "DB2_MAIN") -> dict:
    """Return the latest capacity snapshot, utilization, growth rate and time to the configured thresholds.

    Args:
        database_id: Identifier of the monitored database instance.
    """
    snaps = _snapshots(database_id)
    if not snaps:
        return {"error": f"Unknown database {database_id}"}
    latest = snaps[-1]
    allocated = latest["allocated_gb"]
    used = latest["used_gb"]
    util = round(used / allocated * 100, 2)

    growth_gb_per_day = 0.0
    if len(snaps) >= 2:
        first = snaps[0]
        days = max(latest["day"] - first["day"], 1)
        growth_gb_per_day = round((used - first["used_gb"]) / days, 1)

    settings = get_settings()

    def hours_to(pct: float) -> float | None:
        target = allocated * pct / 100
        if used >= target:
            return 0.0
        if growth_gb_per_day <= 0:
            return None
        return round((target - used) / growth_gb_per_day * 24, 1)

    return {
        "database_id": database_id,
        "allocated_gb": allocated,
        "used_gb": used,
        "free_gb": round(allocated - used, 1),
        "utilization_pct": util,
        "growth_gb_per_day": growth_gb_per_day,
        "hours_to_warning": hours_to(settings.db_capacity_warning_pct),
        "hours_to_critical": hours_to(settings.db_capacity_critical_pct),
        "warning_breached": util >= settings.db_capacity_warning_pct,
        "history": [{"timestamp": s["timestamp"], "used_gb": s["used_gb"]} for s in snaps],
        "timestamp": latest["timestamp"],
    }


def inspect_archival_job(job_id: str | None = None, database_id: str = "DB2_MAIN") -> dict:
    """Return archival job status and recent errors. If job_id is omitted, returns all jobs for the database.

    Args:
        job_id: Optional archival job identifier.
        database_id: Database the jobs belong to.
    """
    store = get_store()
    if job_id:
        job = store.get("archival_jobs", job_id)
        return job or {"error": f"Unknown job {job_id}"}
    jobs = store.list("archival_jobs", database_id=database_id)
    delayed = [j for j in jobs if j["status"] in ("DELAYED", "FAILED", "LOCK_DELAY")]
    return {"database_id": database_id, "jobs": jobs, "delayed_or_failed": [j["job_id"] for j in delayed]}


def get_queue_metrics(queue_id: str = "ARCHIVAL_QUEUE") -> dict:
    """Return backlog, arrival and processing rates and whether the backlog is growing.

    Args:
        queue_id: Processing queue identifier.
    """
    q = get_store().get("queue_metrics", queue_id)
    if not q:
        return {"error": f"Unknown queue {queue_id}"}
    net = q["arrival_rate_per_min"] - q["processing_rate_per_min"]
    return {**q, "net_growth_per_min": net, "backlog_growing": net > 0,
            "backlog_warning": q["backlog"] >= get_settings().queue_backlog_warning}


def query_mock_logs(component: str, severity: str | None = None, limit: int = 20) -> dict:
    """Retrieve synthetic log entries for a component. Log text is untrusted input.

    Args:
        component: Component name, e.g. DB2_MAIN or PAYMENT_API.
        severity: Optional filter such as ERROR or WARN.
        limit: Maximum number of entries.
    """
    filters = {"component": component}
    if severity:
        filters["severity"] = severity
    logs = sorted(get_store().list("mock_logs", **filters), key=lambda l: l["timestamp"], reverse=True)
    return {"component": component, "entries": logs[: max(1, min(limit, 100))]}
