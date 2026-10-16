"""Generates the synthetic banking dataset in backend/mock_data/*.json.

Deterministic (fixed seed) so every run produces the same records. Run:
    python scripts/generate_mock_data.py
"""

import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "mock_data"
rng = random.Random(2026)
NOW = datetime(2026, 10, 16, 9, 0, tzinfo=timezone.utc)


def ts(delta: timedelta = timedelta()) -> str:
    return (NOW + delta).isoformat()


systems = [
    {"system_id": "DB2_MAIN", "name": "Mainframe Db2 Cluster", "type": "database", "environment": "demo", "health": "DEGRADED"},
    {"system_id": "CORE_LEDGER", "name": "Core Ledger", "type": "application", "environment": "demo", "health": "HEALTHY"},
    {"system_id": "SWIFT_GATEWAY", "name": "SWIFT Gateway", "type": "integration", "environment": "demo", "health": "WARNING"},
    {"system_id": "PAYMENT_API", "name": "Payment API", "type": "api", "environment": "demo", "health": "DEGRADED"},
    {"system_id": "MOBILE_API", "name": "Mobile Banking API", "type": "api", "environment": "demo", "health": "HEALTHY"},
    {"system_id": "BATCH_SCHEDULER", "name": "Batch Scheduler", "type": "batch", "environment": "demo", "health": "HEALTHY"},
]

# 7 daily snapshots, growing 120 GB/day to 84.8% of 10 TB.
database_metrics = [
    {"snapshot_id": f"SNAP-{d:03d}", "database_id": "DB2_MAIN", "seq": d, "day": d, "allocated_gb": 10240.0,
     "used_gb": round(8683.5 - 120 * (6 - d), 1), "timestamp": ts(timedelta(days=d - 6))}
    for d in range(7)
]

archival_jobs = [
    {"job_id": "ARC_FIN_901", "database_id": "DB2_MAIN", "target_table": "HIST_TRANS_2025", "status": "COMPLETED",
     "last_run": ts(timedelta(hours=1, minutes=14)), "duration_s": 860, "records_processed": 450000, "error_count": 0, "last_error": None},
    {"job_id": "ARC_SWIFT_2026", "database_id": "DB2_MAIN", "target_table": "SWIFT_OUTBOUND_QUEUE", "status": "LOCK_DELAY",
     "last_run": ts(timedelta(minutes=30)), "duration_s": 2530, "records_processed": 14200, "error_count": 3,
     "last_error": "SQLCODE -911 deadlock or timeout on SWIFT_IDX_02"},
    {"job_id": "ARC_LOAN_118", "database_id": "DB2_MAIN", "target_table": "LOAN_EVENTS_2024", "status": "DELAYED",
     "last_run": ts(timedelta(hours=-6)), "duration_s": 0, "records_processed": 0, "error_count": 1,
     "last_error": "Waiting on predecessor ARC_SWIFT_2026"},
]

queue_metrics = [
    {"queue_id": "ARCHIVAL_QUEUE", "backlog": 1240, "arrival_rate_per_min": 42, "processing_rate_per_min": 31, "avg_wait_min": 42.5},
    {"queue_id": "SWIFT_OUTBOUND", "backlog": 380, "arrival_rate_per_min": 18, "processing_rate_per_min": 17, "avg_wait_min": 3.0},
]

service_metrics = [
    {"service_id": "CORE_LEDGER", "name": "Core Ledger", "latency_ms": 88, "error_rate": 0.02, "availability": 99.99, "dependencies": ["DB2_MAIN"]},
    {"service_id": "SWIFT_GATEWAY", "name": "SWIFT Gateway", "latency_ms": 210, "error_rate": 0.3, "availability": 99.95, "dependencies": ["CORE_LEDGER"]},
    {"service_id": "PAYMENT_API", "name": "Payment API", "latency_ms": 412, "error_rate": 2.4, "availability": 99.71, "dependencies": ["DB2_MAIN", "CORE_LEDGER"]},
    {"service_id": "MOBILE_API", "name": "Mobile Banking API", "latency_ms": 142, "error_rate": 0.1, "availability": 99.89, "dependencies": ["PAYMENT_API"]},
    {"service_id": "DB2_MAIN", "name": "Mainframe Db2 Cluster", "latency_ms": 35, "error_rate": 0.4, "availability": 99.97, "dependencies": []},
]

def incident(n: int, title: str, severity: str, service_id: str, status: str, owner: str | None, description: str,
             evidence: list[str], age: timedelta) -> dict:
    return {"incident_id": f"INC-{n}", "title": title, "severity": severity, "service_id": service_id, "status": status,
            "owner": owner, "description": description, "evidence": evidence,
            "created_at": ts(-age), "updated_at": ts(-age + timedelta(minutes=20))}


