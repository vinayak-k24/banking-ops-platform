"""Migration planner endpoints (Page 6): upload a document or codebase summary, fetch plans and reports."""

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import ValidationError

from config import get_settings
from models.schemas import MigrationUploadRequest, new_id, utcnow
from services import audit, document_storage, migration_report
from services.firestore_store import get_store
from tools.migration_planning import CODEBASE_FILE_NAME, CODEBASE_PROMPT
from workflows import engine, registry  # noqa: F401 - registry registers migration_planning

router = APIRouter(prefix="/api/migration", tags=["migration"])


@router.get("/codebase-prompt")
def codebase_prompt():
    return {"prompt": CODEBASE_PROMPT, "file_name": CODEBASE_FILE_NAME}


@router.post("/documents", status_code=202)
async def upload_document(
    background: BackgroundTasks,
    file: UploadFile = File(...),
    source_type: str = Form("document"),
    target_platform: str = Form("Google Cloud"),
    team_size: int = Form(5),
    actor: str = Form("migration"),
):
    try:
        body = MigrationUploadRequest(source_type=source_type, target_platform=target_platform, team_size=team_size, actor=actor)
    except ValidationError as exc:
        raise HTTPException(422, exc.errors(include_url=False, include_context=False)) from exc

    file_name = document_storage.safe_filename(file.filename or "")
    if document_storage.extension(file_name) not in document_storage.ALLOWED_EXTENSIONS:
        raise HTTPException(415, f"Unsupported file type. Allowed: {', '.join(sorted(document_storage.ALLOWED_EXTENSIONS))}")
    limit = get_settings().migration_max_upload_mb * 1024 * 1024
    data = await file.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(413, f"File exceeds {get_settings().migration_max_upload_mb} MB")
    if not data:
        raise HTTPException(400, "File is empty")

    document_id = new_id("DOC")
    uri = document_storage.save(document_id, file_name, data)
    doc = {"document_id": document_id, "file_name": file_name, "source_type": body.source_type, "size_bytes": len(data),
           "storage_uri": uri, "status": "UPLOADED", "uploaded_by": body.actor, "uploaded_at": utcnow()}
    get_store().put("migration_documents", doc)
    audit.record(body.actor, "migration.document_uploaded", document_id, "UPLOADED", None,
                 {"file_name": file_name, "size_bytes": len(data), "source_type": body.source_type})

    task = engine.prepare("migration_planning", {"document_id": document_id, "source_type": body.source_type,
                                                 "target_platform": body.target_platform, "team_size": body.team_size},
                          body.actor, "mainframe")
    background.add_task(engine.run, task)
    return {"document": _public_doc(doc), "task": task.model_dump(mode="json")}


def _public_doc(doc: dict) -> dict:
    return {k: v for k, v in doc.items() if k != "storage_uri"}


@router.get("/documents")
def list_documents():
    docs = sorted(get_store().list("migration_documents"), key=lambda d: d["uploaded_at"], reverse=True)
    return [_public_doc(d) for d in docs]


@router.get("/plans")
def list_plans(task_id: str | None = None):
    filters = {"task_id": task_id} if task_id else {}
    plans = sorted(get_store().list("migration_plans", **filters), key=lambda p: p["created_at"], reverse=True)
    return [{k: p[k] for k in ("plan_id", "task_id", "document_id", "file_name", "source_type", "target_platform", "status", "created_at")}
            | {"total_weeks": p["plan"]["total_weeks"], "components": len(p["components"])} for p in plans]


def _plan(plan_id: str) -> dict:
    plan = get_store().get("migration_plans", plan_id)
    if not plan:
        raise HTTPException(404, "Plan not found")
    return plan


@router.get("/plans/{plan_id}")
def get_plan(plan_id: str):
    return _plan(plan_id)


@router.get("/plans/{plan_id}/report")
def download_report(plan_id: str, format: str = "md", actor: str = "migration"):
    if format not in ("md", "pdf"):
        raise HTTPException(400, "format must be md or pdf")
    plan = _plan(plan_id)
    audit.record(actor[:64], "migration.report_downloaded", plan_id, "OK", plan["task_id"], {"format": format})
    name = f"migration-plan-{plan_id}.{format}"
    headers = {"Content-Disposition": f'attachment; filename="{name}"'}
    if format == "pdf":
        return Response(migration_report.render_pdf(plan), media_type="application/pdf", headers=headers)
    return Response(migration_report.render_markdown(plan), media_type="text/markdown; charset=utf-8", headers=headers)
