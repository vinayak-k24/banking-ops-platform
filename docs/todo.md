# TODO / Pending Items

Order follows the implementation phases in the functional specification.

## Done

- [x] HTML converted to Next.js; 9 pages as separate routes and components; shared layout components
- [x] Python backend (FastAPI) with ADK orchestrator + 8 agents
- [x] Shared mock dataset (14 collections) and generator script
- [x] Store abstraction: in-memory and Firestore
- [x] Task lifecycle, workflow engine with retry and approval pause/resume
- [x] `database_investigation` workflow end to end (investigate → approve → execute → verify)
- [x] `incident_response` workflow
- [x] Server-side approval rules and audit trail
- [x] Frontend `/api` proxy to backend; Dockerfiles for both services; docker-compose
- [x] Backend tests (23 passing)
- [x] Migration planner on page 6: document upload (PDF/DOCX/MD/TXT) or IDE-agent codebase summary → indexed evidence → deterministic phased plan with verification → Markdown/PDF report

## Phase 1–2: Data wiring and flagship scenario

- [ ] Replace static values on page 1 (Overview) KPI cards, alerts and service health with backend data
- [ ] Page 2 (Database): live capacity cards, trend chart from `history`, archival job table, queue panel
- [ ] Page 2: "Launch investigation" button → `POST /api/tasks`; show steps and status live (polling)
- [ ] Page 2: approval panel wired to `/api/approvals/{id}/decision` (replace legacy `/api/decisions`)
- [ ] Show the same capacity incident on pages 1, 2 and 3
- [ ] Make telemetry numbers consistent with the UI (e.g. UI shows 14.2 h to threshold; backend calculates ~106 h from the seed data — adjust seed data or UI)

## Phase 3: Incidents and decisions

- [ ] Page 3: incident table, detail drawer, run `incident_response`, assign owner, resolve
- [ ] Remediation workflow with SRE approval (`execute_incident_remediation`)
- [ ] Page 9: unified action queue, approval inbox, history, execution console, verification panel
- [ ] Request-changes and approval expiry; re-approval when parameters change

## Phase 4: Agent Command Center

- [ ] Page 7: task queue, step timeline, tool invocation inspector from `/api/tasks`
- [ ] Cancel / retry / resume controls
- [ ] Agent registry and performance stats from `/api/agents`
- [ ] Use ADK agents inside workflow steps for planning and explanations (currently deterministic only; agents used by `/api/copilot`)
- [ ] Timeouts and escalation for long-running steps

## Phase 5: Reconciliation and compliance

- [ ] Page 4: exception queue, grouping, reconciliation run, correction proposal with approval
- [ ] Page 5: control register, evidence gaps, follow-up tasks, draft audit package export

## Phase 6: Risk and modernization

- [ ] Page 8: forecasts (capacity, queue, SLA), preventive task creation, forecast vs actual
- [ ] Page 6: module inventory, dependency graph, sandbox test results, stage promotion with approval
- [ ] Migration planner: test the Gemini extraction/embedding path with `AGENTS_ENABLED=true`; OCR for scanned PDFs (currently fails with "No extractable text"); list past plans in the UI
- [ ] Migration planner on Cloud Run: background planning runs after the HTTP response, so enable "CPU always allocated" or move it to Cloud Tasks / a Cloud Run job; for very large corpora consider Firestore vector search instead of in-process cosine

## Phase 7: Gemini, hardening and demo

- [ ] Enable Gemini on Vertex AI and test each agent with real tool calls
- [ ] Global search across incidents, tasks, jobs, exceptions, modules
- [ ] CSV export from filtered records; executive report to Cloud Storage (`/api/export` is a placeholder)
- [ ] Notification centre fed by events (header bell count is static `(12)`)
- [ ] Filters (time range, system, severity) applied consistently and kept across pages
- [ ] Rename page 9 to "Action & Decision Management" per spec
- [ ] "DEMO MODE — SIMULATED DATA" label wording per spec (currently "DEMO / MOCK DATA")
- [ ] Demo reset button and scripted demo scenarios

## Security and platform

- [ ] Real user authentication (e.g. Identity Platform / IAP); take reviewer identity and role from the session, not the request body
- [ ] Restrict backend so only the frontend can call it (Cloud Run IAM / ingress) once auth is in place
- [ ] Firestore transactions for task and approval updates (avoid concurrent double-approval)
- [ ] Rate limiting on `/api/copilot`

## Deployment

Deferred until local development and local end-to-end testing are complete.

- [ ] Complete and verify the full app locally (backend + frontend, `docker compose up --build`)
- [ ] Create GitHub repository and push
- [ ] Add build/CI files to the repo (content in [deployment.md](deployment.md)):
  - [ ] `cloudbuild.backend.yaml`
  - [ ] `cloudbuild.frontend.yaml`
  - [ ] `.github/workflows/deploy.yml` (only if using GitHub Actions instead of Cloud Build triggers)
- [ ] One-time GCP setup: APIs, Artifact Registry, Firestore, service account, seed data
- [ ] Deploy backend, then frontend; record the public Cloud Run links
- [ ] Cloud Build triggers (or GitHub Actions) for continuous deployment
- [ ] Cloud Monitoring dashboard and alerts; billing budget alert
- [ ] Frontend unit/e2e tests and a CI test step
