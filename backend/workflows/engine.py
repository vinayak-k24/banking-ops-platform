"""Minimal sequential workflow engine with retries, approval pauses and resume-from-step."""

import logging
from dataclasses import dataclass
from typing import Callable

from config import get_settings
from models.schemas import AgentTask, StepStatus, TaskStatus, TaskStep, utcnow
from services import task_manager

log = logging.getLogger(__name__)


class PauseForApproval(Exception):
    """Raised by a step after it created an approval request."""

    def __init__(self, approval_id: str, output: dict):
        self.approval_id = approval_id
        self.output = output


class VerificationOutcome(Exception):
    """Raised by the final verification step to set the terminal task status."""

    def __init__(self, status: TaskStatus, output: dict):
        self.status = status
        self.output = output


@dataclass
class StepDef:
    name: str
    agent_id: str
    tool: str | None
    run: Callable[[dict], dict]  # receives the task context, returns step output


@dataclass
class WorkflowDef:
    name: str
    description: str
    source_page: str
    steps: list[StepDef]
    build_context: Callable[[dict], dict] = lambda params: dict(params)


REGISTRY: dict[str, WorkflowDef] = {}


def register(wf: WorkflowDef) -> WorkflowDef:
    REGISTRY[wf.name] = wf
    return wf


def start(workflow: str, params: dict, actor: str, source_page: str | None = None) -> AgentTask:
    wf = REGISTRY.get(workflow)
    if not wf:
        raise KeyError(f"Unknown workflow {workflow}")
    steps = [TaskStep(name=s.name, agent_id=s.agent_id, tool=s.tool) for s in wf.steps]
    task = task_manager.create(workflow, source_page or wf.source_page, wf.description, steps, wf.build_context(params), actor)
    task.context["task_id"] = task.task_id
    task_manager.transition(task, TaskStatus.RUNNING)
    return run(task)


def run(task: AgentTask) -> AgentTask:
    """Execute steps from task.current_step until done, paused, or failed."""
    wf = REGISTRY[task.workflow]
    max_retries = get_settings().max_step_retries

    while task.current_step < len(wf.steps):
        idx = task.current_step
        step_def, step = wf.steps[idx], task.steps[idx]
        step.status, step.started_at = StepStatus.RUNNING, utcnow()
        task_manager.save(task)
        try:
            output = step_def.run(task.context)
        except PauseForApproval as pause:
            _finish_step(step, pause.output)
            task.context[step_def.name] = pause.output
            task.approval_id = pause.approval_id
            task.current_step = idx + 1
            return task_manager.transition(task, TaskStatus.WAITING_FOR_APPROVAL)
        except VerificationOutcome as outcome:
            _finish_step(step, outcome.output)
            task.context[step_def.name] = outcome.output
            task.current_step = idx + 1
            task.result = outcome.output
            task_manager.transition(task, TaskStatus.VERIFYING)
            return task_manager.transition(task, outcome.status)
        except Exception as exc:  # noqa: BLE001 - recorded on the step
            log.exception("step %s failed", step_def.name)
            step.retries += 1
            step.error = str(exc)[:500]
            if step.retries <= max_retries:
                continue
            step.status, step.finished_at = StepStatus.FAILED, utcnow()
            return task_manager.transition(task, TaskStatus.FAILED)

        _finish_step(step, output)
        task.context[step_def.name] = output
        task.current_step = idx + 1
        task_manager.save(task)

    task.result = task.context.get(wf.steps[-1].name)
    task_manager.transition(task, TaskStatus.VERIFYING)
    return task_manager.transition(task, TaskStatus.SUCCEEDED)


def retry(task: AgentTask, actor: str) -> AgentTask:
    """Resume a FAILED task from its failed step with a fresh retry budget."""
    step = task.steps[task.current_step]
    step.retries, step.error, step.status = 0, None, StepStatus.PENDING
    task_manager.transition(task, TaskStatus.RUNNING, actor)
    return run(task)


def _finish_step(step: TaskStep, output: dict) -> None:
    step.status, step.output, step.finished_at, step.error = StepStatus.DONE, output, utcnow(), None
