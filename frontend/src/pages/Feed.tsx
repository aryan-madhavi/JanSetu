import { useState, useEffect } from "react";
import { fetchJson, exportCsv } from "../lib/api";
import { useApp } from "../context/AppContext";
import { 
  Clock, MapPin, Smartphone, Search, Filter, Download, 
  RefreshCw, AlertCircle, CheckCircle2, X
} from "lucide-react";

export default function Feed() {
  const { district: globalDistrict, t, dataSource, pollTick } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [minSeverity, setMinSeverity] = useState(0);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Selected item modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [assignedItems, setAssignedItems] = useState<Set<string>>(new Set());

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
    if (minSeverity > 0) {
      params.append("severity", minSeverity.toString());
    }
    if (search.trim()) {
      params.append("search", search.trim());
    }
    if (dataSource) {
      params.append("source", dataSource);
    }
    params.append("limit", "100");

    fetchJson<any[]>(`/requests?${params.toString()}`)
      .then(data => setItems(data))
      .catch(err => setError(err.message || "Failed to load live reports"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [globalDistrict, selectedSector, minSeverity, dataSource, pollTick]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleExport = () => {
    if (items.length === 0) return;
    const headers = ["Ticket ID", "Timestamp", "District", "Sector", "Severity", "English Summary", "Original Transcript", "Channel"];
    const rows = items.map(r => [
      r.id, r.timestamp, r.district, r.sector, r.severity, r.english_summary, r.transcript_original, r.channel
    ]);
    exportCsv(headers, rows, `JanSetu_Live_Feed_${globalDistrict}.csv`);
  };

  const handleAssign = (id: string) => {
    setAssignedItems(prev => new Set(prev).add(id));
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F5F2]">
      {/* Header */}
      <div className="bg-white border-b border-[#D9DEE5] px-4 py-3 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-200">
              Demo data
            </span>
            <span className="text-xs font-bold text-[#1565C0] uppercase tracking-wider">
              {globalDistrict === "All" ? t("all_districts") : `${t("district_label")}: ${globalDistrict}`}
            </span>
          </div>
          <h1 className="text-lg font-bold text-[#0B2545] font-sans">
            {t("live_reports")}
          </h1>
          <p className="text-[#5E6B7A] text-xs">
            Real-time infrastructure grievance ingestion stream across citizen channels.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 text-sm">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-2.5 top-2 text-[#5E6B7A]" size={14} />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("search_placeholder")} 
              className="pl-8 pr-3 py-1.5 border border-[#D9DEE5] rounded bg-white w-48 md:w-64 focus:outline-none focus:border-[#1565C0] text-xs" 
            />
          </form>
          <button 
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D9DEE5] rounded text-[#5E6B7A] hover:bg-[#F7F5F2] font-medium text-xs"
          >
            <Filter size={14} /> {t("filter")}
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D9DEE5] rounded text-[#5E6B7A] hover:bg-[#F7F5F2] font-medium text-xs"
          >
            <Download size={14} /> {t("export_csv")}
          </button>
        </div>
      </div>

      {/* Filter Options Bar */}
      {showFilterDrawer && (
        <div className="p-4 bg-white border-b border-[#D9DEE5] flex flex-wrap gap-4 items-center justify-between text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="font-bold text-[#5E6B7A] uppercase mr-2">Sector:</span>
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
              </select>
            </div>
            <div>
              <span className="font-bold text-[#5E6B7A] uppercase mr-2">Min Severity:</span>
              <select
                value={minSeverity}
                onChange={e => setMinSeverity(Number(e.target.value))}
                className="bg-white border border-[#D9DEE5] rounded px-2 py-1"
              >
                <option value={0}>All Severities</option>
                <option value={3}>3+ (Medium to Critical)</option>
                <option value={4}>4+ (High to Critical)</option>
                <option value={5}>5 (Critical Only)</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => { setSelectedSector("all"); setMinSeverity(0); setSearch(""); }}
            className="text-[#1565C0] hover:underline"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
        {loading && (
          <div className="p-12 text-center text-[#5E6B7A]">
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
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="p-12 text-center text-[#5E6B7A] bg-white border border-[#D9DEE5] rounded">
                No reports matched the specified filters.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-white border border-[#D9DEE5] rounded flex flex-col md:flex-row hover:border-[#1565C0] transition-colors">
                  {/* Left Column: Metadata */}
                  <div className="bg-[#F7F5F2] md:w-48 p-4 border-b md:border-b-0 md:border-r border-[#D9DEE5] shrink-0 flex flex-row md:flex-col justify-between md:justify-start gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#0B2545] mb-1 font-mono">{item.id}</div>
                      <div className="text-[11px] text-[#5E6B7A] flex items-center gap-1">
                        <Clock size={12} /> {item.timestamp ? item.timestamp.substring(0, 16).replace("T", " ") : "Just now"}
                      </div>
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        item.severity >= 4 ? "bg-red-100 text-red-700 border border-red-200" :
                        item.severity === 3 ? "bg-[#F59E0B]/20 text-[#0B2545] border border-[#F59E0B]/30" : "bg-blue-100 text-[#1565C0] border border-blue-200"
                      }`}>
                        Severity {item.severity}/5
                      </span>
                      <div className="text-xs font-semibold text-[#162033] mt-2 capitalize">{item.sector}</div>
                      <div className="text-[11px] text-[#5E6B7A] mt-0.5">{item.district}</div>
                    </div>
                  </div>
                  
                  {/* Right Column: Content */}
                  <div className="p-4 flex-1">
                    <h3 className="text-sm font-semibold text-[#162033] mb-2">{item.english_summary}</h3>
                    {item.transcript_original && item.transcript_original !== item.english_summary && (
                      <div className="bg-[#F7F5F2] border border-[#D9DEE5] rounded p-2.5 mb-4">
                        <p className="text-xs text-[#5E6B7A] mb-1 font-semibold uppercase tracking-wider">
                          Original Transcript ({item.language || "Regional"})
                        </p>
                        <p className="text-sm text-[#162033] font-serif">{item.transcript_original}</p>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#5E6B7A]">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-[#1565C0]" />
                        <span className="font-medium">Coordinates:</span>{" "}
                        {item.lat ? item.lat.toFixed(4) : "18.5204"}, {item.lng ? item.lng.toFixed(4) : "73.8567"}
                      </div>
                      <div className="w-px h-3 bg-[#D9DEE5]"></div>
                      <div className="flex items-center gap-1">
                        <Smartphone size={14} className="text-[#1565C0]" />
                        <span className="font-medium">Channel:</span> {item.channel || "PWA"}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Column */}
                  <div className="p-4 border-t md:border-t-0 md:border-l border-[#D9DEE5] flex md:flex-col justify-end md:justify-center gap-2 shrink-0 md:w-36 bg-[#F7F5F2] md:bg-white">
                    <button 
                      onClick={() => setSelectedItem(item)}
                      className="w-full px-3 py-1.5 bg-white md:bg-[#F7F5F2] border border-[#D9DEE5] text-xs font-medium rounded text-[#0B2545] hover:bg-[#e8edf2]"
                    >
                      {t("view_details")}
                    </button>
                    <button 
                      onClick={() => handleAssign(item.id)}
                      className={`w-full px-3 py-1.5 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors ${
                        assignedItems.has(item.id)
                          ? "bg-green-100 text-[#2E7D32] border border-green-300 font-semibold"
                          : "bg-[#0B2545] text-white hover:bg-[#081d36]"
                      }`}
                    >
                      {assignedItems.has(item.id) ? (
                        <>
                          <CheckCircle2 size={12} /> Assigned
                        </>
                      ) : (
                        "Assign Task"
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-[#0B2545]/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#D9DEE5] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-[#D9DEE5] pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#1565C0]">{selectedItem.id}</span>
                <h3 className="text-base font-bold text-[#0B2545]">Grievance Investigation</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-[#5E6B7A] hover:text-[#0B2545]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-[#5E6B7A] uppercase">Summary:</span>
                <p className="text-sm text-[#162033] mt-1">{selectedItem.english_summary}</p>
              </div>

              {selectedItem.transcript_original && (
                <div className="bg-[#F7F5F2] p-3 rounded border border-[#D9DEE5]">
                  <span className="font-semibold text-[#5E6B7A] uppercase">Original Submission ({selectedItem.language}):</span>
                  <p className="text-xs text-[#162033] mt-1 font-serif">{selectedItem.transcript_original}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-[#F7F5F2] p-2 rounded">
                  <span className="text-[#5E6B7A]">District:</span>{" "}
                  <span className="font-bold text-[#0B2545]">{selectedItem.district}</span>
                </div>
                <div className="bg-[#F7F5F2] p-2 rounded">
                  <span className="text-[#5E6B7A]">Sector:</span>{" "}
                  <span className="font-bold text-[#0B2545] capitalize">{selectedItem.sector}</span>
                </div>
                <div className="bg-[#F7F5F2] p-2 rounded">
                  <span className="text-[#5E6B7A]">Severity:</span>{" "}
                  <span className="font-bold text-red-700">{selectedItem.severity}/5</span>
                </div>
                <div className="bg-[#F7F5F2] p-2 rounded">
                  <span className="text-[#5E6B7A]">Channel:</span>{" "}
                  <span className="font-bold text-[#0B2545]">{selectedItem.channel || "PWA"}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[#D9DEE5] pt-3 flex justify-end gap-2">
              <button 
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 border border-[#D9DEE5] rounded text-xs font-medium text-[#5E6B7A] hover:bg-[#F7F5F2]"
              >
                Close
              </button>
              <button 
                onClick={() => { handleAssign(selectedItem.id); setSelectedItem(null); }}
                className="px-4 py-1.5 bg-[#0B2545] text-white rounded text-xs font-medium hover:bg-[#081d36]"
              >
                Dispatch Field Officer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
