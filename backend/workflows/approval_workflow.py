"""Page 9: human approval decisions. Enforced deterministically, then resumes the paused task."""

from models.schemas import ApprovalDecision, TaskStatus, utcnow
from services import audit, authorization, task_manager
from services.firestore_store import get_store
from workflows import engine


class ApprovalError(Exception):
    pass


def decide(approval_id: str, approved: bool, reviewer: str, reviewer_role: str, comment: str | None = None) -> dict:
    store = get_store()
    approval = store.get("approvals", approval_id)
    if not approval:
        raise ApprovalError(f"Unknown approval {approval_id}")
    if approval["decision"] != ApprovalDecision.PENDING.value:
        raise ApprovalError(f"Approval already {approval['decision']}")

    authorization.check_can_approve(approval["action"], reviewer, reviewer_role, approval["requested_by"])

    decision = ApprovalDecision.APPROVED if approved else ApprovalDecision.REJECTED
    approval = store.update("approvals", approval_id, {
        "decision": decision.value, "reviewer": reviewer, "comment": comment, "decided_at": utcnow(),
    })
    audit.record(reviewer, f"approval.{decision.value.lower()}", approval_id, decision.value, approval["task_id"], {"role": reviewer_role})

    task = task_manager.get(approval["task_id"])
    if task and task.status == TaskStatus.WAITING_FOR_APPROVAL and task.approval_id == approval_id:
        if approved:
            task_manager.transition(task, TaskStatus.APPROVED, reviewer)
            task_manager.transition(task, TaskStatus.RUNNING, reviewer)
            task = engine.run(task)  # resumes at the step after the approval request
        else:
            task = task_manager.transition(task, TaskStatus.REJECTED, reviewer)

    return {"approval": approval, "task": task.model_dump(mode="json") if task else None}
