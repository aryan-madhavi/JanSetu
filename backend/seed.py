import json
import os
import hashlib
from datetime import datetime
import pandas as pd
from models import SessionLocal, Request, PriorityScore, ClusterInfo, User, CachedRecommendation, engine, Base
from priority_engine import compute_priority
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import AgglomerativeClustering

def hash_pw(pw: str) -> str:
    return hashlib.sha256(('jansetu_salt_' + pw).encode('utf-8')).hexdigest()

def find_data_file(filename: str) -> str:
    candidates = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", filename),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", filename),
        os.path.join("/app/data", filename),
        os.path.join("data", filename)
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    raise FileNotFoundError(f"Could not find data file: {filename}")

def run_seed():
    print("Dropping and recreating database schema...")
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    session = SessionLocal()
    
    # 1. Load Requests
    req_file = find_data_file('synthetic_requests.jsonl')
    print(f"Loading requests from {req_file}...")
    reqs = []
    with open(req_file, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                reqs.append(json.loads(line))
    
    db_reqs = [Request(**r) for r in reqs]
    session.add_all(db_reqs)
    session.commit()
    print(f"Loaded {len(db_reqs)} requests into SQLite.")
    
    # 2. Cluster
    print("Clustering requests semantically...")
    df = pd.DataFrame(reqs)
    cluster_id_counter = 1
    clusters = []
    
    for (dist, sec), group in df.groupby(['district', 'sector']):
        if len(group) < 2:
            for idx in group.index:
                db_r = session.query(Request).filter_by(id=group.loc[idx, 'id']).first()
                if db_r:
                    db_r.cluster_id = cluster_id_counter
            clusters.append({
                'id': cluster_id_counter, 'sector': sec, 'district': dist,
                'size': len(group), 'description': f'Isolated {sec} issue in {dist}',
                'lat': float(group['lat'].mean()) if 'lat' in group else 20.0,
                'lng': float(group['lng'].mean()) if 'lng' in group else 78.0
            })
            cluster_id_counter += 1
            continue
            
        vec = TfidfVectorizer(stop_words='english')
        try:
            X = vec.fit_transform(group['english_summary']).toarray()
            clustering = AgglomerativeClustering(n_clusters=None, distance_threshold=0.8, metric='euclidean', linkage='ward')
            labels = clustering.fit_predict(X)
        except Exception:
            labels = [0] * len(group)
            
        for local_cluster in set(labels):
            idxs = group[labels == local_cluster].index
            c_id = cluster_id_counter
            
            for idx in idxs:
                db_r = session.query(Request).filter_by(id=group.loc[idx, 'id']).first()
                if db_r:
                    db_r.cluster_id = c_id
                
            clusters.append({
                'id': c_id, 'sector': sec, 'district': dist,
                'size': len(idxs), 'description': f'Clustered {sec} issues in {dist} ({len(idxs)} reports)',
                'lat': float(group.loc[idxs, 'lat'].mean()) if 'lat' in group else 20.0,
                'lng': float(group.loc[idxs, 'lng'].mean()) if 'lng' in group else 78.0
            })
            cluster_id_counter += 1
            
    session.add_all([ClusterInfo(**c) for c in clusters])
    session.commit()
    print(f"Generated {len(clusters)} clusters.")
    
    # 3. Priority Engine
    dist_file = find_data_file('district_data.csv')
    print(f"Computing priorities from {dist_file}...")
    dist_df = pd.read_csv(dist_file)
    res_df = compute_priority(df, dist_df)
    
    if not res_df.empty:
        res_df.drop(columns=['raw_score'], inplace=True, errors='ignore')
        ps_objs = res_df.to_dict('records')
        session.add_all([PriorityScore(**p) for p in ps_objs])
        session.commit()
        print(f"Computed {len(ps_objs)} priority scores.")

    # 4. Seed Demo Users
    print("Seeding demo users...")
    demo_users = [
        User(
            name="Policy Director (Demo)",
            email="policymaker@jansetu.demo",
            phone="9999900000",
            role="policymaker",
            password_hash=hash_pw("demo1234"),
            created_at=datetime.now().isoformat()
        ),
        User(
            name="Ramesh Kumar (Citizen)",
            email="citizen@jansetu.demo",
            phone="9876543210",
            role="citizen",
            password_hash=None,
            created_at=datetime.now().isoformat()
        )
    ]
    session.add_all(demo_users)
    session.commit()

    # 5. Seed Initial Cached Recommendations
    print("Seeding initial cached recommendations...")
    initial_recs = [
        CachedRecommendation(
            title="Accelerate JJM Pipeline in Latur & Bastar",
            description="Severe ground water depletion and high deficit index (0.60) in Latur and Bastar indicates immediate need for piped community water tankers and rapid solar pump deployment.",
            sector="water",
            district="Latur",
            priority="Critical",
            estimated_impact="Benefits 240,000 residents across 48 panchayats",
            matching_scheme="Jal Jeevan Mission (JJM)",
            created_at=datetime.now().isoformat()
        ),
        CachedRecommendation(
            title="Emergency Flood Road Rehabilitation in Dhubri",
            description="Riverine erosion along PMGSY road networks has cut off primary health access across southern Dhubri. Immediate stone pitching and culvert reconstruction required.",
            sector="roads",
            district="Dhubri",
            priority="Critical",
            estimated_impact="Restores emergency transport for 180,000 citizens",
            matching_scheme="PMGSY",
            created_at=datetime.now().isoformat()
        ),
        CachedRecommendation(
            title="Grid Stabilization & Microgrid Installation in Bastar",
            description="Persistent feeder trips and low voltage affecting primary health centres. Deploy decentralized solar microgrids with battery storage.",
            sector="electricity",
            district="Bastar",
            priority="High",
            estimated_impact="Stabilizes power for 12 rural health centers",
            matching_scheme="DDUGJY / Saubhagya",
            created_at=datetime.now().isoformat()
        )
    ]
    session.add_all(initial_recs)
    session.commit()

    session.close()
    print("Seeding successfully completed!")

if __name__ == '__main__':
    run_seed()
