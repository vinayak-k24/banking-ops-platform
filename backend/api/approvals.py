"""Approval endpoints (Page 9). Authorization is enforced in workflows.approval_workflow."""

from fastapi import APIRouter, HTTPException

from models.schemas import ApprovalDecisionRequest, DecisionRequest
from services import audit
from services.authorization import AuthorizationError
from services.firestore_store import get_store
from workflows import approval_workflow

router = APIRouter(prefix="/api", tags=["approvals"])


@router.get("/approvals")
def list_approvals(decision: str | None = None):
    filters = {"decision": decision} if decision else {}
    return sorted(get_store().list("approvals", **filters), key=lambda a: a["created_at"], reverse=True)


@router.post("/approvals/{approval_id}/decision")
def decide(approval_id: str, body: ApprovalDecisionRequest):
    try:
        return approval_workflow.decide(approval_id, body.approved, body.reviewer, body.reviewer_role, body.comment)
    except AuthorizationError as exc:
        raise HTTPException(403, str(exc)) from exc
    except approval_workflow.ApprovalError as exc:
        raise HTTPException(409, str(exc)) from exc


@router.post("/decisions", status_code=201)
def legacy_decision(body: DecisionRequest):
    """Records decisions from the current static UI buttons. Replace with /approvals/{id}/decision as pages are wired up."""
    return audit.record(body.actor, f"{body.kind}.decision", body.requestId,
                        "APPROVED" if body.approved else "REJECTED", details={"note": body.note})
