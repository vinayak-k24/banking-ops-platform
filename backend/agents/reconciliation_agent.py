from agents.base import build_agent
from tools import mock_transactions


def create_reconciliation_agent():
    """Page 4: Transaction Monitoring, Reconciliation, Exception Analysis."""
    return build_agent(
        name="reconciliation_agent",
        description="Runs deterministic reconciliation and explains exception patterns.",
        instruction="""
        Run run_reconciliation and list_exceptions. Group discrepancies by source, reason and time
        window, and propose investigation tasks. Never modify financial records; corrections need approval.
        """,
        tools=[mock_transactions.transaction_summary, mock_transactions.run_reconciliation, mock_transactions.list_exceptions],
    )
