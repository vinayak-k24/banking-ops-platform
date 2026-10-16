from agents.base import build_agent
from tools import mock_database, mock_monitoring


def create_verification_agent():
    """Shared: explains verification results. Pass/fail is decided by deterministic checks."""
    return build_agent(
        name="verification_agent",
        description="Summarizes post-action metrics against completion criteria.",
        instruction="""
        Compare post-action metrics with the expected outcome. Report which criteria passed or failed.
        Never declare success when a check failed; recommend follow-up instead.
        """,
        tools=[mock_database.get_database_metrics, mock_database.get_queue_metrics, mock_monitoring.get_service_metrics],
    )
