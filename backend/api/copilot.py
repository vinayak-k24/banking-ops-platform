from fastapi import APIRouter

from agents.orchestrator import create_orchestrator
from agents.runner import ask
from models.schemas import CopilotRequest, ExportRequest, utcnow

router = APIRouter(prefix="/api", tags=["copilot"])


@router.post("/copilot")
async def copilot(body: CopilotRequest):
    answer, source = await ask(create_orchestrator, body.query)
    return {"answer": answer, "source": source}


@router.post("/export", status_code=202)
def export(body: ExportRequest):
    # Placeholder: generate the report and store it in Cloud Storage later.
    name = body.type.strip() or "Report"
    return {"status": "queued", "fileName": f"{name}.pdf", "requestedAt": utcnow()}
