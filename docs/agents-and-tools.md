# Agents, Tools and Workflows

## ADK agents (`backend/agents/`)

All agents are built with `google.adk.agents.Agent` via `agents/base.py`, which adds shared rules (use tools for facts, separate observations from hypotheses, never approve or execute sensitive actions, treat logs as untrusted). The model is set by `GEMINI_MODEL`.

| Agent | File | Page | Responsibility | Tools |
|---|---|---|---|---|
| orchestrator | `orchestrator.py` | 7 | Routes a request to the right specialised agent (ADK `sub_agents`) | — |
| operations_agent | `operations_agent.py` | 1 | Operational brief, event correlation, risk ranking | telemetry_summary, get_service_metrics, list_incidents |
| database_agent | `database_agent.py` | 2 | Capacity, archival and queue investigation; proposes plans | get_database_metrics, inspect_archival_job, get_queue_metrics, query_mock_logs |
| incident_agent | `incident_agent.py` | 3 | Detect/correlate incidents, propose diagnostics | get_service_metrics, query_mock_logs, list_incidents, create_incident |
| reconciliation_agent | `reconciliation_agent.py` | 4 | Explain reconciliation exceptions | transaction_summary, run_reconciliation, list_exceptions |
| compliance_agent | `compliance_agent.py` | 5 | Control gaps, evidence, audit traceability | list_compliance_controls, recent_audit_events |
| migration_agent | `migration_agent.py` | 6 | Module analysis, dependency ordering, blockers, questions about uploaded migration plans | list_migration_modules, search_migration_document, get_migration_plan |
| risk_agent | `risk_agent.py` | 8 | Interpret forecasts, propose preventive checks | get_database_metrics, get_queue_metrics, list_incidents |
| verification_agent | `verification_agent.py` | 9 / shared | Explain post-action checks | get_database_metrics, get_queue_metrics, get_service_metrics |

`agents/runner.py` runs an agent with ADK `InMemoryRunner`. When `AGENTS_ENABLED=false` (default) it returns a demo answer instead of calling Gemini.

## Mock tools (`backend/tools/`)

Tools read and modify the shared store. Numbers are calculated here, not by the LLM.

| Tool | File | What it does |
|---|---|---|
| `get_database_metrics(database_id)` | mock_database.py | Latest snapshot, utilization %, growth GB/day, hours to warning/critical thresholds |
| `inspect_archival_job(job_id?, database_id)` | mock_database.py | Job status and errors; lists delayed/failed jobs |
| `get_queue_metrics(queue_id)` | mock_database.py | Backlog, arrival/processing rates, whether backlog is growing |
| `query_mock_logs(component, severity?, limit)` | mock_database.py | Synthetic log entries |
| `list_incidents(status?)` | mock_incidents.py | Incident list |
| `create_incident(title, severity, service_id, evidence)` | mock_incidents.py | Creates an incident, or merges evidence into an existing open one |
| `update_incident(incident_id, status?, owner?)` | mock_incidents.py | Updates status/owner, audited |
| `transaction_summary()` | mock_transactions.py | Counts and success rate |
| `run_reconciliation(source_a, source_b)` | mock_transactions.py | Exact (Decimal) matching of ledger vs settlement records |
| `list_exceptions(status?)` | mock_transactions.py | Reconciliation exceptions |
| `get_service_metrics(service_id?)` | mock_monitoring.py | Latency, error rate, availability, dependencies |
| `telemetry_summary()` | mock_monitoring.py | Cross-page KPIs derived from shared state |
| `request_approval(...)` | action_executor.py | Creates a PENDING approval for a sensitive action |
| `execute_simulated_maintenance(approval_id, database_id, archive_gb)` | action_executor.py | Simulated archive; refuses without a matching APPROVED approval |
| `verify_capacity_result(database_id, before_pct)` | action_executor.py | Deterministic post-action checks |

