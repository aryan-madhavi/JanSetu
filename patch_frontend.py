import re

def rewrite_overview():
    with open("frontend/src/pages/Overview.tsx", "r") as f:
        code = f.read()
    
    if "useEffect" not in code:
        code = code.replace('import { Activity', 'import { useEffect, useState } from "react";\nimport { fetchJson } from "../lib/api";\nimport { Activity')
        code = code.replace('export default function Overview() {', """export default function Overview() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    fetchJson('/dashboard/stats').then(setStats).catch(console.error);
  }, []);
  
  if (!stats) return <div className="p-8 text-center text-[#5E6B7A]">Loading Overview...</div>;
  
  const chartData = Object.keys(stats.by_sector || {}).map(k => ({ district: "All", [k]: stats.by_sector[k] }));
""")
        code = code.replace('val: "12,482"', 'val: stats.total_requests')
        code = code.replace('val: "34"', 'val: stats.total_clusters')
        code = code.replace('val: "8,942"', 'val: stats.critical_requests')
        code = code.replace('data={data}', 'data={chartData}')

    with open("frontend/src/pages/Overview.tsx", "w") as f:
        f.write(code)

def rewrite_askdata():
    with open("frontend/src/pages/AskData.tsx", "r") as f:
        code = f.read()

    if "fetchJson" not in code:
        code = code.replace('import { Search', 'import { fetchJson } from "../lib/api";\nimport { Search')
        code = code.replace('const [hasSearched, setHasSearched] = useState(false);', """const [hasSearched, setHasSearched] = useState(false);
  const [reply, setReply] = useState("");
""")
        
        code = code.replace('if (query.trim()) setHasSearched(true);', """if (query.trim()) {
      setHasSearched(true);
      fetchJson('/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: query})
      }).then(r => setReply(r.reply)).catch(console.error);
    }""")
    
        code = code.replace('/* Generated SQL */', '/* AI Reply */')
        code = code.replace('SELECT district, sector, deficit_index<br/>\n              FROM priority_queue<br/>\n              WHERE state = MH AND sector = Water AND deficit_index &gt; 0.7<br/>\n              ORDER BY deficit_index DESC;', '{reply}')

    with open("frontend/src/pages/AskData.tsx", "w") as f:
        f.write(code)

def rewrite_landing():
    with open("frontend/src/pages/Landing.tsx", "r") as f:
        code = f.read()
    
    if "fetchJson" not in code:
        code = code.replace('import { Mic', 'import { fetchJson } from "../lib/api";\nimport { Mic')
        # Add basic submit text logic
        
    with open("frontend/src/pages/Landing.tsx", "w") as f:
        f.write(code)

rewrite_overview()
rewrite_askdata()
