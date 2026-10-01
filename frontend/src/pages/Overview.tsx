import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Download, 
  FileText,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { fetchJson, downloadFile, exportCsv } from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function Overview() {
  const { district, t, dataSource, pollTick } = useApp();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/dashboard/stats?source=${dataSource}${district !== "All" ? `&district=${encodeURIComponent(district)}` : ""}`;
      const data = await fetchJson<any>(url);
      setStats(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [district, dataSource, pollTick]);

  const handleExportCsv = () => {
    if (!stats?.recent_queue || stats.recent_queue.length === 0) return;
    const headers = ["Ticket ID", "Timestamp", "District", "Sector", "Severity", "English Summary", "Source"];
    const rows = stats.recent_queue.map((r: any) => [
      r.id || r.ticket_id || "",
      r.timestamp || "",
      r.district || "",
      r.sector || "",
      r.severity || "",
      r.english_summary || "",
      r.source || ""
    ]);
    exportCsv(headers, rows, `JanSetu_Overview_${district}_${dataSource}.csv`);
  };

  const handleGenerateReport = async () => {
    try {
      setExporting(true);
      const url = `/brief/export?source=${dataSource}${district !== "All" ? `&district=${encodeURIComponent(district)}` : ""}`;
      await downloadFile(url, `JanSetu_Brief_${district}.md`);
    } catch (err: any) {
      alert("Failed to export brief: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const filteredQueue = (stats?.recent_queue || []).filter((item: any) => {
    if (selectedSector === "All Sectors") return true;
    return item.s?.toLowerCase() === selectedSector.toLowerCase();
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Action bar */}
      <div className="bg-white border border-[#D9DEE5] rounded p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-300">
              {dataSource === "live" ? "Live Mode" : "Demo data"}
            </span>
            <span className="text-xs text-[#5E6B7A] uppercase font-bold tracking-wider">
              {district === "All" ? t("all_districts") : district}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">
            {t("national_overview")}
          </h1>
          <p className="text-xs text-[#5E6B7A] mt-0.5">
            Real-time algorithmic priority ranking & citizen infrastructure demand stream.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCsv}
            disabled={!stats}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D9DEE5] hover:bg-[#F7F5F2] text-xs font-medium text-[#0B2545] rounded transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download size={14} className="text-[#5E6B7A]" />
            <span>{t("export_csv")}</span>
          </button>
          
          <button 
            onClick={handleGenerateReport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0B2545] hover:bg-[#1565C0] text-xs font-semibold text-white rounded transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <FileText size={14} />
            <span>{exporting ? "Generating..." : t("generate_report")}</span>
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="bg-white border border-[#D9DEE5] rounded p-12 text-center">
          <RefreshCw size={32} className="mx-auto mb-2 animate-spin text-[#1565C0]" />
          <p className="text-sm text-[#5E6B7A]">{t("loading")}</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded p-8 text-center">
          <AlertTriangle size={32} className="mx-auto mb-2 text-[#D32F2F]" />
          <p className="text-sm font-semibold text-[#D32F2F] mb-1">Failed to load data</p>
          <p className="text-xs text-[#5E6B7A] mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-1.5 bg-[#0B2545] text-white text-xs font-medium rounded hover:bg-[#1565C0]"
          >
            {t("retry")}
          </button>
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
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
              <div className="mt-4 text-[11px] text-[#2E7D32] flex items-center justify-between font-medium">
                <span>{stats.live_requests ?? 0} live, {stats.demo_requests ?? 2000} demo</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {dataSource === "live" ? "Live Mode" : "All Data"}
                </span>
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
