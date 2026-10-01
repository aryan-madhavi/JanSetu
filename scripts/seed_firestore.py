#!/usr/bin/env python3
"""
Seed Firestore with baseline demo dataset (source="demo").
Completely idempotent.
"""
import os
import sys
import json
import pandas as pd
from google.cloud import firestore

# Add parent dir to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.priority_engine import compute_priority

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "jansetu-510215")

def seed():
    print(f"Connecting to Firestore for project {PROJECT_ID}...")
    db = firestore.Client(project=PROJECT_ID)
    
    # 1. Seed Demo Requests
    jsonl_path = os.path.join(os.path.dirname(__file__), "../data/synthetic_requests.jsonl")
    if not os.path.exists(jsonl_path):
        print(f"Error: {jsonl_path} not found.")
        sys.exit(1)
        
    print(f"Loading synthetic requests from {jsonl_path}...")
    requests_data = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                item = json.loads(line)
                item["source"] = "demo"
                requests_data.append(item)
                
    print(f"Loaded {len(requests_data)} requests. Uploading to Firestore 'requests' collection in batches...")
    batch = db.batch()
    b_count = 0
    total_written = 0
    
    for r in requests_data:
        doc_id = r["id"]
        doc_ref = db.collection("requests").document(doc_id)
        batch.set(doc_ref, r)
        b_count += 1
        
        if b_count >= 450:
            batch.commit()
            total_written += b_count
            print(f"  Committed batch: {total_written}/{len(requests_data)}")
            batch = db.batch()
            b_count = 0
            
    if b_count > 0:
        batch.commit()
        total_written += b_count
        print(f"  Committed final batch: {total_written}/{len(requests_data)}")
        
    # 2. Compute and Seed Priorities
    print("Computing priority scores from Firestore districts and requests...")
    # Fetch districts from Firestore
    districts = [doc.to_dict() for doc in db.collection("districts").stream()]
    dist_df = pd.DataFrame(districts)
    req_df = pd.DataFrame(requests_data)
    
    pri_df = compute_priority(req_df, dist_df)
    print(f"Generated {len(pri_df)} priority rankings. Seeding into 'priorities' collection...")
    
    batch = db.batch()
    for idx, row in pri_df.iterrows():
        p_id = f"{row['district']}_{row['sector']}"
        doc_ref = db.collection("priorities").document(p_id)
        doc_data = {
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
            "source": "demo"
        }
        batch.set(doc_ref, doc_data)
    batch.commit()
    print("Priority scores seeded successfully!")
    
    # 3. Seed Clusters
    print("Seeding baseline clusters into 'clusters'...")
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.cluster import AgglomerativeClustering
    
    corpus = [r.get("english_summary") or r.get("transcript_original") or "Grievance" for r in requests_data]
    vec = TfidfVectorizer(max_features=100, stop_words="english")
    X = vec.fit_transform(corpus)
    clustering = AgglomerativeClustering(n_clusters=30, linkage="ward")
    clustering.fit(X.toarray())
    
    batch = db.batch()
    cluster_docs = []
    for c_id in range(30):
        c_items = [requests_data[i] for i, label in enumerate(clustering.labels_) if label == c_id]
        if not c_items:
            continue
        first = c_items[0]
        c_doc = {
            "id": c_id + 1,
            "district": first.get("district", "Bastar"),
            "sector": first.get("sector", "water"),
            "lat": first.get("lat", 19.076),
            "lng": first.get("lng", 82.024),
            "size": len(c_items),
            "description": f"Demand cluster: {first.get('english_summary', 'Citizen reports')} ({len(c_items)} grievances)",
            "source": "demo"
        }
        ref = db.collection("clusters").document(f"cluster_{c_id + 1}")
        batch.set(ref, c_doc)
    batch.commit()
    print("Clusters seeded successfully!")
    
    # 4. Seed Demo Recommendations
    print("Seeding recommendations into 'recommendations'...")
    recs = [
        {
            "id": 1,
            "title": "Accelerate JJM Pipeline in Latur & Bastar",
            "sector": "water",
            "district": "Latur",
            "priority": "Critical",
            "matching_scheme": "Jal Jeevan Mission (JJM)",
            "description": "Severe ground water depletion and high deficit index (0.60) in Latur and Bastar indicates immediate need for piped community water tankers and rapid solar pump deployment.",
            "estimated_impact": "Benefits 240,000 residents across 48 panchayats",
            "source": "demo"
        },
        {
            "id": 2,
            "title": "Emergency Flood Road Rehabilitation in Dhubri",
            "sector": "roads",
            "district": "Dhubri",
            "priority": "Critical",
            "matching_scheme": "PMGSY",
            "description": "Riverine erosion along PMGSY road networks has cut off primary health access across southern Dhubri. Immediate stone pitching and culvert reconstruction required.",
            "estimated_impact": "Restores emergency transport for 180,000 citizens",
            "source": "demo"
        },
        {
            "id": 3,
            "title": "Grid Stabilization & Microgrid Installation in Bastar",
            "sector": "electricity",
            "district": "Bastar",
            "priority": "High",
            "matching_scheme": "DDUGJY / Saubhagya",
            "description": "Persistent feeder trips and low voltage affecting primary health centres. Deploy decentralized solar microgrids with battery storage.",
            "estimated_impact": "Stabilizes power for 12 rural health centers",
            "source": "demo"
        }
    ]
    batch = db.batch()
    for rec in recs:
        ref = db.collection("recommendations").document(str(rec["id"]))
        batch.set(ref, rec)
    batch.commit()
    print("Recommendations seeded successfully!")
    
    # 5. Seed Users
    print("Seeding demo users into 'users'...")
    import hashlib
    users = [
        {
            "email": "policymaker@jansetu.demo",
            "password_hash": hashlib.sha256("demo1234".encode()).hexdigest(),
            "name": "Smt. Vandana Sharma (IAS)",
            "role": "policymaker",
            "source": "demo"
        },
        {
            "phone": "9876543210",
            "name": "Ramesh Kumar",
            "role": "citizen",
            "district": "Pune",
            "source": "demo"
        }
    ]
    batch = db.batch()
    for u in users:
        u_id = u.get("email") or u.get("phone")
        ref = db.collection("users").document(u_id)
        batch.set(ref, u)
    batch.commit()
    print("Users seeded successfully!")
    
    print("=== FIRESTORE SEEDING COMPLETE! ===")

if __name__ == "__main__":
    seed()
