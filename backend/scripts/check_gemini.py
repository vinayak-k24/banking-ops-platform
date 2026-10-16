"""Preflight check for Gemini before spending credits.

    python scripts/check_gemini.py          # config + credentials + model lookup (no generation)
    python scripts/check_gemini.py --live   # also one tiny generate call (uses a few tokens)

Reads the repo-root .env exactly like the backend does.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import ENV_FILE, gemini_credentials_problem, get_settings  # noqa: E402


def main() -> int:
    settings = get_settings()
    vertex = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "").strip().lower() in ("1", "true", "yes")
    print(f".env file        : {ENV_FILE} ({'found' if ENV_FILE.exists() else 'MISSING'})")
    print(f"AGENTS_ENABLED   : {settings.agents_enabled}")
    print(f"GEMINI_MODEL     : {settings.gemini_model}")
    print(f"Backend          : {'Vertex AI' if vertex else 'Gemini API (AI Studio key)'}")
    print(f"GOOGLE_API_KEY   : {'set' if os.getenv('GOOGLE_API_KEY', '').strip() else 'not set'}")  # never print the value
    print(f"Max model calls  : {settings.agent_max_llm_calls} per copilot question")

    problem = gemini_credentials_problem()
    if problem:
        print(f"FAIL credentials : {problem}")
        return 1
    if not settings.agents_enabled:
        print("WARN             : AGENTS_ENABLED=false, the copilot will stay in demo mode.")
    if vertex and os.getenv("GOOGLE_API_KEY", "").strip() and os.getenv("GOOGLE_CLOUD_PROJECT", "").strip():
        # google-genai drops the API key when a project is set and uses Application Default Credentials instead.
        print("WARN             : GOOGLE_API_KEY is IGNORED because GOOGLE_CLOUD_PROJECT is also set (Vertex AI uses ADC). "
              "Remove GOOGLE_CLOUD_PROJECT to use the key.")

    from google import genai

    try:
        client = genai.Client()
        model = client.models.get(model=settings.gemini_model)  # metadata only, no tokens
        print(f"OK model lookup  : {model.name}")
    except Exception as e:  # noqa: BLE001
        print(f"FAIL model lookup: {type(e).__name__}: {str(e)[:300]}")
        return 1

    if "--live" in sys.argv:
        try:
            r = client.models.generate_content(model=settings.gemini_model, contents="Reply with the single word OK.")
            usage = r.usage_metadata
            print(f"OK live call     : {(r.text or '').strip()[:40]!r} (tokens: {usage.total_token_count if usage else '?'})")
        except Exception as e:  # noqa: BLE001
            print(f"FAIL live call   : {type(e).__name__}: {str(e)[:300]}")
            return 1
    print("Ready.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
