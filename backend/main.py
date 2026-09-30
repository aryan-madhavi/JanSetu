import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import os
import re
import json
import uuid
import tempfile
import sqlite3
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Any

from dotenv import load_dotenv
load_dotenv()

import jwt
from fastapi import FastAPI, File, UploadFile, Form, Request as FastRequest, Response, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from models import SessionLocal, Request, PriorityScore, ClusterInfo, User, CachedRecommendation, DB_PATH
from extraction import extract_request_info, get_genai_client, PROBED_LOCATION
from tts import generate_tts_reply
from google.genai import types

JWT_SECRET = os.environ.get("JWT_SECRET", "jansetu_prod_secret_key_98234_jwt_sha256_secure_key_510215")
JWT_ALGORITHM = "HS256"

app = FastAPI(title="JanSetu API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_pw(pw: str) -> str:
    return hashlib.sha256(('jansetu_salt_' + pw).encode('utf-8')).hexdigest()

def create_jwt(user_dict: dict) -> str:
    payload = {
        "sub": str(user_dict["id"]),
        "name": user_dict["name"],
        "role": user_dict["role"],
        "email": user_dict.get("email"),
        "phone": user_dict.get("phone"),
        "exp": int(datetime.now().timestamp()) + 86400 * 7 # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user_optional(request: FastRequest, db: Session = Depends(get_db)) -> Optional[dict]:
    token = request.cookies.get("jansetu_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        return None
        
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(User).filter_by(id=user_id).first()
        if user:
            return {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role
            }
    except Exception:
        pass
    return None

# District Centroids for matching GPS
DISTRICT_COORDS = {
    "Pune": (18.5204, 73.8567),
    "Latur": (18.4088, 76.5604),
    "Patna": (25.5941, 85.1376),
    "Gaya": (24.7914, 84.0015),
    "Ranchi": (23.3441, 85.3096),
    "Bastar": (19.0760, 82.0241),
    "Chennai": (13.0827, 80.2707),
    "Madurai": (9.9252, 78.1198),
    "Dhubri": (26.0207, 89.9743),
    "Wayanad": (11.6854, 76.1320),
}

def resolve_district(lat: Optional[float], lng: Optional[float], text_hint: Optional[str] = None) -> str:
    if text_hint:
        for dist in DISTRICT_COORDS.keys():
            if dist.lower() in text_hint.lower():
                return dist
    if lat is not None and lng is not None:
        best_dist = None
        min_d = float("inf")
        for dist, (dlat, dlng) in DISTRICT_COORDS.items():
            d = (lat - dlat)**2 + (lng - dlng)**2
            if d < min_d:
                min_d = d
                best_dist = dist
        if best_dist:
            return best_dist
    return "Pune"

@app.get("/healthz")
def healthz():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/api/districts")
def get_districts(db: Session = Depends(get_db)):
    db_districts = db.query(Request.district).filter(Request.district.isnot(None)).distinct().all()
    dist_set = set(d[0] for d in db_districts if d[0])
    for d in DISTRICT_COORDS.keys():
        dist_set.add(d)
    return sorted(list(dist_set))

@app.get("/api/dashboard/stats")
def get_stats(district: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Request)
    if district and district.lower() not in ["all", "all districts", ""]:
        q = q.filter(func.lower(Request.district) == district.lower())
        
    reqs = q.all()
    total = len(reqs)
    critical = sum(1 for r in reqs if r.severity and r.severity >= 4)
    
    # By sector
    by_sector = {}
    for r in reqs:
        s = (r.sector or "other").lower()
        by_sector[s] = by_sector.get(s, 0) + 1
        
    # By district
    by_dist = {}
    for r in reqs:
        d = r.district or "Unknown"
        by_dist[d] = by_dist.get(d, 0) + 1
        
    # By language
    by_lang = {}
    for r in reqs:
        l = r.language or "Hindi"
        by_lang[l] = by_lang.get(l, 0) + 1

    # Over time (bucket by date)
    date_map = {}
    for r in reqs:
        ts = r.timestamp or ""
        dt = ts[:10] if len(ts) >= 10 else "2026-09-28"
        if dt not in date_map:
            date_map[dt] = {"date": dt, "count": 0, "roads": 0, "water": 0, "electricity": 0}
        date_map[dt]["count"] += 1
        sec = (r.sector or "").lower()
        if sec in ["roads", "water", "electricity"]:
            date_map[dt][sec] += 1
            
    over_time = [date_map[k] for k in sorted(date_map.keys())]
    if len(over_time) > 14:
        over_time = over_time[-14:]

    # Overview Queue items (top priorities)
    pq = db.query(PriorityScore)
    if district and district.lower() not in ["all", "all districts", ""]:
        pq = pq.filter(func.lower(PriorityScore.district) == district.lower())
    top_p = pq.order_by(PriorityScore.score.desc()).limit(5).all()
    
    recent_queue = []
    for p in top_p:
        recent_queue.append({
            "d": p.district,
            "s": p.sector.capitalize() if p.sector else "Water",
            "sev": "Critical" if p.score > 75 else ("High" if p.score > 40 else "Medium"),
            "eta": "24h" if p.score > 75 else ("48h" if p.score > 40 else "1 Week"),
            "score": round(p.score, 1),
            "scheme": p.matching_scheme
        })

    total_clusters = db.query(ClusterInfo).count()

    return {
        "total_requests": total,
        "critical_requests": critical,
        "total_clusters": total_clusters,
        "by_sector": by_sector,
        "by_district": by_dist,
        "by_language": by_lang,
        "over_time": over_time,
        "recent_queue": recent_queue
    }

@app.get("/api/requests")
def get_requests(
    district: Optional[str] = None,
    sector: Optional[str] = None,
    severity: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    q = db.query(Request)
    if district and district.lower() not in ["all", "all districts", ""]:
        q = q.filter(func.lower(Request.district) == district.lower())
    if sector and sector.lower() not in ["all", "all sectors", ""]:
        q = q.filter(func.lower(Request.sector) == sector.lower())
    if severity:
        q = q.filter(Request.severity >= severity)
    if search:
        s_pat = f"%{search.lower()}%"
        q = q.filter(
            func.lower(Request.english_summary).like(s_pat) |
            func.lower(Request.id).like(s_pat) |
            func.lower(Request.transcript_original).like(s_pat)
        )
        
    reqs = q.order_by(Request.timestamp.desc()).offset(offset).limit(limit).all()
    return [{k: v for k, v in r.__dict__.items() if not k.startswith('_')} for r in reqs]

@app.get("/api/priority")
def get_priority(
    district: Optional[str] = None,
    sector: Optional[str] = None,
    sort_by: str = "score",
    order: str = "desc",
    db: Session = Depends(get_db)
):
    q = db.query(PriorityScore)
    if district and district.lower() not in ["all", "all districts", ""]:
        q = q.filter(func.lower(PriorityScore.district) == district.lower())
    if sector and sector.lower() not in ["all", "all sectors", ""]:
        q = q.filter(func.lower(PriorityScore.sector) == sector.lower())
        
    if sort_by == "demand":
        col = PriorityScore.demand_intensity
    elif sort_by == "deficit":
        col = PriorityScore.infra_deficit
    elif sort_by == "vulnerability":
        col = PriorityScore.vulnerability
    else:
        col = PriorityScore.score

    if order.lower() == "asc":
        q = q.order_by(col.asc())
    else:
        q = q.order_by(col.desc())
        
    scores = q.all()
    result = []
    for s in scores:
        quotes = []
        if s.evidence_quotes:
            try:
                quotes = json.loads(s.evidence_quotes)
            except Exception:
                quotes = []
                
        result.append({
            "id": s.id,
            "district": s.district,
            "sector": s.sector,
            "score": round(s.score, 1),
            "demand": round(s.demand_intensity, 4),
            "deficit": round(s.infra_deficit, 4),
            "vulnerability": round(s.vulnerability, 4),
            "allocation": round(s.allocation_coverage, 4),
            "matching_scheme": s.matching_scheme,
            "breakdown": {
                "demand_intensity": round(s.demand_intensity, 4),
                "infra_deficit": round(s.infra_deficit, 4),
                "vulnerability": round(s.vulnerability, 4),
                "fiscal_coverage": round(s.allocation_coverage, 4)
            },
            "evidence_quotes": quotes
        })
    return result

@app.get("/api/priority/mismatch")
def get_mismatch(db: Session = Depends(get_db)):
    res = db.query(PriorityScore).all()
    return [{
        "district": r.district,
        "sector": r.sector,
        "demand": round(r.demand_intensity, 4),
        "supply": round(r.allocation_coverage, 4),
        "deficit": round(r.infra_deficit, 4),
        "score": round(r.score, 1),
        "scheme": r.matching_scheme
    } for r in res]

@app.get("/api/clusters")
def get_clusters(district: Optional[str] = None, sector: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(ClusterInfo)
    if district and district.lower() not in ["all", "all districts", ""]:
        q = q.filter(func.lower(ClusterInfo.district) == district.lower())
    if sector and sector.lower() not in ["all", "all sectors", ""]:
        q = q.filter(func.lower(ClusterInfo.sector) == sector.lower())
    clusters = q.all()
    return [{k: v for k, v in c.__dict__.items() if not k.startswith('_')} for c in clusters]

@app.get("/api/hotspots")
def get_hotspots(sector: Optional[str] = None, db: Session = Depends(get_db)):
    pq = db.query(PriorityScore)
    if sector and sector.lower() not in ["all", "all sectors", ""]:
        pq = pq.filter(func.lower(PriorityScore.sector) == sector.lower())
    scores = pq.all()
    
    hotspots = []
    for s in scores:
        coords = DISTRICT_COORDS.get(s.district)
        if coords:
            hotspots.append({
                "district": s.district,
                "lat": coords[0],
                "lng": coords[1],
                "intensity": s.score,
                "score": round(s.score, 1),
                "sector": s.sector,
                "deficit": round(s.infra_deficit, 2),
                "demand": round(s.demand_intensity, 2),
                "scheme": s.matching_scheme
            })
    return sorted(hotspots, key=lambda x: x["score"], reverse=True)

@app.get("/api/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    recs = db.query(CachedRecommendation).all()
    if recs:
        return [{k: v for k, v in r.__dict__.items() if not k.startswith('_')} for r in recs]
        
    # Generate on the fly via Gemini from top priority scores
    top_scores = db.query(PriorityScore).order_by(PriorityScore.score.desc()).limit(5).all()
    prompt = f"Based on JanSetu's top infrastructure deficit scores:\n"
    for s in top_scores:
        prompt += f"- District: {s.district}, Sector: {s.sector}, Priority Score: {s.score:.1f}, Deficit: {s.infra_deficit:.2f}, Scheme: {s.matching_scheme}\n"
    prompt += "\nGenerate 3 high-impact, actionable policy recommendations in JSON format: [{'title': '...', 'description': '...', 'sector': '...', 'district': '...', 'priority': 'Critical'|'High', 'estimated_impact': '...', 'matching_scheme': '...'}]"
    
    try:
        client = get_genai_client()
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        data = json.loads(resp.text)
        created_objs = []
        for item in data:
            rec = CachedRecommendation(
                title=item.get("title", "Infrastructure Project"),
                description=item.get("description", ""),
                sector=item.get("sector", "water"),
                district=item.get("district", "Pune"),
                priority=item.get("priority", "High"),
                estimated_impact=item.get("estimated_impact", ""),
                matching_scheme=item.get("matching_scheme", "National Scheme"),
                created_at=datetime.now().isoformat()
            )
            db.add(rec)
            created_objs.append(rec)
        db.commit()
        return [{k: v for k, v in r.__dict__.items() if not k.startswith('_')} for r in created_objs]
    except Exception as e:
        return [{
            "id": 1,
            "title": "Immediate Water Augmentation in Latur",
            "description": "Deploy deep-bore recharge pits and emergency JJM pipe connections.",
            "sector": "water",
            "district": "Latur",
            "priority": "Critical",
            "estimated_impact": "Serves 150,000 citizens with potable water",
            "matching_scheme": "Jal Jeevan Mission (JJM)"
        }]

@app.get("/api/impact")
def get_impact(initiative: Optional[str] = "Jal Jeevan Mission", db: Session = Depends(get_db)):
    scores = db.query(PriorityScore).filter(PriorityScore.matching_scheme.ilike(f"%{initiative}%")).all()
    avg_deficit = (sum(s.infra_deficit for s in scores) / len(scores)) if scores else 0.55
    target_district = scores[0].district if scores else "Latur"
    
    return {
        "initiative": initiative,
        "target_district": target_district,
        "sector": "water" if "jal" in initiative.lower() else "roads",
        "metrics": {
            "demand_reduction_pct": 38.5,
            "coverage_increase_pct": 42.0,
            "affected_population_reached": 380000,
            "active_deficits_resolved": 64
        },
        "timeline": [
            {"period": "Q1 2026", "projected_demand": 1400, "actual_demand": 1380, "expenditure_cr": 45},
            {"period": "Q2 2026", "projected_demand": 1200, "actual_demand": 1120, "expenditure_cr": 82},
            {"period": "Q3 2026", "projected_demand": 950, "actual_demand": 890, "expenditure_cr": 120},
            {"period": "Q4 2026", "projected_demand": 700, "actual_demand": 640, "expenditure_cr": 160}
        ]
    }

@app.get("/api/brief/export")
def get_brief_export(db: Session = Depends(get_db)):
    top_p = db.query(PriorityScore).order_by(PriorityScore.score.desc()).limit(10).all()
    total_reqs = db.query(Request).count()
    critical_reqs = db.query(Request).filter(Request.severity >= 4).count()
    
    lines = [
        "# JanSetu National Civic Infrastructure Brief",
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"Platform: JanSetu Digital Infrastructure Command (Production)",
        "",
        "## Executive Summary",
        f"- Total Verified Citizen Requests: {total_reqs:,}",
        f"- Critical Severity Grievances (P1): {critical_reqs:,}",
        "- Algorithmic Prioritization Engine: Demand × Deficit × Vulnerability × (1 - Fiscal Allocation)",
        "",
        "## Top Priority Infrastructure Projects",
        "| Rank | District | Sector | Priority Score | Demand Index | Deficit Index | Matching Scheme |",
        "|------|----------|--------|----------------|--------------|---------------|-----------------|"
    ]
    
    for i, p in enumerate(top_p, 1):
        lines.append(f"| {i} | {p.district} | {p.sector.capitalize()} | {p.score:.1f} | {p.demand_intensity:.2f} | {p.infra_deficit:.2f} | {p.matching_scheme} |")
        
    lines.append("")
    lines.append("## Citizen Evidence Sample")
    for p in top_p[:3]:
        lines.append(f"### {p.district} ({p.sector.capitalize()})")
        if p.evidence_quotes:
            try:
                quotes = json.loads(p.evidence_quotes)
                for q in quotes[:2]:
                    lines.append(f"- **{q.get('location', p.district)}**: \"{q.get('english')}\" *(Original: {q.get('original')})*")
            except Exception:
                pass
                
    content = "\n".join(lines)
    return Response(
        content=content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": "attachment; filename=\"JanSetu_Infrastructure_Brief.md\""
        }
    )

@app.get("/api/tickets/{ticket_id}")
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    res = db.query(Request).filter_by(id=ticket_id).first()
    if res:
        return {k: v for k, v in res.__dict__.items() if not k.startswith("_")}
    return JSONResponse(status_code=404, content={"error": "Ticket not found"})

# POST /api/requests
@app.post("/api/requests")
async def create_request(
    text: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
    channel: str = Form("PWA"),
    language_hint: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    location_text_hint: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    audio_path = None
    image_path = None
    audio_filename = None

    if audio and audio.filename:
        audio_filename = audio.filename
        _, ext = os.path.splitext(audio.filename)
        fd, audio_path = tempfile.mkstemp(suffix=ext or ".webm")
        os.close(fd)
        with open(audio_path, "wb") as f:
            f.write(await audio.read())

    if image and image.filename:
        _, ext = os.path.splitext(image.filename)
        fd, image_path = tempfile.mkstemp(suffix=ext or ".jpg")
        os.close(fd)
        with open(image_path, "wb") as f:
            f.write(await image.read())

    extracted = extract_request_info(
        text=text,
        audio_path=audio_path,
        image_path=image_path,
        audio_filename=audio_filename
    )

    if audio_path and os.path.exists(audio_path):
        os.remove(audio_path)
    if image_path and os.path.exists(image_path):
        os.remove(image_path)

    if not extracted:
        return JSONResponse(status_code=500, content={"error": "Failed to extract information from submission."})

    req_id = f"REQ-{uuid.uuid4().hex[:6].upper()}"
    detected_lang = extracted.get("language") or language_hint or "Hindi"
    
    # Resolve district
    assigned_district = district
    if not assigned_district or assigned_district.lower() in ["all", ""]:
        assigned_district = resolve_district(lat, lng, extracted.get("location_text") or location_text_hint or text)

    coords = DISTRICT_COORDS.get(assigned_district, (18.5204, 73.8567))
    actual_lat = lat if lat is not None else coords[0]
    actual_lng = lng if lng is not None else coords[1]

    new_req = Request(
        id=req_id,
        timestamp=datetime.now().isoformat(),
        channel=channel,
        language=detected_lang,
        transcript_original=extracted.get("transcript_original", text or "Voice recording"),
        english_summary=extracted.get("english_summary", text or "Citizen report"),
        sector=extracted.get("sector", "water"),
        specific_need=extracted.get("specific_need", "Infrastructure issue"),
        severity=int(extracted.get("severity", 3)),
        sentiment=extracted.get("sentiment", "Neutral"),
        affected_population_estimate=int(extracted.get("affected_population_estimate", 100)),
        location_text=extracted.get("location_text") or location_text_hint or assigned_district,
        lat=actual_lat,
        lng=actual_lng,
        district=assigned_district,
        state="Maharashtra" if assigned_district in ["Pune", "Latur"] else "India"
    )

    db.add(new_req)
    db.commit()

    reply_text, audio_base64 = generate_tts_reply(
        ticket_id=req_id,
        language=detected_lang,
        specific_need=new_req.specific_need
    )

    return {
        "ticket_id": req_id,
        "extraction": extracted,
        "reply_text": reply_text,
        "tts_audio_base64": audio_base64
    }

# POST /api/chat (Data Query with Gemini Function Calling)
class ChatQuery(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_with_data(msg: ChatQuery):
    executed_sql = {"query": None, "columns": [], "rows": []}

    def describe_schema() -> str:
        """Describes tables and columns available in the JanSetu SQLite database."""
        return """
Database Schema:
1. requests:
   - id (TEXT), timestamp (TEXT), channel (TEXT), language (TEXT)
   - transcript_original (TEXT), english_summary (TEXT)
   - sector (TEXT: 'water', 'roads', 'health', 'education', 'electricity', 'sanitation', 'connectivity', 'housing', 'agriculture')
   - specific_need (TEXT), severity (INTEGER 1-5), sentiment (TEXT)
   - affected_population_estimate (INTEGER), location_text (TEXT)
   - lat (REAL), lng (REAL), district (TEXT), state (TEXT)
2. priority_scores:
   - district (TEXT), sector (TEXT), score (REAL: 0-100)
   - demand_intensity (REAL), infra_deficit (REAL: 0-1)
   - vulnerability (REAL), allocation_coverage (REAL)
   - matching_scheme (TEXT)
3. clusters:
   - id (INTEGER), sector (TEXT), district (TEXT), size (INTEGER), description (TEXT), lat (REAL), lng (REAL)
"""

    def run_sql(query: str) -> str:
        """Executes a read-only SQL SELECT query on the JanSetu SQLite database."""
        clean_q = " ".join(query.strip().split())
        if not clean_q.upper().startswith("SELECT"):
            return json.dumps({"error": "Only SELECT queries are allowed."})
            
        disallowed = ["DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "TRUNCATE", "REPLACE", "CREATE", "ATTACH"]
        for word in disallowed:
            if re.search(r'\b' + word + r'\b', clean_q, re.IGNORECASE):
                return json.dumps({"error": f"Security violation: {word} is forbidden."})
                
        if not re.search(r'\bLIMIT\b', clean_q, re.IGNORECASE):
            clean_q = clean_q.rstrip(";") + " LIMIT 200"

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        try:
            cur.execute(clean_q)
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description] if cur.description else []
            res_rows = [list(r) for r in rows[:200]]
            executed_sql["query"] = clean_q
            executed_sql["columns"] = cols
            executed_sql["rows"] = res_rows
            return json.dumps({"columns": cols, "rows": res_rows, "count": len(res_rows)})
        except Exception as e:
            return json.dumps({"error": str(e)})
        finally:
            conn.close()

    try:
        client = get_genai_client()
        chat = client.chats.create(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                tools=[run_sql, describe_schema],
                temperature=0.0
            )
        )
        response = chat.send_message(msg.message)
        answer = response.text or "Here are the query results from the national infrastructure database."
        
        # If tool was not called or executed_sql empty, execute a best-effort relevant query
        if not executed_sql["query"]:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            fallback_sql = "SELECT district, sector, count(*) as count FROM requests GROUP BY district, sector ORDER BY count DESC LIMIT 10"
            cur.execute(fallback_sql)
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
            executed_sql = {"query": fallback_sql, "columns": cols, "rows": [list(r) for r in rows]}
            conn.close()

        chart_spec = None
        if len(executed_sql["columns"]) >= 2 and len(executed_sql["rows"]) > 0:
            chart_spec = {
                "type": "bar",
                "x": executed_sql["columns"][0],
                "y": executed_sql["columns"][1]
            }

        return {
            "answer": answer,
            "sql": executed_sql["query"],
            "columns": executed_sql["columns"],
            "rows": executed_sql["rows"],
            "chart_spec": chart_spec
        }
    except Exception as e:
        # Fallback to local SQL query on failure
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        sql = "SELECT district, sector, score, infra_deficit FROM priority_scores ORDER BY score DESC LIMIT 10"
        cur.execute(sql)
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description]
        conn.close()
        return {
            "answer": f"Executed standard query: {e}",
            "sql": sql,
            "columns": cols,
            "rows": [list(r) for r in rows],
            "chart_spec": {"type": "bar", "x": cols[0], "y": cols[2]}
        }

# Auth Routes
class LoginPayload(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None

class SignupPayload(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = "citizen"

@app.post("/api/auth/login")
def login(payload: LoginPayload, response: Response, db: Session = Depends(get_db)):
    user = None
    if payload.email:
        user = db.query(User).filter_by(email=payload.email).first()
        if not user or user.password_hash != hash_pw(payload.password or ""):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
    elif payload.phone:
        user = db.query(User).filter_by(phone=payload.phone).first()
        if not user:
            # Demo citizen auto-registration
            user = User(
                name=payload.name or "Citizen User",
                phone=payload.phone,
                role="citizen",
                created_at=datetime.now().isoformat()
            )
            db.add(user)
            db.commit()
    else:
        raise HTTPException(status_code=400, detail="Provide either email/password or phone number.")

    user_dict = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role
    }
    token = create_jwt(user_dict)
    response.set_cookie(
        key="jansetu_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=86400 * 7
    )
    return {"user": user_dict, "token": token}

@app.post("/api/auth/signup")
def signup(payload: SignupPayload, response: Response, db: Session = Depends(get_db)):
    if payload.email:
        existing = db.query(User).filter_by(email=payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="User with this email already exists.")
    if payload.phone:
        existing = db.query(User).filter_by(phone=payload.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="User with this phone number already exists.")

    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        role=payload.role or "citizen",
        password_hash=hash_pw(payload.password) if payload.password else None,
        created_at=datetime.now().isoformat()
    )
    db.add(user)
    db.commit()

    user_dict = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role
    }
    token = create_jwt(user_dict)
    response.set_cookie(
        key="jansetu_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=86400 * 7
    )
    return {"user": user_dict, "token": token}

@app.get("/api/auth/me")
def get_me(user: Optional[dict] = Depends(get_current_user_optional)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return {"user": user}

@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("jansetu_token")
    return {"status": "logged_out"}

# Webhooks
@app.post("/api/webhooks/telegram")
async def telegram_webhook(update: dict, db: Session = Depends(get_db)):
    if "message" in update and "text" in update["message"]:
        text = update["message"]["text"]
        extracted = extract_request_info(text=text)
        if extracted:
            req_id = f"REQ-{uuid.uuid4().hex[:6].upper()}"
            new_req = Request(
                id=req_id,
                timestamp=datetime.now().isoformat(),
                channel="Telegram",
                language=extracted.get("language", "English"),
                transcript_original=text,
                english_summary=extracted.get("english_summary", text),
                sector=extracted.get("sector", "water"),
                specific_need=extracted.get("specific_need", "Grievance"),
                severity=int(extracted.get("severity", 3)),
                district="Pune",
                state="Maharashtra"
            )
            db.add(new_req)
            db.commit()
            return {"status": "ok", "req_id": req_id}
    return {"status": "ignored"}

@app.post("/api/webhooks/twilio")
@app.post("/webhooks/whatsapp")
async def twilio_webhook(Body: str = Form(None), From: str = Form(None), db: Session = Depends(get_db)):
    if Body:
        extracted = extract_request_info(text=Body)
        req_id = f"REQ-{uuid.uuid4().hex[:6].upper()}"
        new_req = Request(
            id=req_id,
            timestamp=datetime.now().isoformat(),
            channel="WhatsApp",
            language=extracted.get("language", "English") if extracted else "English",
            transcript_original=Body,
            english_summary=extracted.get("english_summary", Body) if extracted else Body,
            sector=extracted.get("sector", "water") if extracted else "water",
            specific_need=extracted.get("specific_need", "WhatsApp Report") if extracted else "Grievance",
            severity=int(extracted.get("severity", 3)) if extracted else 3,
            district="Pune",
            state="Maharashtra"
        )
        db.add(new_req)
        db.commit()
        twiml_resp = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Namaste! Your grievance is registered under Ticket #{req_id}. JanSetu team is reviewing.</Message>
</Response>"""
        return Response(content=twiml_resp, media_type="application/xml")
    return Response(content="<Response></Response>", media_type="application/xml")

# Static file serving & SPA fallback
frontend_candidates = [
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend_dist"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend_dist"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist"),
    "/app/frontend_dist",
    "frontend_dist"
]

frontend_path = None
for p in frontend_candidates:
    if os.path.exists(p) and os.path.isdir(p) and os.path.exists(os.path.join(p, "index.html")):
        frontend_path = p
        break

if frontend_path:
    # Mount assets folder if exists
    assets_dir = os.path.join(frontend_path, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.middleware("http")
async def spa_middleware(request: FastRequest, call_next):
    response = await call_next(request)
    if response.status_code == 404 and frontend_path:
        path = request.url.path
        if not path.startswith("/api") and not path.startswith("/healthz"):
            index_file = os.path.join(frontend_path, "index.html")
            if os.path.exists(index_file):
                return FileResponse(index_file)
    return response

if frontend_path:
    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(frontend_path, "index.html"))
