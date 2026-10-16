import json

import pytest
from fastapi.testclient import TestClient

from config import get_settings
from main import app
from services import vector_index
from tools import migration_planning as mp

client = TestClient(app)

DOCUMENT_TEXT = """Legacy core banking overview.

The core ledger runs COBOL programs under CICS on the mainframe. Account data is stored in a Db2 database
with about 400 tables. Stored procedures in Db2 calculate interest and fees.

Nightly JCL batch jobs scheduled with Control-M post interest. Payments are exchanged with partners over
MQ message queues and SFTP file transfer. Historical data migration of 12 years of transactions is required.
"""


@pytest.fixture(autouse=True)
def tmp_uploads(tmp_path, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "upload_dir", tmp_path)
    monkeypatch.setattr(settings, "gcs_bucket", None)
    monkeypatch.setattr(settings, "agents_enabled", False)


def comp(cid, ctype, size="M", complexity="medium", deps=(), refs=("p.1",)):
    return {"id": cid, "name": cid, "type": ctype, "size": size, "complexity": complexity,
            "depends_on": list(deps), "source_refs": list(refs), "notes": ""}


def upload(name: str, data: bytes, **form) -> dict:
    res = client.post("/api/migration/documents", files={"file": (name, data)}, data=form)
    assert res.status_code == 202, res.text
    return res.json()


def finished_task(body: dict) -> dict:
    # TestClient runs background tasks before returning, so the task is already terminal.
    return client.get(f"/api/tasks/{body['task']['task_id']}").json()


# ---- Deterministic planning ----

def test_effort_and_timeline_are_deterministic():
    plan = mp.build_plan([comp("db", "database", "M", "high"), comp("app", "application", "L", deps=["db"])], 5, 20)
    assert [p["key"] for p in plan["phases"]] == ["mobilisation", "database", "application", "cutover"]
    assert [p["duration_weeks"] for p in plan["phases"]] == [2.0, 5.0, 5.5, 2.0]
    assert plan["total_weeks"] == 14.5
    assert plan["total_effort_person_weeks"] == 40.5
    assert plan["phases"][2]["start_week"] == 7.0


def test_database_migrated_before_code_even_if_listed_first():
    plan = mp.build_plan([comp("app", "application", deps=["db"]), comp("sp", "query", deps=["db"]), comp("db", "database")], 3, 20)
    assert plan["component_order"] == ["db", "sp", "app"]
    assert all(c["passed"] for c in mp.verify_plan([comp("app", "application", deps=["db"]), comp("sp", "query", deps=["db"]),
                                                    comp("db", "database")], plan))


def test_dependency_pushes_component_to_later_phase():
    comps = [comp("api", "application"), comp("reporting-db", "database", deps=["api"])]
    plan = mp.build_plan(comps, 4, 20)
    phase = next(p for p in plan["phases"] if "reporting-db" in p["components"])
    assert phase["key"] == "application"
    assert any("moved" in w for w in plan["warnings"])
    assert all(c["passed"] for c in mp.verify_plan(comps, plan))


def test_dependency_cycle_fails_verification():
    comps = [comp("a", "application", deps=["b"]), comp("b", "application", deps=["a"])]
    plan = mp.build_plan(comps, 4, 20)
    assert plan["error"] == "Dependency cycle detected"
    assert mp.verify_plan(comps, plan)[0]["passed"] is False


def test_normalize_drops_uncited_and_invalid_components():
    comps, warnings = mp.normalize_components([
        {"name": "Core Ledger", "type": "Application", "size": "l", "complexity": "High", "source_refs": ["p.3"]},
        {"name": "Ghost DB", "type": "database", "size": "M", "complexity": "low", "source_refs": []},
        {"name": "Bad", "type": "spaceship", "size": "M", "complexity": "low", "source_refs": ["p.1"]},
    ])
    assert [c["id"] for c in comps] == ["core-ledger"]
    assert comps[0]["size"] == "L" and comps[0]["type"] == "application"
    assert len(warnings) == 2


def test_parse_codebase_summary_json_block():
    text = "# Context\n\n## Machine-readable inventory\n```json\n" + json.dumps({"components": [comp("db", "database")]}) + "\n```\n"
    assert mp.parse_codebase_summary(text)[0]["id"] == "db"
    assert mp.parse_codebase_summary("no inventory here") is None


