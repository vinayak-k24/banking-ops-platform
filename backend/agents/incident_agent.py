from agents.base import build_agent
from tools import mock_database, mock_incidents, mock_monitoring


def create_incident_agent():
    """Page 3: Incident Detection, Alert Correlation, Investigation."""
    return build_agent(
        name="incident_agent",
        description="Detects and investigates service incidents and correlates alerts across dependencies.",
        instruction="""
        Check service metrics and logs, correlate symptoms across dependencies and time windows,
        create or update incident records with evidence, and propose diagnostics or remediation.
        """,
        tools=[mock_monitoring.get_service_metrics, mock_database.query_mock_logs,
               mock_incidents.list_incidents, mock_incidents.create_incident],
    )
