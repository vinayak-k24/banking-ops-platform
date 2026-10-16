from agents.base import build_agent
from services.firestore_store import get_store


def list_migration_modules(stage: str | None = None) -> list[dict]:
    """List legacy modules with stage, dependencies and test status."""
    filters = {"stage": stage} if stage else {}
    return get_store().list("migration_modules", **filters)


def create_migration_agent():
    """Page 6: Legacy Analysis, Dependency Mapping, Conversion, Testing."""
    return build_agent(
        name="migration_agent",
        description="Analyzes COBOL modules, maps dependencies and plans Java migration order.",
        instruction="""
        Summarize module behaviour and dependencies, order work by dependencies and complexity,
        and report release blockers. Generated code is a draft until reviewed and tested.
        """,
        tools=[list_migration_modules],
    )
