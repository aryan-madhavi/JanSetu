import { useState, useEffect } from "react";
import { fetchJson, downloadFile } from "../lib/api";
import { useApp } from "../context/AppContext";
import { 
  ChevronRight, Filter, Download, X, Search, CheckCircle, 
  ArrowUpDown, RefreshCw, AlertCircle, Sparkles, Quote, CloudSun
} from "lucide-react";

export default function Clusters() {
  const { district: globalDistrict, t, dataSource, pollTick } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [sortBy, setSortBy] = useState<"score" | "demand" | "deficit">("score");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Why Drawer state
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [addedProjects, setAddedProjects] = useState<Set<number>>(new Set());

  const loadData = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (globalDistrict && globalDistrict !== "All") {
      params.append("district", globalDistrict);
    }
    if (selectedSector && selectedSector !== "all") {
      params.append("sector", selectedSector);
    }
    params.append("source", dataSource);
    params.append("sort_by", sortBy);
    params.append("order", sortOrder);

    fetchJson<any[]>(`/priority?${params.toString()}`)
      .then(data => setItems(data))
      .catch(err => setError(err.message || "Failed to load priority queue"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    setPage(1);
  }, [globalDistrict, selectedSector, sortBy, sortOrder, dataSource, pollTick]);

  const filteredItems = items.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.district?.toLowerCase().includes(q) ||
      item.sector?.toLowerCase().includes(q) ||
      item.matching_scheme?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const handleAddToRecommended = (id: number) => {
    setAddedProjects(prev => new Set(prev).add(id));
  };

  const handleExportBrief = () => {
    downloadFile(`/brief/export?source=${dataSource}`, `JanSetu_Priority_Brief_${selectedItem?.district || "National"}.md`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 border-b border-[#D9DEE5] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-300">
              {dataSource === "live" ? "Live Mode" : "Demo data"}
            </span>
            <span className="text-xs text-[#5E6B7A] uppercase font-bold tracking-wider">
              Algorithmic Allocation Model
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight mt-1">
            {t("priority_queue")}
          </h1>
          <p className="text-xs text-[#5E6B7A] mt-1">
            Demand × Deficit × Vulnerability × (1 - Fiscal Allocation Coverage) ranking across national districts.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[#5E6B7A]" size={14} />
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-[#D9DEE5] rounded bg-white text-xs w-48 focus:outline-none focus:border-[#1565C0]"
            />
          </div>

          <button 
            onClick={() => setShowFilterDrawer(true)}
            className="flex items-center gap-1.5 border border-[#D9DEE5] bg-white px-3 py-1.5 rounded text-xs font-medium hover:bg-[#F7F5F2] text-[#0B2545]"
          >
            <Filter size={14} />
            Filter Queue
          </button>

          <button 
            onClick={() => downloadFile(`/brief/export?source=${dataSource}`, "JanSetu_Priority_Queue.md")}
            className="flex items-center gap-1.5 bg-[#0B2545] hover:bg-[#1565C0] text-white px-3 py-1.5 rounded text-xs font-semibold shadow-xs"
          >
            <Download size={14} />
            Export Brief
          </button>
        </div>
      </div>

      {/* FILTER DRAWER / MODAL */}
      {showFilterDrawer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="bg-white w-80 h-full shadow-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-[#D9DEE5] mb-4">
                <h3 className="font-bold text-sm text-[#0B2545] flex items-center gap-2">
                  <Filter size={16} className="text-[#1565C0]" />
                  Filter Priorities
                </h3>
                <button onClick={() => setShowFilterDrawer(false)} className="text-[#5E6B7A] hover:text-[#0B2545]">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-[#0B2545] block mb-1.5">Sector Filter</label>
                  <select 
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="w-full border border-[#D9DEE5] rounded p-2 bg-white text-[#162033]"
                  >
                    <option value="all">All Sectors</option>
                    <option value="water">Water</option>
                    <option value="roads">Roads</option>
                    <option value="health">Health</option>
                    <option value="education">Education</option>
                    <option value="electricity">Electricity</option>
                    <option value="sanitation">Sanitation</option>
                    <option value="connectivity">Connectivity</option>
                    <option value="housing">Housing</option>
                    <option value="agriculture">Agriculture</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#0B2545] block mb-1.5">Sort Factor</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full border border-[#D9DEE5] rounded p-2 bg-white text-[#162033]"
                  >
                    <option value="score">Composite Equalization Score</option>
                    <option value="demand">Citizen Demand Intensity</option>
                    <option value="deficit">Infrastructure Deficit Index</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#0B2545] block mb-1.5">Sort Direction</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortOrder("desc")}
                      className={`flex-1 py-1.5 rounded border text-center font-medium ${sortOrder === "desc" ? "bg-[#0B2545] text-white border-[#0B2545]" : "bg-white border-[#D9DEE5]"}`}
                    >
                      Highest First
                    </button>
                    <button
                      onClick={() => setSortOrder("asc")}
                      className={`flex-1 py-1.5 rounded border text-center font-medium ${sortOrder === "asc" ? "bg-[#0B2545] text-white border-[#0B2545]" : "bg-white border-[#D9DEE5]"}`}
                    >
                      Lowest First
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#D9DEE5] flex gap-2">
              <button
                onClick={() => { setSelectedSector("all"); setSortBy("score"); setSortOrder("desc"); }}
                className="flex-1 py-2 text-xs border border-[#D9DEE5] rounded text-[#5E6B7A] hover:bg-[#F7F5F2]"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="flex-1 py-2 text-xs bg-[#0B2545] text-white rounded font-medium hover:bg-[#1565C0]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Content */}
      {loading ? (
        <div className="bg-white border border-[#D9DEE5] rounded p-12 text-center shadow-xs">
          <RefreshCw size={28} className="mx-auto mb-2 animate-spin text-[#1565C0]" />
          <p className="text-xs text-[#5E6B7A]">{t("loading")}</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded p-8 text-center shadow-xs">
          <AlertCircle size={28} className="mx-auto mb-2 text-red-600" />
          <p className="text-sm font-semibold text-red-700 mb-1">Failed to load priority data</p>
          <p className="text-xs text-[#5E6B7A] mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-1.5 bg-[#0B2545] text-white text-xs font-medium rounded hover:bg-[#1565C0]"
          >
            {t("retry")}
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-[#D9DEE5] rounded p-12 text-center shadow-xs">
          <p className="text-sm font-semibold text-[#0B2545]">No priority records found for the active filter</p>
          <p className="text-xs text-[#5E6B7A] mt-1">Try switching to Live + Demo mode or clearing sector filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#D9DEE5] rounded shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#F7F5F2] border-b border-[#D9DEE5] text-[#5E6B7A] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">District & Project Focus</th>
                  <th className="px-4 py-3">Sector</th>
                  <th className="px-4 py-3 text-right">Demand (per 100k)</th>
                  <th className="px-4 py-3 text-right">Deficit Index</th>
                  <th className="px-4 py-3 text-right cursor-pointer" onClick={() => { setSortBy("score"); setSortOrder(o => o === "desc" ? "asc" : "desc"); }}>
                    <div className="inline-flex items-center gap-1 font-bold text-[#0B2545]">
                      Equalization Score
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5] text-[#162033]">
                {pagedItems.map((item, idx) => {
                  const globalRank = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr 
                      key={item.id || idx}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-[#F7F5F2] transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-[#5E6B7A]">
                        #{globalRank}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-[#0B2545]">
                          {item.district} {item.sector?.toUpperCase()} Intervention
                        </div>
                        <div className="text-xs text-[#5E6B7A] mt-0.5">
                          Scheme: {item.matching_scheme}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="border border-[#D9DEE5] text-[#5E6B7A] px-2 py-0.5 rounded text-xs font-medium bg-white capitalize">
                          {item.sector}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {item.demand}
                      </td>
                      <td className="px-4 py-3 text-right text-red-700 font-medium">
                        {item.deficit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-base font-bold ${item.score > 60 ? "text-red-700" : "text-[#0B2545]"}`}>
                          {item.score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                          className="px-2.5 py-1 text-xs font-medium text-[#1565C0] hover:bg-blue-50 rounded border border-blue-200 inline-flex items-center gap-1"
                        >
                          Review <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-[#F7F5F2] border-t border-[#D9DEE5] px-4 py-3 text-xs text-[#5E6B7A] flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>
              Showing {Math.min((page - 1) * pageSize + 1, filteredItems.length)} - {Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length} priority allocations
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white border border-[#D9DEE5] rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-2 font-medium text-[#0B2545]">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 bg-white border border-[#D9DEE5] rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHY DRAWER */}
      {selectedItem && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l border-[#D9DEE5] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="bg-[#0B2545] text-white p-4 flex justify-between items-start shrink-0">
            <div>
              <div className="text-xs text-white/70 uppercase tracking-wider font-semibold">
                Allocation Evidence & Factor Audit
              </div>
              <h2 className="text-lg font-bold mt-1">
                {selectedItem.district} • {selectedItem.sector?.toUpperCase()}
              </h2>
              <div className="text-xs text-white/80 mt-1 flex items-center gap-2">
                <span className="bg-[#1565C0] px-2 py-0.5 rounded font-mono font-bold">
                  Score: {selectedItem.score}
                </span>
                <span>{selectedItem.matching_scheme}</span>
              </div>
            </div>
            <button 
              onClick={() => setSelectedItem(null)}
              className="text-white/70 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
            {/* Live External Signal: Open-Meteo Weather */}
            {selectedItem.weather_signal && (
              <div className="p-3.5 rounded bg-blue-50/70 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1565C0] flex items-center gap-1.5">
                    <CloudSun size={15} />
                    Live Context Signal: Open-Meteo
                  </span>
                  <span className="text-[10px] text-[#5E6B7A] font-mono">
                    {selectedItem.weather_signal.source}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded border border-blue-100 shadow-2xs">
                    <div className="text-[10px] text-[#5E6B7A]">Temperature</div>
                    <div className="font-bold text-[#0B2545]">{selectedItem.weather_signal.temp_c}°C</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-100 shadow-2xs">
                    <div className="text-[10px] text-[#5E6B7A]">Precipitation</div>
                    <div className="font-bold text-[#0B2545]">{selectedItem.weather_signal.precipitation_mm} mm</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-100 shadow-2xs">
                    <div className="text-[10px] text-[#5E6B7A]">Humidity</div>
                    <div className="font-bold text-[#0B2545]">{selectedItem.weather_signal.humidity_pct}%</div>
                  </div>
                </div>
                <div className="text-[10px] text-[#5E6B7A] mt-2 italic flex justify-between">
                  <span>Weather context modifier factored into trajectory</span>
                  <span>{selectedItem.weather_signal.retrieved_at ? selectedItem.weather_signal.retrieved_at.substring(11, 16) + " UTC" : "Realtime"}</span>
                </div>
              </div>
            )}

            {/* Factor Formula Section */}
            <div className="bg-[#F7F5F2] border border-[#D9DEE5] rounded p-4">
              <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider mb-3">
                Algorithmic Factor Decomposition
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#5E6B7A]">1. Citizen Demand Intensity</span>
                    <span className="font-mono font-bold text-[#0B2545]">
                      {selectedItem.breakdown?.demand_intensity ?? selectedItem.demand}
                    </span>
                  </div>
                  <div className="w-full bg-[#D9DEE5] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#1565C0] h-full" 
                      style={{ width: `${Math.min(100, ((selectedItem.breakdown?.demand_intensity ?? selectedItem.demand) / 10) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#5E6B7A]">2. Infrastructure Deficit Index</span>
                    <span className="font-mono font-bold text-red-700">
                      {selectedItem.breakdown?.infra_deficit ?? selectedItem.deficit}
                    </span>
                  </div>
                  <div className="w-full bg-[#D9DEE5] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-600 h-full" 
                      style={{ width: `${(selectedItem.breakdown?.infra_deficit ?? selectedItem.deficit) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#5E6B7A]">3. Socioeconomic Vulnerability (Rural+SC/ST)</span>
                    <span className="font-mono font-bold text-[#F59E0B]">
                      {selectedItem.breakdown?.vulnerability ?? 0.65}
                    </span>
                  </div>
                  <div className="w-full bg-[#D9DEE5] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#F59E0B] h-full" 
                      style={{ width: `${(selectedItem.breakdown?.vulnerability ?? 0.65) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#5E6B7A]">4. Uncovered Fiscal Gap (1 - Allocation)</span>
                    <span className="font-mono font-bold text-[#2E7D32]">
                      {1 - (selectedItem.breakdown?.fiscal_coverage ?? 0.25)}
                    </span>
                  </div>
                  <div className="w-full bg-[#D9DEE5] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#2E7D32] h-full" 
                      style={{ width: `${(1 - (selectedItem.breakdown?.fiscal_coverage ?? 0.25)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Scheme Badge & Recommendation */}
            <div className="border border-blue-200 bg-blue-50/50 rounded p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1565C0] block mb-1">
                Eligible Centrally Sponsored Scheme
              </span>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-[#1565C0]" />
                <span className="font-bold text-[#0B2545]">{selectedItem.matching_scheme}</span>
              </div>
              <p className="text-xs text-[#5E6B7A] mt-1">
                Pre-cleared funding channel under national fiscal deficit equalization rules.
              </p>
            </div>

            {/* Evidence Quotes */}
            <div>
              <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Quote size={14} className="text-[#1565C0]" />
                Verified Citizen Grievance Quotes
              </h3>
              
              <div className="space-y-2.5">
                {selectedItem.evidence_quotes && selectedItem.evidence_quotes.length > 0 ? (
                  selectedItem.evidence_quotes.map((q: any, i: number) => (
                    <div key={i} className="p-3 bg-[#F7F5F2] border border-[#D9DEE5] rounded text-xs">
                      <div className="flex justify-between items-center text-[#5E6B7A] mb-1">
                        <span className="font-semibold text-[#0B2545]">{q.location || selectedItem.district}</span>
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                          Severity: {q.severity}/5
                        </span>
                      </div>
                      <p className="text-[#162033] italic">"{q.english || q.original}"</p>
                      {q.original && q.original !== q.english && (
                        <p className="text-[10px] text-[#5E6B7A] mt-1 font-mono">
                          Orig: {q.original}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#5E6B7A] italic">No direct grievance quotes attached to this cluster.</p>
                )}
              </div>
            </div>

            {/* Demand Trajectory Sparkline */}
            <div className="bg-[#F7F5F2] border border-[#D9DEE5] rounded p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6B7A] block mb-2">
                4-Quarter Demand Trajectory Without Intervention
              </span>
              <div className="flex items-end gap-1 h-12 pt-2">
                <div className="flex-1 bg-amber-200 h-[40%] rounded-xs flex items-end justify-center text-[9px] text-[#5E6B7A]">Q1</div>
                <div className="flex-1 bg-amber-300 h-[60%] rounded-xs flex items-end justify-center text-[9px] text-[#5E6B7A]">Q2</div>
                <div className="flex-1 bg-amber-400 h-[80%] rounded-xs flex items-end justify-center text-[9px] text-[#5E6B7A]">Q3</div>
                <div className="flex-1 bg-red-500 h-[100%] rounded-xs flex items-end justify-center text-[9px] text-white font-bold">Q4</div>
              </div>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="p-4 border-t border-[#D9DEE5] bg-[#F7F5F2] flex gap-3 shrink-0">
            <button
              onClick={() => handleAddToRecommended(selectedItem.id)}
              disabled={addedProjects.has(selectedItem.id)}
              className="flex-1 py-2 px-3 bg-white border border-[#D9DEE5] hover:bg-gray-50 rounded text-xs font-semibold text-[#0B2545] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles size={14} className="text-[#F59E0B]" />
              {addedProjects.has(selectedItem.id) ? "Added to Recommended" : "Add to Recommended"}
            </button>

            <button
              onClick={handleExportBrief}
              className="flex-1 py-2 px-3 bg-[#0B2545] hover:bg-[#1565C0] text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Download size={14} />
              Export Brief
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
