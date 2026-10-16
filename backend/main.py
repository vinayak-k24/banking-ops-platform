import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api import approvals, copilot, operations, tasks
from config import get_settings
from services.firestore_store import MemoryStore, get_store

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

settings = get_settings()
app = FastAPI(title="Banking Operations Agent Platform API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

for module in (operations, tasks, approvals, copilot):
    app.include_router(module.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "environment": settings.environment, "store": settings.store_backend,
            "agents_enabled": settings.agents_enabled}


@app.post("/api/admin/reset")
def reset_demo():
    """Reload mock data (in-memory store only)."""
    store = get_store()
    if not isinstance(store, MemoryStore) or settings.environment != "demo":
        raise HTTPException(403, "Reset is only available for the in-memory demo store")
    store.reset()
    return {"status": "reset"}