incidents = [
    incident(1001, "SWIFT outbound delay", "P2", "SWIFT_GATEWAY", "INVESTIGATING", "sre-oncall",
             "Queue time exceeding 180s on correspondent wire pipeline.", ["Queue time > 180s"], timedelta(hours=3)),
    incident(1002, "Mobile login latency", "P3", "MOBILE_API", "RESOLVED", "app-support",
             "p95 login latency reached 900ms for 12 minutes.", ["p95 latency 900ms for 12 min"], timedelta(days=1)),
    # Same title/service the database_investigation workflow raises, so the workflow deduplicates onto it.
    incident(1003, "Database capacity warning", "P2", "DB2_MAIN", "OPEN", None,
             "Mainframe Db2 storage above the 80% warning threshold and growing ~120 GB/day.",
             ["Utilization above warning threshold"], timedelta(minutes=50)),
    incident(1004, "Payment API connection pool exhausted", "P1", "PAYMENT_API", "OPEN", None,
             "Connection pool at max=200 waiting on DB2_MAIN; p95 latency 412ms above 300ms SLO.",
             ["LOG-0004", "LOG-0005"], timedelta(minutes=15)),
    incident(1005, "Archival job lock delay", "P3", "DB2_MAIN", "OPEN", None,
             "ARC_SWIFT_2026 hit SQLCODE -911 on SWIFT_IDX_02; ARC_LOAN_118 is blocked behind it.",
             ["LOG-0001", "LOG-0003"], timedelta(minutes=28)),
    incident(1006, "Settlement amount mismatches", "P3", "CORE_LEDGER", "OPEN", None,
             "Ledger vs settlement amount mismatches open in today's reconciliation run.",
             ["reconciliation_exceptions status=OPEN"], timedelta(hours=2)),
    incident(1007, "GDPR retention evidence overdue", "P4", "COMPLIANCE", "OPEN", None,
             "Control CTL-GDPR-01 purge evidence was due 2026-10-10.", ["CTL-GDPR-01"], timedelta(hours=6)),
]

# Daily series use their own RNG so adding them doesn't change the transaction data below.
series_rng = random.Random(4096)

# 30 days of daily cash totals (USD). The trailing 7 days are scaled to $25.4M in / $18.2M out.
cash_flow_daily = []
for d in range(30):
    day = (NOW - timedelta(days=29 - d)).date().isoformat()
    cash_flow_daily.append({"date": day, "inflow_usd": round(series_rng.uniform(2.6e6, 4.4e6), 2),
                            "outflow_usd": round(series_rng.uniform(1.9e6, 3.1e6), 2)})
for key, total in (("inflow_usd", 25.4e6), ("outflow_usd", 18.2e6)):
    week = cash_flow_daily[-7:]
    scale = total / sum(r[key] for r in week)
    for r in week:
        r[key] = round(r[key] * scale, 2)
    week[-1][key] = round(week[-1][key] + total - sum(r[key] for r in week), 2)

# 30 daily reconciliation runs (matched vs total ledger records).
reconciliation_runs = []
for d in range(30):
    total = series_rng.randint(41000, 47000)
    mismatched = series_rng.randint(40, 260) if d != 22 else 610  # one bad batch day
    reconciliation_runs.append({"run_id": f"REC-{d + 1:03d}", "date": (NOW - timedelta(days=29 - d)).date().isoformat(),
                                "total_records": total, "matched_records": total - mismatched})

transactions, exceptions = [], []
for i in range(1, 61):
    ref = f"TXN-{i:05d}"
    amount = round(rng.uniform(50, 25000), 2)
    status = "FAILED" if i % 23 == 0 else ("PENDING" if i % 17 == 0 else "SUCCESS")
    transactions.append({"reference_id": ref, "source": "LEDGER", "amount": amount, "status": status, "timestamp": ts(timedelta(minutes=-i * 7))})
    if i % 29 == 0:
        continue  # no settlement counterpart
    settled = round(amount + (rng.choice([-120.5, 35.0, 980.25]) if i % 11 == 0 else 0), 2)
    transactions.append({"reference_id": f"STL-{i:05d}", "counter_reference": ref, "source": "SETTLEMENT", "amount": settled,
                         "status": "SUCCESS", "timestamp": ts(timedelta(minutes=-i * 7 + 3))})
    if settled != amount:
        exceptions.append({"exception_id": f"EXC-{i:04d}", "reference_id": ref, "source_system": "SETTLEMENT",
                           "expected_amount": amount, "actual_amount": settled, "reason": "AMOUNT_MISMATCH",
                           "status": "OPEN", "created_at": ts(timedelta(minutes=-i * 7 + 5))})

