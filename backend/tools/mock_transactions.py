"""Mock transaction and reconciliation tools. Matching and amount differences are exact (Decimal)."""

from collections import defaultdict
from decimal import Decimal

from services.firestore_store import get_store


def transaction_summary() -> dict:
    """Return counts and success rate of synthetic transactions."""
    txns = get_store().list("transactions")
    counts = defaultdict(int)
    for t in txns:
        counts[t["status"]] += 1
    total = len(txns)
    return {"total": total, **counts, "success_rate_pct": round(counts["SUCCESS"] / total * 100, 2) if total else None}


def run_reconciliation(source_a: str = "LEDGER", source_b: str = "SETTLEMENT") -> dict:
    """Compare transactions from two source systems by reference_id and amount.

    Args:
        source_a: First source system.
        source_b: Second source system.
    """
    txns = get_store().list("transactions")
    a = {t["reference_id"]: t for t in txns if t["source"] == source_a}
    b = {t["counter_reference"]: t for t in txns if t["source"] == source_b and t.get("counter_reference")}

    matched, mismatched, missing = [], [], []
    for ref, rec in a.items():
        other = b.get(ref)
        if other is None:
            missing.append(ref)
            continue
        diff = Decimal(str(other["amount"])) - Decimal(str(rec["amount"]))
        (matched if diff == 0 else mismatched).append({"reference_id": ref, "difference": str(diff)} if diff else ref)

    total_diff = sum((Decimal(m["difference"]) for m in mismatched), Decimal("0"))
    return {
        "compared": len(a),
        "matched": len(matched),
        "amount_mismatches": mismatched,
        "missing_counterpart": missing,
        "total_discrepancy": str(total_diff),
    }


def list_exceptions(status: str | None = None) -> list[dict]:
    filters = {"status": status} if status else {}
    return get_store().list("reconciliation_exceptions", **filters)
