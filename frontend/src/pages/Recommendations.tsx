import { useState, useEffect } from "react";
import { fetchJson, downloadFile } from "../lib/api";
import { Sparkles, Download, CheckCircle, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Recommendations() {
  const { t, dataSource, pollTick } = useApp();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchJson<any[]>(`/recommendations${dataSource ? `?source=${dataSource}` : ""}`)
      .then(data => setRecommendations(data))
      .catch(err => setError(err.message || "Failed to load policy recommendations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [dataSource, pollTick]);

  const handleExport = () => {
    downloadFile("/brief/export", "JanSetu_Policy_Recommendations.md");
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 border-b border-[#D9DEE5] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
              dataSource === "live" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-blue-100 text-blue-800 border border-blue-200"
            }`}>
              {dataSource === "live" ? "Live data" : "Live + Demo data"}
            </span>
            <span className="text-xs font-bold text-[#1565C0] uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={14} /> AI-Synthesized Policy Directives
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0B2545] font-sans mt-1">
            {t("recommended_projects")}
          </h1>
          <p className="text-[#5E6B7A] text-sm mt-1">
            Gemini-generated strategic interventions synthesized from top deficit scores and verified citizen demand.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D9DEE5] rounded text-[#5E6B7A] hover:bg-[#F7F5F2] text-sm font-medium"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2545] text-white rounded text-sm font-medium hover:bg-[#081d36]"
          >
            <Download size={14} /> Export Brief
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-[#5E6B7A]">
          <RefreshCw size={32} className="mx-auto mb-2 animate-spin text-[#1565C0]" />
          <p className="text-sm">{t("loading")}</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded text-center my-4">
          <AlertCircle size={32} className="mx-auto text-red-600 mb-2" />
          <p className="text-sm text-red-700 mb-3">{error}</p>
          <button onClick={loadData} className="px-4 py-1.5 bg-[#0B2545] text-white text-xs font-medium rounded">
            {t("retry")}
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec, i) => (
            <div key={rec.id || i} className="bg-white border border-[#D9DEE5] rounded shadow-sm flex flex-col justify-between p-6">
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded uppercase tracking-wider ${
                    rec.priority === "Critical" ? "bg-red-100 text-red-700 border border-red-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    {rec.priority || "High Priority"}
                  </span>
                  <span className="text-xs font-mono font-medium text-[#5E6B7A]">
                    {rec.district} • {rec.sector?.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#0B2545] mb-2">{rec.title}</h3>
                <p className="text-xs text-[#5E6B7A] leading-relaxed mb-4">{rec.description}</p>
              </div>

              <div className="border-t border-[#D9DEE5] pt-4 mt-2">
                <div className="text-[11px] text-[#5E6B7A] mb-1 font-semibold uppercase tracking-wider">
                  Target Scheme
                </div>
                <div className="text-xs font-medium text-[#1565C0] mb-3">
                  {rec.matching_scheme || "National Infrastructure Pipeline"}
                </div>
                <div className="bg-[#F7F5F2] border border-[#D9DEE5] rounded p-2.5 mb-4 text-xs text-[#162033] flex items-start gap-2">
                  <CheckCircle size={14} className="text-[#2E7D32] shrink-0 mt-0.5" />
                  <span>{rec.estimated_impact || "Projected coverage enhancement across priority wards."}</span>
                </div>
                <button
                  onClick={handleExport}
                  className="w-full py-1.5 px-3 bg-white border border-[#D9DEE5] text-[#0B2545] hover:bg-[#F7F5F2] rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  Review Policy Brief <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
