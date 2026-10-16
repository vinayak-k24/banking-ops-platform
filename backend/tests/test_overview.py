from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def overview(timeframe: str = "This Month") -> dict:
    res = client.get("/api/charts/overview", params={"timeframe": timeframe})
    assert res.status_code == 200, res.text
    return res.json()


def test_cash_flow_has_seven_days_and_matching_totals():
    cf = overview()["cashFlow"]
    assert len(cf["labels"]) == 7
    inflow, outflow = cf["datasets"]
    assert len(inflow["data"]) == len(outflow["data"]) == 7
    assert round(sum(inflow["data"]), 2) == cf["totals"]["inflow"] == 25_400_000
    assert round(sum(outflow["data"]), 2) == cf["totals"]["outflow"] == 18_200_000


def test_reconciliation_trend_follows_timeframe():
    month = overview("This Month")["reconcile"]
    week = overview("7 Days")["reconcile"]
    today = overview("Today")["reconcile"]
    assert len(today["observations"]) == 1
    assert len(week["observations"]) == 7
    assert len(month["observations"]) == 16  # 1-16 October
    assert month["observations"][-1]["date"] == month["latest"]["date"]
    assert all(0 <= o["accuracy_pct"] <= 100 for o in month["observations"])
    assert month["target_pct"] == 99.5


def test_reconciliation_accuracy_is_matched_over_total():
    obs = overview("7 Days")["reconcile"]["observations"][-1]
    assert obs["accuracy_pct"] == round(obs["matched"] / obs["total"] * 100, 2)


def test_core_health_status_uses_thresholds():
    health = overview()["coreHealth"]
    assert health["value"] == 0.93 and health["status"] == "HEALTHY"
    assert health["thresholds"] == {"healthy": 0.9, "warning": 0.75}


def test_acknowledge_and_resolve_incident_updates_kpis_and_audit():
    before = client.get("/api/telemetry").json()["activeCriticalIncidents"]
    res = client.post("/api/incidents/INC-1004/status", json={"action": "acknowledge", "actor": "sre"})
    assert res.status_code == 200 and res.json()["status"] == "INVESTIGATING" and res.json()["owner"] == "sre"
    assert client.get("/api/telemetry").json()["activeCriticalIncidents"] == before

    res = client.post("/api/incidents/INC-1004/status", json={"action": "resolve", "actor": "sre"})
    assert res.json()["status"] == "RESOLVED"
    assert client.get("/api/telemetry").json()["activeCriticalIncidents"] == before - 1
    events = [e for e in client.get("/api/audit-events").json() if e["target"] == "INC-1004"]
    assert {e["outcome"] for e in events} >= {"INVESTIGATING", "RESOLVED"}

    assert client.post("/api/incidents/INC-1004/status", json={"action": "resolve", "actor": "sre"}).status_code == 409


def test_incident_status_rejects_unknown_incident_and_action():
    assert client.post("/api/incidents/INC-0000/status", json={"action": "resolve", "actor": "sre"}).status_code == 404
    assert client.post("/api/incidents/INC-1004/status", json={"action": "delete", "actor": "sre"}).status_code == 422
