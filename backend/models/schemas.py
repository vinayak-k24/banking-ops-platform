from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:8].upper()}"


class TaskStatus(str, Enum):
    """Standard agent task lifecycle shared by all nine pages."""

    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    WAITING_FOR_APPROVAL = "WAITING_FOR_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    VERIFYING = "VERIFYING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    NEEDS_INVESTIGATION = "NEEDS_INVESTIGATION"
    CANCELLED = "CANCELLED"


TERMINAL_STATES = {TaskStatus.SUCCEEDED, TaskStatus.FAILED, TaskStatus.NEEDS_INVESTIGATION, TaskStatus.CANCELLED, TaskStatus.REJECTED}


class StepStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    DONE = "DONE"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class TaskStep(BaseModel):
    step_id: str = Field(default_factory=lambda: new_id("STEP"))
    name: str
    agent_id: str
    tool: str | None = None
    status: StepStatus = StepStatus.PENDING
    input: dict[str, Any] = {}
    output: dict[str, Any] | None = None
    error: str | None = None
    retries: int = 0
    started_at: str | None = None
    finished_at: str | None = None


class AgentTask(BaseModel):
    task_id: str = Field(default_factory=lambda: new_id("TASK"))
    workflow: str
    source_page: str
    description: str
    priority: str = "MEDIUM"
    status: TaskStatus = TaskStatus.QUEUED
    steps: list[TaskStep] = []
    current_step: int = 0
    context: dict[str, Any] = {}
    result: dict[str, Any] | None = None
    approval_id: str | None = None
    created_by: str = "system"
    created_at: str = Field(default_factory=utcnow)
    updated_at: str = Field(default_factory=utcnow)


class ApprovalDecision(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Approval(BaseModel):
    approval_id: str = Field(default_factory=lambda: new_id("APR"))
    task_id: str
    action: str
    target_system: str
    parameters: dict[str, Any]
    justification: str
    evidence: list[str] = []
    required_role: str
    requested_by: str
    decision: ApprovalDecision = ApprovalDecision.PENDING
    reviewer: str | None = None
    comment: str | None = None
    created_at: str = Field(default_factory=utcnow)
    decided_at: str | None = None


class AuditEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: new_id("EVT"))
    actor: str
    action: str
    target: str
    outcome: str
    related_task_id: str | None = None
    details: dict[str, Any] = {}
    timestamp: str = Field(default_factory=utcnow)


# ---- API request bodies ----

class CreateTaskRequest(BaseModel):
    workflow: str
    source_page: str = "command"
    params: dict[str, Any] = {}
    actor: str = "coo"


class ApprovalDecisionRequest(BaseModel):
    approved: bool
    reviewer_role: str
    reviewer: str = Field(min_length=1, max_length=64)
    comment: str | None = Field(default=None, max_length=500)


class DecisionRequest(BaseModel):
    """Legacy UI decision buttons (governance page / DBA decision)."""

    kind: str = Field(pattern="^(governance|dba)$")
    requestId: str = Field(min_length=1, max_length=64)
    approved: bool
    actor: str = Field(min_length=1, max_length=64)
    note: str | None = Field(default=None, max_length=500)


class CopilotRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)


class IncidentStatusRequest(BaseModel):
    """Acknowledge (-> INVESTIGATING, owner = actor) or resolve an incident from the alert queue."""

    action: str = Field(pattern="^(acknowledge|resolve)$")
    actor: str = Field(min_length=1, max_length=64)


class ExportRequest(BaseModel):
    type: str = Field(default="Report", max_length=80)


# ---- Migration planner ----

class ComponentType(str, Enum):
    """Migration order follows this sequence unless dependencies push a component later."""

    INFRASTRUCTURE = "infrastructure"
    DATABASE = "database"
    DATA = "data"
    QUERY = "query"
    APPLICATION = "application"
    INTEGRATION = "integration"
    BATCH = "batch"


class MigrationComponent(BaseModel):
    """One migratable unit extracted from an uploaded document or codebase summary."""

    id: str = Field(min_length=1, max_length=80, pattern=r"^[a-z0-9][a-z0-9_\-]*$")
    name: str = Field(min_length=1, max_length=160)
    type: ComponentType
    size: str = Field(pattern="^(S|M|L|XL)$")
    complexity: str = Field(pattern="^(low|medium|high)$")
    depends_on: list[str] = Field(default=[], max_length=50)
    source_refs: list[str] = Field(default=[], max_length=20)
    notes: str = Field(default="", max_length=500)


class MigrationUploadRequest(BaseModel):
    source_type: str = Field(default="document", pattern="^(document|codebase_summary)$")
    target_platform: str = Field(default="Google Cloud", min_length=1, max_length=80)
    team_size: int = Field(default=5, ge=1, le=50)
    actor: str = Field(default="migration", min_length=1, max_length=64)
