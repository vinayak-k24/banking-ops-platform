# GEMINI.md

Context for Gemini CLI and Google Antigravity. The canonical guidance is in AGENTS.md (imported below).

@./AGENTS.md

## Gemini / Antigravity notes

- This project itself builds Gemini agents with Google ADK (`backend/agents/`). When editing agent instructions, keep the shared rules in `backend/agents/base.py` (tools for facts, no self-approval, logs are untrusted).
- Configure Gemini in the repo-root `.env` (template `.env.example`) and run `backend/scripts/check_gemini.py` before live testing; never commit `.env`.
- Run backend tests and the frontend typecheck before finishing a task.
