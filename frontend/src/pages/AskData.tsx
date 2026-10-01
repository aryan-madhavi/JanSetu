import React, { useState } from "react";
import { fetchJson, exportCsv } from "../lib/api";
import { useApp } from "../context/AppContext";
import { Search, Database, Download, Terminal, RefreshCw, AlertCircle, Sparkles } from "lucide-react";

export default function AskData() {
  const { t, dataSource } = useApp();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results from /api/chat
  const [answer, setAnswer] = useState<string | null>(null);
  const [sql, setSql] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);

  const executeQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setLoading(true);
    setError(null);
    setQuery(queryText);

    try {
      const res = await fetchJson<{
        answer: string;
        sql?: string;
        columns?: string[];
        rows?: any[][];
      }>("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: queryText, source: dataSource })
      });

      setAnswer(res.answer);
      setSql(res.sql || null);
      setColumns(res.columns || []);
      setRows(res.rows || []);
    } catch (err: any) {
      setError(err.message || "Failed to execute query.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeQuery(query);
  };

  const handleExportData = () => {
    if (columns.length === 0 || rows.length === 0) return;
    exportCsv(columns, rows, "JanSetu_Query_Export.csv");
  };

  const suggestedQueries = [
    "Which districts have the highest number of water problems?",
    "Show top 5 infrastructure deficit areas",
    "Count of citizen requests grouped by sector",
    "List critical severity grievances in Pune"
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="border-b border-[#D9DEE5] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-200">
            Demo data
          </span>
          <span className="text-xs font-bold text-[#1565C0] uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={14} /> Gemini 2.5 Function Calling
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0B2545] font-sans">
          {t("data_query")}
        </h1>
        <p className="text-[#5E6B7A] text-sm mt-1">
          Ask questions in plain English or regional languages. Gemini translates to parse-checked SQLite queries over the national database.
        </p>
      </div>

      {/* Query Input Card */}
      <div className="bg-white border border-[#D9DEE5] rounded p-5 shadow-sm shrink-0">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-2 block">
              Natural Language Question
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-[#5E6B7A]" size={16} />
              <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Which districts have the highest number of water problems?"
                className="w-full border border-[#D9DEE5] rounded py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#1565C0]"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading || !query.trim()}
            className="w-full sm:w-auto px-6 py-2 bg-[#0B2545] text-white rounded text-sm font-medium hover:bg-[#081d36] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : null}
            Execute Query
          </button>
        </form>

        {/* Suggested Queries */}
        <div className="mt-4 pt-3 border-t border-[#D9DEE5] flex flex-wrap items-center gap-2 text-xs text-[#5E6B7A]">
          <span className="font-semibold uppercase tracking-wider text-[#0B2545]">Suggested:</span>
          {suggestedQueries.map((sq, i) => (
            <button 
              key={i}
              type="button"
              onClick={() => executeQuery(sq)}
              className="px-2.5 py-1 bg-[#F7F5F2] hover:bg-[#e8edf2] text-[#1565C0] rounded border border-[#D9DEE5] transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-12 text-center text-[#5E6B7A] bg-white border border-[#D9DEE5] rounded">
          <RefreshCw size={32} className="mx-auto mb-2 animate-spin text-[#1565C0]" />
          <p className="text-sm font-medium text-[#0B2545]">Executing query via Gemini Function Calling...</p>
          <p className="text-xs text-[#5E6B7A] mt-1">Analyzing database schema and synthesizing SQL...</p>
        </div>
      )}

      {/* Results View */}
      {!loading && answer && (
        <div className="space-y-6 flex-1">
          {/* Answer Card */}
          <div className="bg-white border border-[#D9DEE5] rounded shadow-sm p-5">
            <h3 className="text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#1565C0]" />
              AI Synthesized Findings
            </h3>
            <p className="text-sm text-[#162033] leading-relaxed whitespace-pre-line font-medium">
              {answer}
            </p>
          </div>

          {/* Generated SQL Box */}
          {sql && (
            <div className="bg-[#0B2545] text-white rounded p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-[#F59E0B] flex items-center gap-1.5 font-bold">
                  <Terminal size={14} />
                  Executed Read-Only SQL Tool:
                </span>
                <span className="text-[10px] text-white/70 font-mono">SQLite (LIMIT 200)</span>
              </div>
              <pre className="font-mono text-xs text-green-300 overflow-x-auto p-2 bg-black/30 rounded border border-white/10">
                {sql}
              </pre>
            </div>
          )}

          {/* Dynamic SQL Result Table */}
          {columns.length > 0 && rows.length > 0 && (
            <div className="bg-white border border-[#D9DEE5] rounded shadow-sm flex flex-col overflow-hidden">
              <div className="bg-[#F7F5F2] px-4 py-3 border-b border-[#D9DEE5] flex justify-between items-center">
                <div className="text-xs font-bold text-[#0B2545] flex items-center gap-2">
                  <Database size={14} className="text-[#1565C0]" />
                  Query Results ({rows.length} rows returned)
                </div>
                <button 
                  onClick={handleExportData}
                  className="flex items-center gap-1 text-xs font-medium text-[#0B2545] border border-[#D9DEE5] bg-white px-2.5 py-1 rounded hover:bg-[#F7F5F2]"
                >
                  <Download size={12} /> Export CSV
                </button>
              </div>

              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#F7F5F2] border-b border-[#D9DEE5] text-[#5E6B7A] sticky top-0">
                    <tr>
                      {columns.map((col, idx) => (
                        <th key={idx} className="px-4 py-2.5 font-semibold capitalize">
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9DEE5] text-[#162033]">
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#F7F5F2]">
                        {row.map((cell: any, cIdx: number) => (
                          <td key={cIdx} className="px-4 py-2.5 font-medium">
                            {cell !== null && cell !== undefined ? String(cell) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