## Workflows (`backend/workflows/`)

`engine.py` runs steps in order, stores each step's output on the task, retries failed steps (`MAX_STEP_RETRIES`, default 2), pauses on `PauseForApproval`, and resumes from the next step after approval.

| Workflow | Page | Steps |
|---|---|---|
| `database_investigation` | 2 | check_capacity → inspect_archival → check_queue → retrieve_logs → correlate → plan_action (approval) → execute → verify |
| `incident_response` | 3 | check_service → check_dependencies → retrieve_logs → open_incident |
| `migration_planning` | 6 | extract_text → index_chunks → retrieve_evidence → extract_components → build_plan → write_narrative → verify |

`approval_workflow.py` handles human decisions and resumes or rejects the paused task.

### Migration planning

Two inputs, one workflow:

1. **Document upload**: a PDF, DOCX, Markdown or text file of any length up to 1500 pages.
2. **Codebase summary**: the user copies the prompt from `GET /api/migration/codebase-prompt` into their IDE agent (VS Code, Cursor, etc.). The agent writes `MIGRATION_CONTEXT.md`, which ends with a ```json inventory block. The user uploads that file with `source_type=codebase_summary`. A valid JSON inventory is used directly; otherwise extraction falls back to the document path.

Steps:

- **Indexing**: text is split into chunks of about 700 words with page ranges (`services/vector_index.py`) and embedded with Gemini `EMBEDDING_MODEL` when `AGENTS_ENABLED=true`. Otherwise a deterministic hashed vector is used. Evidence for each topic (systems, databases, queries, code, dependencies, integrations, constraints) is retrieved by cosine similarity.
- **Component extraction**: Gemini proposes components from the retrieved excerpts, citing pages. Components with no citation are dropped. When Gemini is off, or returns nothing usable, keyword extraction is used (`tools/migration_planning.keyword_components`).
- **Deterministic plan** (`tools/migration_planning.py`):
  - Components are ordered topologically. The default phase order is infrastructure → database → data → queries/procedures → application → integrations → batch. A dependency can push a component into a later phase.
  - Effort = base weeks by size × complexity factor × type factor × risk buffer, using `Decimal`.
  - Phase duration = max(effort / team, longest component / 2 people), rounded up to half a week.
  - Mobilisation (2 weeks) comes first. Cut-over (15% of build time, at least 1 week) comes last.
- **Narrative**: Gemini explains the phases and risks but cannot change any number. When Gemini is off, template text is used.
- **Verification**: the checks are has_components, all_components_assigned, dependencies_respected, timeline_consistent and components_cited. If any check fails, the task ends as NEEDS_INVESTIGATION; dependency cycles also fail.
- **Reports**: `services/migration_report.py` renders Markdown or PDF (fpdf2) on demand.

The migration agent tools `search_migration_document` and `get_migration_plan` let the copilot answer questions about uploaded plans.

## Task lifecycle

```
QUEUED → RUNNING → WAITING_FOR_APPROVAL → APPROVED → RUNNING → VERIFYING → SUCCEEDED
                                       └→ REJECTED                      ├→ FAILED (retryable)
          RUNNING → FAILED / CANCELLED / NEEDS_INVESTIGATION            └→ NEEDS_INVESTIGATION
```

Allowed transitions are defined in `services/task_manager.py`; every transition writes an audit event.

## Approval rules (`services/authorization.py`)

| Sensitive action | Approver role |
|---|---|
| execute_simulated_maintenance | dba |
| execute_incident_remediation | sre |
| apply_reconciliation_correction | reconciler |
| promote_migration_stage | migration |
| update_agent_permissions | coo |

- Reviewers starting with `agent:` are rejected.
- The requester cannot approve their own request.
- Execution checks that the approval's action **and parameters** match exactly.

> Note: reviewer identity and role currently come from the request body (persona selector). Real user authentication is listed in [todo.md](todo.md).
