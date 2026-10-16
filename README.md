# Banking Operations & Intelligence Platform

Nine-page banking operations dashboard (Next.js frontend) with a Python backend that runs
Google ADK / Gemini agents against a simulated banking environment. **Synthetic data only.**

Full documentation is in [docs/](docs/README.md): architecture, agents and tools, API, data model,
pages, Google Cloud services mapping, deployment (GitHub + Cloud Run), and the TODO list.

AI coding assistants: project rules are in [AGENTS.md](AGENTS.md) (also picked up via `CLAUDE.md`,
`GEMINI.md`, `.github/copilot-instructions.md`, `.cursor/rules/`, `.agent/rules/`).

## Project structure

```
banking-ops-platform/
├── src/                          FRONTEND (Next.js 15, TypeScript, Tailwind)
│   ├── app/
│   │   ├── layout.tsx            Root HTML, fonts, icons
│   │   └── (dashboard)/          Shell layout + one route per page:
│   │       ops/ dba/ sre/ reconcile/ audit/ mainframe/ command/ risk/ governance/
│   ├── components/
│   │   ├── layout/               Sidebar, Header, GeminiDrawer, UniversalModal
│   │   ├── pages/                One component per dashboard page
│   │   └── charts/               Chart.js charts, core health gauge
│   ├── context/                  DashboardContext (modal, drawer, persona, timeframe, actions)
│   └── lib/                      api.ts (backend client), modules.ts, types.ts
│
├── backend/                      BACKEND (Python, FastAPI, Google ADK)
│   ├── main.py                   FastAPI app
│   ├── config.py                 Settings and thresholds (env / repo-root .env)
│   ├── api/                      HTTP routes: operations, tasks, approvals, copilot
│   ├── agents/                   ADK agents: orchestrator + operations, database, incident,
│   │                             reconciliation, compliance, migration, risk, verification
│   ├── tools/                    Mock tools that read/modify shared state
│   │                             (mock_database, mock_incidents, mock_transactions,
│   │                              mock_monitoring, action_executor)
│   ├── workflows/                engine.py + database_investigation, incident_response,
│   │                             approval_workflow
│   ├── services/                 firestore_store (memory/Firestore), task_manager,
│   │                             authorization, audit
│   ├── models/schemas.py         Task lifecycle, approvals, audit events, request bodies
│   ├── mock_data/*.json          Synthetic dataset (generated)
│   ├── scripts/                  generate_mock_data.py, seed_firestore.py
│   ├── tests/                    End-to-end workflow tests
│   └── Dockerfile
│
├── Dockerfile                    Frontend image
└── docker-compose.yml            Local full-stack run
```

The browser only talks to `/api/*` on the frontend; Next.js proxies it to the backend (`BACKEND_URL`).

## Run locally

Quickest way (Windows PowerShell, from the project root):

```powershell
.\dev.ps1              # creates backend\.venv + installs deps on first run, then starts both servers
.\dev.ps1 -Setup       # force reinstall of dependencies, then start
.\dev.ps1 -SetupOnly   # only create .venv and install dependencies
# If scripts are blocked: powershell -ExecutionPolicy Bypass -File .\dev.ps1
```

It opens two windows: backend on http://localhost:8000 (API docs at `/docs`) and frontend on http://localhost:3000.

Manual steps instead:

Backend (terminal 1):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python scripts\generate_mock_data.py   # optional, data is committed
.\.venv\Scripts\uvicorn main:app --reload --port 8000  # API docs: http://localhost:8000/docs
```

Frontend (terminal 2):

```powershell
npm install
npm run dev                                             # http://localhost:3000
```

Or both with Docker: `docker compose up --build`.

Tests: `cd backend; .\.venv\Scripts\python -m pytest`

## Key backend endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/telemetry` | Cross-page KPIs derived from shared state |
| GET | `/api/databases/{id}/metrics` | Capacity, growth, time to threshold |
| GET | `/api/incidents`, `/api/services`, `/api/queues/{id}` | Shared mock entities |
| GET/POST | `/api/tasks` | List / start agent workflows (`database_investigation`, `incident_response`) |
| POST | `/api/tasks/{id}/retry`, `/cancel` | Recovery controls |
| GET | `/api/approvals` | Approval inbox |
| POST | `/api/approvals/{id}/decision` | Human approve/reject (role-checked server-side), resumes the task |
| GET | `/api/audit-events` | Audit trail |
| POST | `/api/copilot` | Gemini orchestrator (demo answer unless `AGENTS_ENABLED=true`) |

## Enabling Gemini agents

There is one env file for the whole repo. Copy `.env.example` to `.env` at the repo root, set
`AGENTS_ENABLED=true` and either `GOOGLE_API_KEY` (add `GOOGLE_GENAI_USE_VERTEXAI=true` for a Google Cloud
Vertex AI express-mode key) or Vertex AI with ADC (`GOOGLE_GENAI_USE_VERTEXAI=true`, `GOOGLE_CLOUD_PROJECT`,
after `gcloud auth application-default login`).

Before spending credits, run the preflight (checks config, credentials and the model without generating):

```powershell
backend\.venv\Scripts\python backend\scripts\check_gemini.py          # no tokens used
backend\.venv\Scripts\python backend\scripts\check_gemini.py --live   # one tiny prompt
```

Agent wiring is tested offline (`backend/tests/test_agents.py`) with a scripted fake model; tests force
`AGENTS_ENABLED=false` so they never call Gemini. Each copilot question is capped at `AGENT_MAX_LLM_CALLS`
model calls (default 8).

## Deploy to Google Cloud Run

Two Cloud Run services (`banking-ops-api`, then `banking-ops-web`), deployed manually or from GitHub via
Cloud Build triggers / GitHub Actions. Step-by-step guide: [docs/deployment.md](docs/deployment.md).
