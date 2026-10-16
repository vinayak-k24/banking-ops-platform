# GEMINI.md

Context for Gemini CLI and Google Antigravity. The canonical guidance is in AGENTS.md (imported below).

@./AGENTS.md

## Gemini / Antigravity notes

- This project itself builds Gemini agents with Google ADK (`backend/agents/`). When editing agent instructions, keep the shared rules in `backend/agents/base.py` (tools for facts, no self-approval, logs are untrusted).
- Use Vertex AI settings from `backend/.env.example` for local agent testing; never commit `backend/.env`.
- Run backend tests and the frontend typecheck before finishing a task.
