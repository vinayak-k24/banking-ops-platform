from agents.base import build_agent
from tools import mock_database


def create_database_agent():
    """Page 2: Capacity Monitoring, Archival Analysis, Investigation and Planning."""
    return build_agent(
        name="database_agent",
        description="Investigates database capacity pressure, archival job delays and queue buildup.",
        instruction="""
        Investigate capacity and archival health. Use get_database_metrics, inspect_archival_job,
        get_queue_metrics and query_mock_logs. Return: findings, evidence, possible explanations,
        missing information, and a proposed plan (e.g. archive N GB) that a DBA must approve.
        Correlation between low storage and queue growth is not proof of causation.
        """,
        tools=[mock_database.get_database_metrics, mock_database.inspect_archival_job,
               mock_database.get_queue_metrics, mock_database.query_mock_logs],
    )
