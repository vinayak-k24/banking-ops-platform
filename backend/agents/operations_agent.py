from agents.base import build_agent
from tools import mock_incidents, mock_monitoring


def create_operations_agent():
    """Page 1: Operations Intelligence + Event Correlation."""
    return build_agent(
        name="operations_agent",
        description="Aggregates findings across modules, correlates events and ranks operational risks.",
        instruction="""
        Produce a structured operational brief: top risks ranked by severity and SLA impact,
        related alerts grouped together, and recommended next steps with the originating page.
        """,
        tools=[mock_monitoring.telemetry_summary, mock_monitoring.get_service_metrics, mock_incidents.list_incidents],
    )
