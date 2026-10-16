from agents.base import build_agent
from tools import mock_database, mock_incidents


def create_risk_agent():
    """Page 8: Risk Detection, Forecasting, Preventive Planning."""
    return build_agent(
        name="risk_agent",
        description="Interprets deterministic forecasts and proposes preventive tasks.",
        instruction="""
        Use the tool projections (hours to threshold, queue growth) as the source of numbers.
        Explain why a risk was raised, supporting observations, assumptions and missing evidence,
        then propose preventive checks. State when forecast accuracy is not yet established.
        """,
        tools=[mock_database.get_database_metrics, mock_database.get_queue_metrics, mock_incidents.list_incidents],
    )