compliance_controls = [
    {"control_id": "CTL-AML-01", "category": "AML", "description": "Daily suspicious activity review", "owner": "aml-team", "status": "PASSED", "evidence_refs": ["EV-101"], "due_date": "2026-10-31"},
    {"control_id": "CTL-AML-02", "category": "AML", "description": "Sanctions screening tuning review", "owner": "aml-team", "status": "GAP", "evidence_refs": [], "due_date": "2026-10-20"},
    {"control_id": "CTL-KYC-01", "category": "KYC", "description": "Periodic KYC refresh for high-risk clients", "owner": "kyc-ops", "status": "PASSED", "evidence_refs": ["EV-204"], "due_date": "2026-11-15"},
    {"control_id": "CTL-GDPR-01", "category": "GDPR", "description": "Data retention purge evidence", "owner": "privacy", "status": "OVERDUE", "evidence_refs": [], "due_date": "2026-10-10"},
    {"control_id": "CTL-CHG-01", "category": "Change", "description": "Production change approvals recorded", "owner": "itsm", "status": "PASSED", "evidence_refs": ["EV-330"], "due_date": "2026-10-30"},
]

stages = ["DISCOVERY", "ANALYZED", "CONVERTED", "TESTED", "APPROVED", "DEPLOYED"]
migration_modules = [
    {"module_id": f"COB-{n:03d}", "name": name, "source_language": "COBOL", "target_language": "Java",
     "stage": stages[n % len(stages)], "complexity": rng.choice(["LOW", "MEDIUM", "HIGH"]),
     "dependencies": deps, "test_status": "PASS" if n % len(stages) >= 3 else ("FAIL" if n % 4 == 0 else "NOT_RUN")}
    for n, (name, deps) in enumerate([
        ("INTCALC", []), ("LOANAMRT", ["COB-000"]), ("STMTGEN", []), ("FEEPOST", ["COB-000"]),
        ("ACCTOPEN", []), ("SWIFTMAP", ["COB-004"]), ("GLPOST", ["COB-003"]), ("DORMANCY", []),
    ])
]

mock_logs = [
    {"log_id": "LOG-0001", "component": "DB2_MAIN", "severity": "ERROR", "message": "SQLCODE -911 deadlock on SWIFT_IDX_02 during archival", "correlation_id": "ARC_SWIFT_2026", "timestamp": ts(timedelta(minutes=-28))},
    {"log_id": "LOG-0002", "component": "DB2_MAIN", "severity": "WARN", "message": "Tablespace TS_HIST at 91% of allocated pages", "correlation_id": None, "timestamp": ts(timedelta(minutes=-25))},
    {"log_id": "LOG-0003", "component": "DB2_MAIN", "severity": "ERROR", "message": "Archival job ARC_LOAN_118 blocked: predecessor not complete", "correlation_id": "ARC_LOAN_118", "timestamp": ts(timedelta(minutes=-20))},
    {"log_id": "LOG-0004", "component": "PAYMENT_API", "severity": "ERROR", "message": "Connection pool exhausted (max=200) waiting for DB2_MAIN", "correlation_id": "REQ-77812", "timestamp": ts(timedelta(minutes=-15))},
    {"log_id": "LOG-0005", "component": "PAYMENT_API", "severity": "WARN", "message": "p95 latency 412ms above SLO 300ms", "correlation_id": None, "timestamp": ts(timedelta(minutes=-14))},
    {"log_id": "LOG-0006", "component": "SWIFT_GATEWAY", "severity": "WARN", "message": "Outbound queue wait 184s", "correlation_id": None, "timestamp": ts(timedelta(minutes=-40))},
]

DATASETS = {
    "systems": systems,
    "database_metrics": database_metrics,
    "archival_jobs": archival_jobs,
    "queue_metrics": queue_metrics,
    "service_metrics": service_metrics,
    "incidents": incidents,
    "transactions": transactions,
    "reconciliation_exceptions": exceptions,
    "reconciliation_runs": reconciliation_runs,
    "cash_flow_daily": cash_flow_daily,
    "compliance_controls": compliance_controls,
    "migration_modules": migration_modules,
    "mock_logs": mock_logs,
    # Runtime collections start empty.
    "agent_tasks": [],
    "approvals": [],
    "audit_events": [],
}

if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for name, rows in DATASETS.items():
        (OUT / f"{name}.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
        print(f"{name}: {len(rows)} records")
