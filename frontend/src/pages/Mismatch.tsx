import { useState, useEffect } from "react";
import { fetchJson, downloadFile } from "../lib/api";
import { useApp } from "../context/AppContext";
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from "recharts";
import { AlertTriangle, Download, RefreshCw, AlertCircle, Layers } from "lucide-react";

export default function Mismatch() {
  const { district, t } = useApp();
  const [data, setData] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchJson<any[]>("/priority/mismatch"),
      fetchJson<any[]>("/clusters")
    ])
      .then(([mismatchData, clusterData]) => {
        setData(mismatchData);
        setClusters(clusterData);
      })
      .catch(err => setError(err.message || "Failed to load deficit analysis data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [district]);

  const filteredData = data.filter(d => {
    if (district === "All") return true;
    return d.district?.toLowerCase() === district.toLowerCase();
  });

  const highMismatchItems = [...filteredData].sort((a, b) => (b.demand * b.deficit) - (a.demand * a.deficit)).slice(0, 8);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b border-[#D9DEE5] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-200">
              Demo data
            </span>
            <span className="text-xs font-bold text-[#D32F2F] uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle size={14} /> Fiscal Mismatch Detection
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0B2545] font-sans">
            {t("deficit_analysis")}
          </h1>
          <p className="text-[#5E6B7A] text-sm mt-1">
            Cross-referencing verified citizen demand intensity against baseline infrastructure deficits to pinpoint misallocated public expenditure.
          </p>
        </div>
        <button
          onClick={() => downloadFile("/brief/export", `JanSetu_Deficit_Analysis_${district}.md`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2545] text-white rounded text-sm font-medium hover:bg-[#081d36]"
        >
          <Download size={14} /> Export Analysis
        </button>
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
          <button onClick={loadData} className="px-4 py-1.5 bg-[#0B2545] text-white text-xs font-medium rounded">
            {t("retry")}
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Scatter Chart Panel */}
          <div className="bg-white border border-[#D9DEE5] rounded shadow-sm p-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0B2545]">
                  Demand vs. Deficit Quadrant Matrix
                </h2>
                <p className="text-xs text-[#5E6B7A]">
                  Top-right quadrant indicates Critical Action Zone (High citizen pressure + Severe deficit).
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#5E6B7A]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span> Critical Deficit (&gt;0.6)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1565C0] inline-block"></span> Moderate
                </span>
              </div>
            </div>

            <div className="h-80 sm:h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    type="number" 
                    dataKey="demand" 
                    name="Demand Intensity" 
                    unit="" 
                    tick={{ fontSize: 11, fill: "#5E6B7A" }}
                    label={{ value: "Citizen Demand Intensity →", position: "insideBottom", offset: -10, fontSize: 11, fill: "#5E6B7A" }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="deficit" 
                    name="Deficit Index" 
                    domain={[0, 1]}
                    tick={{ fontSize: 11, fill: "#5E6B7A" }}
                    label={{ value: "Deficit Index (0-1) →", angle: -90, position: "insideLeft", fontSize: 11, fill: "#5E6B7A" }}
                  />
                  <ReferenceLine y={0.5} stroke="#D9DEE5" strokeDasharray="4 4" />
                  <ReferenceLine x={4} stroke="#D9DEE5" strokeDasharray="4 4" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white border border-[#D9DEE5] rounded p-2.5 shadow-lg text-xs">
                          <div className="font-bold text-[#0B2545]">{item.district} ({item.sector})</div>
                          <div className="text-red-700 font-semibold">Deficit: {item.deficit}</div>
                          <div className="text-[#1565C0]">Demand: {item.demand}</div>
                          <div className="text-[#5E6B7A] mt-1">Priority: {item.score}</div>
                          <div className="text-[11px] text-gray-500">{item.scheme}</div>
                        </div>
                      );
                    }}
                  />
                  <Scatter name="Districts" data={filteredData}>
                    {filteredData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.deficit > 0.55 ? "#D32F2F" : "#1565C0"} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid: High Mismatch Table & Semantic Clusters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Critical Mismatch List */}
            <div className="bg-white border border-[#D9DEE5] rounded shadow-sm overflow-hidden flex flex-col">
              <div className="bg-[#F7F5F2] px-4 py-3 border-b border-[#D9DEE5] flex justify-between items-center">
                <h3 className="text-sm font-semibold text-[#0B2545] flex items-center gap-1.5">
                  <AlertTriangle size={16} className="text-[#D32F2F]" />
                  Priority Disconnects (Immediate Intervention Required)
                </h3>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#F7F5F2] border-b border-[#D9DEE5] text-[#5E6B7A]">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">District</th>
                      <th className="px-4 py-2.5 font-semibold">Sector</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Deficit</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Demand</th>
                      <th className="px-4 py-2.5 font-semibold">Target Scheme</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9DEE5] text-[#162033]">
                    {highMismatchItems.map((item, i) => (
                      <tr key={i} className="hover:bg-[#F7F5F2]">
                        <td className="px-4 py-2.5 font-bold text-[#0B2545]">{item.district}</td>
                        <td className="px-4 py-2.5 capitalize">{item.sector}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-red-700">{item.deficit}</td>
                        <td className="px-4 py-2.5 text-right font-medium">{item.demand}</td>
                        <td className="px-4 py-2.5 text-[#1565C0] font-medium truncate max-w-[160px]">{item.scheme}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Semantic Clusters Card */}
            <div className="bg-white border border-[#D9DEE5] rounded shadow-sm overflow-hidden flex flex-col">
              <div className="bg-[#F7F5F2] px-4 py-3 border-b border-[#D9DEE5] flex justify-between items-center">
                <h3 className="text-sm font-semibold text-[#0B2545] flex items-center gap-1.5">
                  <Layers size={16} className="text-[#1565C0]" />
                  Active Semantic Clusters ({clusters.length} clusters identified)
                </h3>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-80">
                {clusters.slice(0, 6).map((c, i) => (
                  <div key={c.id || i} className="p-2.5 bg-[#F7F5F2] border border-[#D9DEE5] rounded text-xs flex justify-between items-start gap-2">
                    <div>
                      <div className="font-semibold text-[#0B2545]">{c.description}</div>
                      <div className="text-[11px] text-[#5E6B7A] mt-0.5 capitalize">
                        {c.district} • {c.sector}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded font-bold bg-blue-100 text-[#1565C0] shrink-0 text-[11px]">
                      {c.size} reports
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
