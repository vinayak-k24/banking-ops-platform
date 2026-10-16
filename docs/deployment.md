# Deployment

Two Cloud Run services are deployed from one GitHub repository:

| Service | Source | Port | Public link (format) |
|---|---|---|---|
| `banking-ops-api` | `backend/` (`backend/Dockerfile`) | `$PORT` (8080) | `https://banking-ops-api-<PROJECT_NUMBER>.<REGION>.run.app` |
| `banking-ops-web` | repo root (`Dockerfile`) | `$PORT` (8080) | `https://banking-ops-web-<PROJECT_NUMBER>.<REGION>.run.app` |

The **frontend URL is the deployment link to submit**. The backend URL is needed when building the frontend, because `BACKEND_URL` is fixed into the `/api` proxy at build time. Deploy the backend first.

Cloud Run also shows each service URL in the console and via:

```bash
gcloud run services describe banking-ops-web --region us-central1 --format 'value(status.url)'
```

## 1. Local run

```powershell
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\uvicorn main:app --reload --port 8000

# Frontend (second terminal, repo root)
npm install
npm run dev            # http://localhost:3000
```

Or both: `docker compose up --build`.

## 2. GitHub repository

```bash
cd banking-ops-platform
git init
git add .
git commit -m "Initial commit: banking ops platform"
git branch -M main
git remote add origin https://github.com/<org-or-user>/banking-ops-platform.git
git push -u origin main
```

Check before pushing:
- `.gitignore` excludes `node_modules`, `.next`, `.env*`, `backend/.venv`.
- No keys in the repo. The single repo-root `.env` stays local (excluded from git and both Docker build contexts); use Cloud Run env vars / Secret Manager.
- `backend/mock_data/*.json` **is** committed (needed by the in-memory store and the seed script).

## 3. One-time Google Cloud setup

```bash
PROJECT=<project-id>
REGION=us-central1
gcloud config set project $PROJECT

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  aiplatform.googleapis.com firestore.googleapis.com secretmanager.googleapis.com

# Container registry
gcloud artifacts repositories create banking-ops --repository-format=docker --location=$REGION

# Firestore (Native mode)
gcloud firestore databases create --location=$REGION

# Backend runtime identity
gcloud iam service-accounts create banking-ops-api-sa
SA=banking-ops-api-sa@$PROJECT.iam.gserviceaccount.com
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$SA --role=roles/aiplatform.user
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$SA --role=roles/datastore.user

# Seed Firestore from your machine (after gcloud auth application-default login)
cd backend; python scripts/seed_firestore.py --project $PROJECT
```

## 4. Manual deployment (first deploy / quick redeploy)

### Backend

```bash
gcloud run deploy banking-ops-api --source backend --region $REGION \
  --service-account $SA --allow-unauthenticated \
  --set-env-vars STORE_BACKEND=firestore,GCP_PROJECT=$PROJECT,AGENTS_ENABLED=true,GOOGLE_GENAI_USE_VERTEXAI=true,GOOGLE_CLOUD_PROJECT=$PROJECT,GOOGLE_CLOUD_LOCATION=$REGION

BACKEND_URL=$(gcloud run services describe banking-ops-api --region $REGION --format 'value(status.url)')
```

### Frontend

`gcloud run deploy --source` cannot pass Docker build args, so build the image with Cloud Build using a config file:

```bash
gcloud builds submit --config cloudbuild.frontend.yaml \
  --substitutions=_REGION=$REGION,_BACKEND_URL=$BACKEND_URL .
```

The build config also deploys the image (see section 5). Then update the backend CORS setting to allow the frontend origin (only needed for direct browser calls; the `/api` proxy is server-to-server):

```bash
WEB_URL=$(gcloud run services describe banking-ops-web --region $REGION --format 'value(status.url)')
gcloud run services update banking-ops-api --region $REGION --update-env-vars "^@^CORS_ORIGINS=[\"$WEB_URL\"]"
```

## 5. Continuous deployment from GitHub (Cloud Build triggers) — recommended

Each push to `main` rebuilds and redeploys the services.

1. Console → **Cloud Build → Triggers → Connect repository** → GitHub → install the Cloud Build GitHub App on the repo.
2. Add the two build configs below to the repo root.
3. Create two triggers (push to `main`):
   - `deploy-api`: config `cloudbuild.backend.yaml`, included files filter `backend/**`.
   - `deploy-web`: config `cloudbuild.frontend.yaml`, ignored files filter `backend/**`, substitution `_BACKEND_URL=<backend URL>`.
4. Grant the Cloud Build service account `roles/run.admin` and `roles/iam.serviceAccountUser`.

`cloudbuild.backend.yaml`:

