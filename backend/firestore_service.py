import os
import json
import time
import urllib.request
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import pandas as pd
import duckdb
from google.cloud import firestore
from priority_engine import compute_priority

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "jansetu-510215")


def sanitize_dict(d: Dict[str, Any]) -> Dict[str, Any]:
    import math
    if not isinstance(d, dict):
        return d
    clean = {}
    for k, v in d.items():
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            clean[k] = None
        elif isinstance(v, dict):
            clean[k] = sanitize_dict(v)
        elif isinstance(v, list):
            clean[k] = [sanitize_dict(item) if isinstance(item, dict) else (None if isinstance(item, float) and (math.isnan(item) or math.isinf(item)) else item) for item in v]
        else:
            clean[k] = v
    return clean

def sanitize_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [sanitize_dict(r) for r in records]

class FirestoreDataService:
    def __init__(self):
        self.db = firestore.Client(project=PROJECT_ID)
        self._cache = {
            "requests": None,
            "districts": None,
            "priorities": None,
            "clusters": None,
            "recommendations": None,
            "last_load": 0
        }
        self._weather_cache = {}
        self.CACHE_TTL = 30.0  # 30 seconds TTL

    def _ensure_cache(self, force=False):
        now = time.time()
        if force or (now - self._cache["last_load"] > self.CACHE_TTL) or self._cache["requests"] is None:
            # 1. Fetch requests
            req_docs = [d.to_dict() for d in self.db.collection("requests").stream()]
            self._cache["requests"] = pd.DataFrame(req_docs) if req_docs else pd.DataFrame()
            
            # 2. Fetch districts
            dist_docs = [d.to_dict() for d in self.db.collection("districts").stream()]
            self._cache["districts"] = pd.DataFrame(dist_docs) if dist_docs else pd.DataFrame()
            
            # 3. Fetch priorities
            pri_docs = [d.to_dict() for d in self.db.collection("priorities").stream()]
            self._cache["priorities"] = pd.DataFrame(pri_docs) if pri_docs else pd.DataFrame()
            
            # 4. Fetch clusters
            self._cache["clusters"] = [d.to_dict() for d in self.db.collection("clusters").stream()]
            
            # 5. Fetch recommendations
            self._cache["recommendations"] = [d.to_dict() for d in self.db.collection("recommendations").stream()]
            
            self._cache["last_load"] = now

    def invalidate_cache(self):
        self._cache["last_load"] = 0

    def get_filtered_requests_df(self, source="all"):
        self._ensure_cache()
        df = self._cache["requests"]
        if df.empty:
            return df
        if source == "live":
            return df[df["source"] == "live"]
        elif source == "demo":
            return df[df["source"] == "demo"]
        return df

    def get_districts_list(self) -> List[str]:
        self._ensure_cache()
        df = self._cache["districts"]
        if df.empty or "district" not in df.columns:
            return ["Bastar", "Chennai", "Dhubri", "Gaya", "Latur", "Madurai", "Patna", "Pune", "Ranchi", "Wayanad"]
        return sorted(df["district"].unique().tolist())

    def get_district_metadata(self, district_name: str) -> Optional[Dict[str, Any]]:
        self._ensure_cache()
        df = self._cache["districts"]
        if df.empty:
            return None
        sub = df[df["district"].str.lower() == district_name.lower()]
        if not sub.empty:
            return sanitize_dict(sub.iloc[0].to_dict())
        return None

    def get_dashboard_stats(self, source="all", district=None) -> Dict[str, Any]:
        self._ensure_cache()
        req_df = self._cache["requests"]
        
        # Calculate global live vs demo counts
        if not req_df.empty:
            global_live = int((req_df["source"] == "live").sum()) if "source" in req_df.columns else 0
            global_demo = int((req_df["source"] == "demo").sum()) if "source" in req_df.columns else 0
        else:
            global_live = 0
            global_demo = 0

        # Filter by source
        if source == "live" and not req_df.empty:
            req_df = req_df[req_df["source"] == "live"]
        elif source == "demo" and not req_df.empty:
            req_df = req_df[req_df["source"] == "demo"]

        # Filter by district if requested
        if district and district.lower() != "all" and not req_df.empty:
            req_df = req_df[req_df["district"].str.lower() == district.lower()]

        total_requests = len(req_df)
        critical_requests = int((req_df["severity"] >= 4).sum()) if not req_df.empty else 0
        
        by_sector = req_df["sector"].value_counts().to_dict() if not req_df.empty and "sector" in req_df.columns else {}
        by_district = req_df["district"].value_counts().to_dict() if not req_df.empty and "district" in req_df.columns else {}
        by_language = req_df["language"].value_counts().to_dict() if not req_df.empty and "language" in req_df.columns else {}
        
        # Temporal counts
        over_time = []
        if not req_df.empty and "timestamp" in req_df.columns:
            temp_df = req_df.copy()
            temp_df["date"] = temp_df["timestamp"].astype(str).str.slice(0, 10)
            daily = temp_df.groupby("date").size().tail(14).reset_index(name="count")
            for _, r in daily.iterrows():
                d_str = r["date"]
                d_sub = temp_df[temp_df["date"] == d_str]
                roads_c = int((d_sub["sector"] == "roads").sum())
                water_c = int((d_sub["sector"] == "water").sum())
                elec_c = int((d_sub["sector"] == "electricity").sum())
                over_time.append({
                    "date": d_str,
                    "count": int(r["count"]),
                    "roads": roads_c,
                    "water": water_c,
                    "electricity": elec_c
                })

        # Recent queue
        pri_list = self.get_priorities(source=source, district=district)
        recent_queue = []
        for p in pri_list[:5]:
            recent_queue.append({
                "d": p["district"],
                "s": p["sector"].capitalize() if isinstance(p["sector"], str) else p["sector"],
                "sev": "Critical" if p["score"] >= 80 else ("High" if p["score"] >= 50 else "Moderate"),
                "eta": "24h" if p["score"] >= 90 else "48h",
                "score": p["score"],
                "scheme": p.get("matching_scheme", "National Infrastructure Pipeline")
            })

        return {
            "total_requests": total_requests,
            "live_requests": global_live,
            "demo_requests": global_demo,
            "critical_requests": critical_requests,
            "total_clusters": len(self._cache["clusters"]),
            "by_sector": by_sector,
            "by_district": by_district,
            "by_language": by_language,
            "over_time": over_time,
            "recent_queue": recent_queue
        }

    def get_requests(self, source="all", district=None, sector=None, limit=200) -> List[Dict[str, Any]]:
        df = self.get_filtered_requests_df(source=source)
        if df.empty:
            return []
        if district and district.lower() != "all":
            df = df[df["district"].str.lower() == district.lower()]
        if sector and sector.lower() != "all":
            df = df[df["sector"].str.lower() == sector.lower()]
        if "timestamp" in df.columns:
            df = df.sort_values(by="timestamp", ascending=False)
        return sanitize_records(df.head(limit).to_dict(orient="records"))

    def get_priorities(self, source="all", district=None, sector=None) -> List[Dict[str, Any]]:
        self._ensure_cache()
        df = self._cache["priorities"]
        if df.empty:
            return []
        
        # If live only, recompute dynamically over live requests
        if source == "live":
            req_df = self.get_filtered_requests_df(source="live")
            dist_df = self._cache["districts"]
            if not req_df.empty and not dist_df.empty:
                df = compute_priority(req_df, dist_df)
            else:
                return []
                
        if district and district.lower() != "all" and "district" in df.columns:
            df = df[df["district"].str.lower() == district.lower()]
        if sector and sector.lower() != "all" and "sector" in df.columns:
            df = df[df["sector"].str.lower() == sector.lower()]
            
        if "score" in df.columns:
            df = df.sort_values(by="score", ascending=False)
        
        items = df.to_dict(orient="records")
        for i, item in enumerate(items):
            if "id" not in item:
                item["id"] = i + 1
            if isinstance(item.get("evidence_quotes"), str):
                try:
                    item["evidence_quotes"] = json.loads(item["evidence_quotes"])
                except Exception:
                    item["evidence_quotes"] = []
            if "breakdown" not in item and "demand_intensity" in item:
                item["breakdown"] = {
                    "demand_intensity": item.get("demand_intensity", 0),
                    "infra_deficit": item.get("infra_deficit", 0),
                    "vulnerability": item.get("vulnerability", 0),
                    "fiscal_coverage": item.get("allocation_coverage", 0)
                }
        return sanitize_records(items)

    def get_clusters(self, source="all", district=None, sector=None) -> List[Dict[str, Any]]:
        self._ensure_cache()
        items = self._cache["clusters"]
        if source == "live":
            items = [c for c in items if c.get("source") == "live"]
        if district and district.lower() != "all":
            items = [c for c in items if c.get("district", "").lower() == district.lower()]
        if sector and sector.lower() != "all":
            items = [c for c in items if c.get("sector", "").lower() == sector.lower()]
        return sanitize_records(items)

    def get_hotspots(self, source="all", district=None, sector=None) -> List[Dict[str, Any]]:
        priorities = self.get_priorities(source=source, district=district, sector=sector)
        self._ensure_cache()
        dist_df = self._cache["districts"]
        hotspots = []
        for p in priorities:
            d_name = p.get("district")
            lat, lng = 20.5937, 78.9629
            if not dist_df.empty and "district" in dist_df.columns:
                sub = dist_df[dist_df["district"].str.lower() == d_name.lower()]
                if not sub.empty:
                    lat = float(sub.iloc[0]["lat"])
                    lng = float(sub.iloc[0]["lng"])
            hotspots.append({
                "district": d_name,
                "sector": p.get("sector"),
                "score": p.get("score"),
                "intensity": p.get("score"),
                "deficit": p.get("deficit", 0.5),
                "demand": p.get("demand", 1.0),
                "scheme": p.get("matching_scheme", "National Scheme"),
                "lat": lat,
                "lng": lng
            })
        return sanitize_records(hotspots)

    def get_recommendations(self, source="all") -> List[Dict[str, Any]]:
        self._ensure_cache()
        items = self._cache["recommendations"]
        if source == "live":
            items = [r for r in items if r.get("source") == "live"]
        return sanitize_records(items)

    def add_request(self, req: Dict[str, Any]):
        """
        Store live request in Firestore with source="live".
        Recomputes district priority immediately and updates priorities collection.
        Invalidates in-memory cache.
        """
        req["source"] = "live"
        if not req.get("timestamp"):
            req["timestamp"] = datetime.now(timezone.utc).isoformat()
            
        doc_id = req.get("id") or f"REQ-{os.urandom(3).hex().upper()}"
        req["id"] = doc_id
        
        # 1. Write to Firestore 'requests' collection
        self.db.collection("requests").document(doc_id).set(req)
        
        # 2. Write to Firestore 'tickets' collection for rapid ticket lookups
        self.db.collection("tickets").document(doc_id).set({
            "ticket_id": doc_id,
            "status": "Under Review",
            "extraction": req,
            "created_at": req["timestamp"],
            "source": "live"
        })
        
        # 3. Incrementally update or create cluster in 'clusters' collection
        try:
            d_name = req.get("district", "Pune")
            s_name = req.get("sector", "roads")
            cluster_id = f"cluster_live_{d_name}_{s_name}".lower().replace(" ", "_")
            c_ref = self.db.collection("clusters").document(cluster_id)
            c_snap = c_ref.get()
            if c_snap.exists:
                c_data = c_snap.to_dict()
                new_size = c_data.get("size", 1) + 1
                c_ref.update({
                    "size": new_size,
                    "description": f"Live cluster: {req.get('english_summary', 'Citizen demand')} ({new_size} reports)",
                    "source": "live",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                })
            else:
                meta = self.get_district_metadata(d_name)
                lat = meta.get("lat", 18.5204) if meta else 18.5204
                lng = meta.get("lng", 73.8567) if meta else 73.8567
                c_ref.set({
                    "id": cluster_id,
                    "district": d_name,
                    "sector": s_name,
                    "lat": lat,
                    "lng": lng,
                    "size": 1,
                    "description": f"Live cluster: {req.get('english_summary', 'Citizen demand')} (1 report)",
                    "source": "live",
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
        except Exception as ce:
            print("Incremental clustering error:", ce)

        # 4. Invalidate cache so next reads pick up new record
        self.invalidate_cache()
        
        # 4. Incrementally recompute priority for the affected district
        try:
            self._recompute_district_priorities(req.get("district", "Pune"))
        except Exception as e:
            print("Priority recompute warning:", e)
            
        return req

    def _recompute_district_priorities(self, district_name: str):
        self._ensure_cache(force=True)
        req_df = self._cache["requests"]
        dist_df = self._cache["districts"]
        if req_df.empty or dist_df.empty:
            return
            
        pri_df = compute_priority(req_df, dist_df)
        batch = self.db.batch()
        for idx, row in pri_df.iterrows():
            if row["district"].lower() == district_name.lower():
                p_id = f"{row['district']}_{row['sector']}"
                ref = self.db.collection("priorities").document(p_id)
                batch.set(ref, {
                    "id": idx + 1,
                    "district": row["district"],
                    "sector": row["sector"],
                    "score": float(row["score"]),
                    "demand": float(row["demand_intensity"]),
                    "deficit": float(row["infra_deficit"]),
                    "vulnerability": float(row["vulnerability"]),
                    "allocation": float(row["allocation_coverage"]),
                    "matching_scheme": row["matching_scheme"],
                    "breakdown": {
                        "demand_intensity": float(row["demand_intensity"]),
                        "infra_deficit": float(row["infra_deficit"]),
                        "vulnerability": float(row["vulnerability"]),
                        "fiscal_coverage": float(row["allocation_coverage"])
                    },
                    "evidence_quotes": json.loads(row["evidence_quotes"]),
                    "source": "live"
                })
        batch.commit()
        self.invalidate_cache()

    def get_weather_context(self, district_name: str) -> Dict[str, Any]:
        """
        Fetch live Open-Meteo external weather indicators for the district.
        Cached in-memory for 10 minutes.
        """
        now = time.time()
        cached = self._weather_cache.get(district_name.lower())
        if cached and (now - cached["timestamp"] < 600):
            return cached["data"]
            
        meta = self.get_district_metadata(district_name)
        lat = meta.get("lat", 19.076) if meta else 19.076
        lng = meta.get("lng", 82.024) if meta else 82.024
        
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "JanSetu-Governance/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                curr = data.get("current", {})
                w_data = {
                    "district": district_name,
                    "temp_c": curr.get("temperature_2m", 25.0),
                    "precipitation_mm": curr.get("precipitation", 0.0),
                    "humidity_pct": curr.get("relative_humidity_2m", 65),
                    "weather_code": curr.get("weather_code", 0),
                    "source": "Open-Meteo API",
                    "retrieved_at": datetime.now(timezone.utc).isoformat()
                }
                self._weather_cache[district_name.lower()] = {"timestamp": now, "data": w_data}
                return w_data
        except Exception as e:
            return {
                "district": district_name,
                "temp_c": 28.0,
                "precipitation_mm": 0.0,
                "humidity_pct": 60,
                "source": "Open-Meteo Fallback",
                "retrieved_at": datetime.now(timezone.utc).isoformat()
            }

    def execute_duckdb_sql(self, sql_query: str, source="all"):
        """
        Analytic DuckDB layer:
        Loads current Firestore collections into in-memory DuckDB tables:
        - requests (filtered by source)
        - districts
        - priorities
        Enforces read-only SELECT and LIMIT 200.
        """
        # Validate query
        clean_sql = sql_query.strip()
        if not clean_sql.lower().startswith("select"):
            raise ValueError("Only SELECT queries are allowed.")
        for forbidden in ["drop", "delete", "update", "insert", "alter", "truncate", "create"]:
            if f" {forbidden} " in f" {clean_sql.lower()} ":
                raise ValueError(f"Prohibited SQL keyword: {forbidden}")
                
        if "limit" not in clean_sql.lower():
            clean_sql += " LIMIT 200"

        req_df = self.get_filtered_requests_df(source=source)
        dist_df = self._cache["districts"]
        pri_df = self._cache["priorities"]
        
        con = duckdb.connect(":memory:")
        con.register("requests", req_df)
        con.register("districts", dist_df)
        con.register("priorities", pri_df)
        
        rel = con.execute(clean_sql)
        columns = [desc[0] for desc in rel.description]
        raw_rows = [list(r) for r in rel.fetchall()]
        import math
        clean_rows = []
        for row in raw_rows:
            clean_row = []
            for val in row:
                if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
                    clean_row.append(None)
                else:
                    clean_row.append(val)
            clean_rows.append(clean_row)
        return clean_sql, columns, clean_rows

# Singleton instance
data_service = FirestoreDataService()
