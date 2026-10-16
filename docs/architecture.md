# Architecture

## Overview

The solution is a multi-agent banking operations platform. A Next.js frontend provides 9 dashboard pages. A Python backend runs Google ADK agents (Gemini) that investigate a **simulated** banking environment by calling tools, and enforces approvals and audit in deterministic code.

Core principle: **Gemini decides what to investigate and explains findings; deterministic code calculates, checks permissions and executes; humans approve sensitive actions; every outcome is verified and recorded.**

## Layers

```
┌──────────────────────────────────────────────────────────────┐
│ Presentation (Next.js, Cloud Run service: banking-ops-web)   │
│  9 pages · sidebar/header · charts · modal · Gemini drawer   │
└───────────────────────────┬──────────────────────────────────┘
                            │  /api/*  (proxied by Next.js rewrites)
┌───────────────────────────▼──────────────────────────────────┐
│ Application API (FastAPI, Cloud Run service: banking-ops-api)│
│  routes · task lifecycle · approval enforcement · audit      │
├──────────────────────────────────────────────────────────────┤
│ Agent layer (Google ADK + Gemini on Vertex AI)               │
│  orchestrator → 8 specialised agents (planning, explanation) │
├──────────────────────────────────────────────────────────────┤
│ Deterministic services & workflows                           │
│  workflow engine · thresholds · forecasts · reconciliation   │
│  authorization · verification checks                         │
├──────────────────────────────────────────────────────────────┤
│ Tools & data                                                 │
│  mock tools → shared store (in-memory or Firestore)          │
│  mock_data/*.json · audit events · tasks · approvals         │
└──────────────────────────────────────────────────────────────┘
```

## Request flow

1. The browser calls `/api/...` on the frontend origin.
2. Next.js rewrites forward the call to `BACKEND_URL` (the backend Cloud Run service). The URL is fixed when the frontend is built.
3. FastAPI routes call workflows, tools or agents.
4. Tools read and write the shared store, so every page sees the same records.
5. Sensitive actions create an approval and pause the task; a human decision resumes it.

### Flagship flow: database capacity investigation (page 2)

```
POST /api/tasks {workflow: database_investigation}
  check_capacity → inspect_archival → check_queue → retrieve_logs
  → correlate (creates/updates shared incident)
  → plan_action (creates approval)            ── task: WAITING_FOR_APPROVAL
POST /api/approvals/{id}/decision  (DBA role, checked server-side)
  → execute (simulated archive, only with matching approval)
  → verify (deterministic checks)             ── task: SUCCEEDED / FAILED / NEEDS_INVESTIGATION
```

## Repository layout

```
banking-ops-platform/
├── src/                 Frontend (Next.js 15 App Router, TypeScript, Tailwind, Chart.js)
│   ├── app/(dashboard)/ One route per page + shared shell layout
│   ├── components/      layout/, pages/, charts/
│   ├── context/         DashboardContext (modal, drawer, persona, timeframe, actions)
│   └── lib/             api.ts (backend client), modules.ts, types.ts
├── backend/             Backend (Python 3.12, FastAPI, Google ADK)
│   ├── main.py, config.py
│   ├── api/             HTTP routes
│   ├── agents/          ADK agents
│   ├── tools/           Mock tools
│   ├── workflows/       Workflow engine and workflows
│   ├── services/        Store, task manager, authorization, audit
│   ├── models/          Pydantic schemas
│   ├── mock_data/       Synthetic dataset
│   ├── scripts/         Data generation, Firestore seeding
│   └── tests/
├── docs/                This documentation
├── Dockerfile           Frontend image
└── docker-compose.yml   Local full stack
```

## Design decisions

| Decision | Reason |
|---|---|
| Separate frontend and backend services | Python is required for ADK; each scales and deploys independently |
| Same-origin `/api` proxy | No CORS setup in the browser; backend URL is not hard-coded in client code |
| Store abstraction (`services/firestore_store.py`) | Same code runs on in-memory JSON locally and Firestore on Cloud Run |
| Workflow engine runs steps deterministically | Results are reproducible and testable; Gemini is used where reasoning adds value |
| Approvals enforced in `services/authorization.py` | LLM output cannot bypass approval; agents cannot approve; approval is tied to exact parameters |
| Verification by explicit checks | A task is never marked successful just because a response sounded successful |

## Security

- Synthetic data only. No credentials in frontend code; Gemini access uses the backend service account (Vertex AI).
- All tool inputs validated server-side (Pydantic). Log text and documents are treated as untrusted data in agent instructions.
- Approvals check role, block self-approval and agent approval, and bind to action + parameters.
- Audit events record actor, action, target and outcome without secrets.
