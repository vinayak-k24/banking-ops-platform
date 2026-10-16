# Google Cloud Services Mapping

Status: **In use** = the code supports it now · **Planned** = in the roadmap ([todo.md](todo.md)) · **Optional** = add if needed.

## Services → solution components

| Google Cloud service | Status | Used for | Solution component |
|---|---|---|---|
| **Cloud Run** | In use | Hosts both services: `banking-ops-web` (Next.js) and `banking-ops-api` (FastAPI + ADK). Provides the public HTTPS deployment links. | `Dockerfile`, `backend/Dockerfile` |
| **Vertex AI (Gemini models)** | In use (off by default) | Reasoning, planning and explanation for ADK agents. Enabled with `AGENTS_ENABLED=true`, `GOOGLE_GENAI_USE_VERTEXAI=true`. | `backend/agents/*` |
| **Agent Development Kit (ADK)** | In use | Python framework (library, not a cloud resource) for the orchestrator and 8 agents | `backend/agents/` |
| **Firestore** | In use (switchable) | Shared state: mock entities, tasks, approvals, audit events. `STORE_BACKEND=firestore`. | `backend/services/firestore_store.py`, `scripts/seed_firestore.py` |
| **Cloud Build** | In use for deploys | Builds container images from source / GitHub triggers | `gcloud run deploy --source`, Cloud Build triggers |
| **Artifact Registry** | In use for deploys | Stores the frontend and backend container images | Deployment pipeline |
| **IAM (service accounts)** | In use for deploys | Backend identity for Vertex AI and Firestore; CI deploy identity | See [deployment.md](deployment.md) |
| **Secret Manager** | Planned | Any secrets (e.g. a `GOOGLE_API_KEY` if not using Vertex AI). No secrets are needed with Vertex AI + service account. | Cloud Run `--set-secrets` |
| **Cloud Logging** | In use (automatic) | Cloud Run captures backend/frontend logs (workflow step failures are logged) | Python `logging` in backend |
| **Cloud Monitoring** | Planned | Dashboards and alerts for API errors, latency, agent run duration | — |
| **Cloud Storage** | Planned | Synthetic log files, generated reports/exports, evidence files for audit packages. `GCS_BUCKET` setting exists. | `/api/export`, compliance evidence |
| **Pub/Sub** | Optional | Event-driven triggers, e.g. `DATABASE_CAPACITY_WARNING` → start investigation task | Workflow engine |
| **Cloud Scheduler** | Optional | Periodic checks (capacity, stale queues, SLA deadlines) that create tasks | `POST /api/tasks` |
| **BigQuery** | Optional (later) | Historical analytics: incident frequency, agent success rate, forecast error | — |
| **Firebase Hosting** | Not used | Frontend runs on Cloud Run instead (Next.js server needed for `/api` proxy) | — |
| **Vertex AI Agent Engine** | Optional | Managed alternative to running ADK agents inside Cloud Run | — |

## Components → services

| Solution component | Google Cloud services |
|---|---|
| 9-page UI | Cloud Run (`banking-ops-web`) |
| API, workflow engine, approvals, audit | Cloud Run (`banking-ops-api`) |
| Agents (orchestrator + 8) | ADK on Cloud Run, Gemini on Vertex AI |
| Shared mock data, tasks, approvals, audit trail | Firestore |
| Reports, evidence, large logs | Cloud Storage (planned) |
| Build and deploy from GitHub | Cloud Build triggers (or GitHub Actions), Artifact Registry |
| Identity and access | IAM service accounts, Workload Identity Federation (GitHub Actions) |
| Observability | Cloud Logging, Cloud Monitoring (planned) |
| Scheduled / event-driven monitoring | Cloud Scheduler, Pub/Sub (optional) |

## APIs to enable

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  aiplatform.googleapis.com firestore.googleapis.com secretmanager.googleapis.com \
  iam.googleapis.com logging.googleapis.com monitoring.googleapis.com storage.googleapis.com
```

## IAM roles

| Identity | Roles |
|---|---|
| Backend runtime service account (`banking-ops-api-sa`) | `roles/aiplatform.user`, `roles/datastore.user`, `roles/storage.objectAdmin` (when Cloud Storage is added), `roles/secretmanager.secretAccessor` (if secrets used) |
| Frontend runtime service account (`banking-ops-web-sa`) | No extra roles needed |
| CI deployer (Cloud Build or GitHub Actions) | `roles/run.admin`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser`, `roles/cloudbuild.builds.editor` (if submitting builds) |

## Cost notes

Cloud Run scales to zero when idle (keep `min-instances=0` for the demo). Vertex AI charges per token when agents are enabled. Firestore charges per read/write and storage. Set a billing budget alert; it notifies but does not cap spending.
