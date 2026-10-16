"""Runs an ADK agent for a single request and returns its final text response."""

import logging

from config import gemini_credentials_problem, get_settings

log = logging.getLogger(__name__)
APP_NAME = "banking_ops"


async def run_agent(agent, prompt: str, user_id: str = "ui") -> str:
    from google.adk.agents.run_config import RunConfig
    from google.adk.runners import InMemoryRunner
    from google.genai import types

    runner = InMemoryRunner(agent=agent, app_name=APP_NAME)
    session = await runner.session_service.create_session(app_name=APP_NAME, user_id=user_id)
    message = types.Content(role="user", parts=[types.Part(text=prompt)])
    run_config = RunConfig(max_llm_calls=get_settings().agent_max_llm_calls)

    final = ""
    async for event in runner.run_async(user_id=user_id, session_id=session.id, new_message=message, run_config=run_config):
        if event.is_final_response() and event.content and event.content.parts:
            final = "".join(p.text or "" for p in event.content.parts)
    return final


async def ask(agent_factory, prompt: str) -> tuple[str, str]:
    """Returns (answer, source). Falls back to a demo answer when agents are disabled or fail."""
    from google.adk.agents.invocation_context import LlmCallsLimitExceededError

    if not get_settings().agents_enabled:
        return (f'Demo mode: agents are disabled (set AGENTS_ENABLED=true).\n\nQuery received: "{prompt}"', "demo")
    # Fail before any network call so a misconfigured .env costs nothing.
    problem = gemini_credentials_problem()
    if problem:
        return (f"Gemini is not configured: {problem}", "config_error")
    try:
        answer = await run_agent(agent_factory(), prompt)
        return (answer or "The agent finished without a text answer.", "gemini")
    except LlmCallsLimitExceededError:
        log.warning("agent hit max_llm_calls=%s", get_settings().agent_max_llm_calls)
        return ("The agent stopped after reaching the per-request model call limit (AGENT_MAX_LLM_CALLS).", "limit")
    except Exception:  # noqa: BLE001 - surface a safe message, keep details in logs
        log.exception("agent run failed")
        return ("The agent could not complete this request. Check backend logs.", "error")
