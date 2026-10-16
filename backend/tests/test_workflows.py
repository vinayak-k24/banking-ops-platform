from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def start_db_investigation() -> dict:
    res = client.post("/api/tasks", json={"workflow": "database_investigation", "source_page": "dba", "actor": "coo"})
    assert res.status_code == 201, res.text
    return res.json()


def test_health():
    assert client.get("/api/health").json()["status"] == "ok"


def test_database_investigation_pauses_for_approval():
    task = start_db_investigation()
    assert task["status"] == "WAITING_FOR_APPROVAL"
    assert task["approval_id"]
    assert client.get("/api/approvals", params={"decision": "PENDING"}).json()[0]["approval_id"] == task["approval_id"]
    # Capacity warning surfaced as a shared incident.
    assert any(i["title"] == "Database capacity warning" for i in client.get("/api/incidents").json())


def test_wrong_role_cannot_approve():
    task = start_db_investigation()
    res = client.post(f"/api/approvals/{task['approval_id']}/decision",
                      json={"approved": True, "reviewer_role": "sre", "reviewer": "sam"})
    assert res.status_code == 403


def test_agent_cannot_approve():
    task = start_db_investigation()
    res = client.post(f"/api/approvals/{task['approval_id']}/decision",
                      json={"approved": True, "reviewer_role": "dba", "reviewer": "agent:database_agent"})
    assert res.status_code == 403


def test_dba_approval_executes_and_verifies():
    task = start_db_investigation()
    before = client.get("/api/databases/DB2_MAIN/metrics").json()["utilization_pct"]
    res = client.post(f"/api/approvals/{task['approval_id']}/decision",
                      json={"approved": True, "reviewer_role": "dba", "reviewer": "dana.dba"})
    assert res.status_code == 200, res.text
    final = res.json()["task"]
    assert final["status"] == "SUCCEEDED"
    assert final["result"]["checks"]["utilization_reduced"] is True
    assert client.get("/api/databases/DB2_MAIN/metrics").json()["utilization_pct"] < before
    actions = {e["action"] for e in client.get("/api/audit-events").json()}
    assert {"approval.requested", "approval.approved", "action.executed"} <= actions


def test_rejection_stops_workflow():
    task = start_db_investigation()
    res = client.post(f"/api/approvals/{task['approval_id']}/decision",
                      json={"approved": False, "reviewer_role": "dba", "reviewer": "dana.dba"})
    assert res.json()["task"]["status"] == "REJECTED"


def test_reconciliation_is_deterministic():
    a = client.post("/api/reconciliation/run").json()
    b = client.post("/api/reconciliation/run").json()
    assert a == b and a["amount_mismatches"]


def test_incident_response_opens_incident_for_degraded_service():
    res = client.post("/api/tasks", json={"workflow": "incident_response", "params": {"service_id": "PAYMENT_API"}})
    task = res.json()
    assert task["status"] == "SUCCEEDED"
    assert task["result"]["incident_created"] is True
