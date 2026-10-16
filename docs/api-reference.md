# Backend API Reference

Base URL: backend service (local `http://localhost:8000`). From the browser, call the same paths on the frontend origin; Next.js proxies `/api/*`.
Interactive docs (Swagger): `http://localhost:8000/docs`.
Errors return `{"detail": "..."}` with status 400, 403, 404 or 409.

## System

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | `{status, environment, store, agents_enabled}` |
| POST | `/api/admin/reset` | Reload mock data (in-memory demo store only) |

## Operations data

| Method | Path | Description |
|---|---|---|
| GET | `/api/telemetry` | Cross-page KPI summary |
| GET | `/api/charts/overview?timeframe=` | Overview chart series |
| GET | `/api/services` | Service metrics |
| GET | `/api/databases/{database_id}/metrics` | Capacity metrics and history |
| GET | `/api/databases/{database_id}/archival-jobs` | Archival jobs |
| GET | `/api/queues/{queue_id}` | Queue metrics |
| GET | `/api/logs/{component}?severity=&limit=` | Synthetic logs |
| GET | `/api/incidents?status=` | Incidents |
| GET | `/api/transactions/summary` | Transaction counts |
| POST | `/api/reconciliation/run` | Run reconciliation |
| GET | `/api/reconciliation/exceptions?status=` | Exceptions |
| GET | `/api/compliance/controls?status=` | Controls |
| GET | `/api/migration/modules?stage=` | Migration modules |
| GET | `/api/audit-events?limit=` | Audit trail, newest first |

## Tasks and agents

| Method | Path | Description |
|---|---|---|
| GET | `/api/workflows` | Registered workflows and steps |
| GET | `/api/agents` | Agent registry with completed step counts |
| GET | `/api/tasks?status=` | Tasks |
| POST | `/api/tasks` | Start a workflow |
| GET | `/api/tasks/{task_id}` | Task with steps |
| POST | `/api/tasks/{task_id}/cancel?actor=` | Cancel |
| POST | `/api/tasks/{task_id}/retry?actor=` | Retry a FAILED task |

Start a task:

```json
POST /api/tasks
{ "workflow": "database_investigation", "source_page": "dba", "params": {"database_id": "DB2_MAIN"}, "actor": "coo" }
→ 201 { "task_id": "TASK-…", "status": "WAITING_FOR_APPROVAL", "approval_id": "APR-…", "steps": [ … ] }
```

## Approvals

| Method | Path | Description |
|---|---|---|
| GET | `/api/approvals?decision=PENDING` | Approval inbox |
| POST | `/api/approvals/{approval_id}/decision` | Approve or reject; resumes the task |
| POST | `/api/decisions` | Legacy: records UI button decisions as audit events |

```json
POST /api/approvals/APR-…/decision
{ "approved": true, "reviewer": "dana.dba", "reviewer_role": "dba", "comment": "OK" }
→ 200 { "approval": { "decision": "APPROVED", … }, "task": { "status": "SUCCEEDED", "result": { "checks": { … } } } }
```

## Migration planner (Page 6)

| Method | Path | Description |
|---|---|---|
| GET | `/api/migration/codebase-prompt` | `{prompt, file_name}`: prompt for an IDE agent that writes `MIGRATION_CONTEXT.md` |
| POST | `/api/migration/documents` | Multipart upload: `file` (pdf, docx, md, txt; max 50 MB / 1500 pages), `source_type` (`document` or `codebase_summary`), `target_platform`, `team_size` (1-50), `actor`. Returns 202 `{document, task}`; the `migration_planning` workflow runs in the background, so poll `/api/tasks/{task_id}` |
| GET | `/api/migration/documents` | Uploaded documents (storage URI not exposed) |
| GET | `/api/migration/plans?task_id=` | Plan summaries |
| GET | `/api/migration/plans/{plan_id}` | Full plan: components, phases, timeline, narrative, checks |
| GET | `/api/migration/plans/{plan_id}/report?format=md\|pdf` | Download the report as Markdown or PDF (audited) |

Errors: 413 file too large, 415 unsupported type, 422 invalid form fields.

## Copilot and export

| Method | Path | Description |
|---|---|---|
| POST | `/api/copilot` | `{query}` → `{answer, source}`; source is `gemini`, `demo` or `error` |
| POST | `/api/export` | `{type}` → queued placeholder |
