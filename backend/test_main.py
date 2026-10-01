import os
import json
import pytest
from fastapi.testclient import TestClient
from main import app
from firestore_service import data_service

client = TestClient(app)

def test_healthz():
    resp = client.get("/healthz")
    assert resp.status_code == 200
    assert resp.json().get("status") == "ok"
    assert resp.json().get("mode") == "firestore_native"

def test_districts():
    resp = client.get("/api/districts")
    assert resp.status_code == 200
    districts = resp.json()
    assert isinstance(districts, list)
    assert len(districts) > 0
    assert "Pune" in districts
    assert "Bastar" in districts

def test_district_weather():
    resp = client.get("/api/districts/Bastar/weather")
    assert resp.status_code == 200
    w = resp.json()
    assert "temp_c" in w
    assert "precipitation_mm" in w
    assert "source" in w
    assert "Open-Meteo" in w["source"]

def test_dashboard_stats():
    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_requests"] > 0
    assert data["critical_requests"] > 0
    assert "live_requests" in data
    assert "demo_requests" in data
    assert len(data["by_sector"]) > 0
    assert len(data["by_district"]) > 0
    
    # Assert stats.total equals actual Firestore count
    fs_count = data_service.db.collection("requests").count().get()[0][0].value
    assert data["total_requests"] == fs_count

def test_requests_endpoint():
    resp = client.get("/api/requests?limit=10")
    assert resp.status_code == 200
    reqs = resp.json()
    assert isinstance(reqs, list)
    assert len(reqs) > 0
    first = reqs[0]
    assert "id" in first
    assert "sector" in first
    assert "district" in first
    assert "source" in first

def test_requests_district_filter():
    resp = client.get("/api/requests?district=Pune&limit=5")
    assert resp.status_code == 200
    reqs = resp.json()
    for r in reqs:
        assert r["district"].lower() == "pune"

def test_priority_queue():
    resp = client.get("/api/priority")
    assert resp.status_code == 200
    scores = resp.json()
    assert len(scores) > 0
    top = scores[0]
    assert "score" in top
    assert "demand" in top
    assert "deficit" in top
    assert "breakdown" in top
    assert "evidence_quotes" in top
    assert "weather_signal" in top
    assert isinstance(top["evidence_quotes"], list)
    assert len(top["evidence_quotes"]) > 0

def test_priority_mismatch():
    resp = client.get("/api/priority/mismatch")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) > 0
    assert "demand" in items[0]
    assert "deficit" in items[0]

def test_clusters():
    resp = client.get("/api/clusters")
    assert resp.status_code == 200
    clusters = resp.json()
    assert len(clusters) > 0
    assert "size" in clusters[0]
    assert "district" in clusters[0]

def test_hotspots():
    resp = client.get("/api/hotspots")
    assert resp.status_code == 200
    hotspots = resp.json()
    assert len(hotspots) > 0
    first = hotspots[0]
    assert "lat" in first
    assert "lng" in first
    assert "intensity" in first
    assert "district" in first

def test_recommendations():
    resp = client.get("/api/recommendations")
    assert resp.status_code == 200
    recs = resp.json()
    assert len(recs) > 0
    assert "title" in recs[0]
    assert "description" in recs[0]

def test_impact():
    resp = client.get("/api/impact?initiative=Jal+Jeevan+Mission")
    assert resp.status_code == 200
    data = resp.json()
    assert "affected_citizens_baseline" in data
    assert "projected_resolution_rate" in data

def test_brief_export():
    resp = client.get("/api/brief/export")
    assert resp.status_code == 200
    assert "JanSetu" in resp.text
    assert "Priority Allocations" in resp.text

def test_chat_sql_query():
    resp = client.post("/api/chat", json={"message": "Which districts have the highest number of water problems?"})
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert "sql" in data
    assert data["sql"] is not None
    assert "SELECT" in data["sql"].upper()
    assert "rows" in data
    assert len(data["rows"]) > 0

def test_auth_flows():
    # Login policymaker demo
    login_resp = client.post("/api/auth/login", json={"email": "policymaker@jansetu.demo", "password": "demo1234"})
    assert login_resp.status_code == 200
    user = login_resp.json()["user"]
    assert user["role"] == "policymaker"
    assert "token" in login_resp.json()
    token = login_resp.json()["token"]

    # Check /api/auth/me with Bearer token
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["user"]["email"] == "policymaker@jansetu.demo"

    # Login citizen demo
    cit_resp = client.post("/api/auth/login", json={"phone": "9876543210", "name": "Ramesh Kumar"})
    assert cit_resp.status_code == 200
    assert cit_resp.json()["user"]["role"] == "citizen"

def test_webhooks():
    # WhatsApp / Twilio simulation
    tw_resp = client.post("/webhooks/whatsapp", data={"Body": "Drinking water pipeline leakage in Bastar", "From": "whatsapp:+919876543210"})
    assert tw_resp.status_code == 200
    assert "Response" in tw_resp.text
    assert "Ticket" in tw_resp.text

def test_submit_request_live():
    resp = client.post("/api/requests", data={
        "text": "बस्तर में पेयजल की भारी किल्लत है",
        "district": "Bastar",
        "language_hint": "Hindi"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "ticket_id" in data
    assert data["ticket_id"].startswith("REQ-")
    assert "reply_text" in data
    assert len(data["reply_text"]) > 0
