import os
import json
import pytest
from fastapi.testclient import TestClient
from main import app
from models import SessionLocal, Request, PriorityScore, User

client = TestClient(app)

def test_healthz():
    resp = client.get("/healthz")
    assert resp.status_code == 200
    assert resp.json().get("status") == "ok"

def test_districts():
    resp = client.get("/api/districts")
    assert resp.status_code == 200
    districts = resp.json()
    assert isinstance(districts, list)
    assert len(districts) > 0
    assert "Pune" in districts

def test_dashboard_stats():
    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_requests"] > 0
    assert data["critical_requests"] > 0
    assert len(data["by_sector"]) > 0
    assert len(data["by_district"]) > 0
    
    # Assert stats.total equals actual DB count
    db = SessionLocal()
    db_count = db.query(Request).count()
    db.close()
    assert data["total_requests"] == db_count

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
    assert isinstance(top["evidence_quotes"], list)
    assert len(top["evidence_quotes"]) > 0
    assert "original" in top["evidence_quotes"][0]
    assert "english" in top["evidence_quotes"][0]

def test_priority_mismatch():
    resp = client.get("/api/priority/mismatch")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) > 0
    assert "demand" in items[0]
    assert "supply" in items[0]
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
    assert "metrics" in data
    assert "timeline" in data
    assert len(data["timeline"]) > 0

def test_brief_export():
    resp = client.get("/api/brief/export")
    assert resp.status_code == 200
    assert "JanSetu" in resp.text
    assert "Top Priority Infrastructure Projects" in resp.text
    assert len(resp.text) > 500

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
    tw_resp = client.post("/api/webhooks/twilio", data={"Body": "Drinking water pipeline leakage near bus stand in Pune", "From": "whatsapp:+919876543210"})
    assert tw_resp.status_code == 200
    assert "Response" in tw_resp.text
    assert "Ticket" in tw_resp.text
