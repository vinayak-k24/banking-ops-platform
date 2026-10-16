---
description: Run all project checks (backend tests, frontend typecheck and build)
---

1. In `backend/`, run `.\.venv\Scripts\python -m pytest -q`. If `.venv` is missing, run `.\dev.ps1 -SetupOnly` from the repo root first.
2. From the repo root, run `npx tsc --noEmit`.
3. From the repo root, run `npm run build`.
4. Report any failures with the relevant output and fix them before continuing.
