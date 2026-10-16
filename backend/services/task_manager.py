"""Persists agent tasks and enforces the standard task lifecycle."""

from models.schemas import TERMINAL_STATES, AgentTask, TaskStatus, TaskStep, utcnow
from services import audit
from services.firestore_store import get_store

ALLOWED_TRANSITIONS: dict[TaskStatus, set[TaskStatus]] = {
    TaskStatus.QUEUED: {TaskStatus.RUNNING, TaskStatus.CANCELLED},
    TaskStatus.RUNNING: {TaskStatus.WAITING_FOR_APPROVAL, TaskStatus.VERIFYING, TaskStatus.FAILED, TaskStatus.CANCELLED, TaskStatus.NEEDS_INVESTIGATION},
    TaskStatus.WAITING_FOR_APPROVAL: {TaskStatus.APPROVED, TaskStatus.REJECTED, TaskStatus.CANCELLED},
    TaskStatus.APPROVED: {TaskStatus.RUNNING},
    TaskStatus.VERIFYING: {TaskStatus.SUCCEEDED, TaskStatus.FAILED, TaskStatus.NEEDS_INVESTIGATION},
    TaskStatus.FAILED: {TaskStatus.RUNNING},  # eligible retry
}


class InvalidTransition(Exception):
    pass


def create(workflow: str, source_page: str, description: str, steps: list[TaskStep], context: dict, actor: str, priority: str = "MEDIUM") -> AgentTask:
    task = AgentTask(workflow=workflow, source_page=source_page, description=description, steps=steps, context=context, created_by=actor, priority=priority)
    save(task)
    audit.record(actor, "task.created", task.task_id, "QUEUED", task.task_id, {"workflow": workflow})
    return task


def get(task_id: str) -> AgentTask | None:
    doc = get_store().get("agent_tasks", task_id)
    return AgentTask(**doc) if doc else None


def list_tasks(status: str | None = None) -> list[AgentTask]:
    filters = {"status": status} if status else {}
    tasks = [AgentTask(**d) for d in get_store().list("agent_tasks", **filters)]
    return sorted(tasks, key=lambda t: t.created_at, reverse=True)


def save(task: AgentTask) -> AgentTask:
    task.updated_at = utcnow()
    get_store().put("agent_tasks", task.model_dump(mode="json"))
    return task


def transition(task: AgentTask, new_status: TaskStatus, actor: str = "system") -> AgentTask:
    if new_status not in ALLOWED_TRANSITIONS.get(task.status, set()):
        raise InvalidTransition(f"{task.status.value} -> {new_status.value} is not allowed")
    old = task.status
    task.status = new_status
    save(task)
    audit.record(actor, "task.transition", task.task_id, new_status.value, task.task_id, {"previous": old.value})
    return task


def cancel(task: AgentTask, actor: str) -> AgentTask:
    if task.status in TERMINAL_STATES:
        raise InvalidTransition(f"Task already {task.status.value}")
    return transition(task, TaskStatus.CANCELLED, actor)
