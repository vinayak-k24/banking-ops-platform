"""Chunking, embedding and similarity search over uploaded migration documents.

Uses Gemini embeddings when agents are enabled, otherwise a deterministic hashed
bag-of-words vector so the planner works offline and in tests. The method used is
recorded per document so queries are always embedded the same way.
"""

import hashlib
import math
import re

from config import get_settings
from services import llm
from services.firestore_store import get_store

CHUNK_WORDS = 700  # ~1,000 tokens
OVERLAP_WORDS = 100
HASH_DIM = 256
_WORD = re.compile(r"[a-z0-9][a-z0-9_\-/.]*")


def embedding_method() -> str:
    return "gemini" if get_settings().agents_enabled else "hashed"


def chunk_pages(document_id: str, pages: list[str]) -> list[dict]:
    """Split page text into overlapping word windows, keeping the page range of each chunk."""
    words: list[tuple[str, int]] = [(w, n) for n, text in enumerate(pages, start=1) for w in text.split()]
    chunks, start, step = [], 0, CHUNK_WORDS - OVERLAP_WORDS
    while start < len(words):
        window = words[start:start + CHUNK_WORDS]
        chunks.append({
            "chunk_id": f"{document_id}-{len(chunks):05d}",
            "document_id": document_id,
            "index": len(chunks),
            "page_start": window[0][1],
            "page_end": window[-1][1],
            "text": " ".join(w for w, _ in window),
        })
        start += step
    return chunks


def hashed_vector(text: str) -> list[float]:
    vec = [0.0] * HASH_DIM
    for word in _WORD.findall(text.lower()):
        h = int.from_bytes(hashlib.md5(word.encode()).digest()[:4], "little")
        vec[h % HASH_DIM] += 1.0 if (h >> 31) == 0 else -1.0
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def embed_texts(texts: list[str], method: str) -> list[list[float]]:
    if method == "gemini":
        return llm.embed(texts)
    return [hashed_vector(t) for t in texts]


def index_document(document_id: str, chunks: list[dict], method: str) -> int:
    vectors = embed_texts([c["text"] for c in chunks], method)
    store = get_store()
    for chunk, vector in zip(chunks, vectors):
        store.put("migration_chunks", {**chunk, "embedding": vector})
    return len(chunks)


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na, nb = math.sqrt(sum(x * x for x in a)), math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def document_chunks(document_id: str) -> list[dict]:
    return sorted(get_store().list("migration_chunks", document_id=document_id), key=lambda c: c["index"])


def search(document_id: str, query: str, top_k: int = 6) -> list[dict]:
    doc = get_store().get("migration_documents", document_id)
    if not doc:
        return []
    qvec = embed_texts([query], doc.get("embedding_method", "hashed"))[0]
    scored = [(_cosine(qvec, c["embedding"]), c) for c in document_chunks(document_id)]
    scored.sort(key=lambda s: s[0], reverse=True)
    return [{"chunk_id": c["chunk_id"], "page_start": c["page_start"], "page_end": c["page_end"],
             "score": round(score, 4), "text": c["text"]} for score, c in scored[:top_k]]
