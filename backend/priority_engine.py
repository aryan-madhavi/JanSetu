import json
import pandas as pd

def compute_priority(requests_df, district_df):
    results = []
    schemes = {
        'water': 'Jal Jeevan Mission (JJM)',
        'roads': 'PMGSY (Pradhan Mantri Gram Sadak Yojana)',
        'health': 'Ayushman Bharat HWC',
        'education': 'Samagra Shiksha Abhiyan',
        'electricity': 'DDUGJY / Saubhagya',
        'sanitation': 'Swachh Bharat Mission (Grameen)',
        'connectivity': 'BharatNet / Digital India',
        'housing': 'Pradhan Mantri Awas Yojana (PMAY)',
        'agriculture': 'PM-KISAN / Micro Irrigation'
    }
    
    for (district, sector), group in requests_df.groupby(['district', 'sector']):
        if not district or not sector or pd.isna(district) or pd.isna(sector):
            continue
        d_row = district_df[district_df['district'] == district]
        if d_row.empty:
            continue
        d_row = d_row.iloc[0]
        
        pop = float(d_row['population'])
        if pop == 0:
            continue
        
        # severity-weighted count per 100k capita
        demand_intensity = (float(group['severity'].sum()) / pop) * 100000.0
        
        idx_col = f'{sector}_idx'
        if idx_col in d_row and not pd.isna(d_row[idx_col]):
            infra_deficit = max(100.0 - float(d_row[idx_col]), 0.0) / 100.0
        else:
            infra_deficit = 0.5
            
        rural_pct = float(d_row.get('rural_pct', 50.0))
        sc_st_pct = float(d_row.get('sc_st_pct', 20.0))
        vulnerability = (rural_pct + sc_st_pct) / 200.0
        
        investment = float(d_row.get('investment_allocation', 5000.0))
        allocation_coverage = min(investment / 20000.0, 1.0)
        
        raw_score = demand_intensity * infra_deficit * vulnerability * (1.0 - allocation_coverage)
        
        # Collect top 3 evidence quotes
        sorted_group = group.sort_values(by='severity', ascending=False)
        quotes = []
        for _, r in sorted_group.head(3).iterrows():
            orig = r.get('transcript_original') or r.get('english_summary') or ''
            eng = r.get('english_summary') or orig
            quotes.append({
                'id': str(r.get('id', '')),
                'original': str(orig)[:200],
                'english': str(eng)[:200],
                'severity': int(r.get('severity', 3)),
                'location': str(r.get('location_text') or district),
                'specific_need': str(r.get('specific_need', ''))
            })
            
        results.append({
            'district': str(district),
            'sector': str(sector),
            'raw_score': raw_score,
            'demand_intensity': round(demand_intensity, 4),
            'infra_deficit': round(infra_deficit, 4),
            'vulnerability': round(vulnerability, 4),
            'allocation_coverage': round(allocation_coverage, 4),
            'matching_scheme': schemes.get(str(sector).lower(), 'National Infrastructure Pipeline'),
            'evidence_quotes': json.dumps(quotes)
        })
        
    res_df = pd.DataFrame(results)
    if not res_df.empty:
        max_score = res_df['raw_score'].max()
        if max_score > 0:
            res_df['score'] = ((res_df['raw_score'] / max_score) * 100.0).round(1)
        else:
            res_df['score'] = 0.0
    return res_df
