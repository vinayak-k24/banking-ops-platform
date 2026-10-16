# GitHub Copilot instructions

Full guidance: [AGENTS.md](../AGENTS.md). Key points:

- **Stack:** Next.js 15 (App Router, TypeScript, Tailwind 3, Chart.js) in `src/`; Python 3.12 FastAPI + Google ADK in `backend/`. Synthetic banking data only.
- **Frontend** calls the backend only via `src/lib/api.ts` with relative `/api/...` paths. Types in `src/lib/types.ts` mirror `backend/models/schemas.py`. Pages use `useDashboard()` from `src/context/DashboardContext.tsx`. Keep existing Tailwind styling and Font Awesome icons.
- **Backend:** all storage via `services/firestore_store.get_store()`; every state change writes `services/audit.record(...)`; calculations and verification are deterministic code in `tools/`/`workflows/`, not LLM output.
- **Approvals** are enforced in `services/authorization.py`: agents can't approve, no self-approval, execution requires an approval matching action and parameters. Tasks follow the lifecycle in `models/schemas.py`; never mark SUCCEEDED without verification checks.
- **Tools** are typed functions with `Args:` docstrings (ADK tool schemas). New workflows register in `workflows/registry.py`; new agents use `agents/base.build_agent` and are added to `orchestrator.py`.
- **Don't** commit `.env` files or credentials, upgrade to TypeScript 7, or add CI/build files yet.
- **Checks:** `cd backend; .\.venv\Scripts\python -m pytest -q`, `npx tsc --noEmit`, `npm run build`. Update `docs/` and `docs/todo.md` with behaviour changes.