def test_chunking_keeps_page_ranges_and_hashed_search_ranks_relevant_chunk():
    pages = ["alpha " * 800, "db2 database schema tables " * 50]
    chunks = vector_index.chunk_pages("DOC-T", pages)
    assert chunks[0]["page_start"] == 1 and chunks[-1]["page_end"] == 2
    q = vector_index.hashed_vector("db2 database tables")
    best = max(chunks, key=lambda c: sum(x * y for x, y in zip(q, vector_index.hashed_vector(c["text"]))))
    assert best["page_end"] == 2


# ---- End-to-end ----

def test_document_upload_produces_verified_plan_and_reports():
    body = upload("core-banking.md", DOCUMENT_TEXT.encode(), team_size="4", target_platform="Google Cloud")
    assert "storage_uri" not in body["document"]
    task = finished_task(body)
    assert task["status"] == "SUCCEEDED", task
    plan = client.get(f"/api/migration/plans/{task['result']['plan_id']}").json()
    keys = [p["key"] for p in plan["plan"]["phases"]]
    assert keys.index("database") < keys.index("query") < keys.index("application") < keys.index("batch")
    assert plan["extraction_method"] == "keyword"
    assert all(c["passed"] for c in plan["checks"])

    md = client.get(f"/api/migration/plans/{plan['plan_id']}/report", params={"format": "md"})
    assert md.status_code == 200 and "## Phases and timeline" in md.text
    pdf = client.get(f"/api/migration/plans/{plan['plan_id']}/report", params={"format": "pdf"})
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF")
    from services import audit

    actions = {e["action"] for e in audit.recent(200)}
    assert {"migration.document_uploaded", "migration.plan_created", "migration.report_downloaded"} <= actions


def test_pdf_upload_is_extracted():
    from fpdf import FPDF

    pdf = FPDF()
    for line in DOCUMENT_TEXT.split("\n\n"):
        pdf.add_page()
        pdf.set_font("Helvetica", size=11)
        pdf.multi_cell(0, 6, line.replace("\n", " "))
    task = finished_task(upload("spec.pdf", bytes(pdf.output())))
    assert task["status"] == "SUCCEEDED", task
    assert task["steps"][0]["output"]["page_count"] == 3


def test_codebase_summary_uses_json_inventory():
    inventory = {"components": [comp("orders-db", "database", refs=[]), comp("orders-api", "application", deps=["orders-db"], refs=["src/api"])]}
    text = f"# MIGRATION_CONTEXT\n\n## 1. Overview\nOrders service.\n\n## Machine-readable inventory\n```json\n{json.dumps(inventory)}\n```\n"
    task = finished_task(upload("MIGRATION_CONTEXT.md", text.encode(), source_type="codebase_summary"))
    assert task["status"] == "SUCCEEDED", task
    plan = client.get(f"/api/migration/plans/{task['result']['plan_id']}").json()
    assert plan["extraction_method"] == "codebase_inventory"
    assert plan["plan"]["component_order"] == ["orders-db", "orders-api"]
    assert plan["components"][0]["source_refs"] == [mp.CODEBASE_FILE_NAME]


def test_document_without_components_needs_investigation():
    task = finished_task(upload("notes.txt", b"Team lunch is on Friday."))
    assert task["status"] == "NEEDS_INVESTIGATION"


def test_upload_validation():
    assert client.post("/api/migration/documents", files={"file": ("x.exe", b"MZ")}).status_code == 415
    assert client.post("/api/migration/documents", files={"file": ("x.md", b"")}).status_code == 400
    assert client.post("/api/migration/documents", files={"file": ("x.md", b"db2")}, data={"team_size": "0"}).status_code == 422
    assert client.post("/api/migration/documents", files={"file": ("x.md", b"db2")}, data={"source_type": "evil"}).status_code == 422


def test_upload_size_limit(monkeypatch):
    monkeypatch.setattr(get_settings(), "migration_max_upload_mb", 1)
    res = client.post("/api/migration/documents", files={"file": ("big.txt", b"a" * (1024 * 1024 + 1))})
    assert res.status_code == 413


def test_report_errors_and_prompt():
    assert client.get("/api/migration/plans/PLAN-NOPE").status_code == 404
    assert client.get("/api/migration/plans/PLAN-NOPE/report", params={"format": "docx"}).status_code == 400
    prompt = client.get("/api/migration/codebase-prompt").json()
    assert prompt["file_name"] == "MIGRATION_CONTEXT.md" and "```json" in prompt["prompt"]


def test_storage_rejects_path_traversal():
    from services import document_storage

    with pytest.raises(ValueError):
        document_storage.load("file://../../etc/passwd")
    assert document_storage.safe_filename("..\\..\\evil name.md") == "evil_name.md"
