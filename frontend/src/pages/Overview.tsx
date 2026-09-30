import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJson, exportCsv, downloadFile } from "../lib/api";
import { useApp } from "../context/AppContext";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from "recharts";
import { 
  TrendingUp, AlertOctagon, CheckCircle2, Clock, Download, FileText, RefreshCw, AlertCircle
} from "lucide-react";

export default function Overview() {
  const navigate = useNavigate();
  const { district, t } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>("All Sectors");

  const loadStats = () => {
    setLoading(true);
    setError(null);
    const param = district && district !== "All" ? `?district=${encodeURIComponent(district)}` : "";
    fetchJson<any>(`/dashboard/stats${param}`)
      .then(data => setStats(data))
      .catch(err => setError(err.message || "Failed to load dashboard statistics"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, [district]);

  const handleExportCsv = () => {
    if (!stats || !stats.recent_queue) return;
    const headers = ["District", "Sector", "Severity", "ETA", "Priority Score", "Target Scheme"];
    const rows = stats.recent_queue.map((r: any) => [
      r.d, r.s, r.sev, r.eta, r.score, r.scheme
    ]);
    exportCsv(headers, rows, `JanSetu_National_Priority_Queue_${district}.csv`);
  };

  const handleGenerateReport = () => {
    downloadFile("/brief/export", `JanSetu_Infrastructure_Report_${district}.md`);
  };

  const filteredQueue = (stats?.recent_queue || []).filter((item: any) => {
    if (selectedSector === "All Sectors") return true;
    return item.s.toLowerCase() === selectedSector.toLowerCase();
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white border border-[#D9DEE5] rounded p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-200">
              Demo data
            </span>
            <span className="text-xs font-bold text-[#5E6B7A] uppercase tracking-wider">
              {district === "All" ? t("all_districts") : `${t("district_label")}: ${district}`}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0B2545] font-sans mt-0.5">
            {t("national_overview")}
          </h1>
          <p className="text-xs text-[#5E6B7A]">
            Real-time algorithmic priority ranking & citizen infrastructure demand stream.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D9DEE5] text-sm font-medium rounded text-[#0B2545] hover:bg-[#F7F5F2] transition-colors"
          >
            <Download size={14} />
            {t("export_csv")}
          </button>
          <button 
            onClick={handleGenerateReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2545] text-white text-sm font-medium rounded hover:bg-[#081d36] transition-colors"
          >
            <FileText size={14} />
            {t("generate_report")}
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-[#5E6B7A] bg-white border border-[#D9DEE5] rounded">
          <RefreshCw size={32} className="mx-auto mb-2 animate-spin text-[#1565C0]" />
          <p className="text-sm">{t("loading")}</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded text-center">
          <AlertCircle size={32} className="mx-auto text-red-600 mb-2" />
          <p className="text-sm text-red-700 mb-3">{error}</p>
          <button onClick={loadStats} className="px-4 py-1.5 bg-[#0B2545] text-white text-xs font-medium rounded">
            {t("retry")}
          </button>
        </div>
      )}

      {!loading && stats && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#D9DEE5] rounded p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-[#5E6B7A] text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Total Ingested Grievances</span>
                  <TrendingUp size={16} className="text-[#1565C0]" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-[#0B2545]">
                  {stats.total_requests?.toLocaleString()}
                </div>
              </div>
              <div className="mt-4 text-[11px] text-[#2E7D32] flex items-center gap-1 font-medium">
                <span>Multi-channel verified citizen inputs</span>
              </div>
            </div>

            <div className="bg-white border border-[#D9DEE5] rounded p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-[#5E6B7A] text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Critical (P1) Alerts</span>
                  <AlertOctagon size={16} className="text-[#D32F2F]" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-[#D32F2F]">
                  {stats.critical_requests?.toLocaleString()}
                </div>
              </div>
              <div className="mt-4 text-[11px] text-[#D32F2F] font-medium">
                Life & safety emergencies flagged
              </div>
            </div>

            <div className="bg-white border border-[#D9DEE5] rounded p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-[#5E6B7A] text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Semantic Clusters</span>
                  <CheckCircle2 size={16} className="text-[#2E7D32]" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-[#0B2545]">
                  {stats.total_clusters}
                </div>
              </div>
              <div className="mt-4 text-[11px] text-[#5E6B7A]">
                Clustered across 10 focus districts
              </div>
            </div>

            <div className="bg-white border border-[#D9DEE5] rounded p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-[#5E6B7A] text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Max Deficit Priority</span>
                  <Clock size={16} className="text-[#F59E0B]" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-[#0B2545]">
                  {stats.recent_queue?.[0]?.score ? `${stats.recent_queue[0].score}/100` : "88.5/100"}
                </div>
              </div>
              <div className="mt-4 text-[11px] text-[#5E6B7A] truncate">
                {stats.recent_queue?.[0] ? `${stats.recent_queue[0].d} (${stats.recent_queue[0].s})` : "Latur (Water)"}
              </div>
            </div>
          </div>

          {/* Main Grid: Chart & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart Panel */}
            <div className="bg-white border border-[#D9DEE5] rounded shadow-sm flex flex-col">
              <div className="bg-[#F7F5F2] px-4 py-3 border-b border-[#D9DEE5] flex justify-between items-center">
                <h2 className="text-[15px] font-semibold text-[#0B2545]">Grievance Demand Ingestion Trends</h2>
                <span className="text-xs text-[#5E6B7A]">Daily Temporal Breakdown</span>
              </div>
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.over_time || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: "#5E6B7A", fontSize: 11}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: "#5E6B7A", fontSize: 11}} dx={-10} />
                    <Tooltip cursor={{fill: "#F7F5F2"}} contentStyle={{borderRadius: "4px", border: "1px solid #D9DEE5", fontSize: "12px"}} />
                    <Legend iconType="circle" wrapperStyle={{fontSize: "12px", paddingTop: "20px"}} />
                    <Bar dataKey="water" name="Water" stackId="a" fill="#1565C0" />
                    <Bar dataKey="roads" name="Roads" stackId="a" fill="#0B2545" />
                    <Bar dataKey="electricity" name="Power" stackId="a" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority Table Panel */}
            <div className="bg-white border border-[#D9DEE5] rounded shadow-sm flex flex-col overflow-hidden">
              <div className="bg-[#F7F5F2] px-4 py-3 border-b border-[#D9DEE5] flex justify-between items-center">
                <h2 className="text-[15px] font-semibold text-[#0B2545]">{t("priority_queue")}</h2>
                <select 
                  value={selectedSector}
                  onChange={e => setSelectedSector(e.target.value)}
                  className="bg-white border border-[#D9DEE5] rounded text-xs px-2 py-1 text-[#5E6B7A] focus:outline-none focus:border-[#1565C0]"
                >
                  <option>All Sectors</option>
                  <option>Roads</option>
                  <option>Water</option>
                  <option>Electricity</option>
                  <option>Health</option>
                </select>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b border-[#D9DEE5] text-[#5E6B7A] sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-medium">District</th>
                      <th className="px-4 py-3 font-medium">Sector</th>
                      <th className="px-4 py-3 font-medium">Severity</th>
                      <th className="px-4 py-3 font-medium">Score</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9DEE5] text-[#162033]">
                    {filteredQueue.map((row: any, i: number) => (
                      <tr 
                        key={i} 
                        onClick={() => navigate("/priority")}
                        className="hover:bg-[#F7F5F2] transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 font-medium text-[#0B2545]">{row.d}</td>
                        <td className="px-4 py-3">{row.s}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            row.sev === "Critical" ? "bg-red-100 text-red-700" :
                            row.sev === "High" ? "bg-[#F59E0B]/20 text-[#0B2545]" : "bg-blue-100 text-[#1565C0]"
                          }`}>
                            {row.sev}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-[#0B2545]">{row.score}</td>
                        <td className="px-4 py-3 text-xs text-[#1565C0] font-medium hover:underline">
                          Review →
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
