"""Root ADK agent (Page 7: Agent Command Center). Routes requests to specialized agents."""

from agents.base import build_agent
from agents.compliance_agent import create_compliance_agent
from agents.database_agent import create_database_agent
from agents.incident_agent import create_incident_agent
from agents.migration_agent import create_migration_agent
from agents.operations_agent import create_operations_agent
from agents.reconciliation_agent import create_reconciliation_agent
from agents.risk_agent import create_risk_agent
from agents.verification_agent import create_verification_agent

AGENT_REGISTRY = {
    "operations_agent": {"page": "ops", "domain": "Operations Intelligence"},
    "database_agent": {"page": "dba", "domain": "Capacity & Archival"},
    "incident_agent": {"page": "sre", "domain": "Incident Investigation"},
    "reconciliation_agent": {"page": "reconcile", "domain": "Reconciliation"},
    "compliance_agent": {"page": "audit", "domain": "Audit Assistance"},
    "migration_agent": {"page": "mainframe", "domain": "Migration Intelligence"},
    "risk_agent": {"page": "risk", "domain": "Predictive Risk"},
    "verification_agent": {"page": "governance", "domain": "Verification"},
}


def create_orchestrator():
    return build_agent(
        name="orchestrator",
        description="Banking operations orchestrator.",
        instruction="""
        You coordinate specialized banking operations agents. Delegate each request to the agent
        whose domain matches: database capacity/archival -> database_agent, incidents -> incident_agent,
        reconciliation -> reconciliation_agent, compliance/audit -> compliance_agent,
        modernization -> migration_agent, forecasts/risk -> risk_agent, overall status -> operations_agent,
        post-action checks -> verification_agent.
        """,
        tools=[],
        sub_agents=[
            create_operations_agent(),
            create_database_agent(),
            create_incident_agent(),
            create_reconciliation_agent(),
            create_compliance_agent(),
            create_migration_agent(),
            create_risk_agent(),
            create_verification_agent(),
        ],
    )
