"""Agent task lifecycle endpoints (Page 7 Command Center)."""

from collections import Counter

from fastapi import APIRouter, HTTPException

from agents.orchestrator import AGENT_REGISTRY
from models.schemas import CreateTaskRequest, TaskStatus
from services import task_manager
from workflows import engine
from workflows.registry import REGISTRY

router = APIRouter(prefix="/api", tags=["tasks"])


@router.get("/workflows")
def workflows():
    return [{"name": w.name, "description": w.description, "source_page": w.source_page,
             "steps": [s.name for s in w.steps]} for w in REGISTRY.values()]


@router.get("/agents")
def agents():
    tasks = task_manager.list_tasks()
    step_counts = Counter(s.agent_id for t in tasks for s in t.steps if s.status.value == "DONE")
    return [{"agent_id": a, **meta, "completed_steps": step_counts.get(a, 0)} for a, meta in AGENT_REGISTRY.items()]


@router.get("/tasks")
def list_tasks(status: TaskStatus | None = None):
    return [t.model_dump(mode="json") for t in task_manager.list_tasks(status.value if status else None)]


@router.post("/tasks", status_code=201)
def create_task(body: CreateTaskRequest):
    if body.workflow not in REGISTRY:
        raise HTTPException(400, f"Unknown workflow {body.workflow}")
    task = engine.start(body.workflow, body.params, body.actor, body.source_page)
    return task.model_dump(mode="json")


@router.get("/tasks/{task_id}")
def get_task(task_id: str):
    task = task_manager.get(task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return task.model_dump(mode="json")


@router.post("/tasks/{task_id}/cancel")
def cancel_task(task_id: str, actor: str = "coo"):
    task = task_manager.get(task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    try:
        return task_manager.cancel(task, actor).model_dump(mode="json")
    except task_manager.InvalidTransition as exc:
        raise HTTPException(409, str(exc)) from exc


@router.post("/tasks/{task_id}/retry")
def retry_task(task_id: str, actor: str = "coo"):
    task = task_manager.get(task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    if task.status != TaskStatus.FAILED:
        raise HTTPException(409, "Only FAILED tasks can be retried")
    return engine.retry(task, actor).model_dump(mode="json")
