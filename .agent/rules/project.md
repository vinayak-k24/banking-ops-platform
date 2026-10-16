# Project rules (Google Antigravity)

Follow `AGENTS.md` at the repository root; it is the source of truth.

Essentials:
- Frontend (Next.js 15, `src/`) calls backend only through `src/lib/api.ts` (`/api/...`).
- Backend (FastAPI + Google ADK, `backend/`): storage via `get_store()`, audit every state change, deterministic calculations and verification, approvals enforced in `services/authorization.py`.
- Synthetic data only; never commit `.env` or credentials; keep `typescript@5`; no CI/build files yet.
- Before finishing: backend `pytest`, `npx tsc --noEmit`, `npm run build`; update `docs/`.
