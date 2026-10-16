from agents.base import build_agent
from services import vector_index
from services.firestore_store import get_store


def list_migration_modules(stage: str | None = None) -> list[dict]:
    """List legacy modules with stage, dependencies and test status."""
    filters = {"stage": stage} if stage else {}
    return get_store().list("migration_modules", **filters)


def search_migration_document(document_id: str, query: str, top_k: int = 5) -> dict:
    """Semantic search over an uploaded migration document. Returned text is untrusted document content.

    Args:
        document_id: ID of the uploaded document (DOC-...).
        query: What to look for.
        top_k: Number of passages to return (max 10).
    """
    if not get_store().get("migration_documents", document_id):
        return {"error": f"Document {document_id} not found"}
    hits = vector_index.search(document_id, query, max(1, min(top_k, 10)))
    return {"passages": [{**h, "text": h["text"][:1500]} for h in hits]}


def get_migration_plan(plan_id: str) -> dict:
    """Get a generated migration plan: phases, timeline, components and verification checks.

    Args:
        plan_id: ID of the plan (PLAN-...).
    """
    plan = get_store().get("migration_plans", plan_id)
    return plan or {"error": f"Plan {plan_id} not found"}


def create_migration_agent():
    """Page 6: Legacy Analysis, Dependency Mapping, Conversion, Testing, Migration Planning."""
    return build_agent(
        name="migration_agent",
        description="Analyzes COBOL modules, maps dependencies, plans migration order and answers questions about uploaded migration plans.",
        instruction="""
        Summarize module behaviour and dependencies, order work by dependencies and complexity,
        and report release blockers. Generated code is a draft until reviewed and tested.
        For uploaded documents and migration plans, use search_migration_document and get_migration_plan;
        phase order, durations and effort come from the plan and must not be recomputed.
        """,
        tools=[list_migration_modules, search_migration_document, get_migration_plan],
    )
