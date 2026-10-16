"""Thin wrapper over google-genai for JSON generation and embeddings (used when agents_enabled)."""

import json
from functools import lru_cache
from typing import Any

from config import get_settings

EMBED_BATCH = 100


@lru_cache
def _client():
    from google import genai

    # Reads GOOGLE_GENAI_USE_VERTEXAI / GOOGLE_CLOUD_PROJECT or GOOGLE_API_KEY from the environment.
    return genai.Client()


def generate_json(prompt: str) -> Any:
    from google.genai import types

    response = _client().models.generate_content(
        model=get_settings().gemini_model,
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.1),
    )
    return json.loads(response.text or "null")


def embed(texts: list[str]) -> list[list[float]]:
    vectors: list[list[float]] = []
    for i in range(0, len(texts), EMBED_BATCH):
        result = _client().models.embed_content(model=get_settings().embedding_model, contents=texts[i:i + EMBED_BATCH])
        vectors += [list(e.values) for e in result.embeddings]
    return vectors
