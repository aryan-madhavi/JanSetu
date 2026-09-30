import { useState, useEffect } from "react";
import { fetchJson, downloadFile } from "../lib/api";
import { useApp } from "../context/AppContext";
import { 
  ChevronRight, Filter, Download, X, Search, CheckCircle, 
  ArrowUpDown, RefreshCw, AlertCircle, Sparkles, Quote
} from "lucide-react";

export default function Clusters() {
  const { district: globalDistrict, t } = useApp();
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
  }, [globalDistrict, selectedSector, sortBy, sortOrder]);

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
    downloadFile("/brief/export", `JanSetu_Priority_Brief_${selectedItem?.district || "National"}.md`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 border-b border-[#D9DEE5] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-200">
              Demo data
            </span>
            <span className="text-xs font-bold text-[#1565C0] uppercase tracking-wider">
              Algorithmic Allocation Model
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0B2545] font-sans mt-1">
            {t("priority_queue")}
          </h1>
          <p className="text-[#5E6B7A] text-sm mt-1">
            Demand × Deficit × Vulnerability × (1 - Fiscal Allocation Coverage) ranking across national districts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 text-[#5E6B7A]" size={14} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search district or sector..."
              className="pl-8 pr-3 py-1.5 border border-[#D9DEE5] rounded bg-white text-xs w-48 sm:w-60 focus:outline-none focus:border-[#1565C0]"
            />
          </div>
          <button 
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D9DEE5] rounded text-[#5E6B7A] hover:bg-[#F7F5F2] text-xs font-medium"
          >
            <Filter size={14} /> Filter Queue
          </button>
          <button 
            onClick={handleExportBrief}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2545] text-white rounded text-xs font-medium hover:bg-[#081d36]"
          >
            <Download size={14} /> Export Brief
          </button>
        </div>
      </div>

      {/* Filter Box */}
      {showFilterDrawer && (
        <div className="mb-6 p-4 bg-white border border-[#D9DEE5] rounded shadow-sm flex flex-wrap gap-4 items-center justify-between text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="font-bold text-[#5E6B7A] uppercase mr-2">Sector:</label>
              <select
                value={selectedSector}
                onChange={e => setSelectedSector(e.target.value)}
                className="bg-white border border-[#D9DEE5] rounded px-2 py-1"
              >
                <option value="all">All Sectors</option>
                <option value="water">Water</option>
                <option value="roads">Roads</option>
                <option value="electricity">Electricity</option>
                <option value="health">Health</option>
                <option value="education">Education</option>
                <option value="sanitation">Sanitation</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-[#5E6B7A] uppercase mr-2">Sort By:</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-white border border-[#D9DEE5] rounded px-2 py-1"
              >
                <option value="score">Priority Score</option>
                <option value="demand">Demand Intensity</option>
                <option value="deficit">Deficit Index</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-[#5E6B7A] uppercase mr-2">Order:</label>
              <button
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                className="px-2 py-1 border border-[#D9DEE5] rounded bg-white hover:bg-[#F7F5F2]"
              >
                {sortOrder.toUpperCase()} <ArrowUpDown size={12} className="inline ml-1" />
              </button>
            </div>
          </div>
          <button
            onClick={() => { setSelectedSector("all"); setSearch(""); setSortBy("score"); setSortOrder("desc"); }}
            className="text-[#1565C0] hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

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

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white border border-[#D9DEE5] rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F7F5F2] border-b border-[#D9DEE5] text-[#5E6B7A]">
                <tr>
                  <th className="px-4 py-3 font-semibold w-16">Rank</th>
                  <th className="px-4 py-3 font-semibold">District & Project Focus</th>
                  <th className="px-4 py-3 font-semibold">Sector</th>
                  <th className="px-4 py-3 font-semibold text-right">Demand Index</th>
                  <th className="px-4 py-3 font-semibold text-right">Deficit Index</th>
                  <th className="px-4 py-3 font-semibold text-right">Priority Score</th>
                  <th className="px-4 py-3 font-semibold text-center w-28">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5] text-[#162033]">
                {pagedItems.map((item, i) => {
                  const rank = (page - 1) * pageSize + i + 1;
                  return (
                    <tr 
                      key={item.id || i} 
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-[#F7F5F2] transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-bold text-[#0B2545]">
                        #{rank}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#0B2545]">
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
            {/* Factor Formula Section */}
            <div className="bg-[#F7F5F2] border border-[#D9DEE5] rounded p-4">
              <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider mb-3">
                Algorithmic Factor Decomposition
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#5E6B7A]">1. Citizen Demand Intensity</span>
                    <span className="font-bold text-[#0B2545]">{selectedItem.demand}</span>
                  </div>
                  <div className="w-full bg-[#D9DEE5] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#1565C0] h-full" 
                      style={{ width: `${Math.min(selectedItem.demand * 10, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#5E6B7A]">2. Infrastructure Deficit Index</span>
                    <span className="font-bold text-[#D32F2F]">{selectedItem.deficit}</span>
                  </div>
                  <div className="w-full bg-[#D9DEE5] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#D32F2F] h-full" 
                      style={{ width: `${Math.min(selectedItem.deficit * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#5E6B7A]">3. Socioeconomic Vulnerability (Rural+SC/ST)</span>
                    <span className="font-bold text-[#0B2545]">{selectedItem.vulnerability}</span>
                  </div>
                  <div className="w-full bg-[#D9DEE5] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#F59E0B] h-full" 
                      style={{ width: `${Math.min(selectedItem.vulnerability * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#5E6B7A]">4. Uncovered Fiscal Gap (1 - Allocation)</span>
                    <span className="font-bold text-[#2E7D32]">{(1 - selectedItem.allocation).toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-[#D9DEE5] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#2E7D32] h-full" 
                      style={{ width: `${Math.min((1 - selectedItem.allocation) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Scheme Match */}
            <div>
              <h3 className="text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-2">
                Eligible Centrally Sponsored Scheme
              </h3>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded flex items-start gap-2">
                <CheckCircle size={16} className="text-[#1565C0] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-xs text-[#0B2545]">{selectedItem.matching_scheme}</div>
                  <div className="text-[11px] text-[#5E6B7A] mt-0.5">
                    Pre-cleared funding channel under national fiscal deficit equalization rules.
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence Quotes */}
            <div>
              <h3 className="text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Quote size={14} className="text-[#1565C0]" />
                Verified Citizen Grievance Quotes
              </h3>
              <div className="space-y-2.5">
                {selectedItem.evidence_quotes && selectedItem.evidence_quotes.length > 0 ? (
                  selectedItem.evidence_quotes.map((q: any, qi: number) => (
                    <div key={qi} className="bg-[#F7F5F2] border border-[#D9DEE5] rounded p-3 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[#0B2545]">{q.location || selectedItem.district}</span>
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-semibold">
                          Severity: {q.severity}/5
                        </span>
                      </div>
                      <p className="text-[#162033] font-serif mb-1">
                        "{q.english || q.original}"
                      </p>
                      {q.original && q.original !== q.english && (
                        <p className="text-[11px] text-[#5E6B7A] italic">
                          Orig: {q.original}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-[#F7F5F2] border border-[#D9DEE5] rounded text-xs text-[#5E6B7A] text-center">
                    Multiple grievances aggregated for this sector/district index.
                  </div>
                )}
              </div>
            </div>

            {/* Sparkline Projection */}
            <div className="border-t border-[#D9DEE5] pt-4">
              <h3 className="text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-2">
                4-Quarter Demand Trajectory Without Intervention
              </h3>
              <div className="flex items-end justify-between h-16 bg-[#F7F5F2] border border-[#D9DEE5] rounded p-2 px-6">
                <div className="text-center">
                  <div className="text-[10px] text-[#5E6B7A]">Q1</div>
                  <div className="w-6 bg-[#1565C0] h-6 rounded-t mx-auto" />
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-[#5E6B7A]">Q2</div>
                  <div className="w-6 bg-[#1565C0] h-8 rounded-t mx-auto" />
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-[#5E6B7A]">Q3</div>
                  <div className="w-6 bg-[#F59E0B] h-10 rounded-t mx-auto" />
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-[#5E6B7A]">Q4</div>
                  <div className="w-6 bg-[#D32F2F] h-14 rounded-t mx-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 bg-[#F7F5F2] border-t border-[#D9DEE5] flex gap-2 shrink-0">
            <button
              onClick={() => handleAddToRecommended(selectedItem.id)}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded border transition-colors flex items-center justify-center gap-1.5 ${
                addedProjects.has(selectedItem.id)
                  ? "bg-green-100 text-[#2E7D32] border-green-300"
                  : "bg-white border-[#D9DEE5] text-[#0B2545] hover:bg-[#e8edf2]"
              }`}
            >
              {addedProjects.has(selectedItem.id) ? (
                <>
                  <CheckCircle size={14} /> Added to Recommended
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Add to Recommended
                </>
              )}
            </button>
            <button
              onClick={handleExportBrief}
              className="flex-1 py-2 px-3 bg-[#0B2545] text-white text-xs font-semibold rounded hover:bg-[#081d36] transition-colors flex items-center justify-center gap-1.5"
            >
              <Download size={14} /> Export Brief
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
