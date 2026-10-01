import { useState, useEffect } from "react";
import { fetchJson, downloadFile } from "../lib/api";
import { Activity, Download, ArrowUpRight, TrendingUp, CheckCircle, RefreshCw } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Impact() {
  const { t, dataSource, pollTick } = useApp();
  const [data, setData] = useState<any>(null);
  const [initiative, setInitiative] = useState("Jal Jeevan Mission");
  const [loading, setLoading] = useState(true);

  const loadData = (init: string) => {
    setLoading(true);
    fetchJson<any>(`/impact?initiative=${encodeURIComponent(init)}${dataSource ? `&source=${dataSource}` : ""}`)
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData(initiative);
  }, [initiative, dataSource, pollTick]);

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
            <span className="text-xs font-bold text-[#2E7D32] uppercase tracking-wider flex items-center gap-1">
              <TrendingUp size={14} /> Outcome Verification Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0B2545] font-sans mt-1">
            {t("impact_tracker")}
          </h1>
          <p className="text-[#5E6B7A] text-sm mt-1">
            Quantitative correlation between fiscal expenditure allocations and verified citizen grievance reduction.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={initiative}
            onChange={e => setInitiative(e.target.value)}
            className="bg-white border border-[#D9DEE5] rounded text-sm px-3 py-1.5 text-[#0B2545] focus:outline-none focus:border-[#1565C0]"
          >
            <option value="Jal Jeevan Mission">Jal Jeevan Mission (Water)</option>
            <option value="PMGSY">PMGSY (Rural Roads)</option>
            <option value="DDUGJY">DDUGJY (Electrification)</option>
          </select>
          <button
            onClick={() => downloadFile("/brief/export", "JanSetu_Impact_Audit.md")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2545] text-white rounded text-sm font-medium hover:bg-[#081d36]"
          >
            <Download size={14} /> Export Audit
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-[#5E6B7A]">
          <RefreshCw size={32} className="mx-auto mb-2 animate-spin text-[#1565C0]" />
          <p className="text-sm">{t("loading")}</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-[#D9DEE5] rounded p-5 shadow-sm">
              <div className="text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">Demand Reduction</div>
              <div className="text-2xl font-bold text-[#2E7D32] flex items-center gap-1">
                +{data.metrics?.demand_reduction_pct}%
                <ArrowUpRight size={18} />
              </div>
              <p className="text-xs text-[#5E6B7A] mt-2">Reduction in unaddressed grievances</p>
            </div>
            <div className="bg-white border border-[#D9DEE5] rounded p-5 shadow-sm">
              <div className="text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">Coverage Increase</div>
              <div className="text-2xl font-bold text-[#1565C0] flex items-center gap-1">
                +{data.metrics?.coverage_increase_pct}%
              </div>
              <p className="text-xs text-[#5E6B7A] mt-2">Piped infrastructure expansion</p>
            </div>
            <div className="bg-white border border-[#D9DEE5] rounded p-5 shadow-sm">
              <div className="text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">Citizens Reached</div>
              <div className="text-2xl font-bold text-[#0B2545]">
                {data.metrics?.affected_population_reached?.toLocaleString()}
              </div>
              <p className="text-xs text-[#5E6B7A] mt-2">Verified population impact</p>
            </div>
            <div className="bg-white border border-[#D9DEE5] rounded p-5 shadow-sm">
              <div className="text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">Deficits Mitigated</div>
              <div className="text-2xl font-bold text-[#F59E0B]">
                {data.metrics?.active_deficits_resolved}
              </div>
              <p className="text-xs text-[#5E6B7A] mt-2">Wards restored to standard index</p>
            </div>
          </div>

          {/* Timeline Table */}
          <div className="bg-white border border-[#D9DEE5] rounded shadow-sm overflow-hidden mb-6">
            <div className="bg-[#F7F5F2] px-4 py-3 border-b border-[#D9DEE5] flex justify-between items-center">
              <h2 className="text-[15px] font-semibold text-[#0B2545] flex items-center gap-2">
                <Activity size={16} className="text-[#1565C0]" />
                Expenditure vs. Citizen Demand Trajectory ({data.target_district})
              </h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F5F2] border-b border-[#D9DEE5] text-[#5E6B7A]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Timeline Period</th>
                  <th className="px-4 py-3 font-semibold text-right">Projected Demand</th>
                  <th className="px-4 py-3 font-semibold text-right">Actual Complaints</th>
                  <th className="px-4 py-3 font-semibold text-right">Expenditure (₹ Cr)</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5] text-[#162033]">
                {data.timeline?.map((t: any, i: number) => (
                  <tr key={i} className="hover:bg-[#F7F5F2]">
                    <td className="px-4 py-3 font-medium text-[#0B2545]">{t.period}</td>
                    <td className="px-4 py-3 text-right">{t.projected_demand}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#1565C0]">{t.actual_demand}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">₹{t.expenditure_cr} Cr</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-[#2E7D32]">
                        <CheckCircle size={12} /> Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
