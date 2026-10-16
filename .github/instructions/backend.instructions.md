---
applyTo: "backend/**/*.py"
---

# Backend (Python) instructions

- Python 3.12, FastAPI, Pydantic v2, google-adk. Run from `backend/` (imports are relative to it, e.g. `from services import audit`).
- Storage only through `get_store()`; audit every state change with `audit.record(actor, action, target, outcome, task_id, details={...})`.
- Tools: typed functions, docstring with `Args:`, return dicts, `{"error": ...}` for not found.
- Money: `Decimal`. Thresholds from `config.get_settings()`, not literals.
- Sensitive actions: `request_approval` + `PauseForApproval`; verification via `VerificationOutcome`.
- Add/adjust tests in `backend/tests/` for every behaviour change.