```yaml
substitutions:
  _REGION: us-central1
steps:
  - name: gcr.io/cloud-builders/docker
    args: [build, -t, '${_REGION}-docker.pkg.dev/$PROJECT_ID/banking-ops/api:$SHORT_SHA', backend]
  - name: gcr.io/cloud-builders/docker
    args: [push, '${_REGION}-docker.pkg.dev/$PROJECT_ID/banking-ops/api:$SHORT_SHA']
  - name: gcr.io/google.com/cloudsdktool/cloud-sdk
    entrypoint: gcloud
    args: [run, deploy, banking-ops-api, --image, '${_REGION}-docker.pkg.dev/$PROJECT_ID/banking-ops/api:$SHORT_SHA',
           --region, '${_REGION}', --service-account, 'banking-ops-api-sa@$PROJECT_ID.iam.gserviceaccount.com',
           --allow-unauthenticated]
images: ['${_REGION}-docker.pkg.dev/$PROJECT_ID/banking-ops/api:$SHORT_SHA']
```

`cloudbuild.frontend.yaml`:

```yaml
substitutions:
  _REGION: us-central1
  _BACKEND_URL: ''
  _TAG: latest
steps:
  - name: gcr.io/cloud-builders/docker
    args: [build, --build-arg, 'BACKEND_URL=${_BACKEND_URL}',
           -t, '${_REGION}-docker.pkg.dev/$PROJECT_ID/banking-ops/web:${_TAG}', .]
  - name: gcr.io/cloud-builders/docker
    args: [push, '${_REGION}-docker.pkg.dev/$PROJECT_ID/banking-ops/web:${_TAG}']
  - name: gcr.io/google.com/cloudsdktool/cloud-sdk
    entrypoint: gcloud
    args: [run, deploy, banking-ops-web, --image, '${_REGION}-docker.pkg.dev/$PROJECT_ID/banking-ops/web:${_TAG}',
           --region, '${_REGION}', --allow-unauthenticated]
images: ['${_REGION}-docker.pkg.dev/$PROJECT_ID/banking-ops/web:${_TAG}']
```

Environment variables set on the backend service (section 4) persist across redeploys of new images.

`$SHORT_SHA` is only set for builds started by a trigger; for manual `gcloud builds submit`, pass `_TAG` instead (frontend config) or replace `$SHORT_SHA`.

## 6. Alternative: GitHub Actions

Use Workload Identity Federation (no JSON keys) with `google-github-actions/auth` and `google-github-actions/deploy-cloudrun`:

```yaml
# .github/workflows/deploy.yml
on: { push: { branches: [main] } }
permissions: { contents: read, id-token: write }
jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.DEPLOY_SA }}
      - uses: google-github-actions/deploy-cloudrun@v2
        with: { service: banking-ops-api, source: ./backend, region: us-central1 }
  deploy-web:
    needs: deploy-api
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.DEPLOY_SA }}
      - uses: google-github-actions/setup-gcloud@v2
      - run: gcloud builds submit --config cloudbuild.frontend.yaml --substitutions=_BACKEND_URL=${{ vars.BACKEND_URL }},_TAG=${{ github.sha }} .
```

The deploy service account needs the CI roles listed in [gcp-services.md](gcp-services.md).

## 7. Public access and verification

- `--allow-unauthenticated` makes the links public. If your organization policy blocks `allUsers`, the deploy succeeds but the link returns 403; ask the org admin for an exception or use IAP.
- Verify after deploy:
  ```bash
  curl $BACKEND_URL/api/health
  curl $WEB_URL/api/health      # same response, through the frontend proxy
  ```
  Open `$WEB_URL` in a browser — it redirects to `/ops`.

## 8. Configuration reference

| Variable | Service | Default | Notes |
|---|---|---|---|
| `BACKEND_URL` | web (build time) | `http://localhost:8000` | Backend base URL for the `/api` proxy |
| `STORE_BACKEND` | api | `memory` | Use `firestore` on Cloud Run |
| `GCP_PROJECT` | api | — | Firestore project |
| `AGENTS_ENABLED` | api | `false` | Enables Gemini agents |
| `GOOGLE_GENAI_USE_VERTEXAI` | api | — | `true` to use Vertex AI with the service account |
| `GOOGLE_API_KEY` | api | — | AI Studio key, or Vertex AI express-mode key with `GOOGLE_GENAI_USE_VERTEXAI=true`. Store in Secret Manager. Ignored by the SDK if `GOOGLE_CLOUD_PROJECT` is also set (service-account credentials win); not needed with the service-account setup above |
| `AGENT_MAX_LLM_CALLS` | api | `8` | Max model calls per copilot question |
| `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION` | api | — | Vertex AI project/region |
| `GEMINI_MODEL` | api | `gemini-2.0-flash` | Check the model is available in your region |
| `CORS_ORIGINS` | api | `["http://localhost:3000"]` | JSON list |
| `ENVIRONMENT` | api | `demo` | `/api/admin/reset` only works in `demo` with the memory store |
