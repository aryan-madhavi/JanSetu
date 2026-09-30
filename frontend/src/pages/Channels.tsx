import { useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { useApp } from "../context/AppContext";
import { Smartphone, Radio, Send, CheckCircle2, ExternalLink, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

export default function Channels() {
  const { t } = useApp();
  const [simChannel, setSimChannel] = useState<"WhatsApp" | "Telegram" | "IVR">("WhatsApp");
  const [simMessage, setSimMessage] = useState("Severe water pipeline breakdown near market square. Need immediate tanker.");
  const [simDistrict, setSimDistrict] = useState("Pune");
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim()) return;
    setSimulating(true);
    setError(null);
    setSimResult(null);

    try {
      if (simChannel === "WhatsApp") {
        const formData = new URLSearchParams();
        formData.append("Body", simMessage);
        formData.append("From", "whatsapp:+919876543210");
        
        const res = await fetch(`${API_BASE_URL}/webhooks/twilio`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString()
        });
        const text = await res.text();
        setSimResult({ channel: "WhatsApp", response: text, status: "Delivered to JanSetu Ingestion Pipeline" });
      } else {
        // PWA / Telegram
        const formData = new FormData();
        formData.append("text", simMessage);
        formData.append("channel", simChannel);
        formData.append("district", simDistrict);

        const res = await fetch(`${API_BASE_URL}/requests`, {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        setSimResult({ channel: simChannel, ticket_id: data.ticket_id, response: data.reply_text, status: "Verified & Seeded in SQLite DB" });
      }
    } catch (err: any) {
      setError(err.message || "Simulation failed.");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-[#D9DEE5] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-200">
            Demo data
          </span>
          <span className="text-xs font-bold text-[#1565C0] uppercase tracking-wider">
            Multi-Modal Ingestion Hub
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0B2545] font-sans">
          {t("input_channels")}
        </h1>
        <p className="text-[#5E6B7A] text-sm mt-1">
          Configure and test real physical and digital endpoints for universal citizen grievance reporting.
        </p>
      </div>

      {/* Gateway Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Telegram Bot */}
        <div className="bg-white border border-[#D9DEE5] rounded p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-blue-50 text-[#1565C0] rounded">
                <Send size={24} />
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-green-100 text-[#2E7D32]">
                Active Webhook
              </span>
            </div>
            <h3 className="font-bold text-[#0B2545] text-base mb-1">Telegram Citizen Bot</h3>
            <p className="text-xs text-[#5E6B7A] mb-3">
              Direct conversational ingestion bot supporting voice notes, photos, and live location sharing.
            </p>
            <div className="bg-[#F7F5F2] border border-[#D9DEE5] rounded p-2.5 text-xs text-[#0B2545] font-mono mb-4">
              @jansetu_gdg_bot
            </div>
          </div>
          <a
            href="https://t.me/jansetu_gdg_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 bg-white border border-[#1565C0] text-[#1565C0] hover:bg-blue-50 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            Launch in Telegram <ExternalLink size={14} />
          </a>
        </div>

        {/* WhatsApp Sandbox */}
        <div className="bg-white border border-[#D9DEE5] rounded p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-green-50 text-[#2E7D32] rounded">
                <Smartphone size={24} />
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-green-100 text-[#2E7D32]">
                Twilio Sandbox
              </span>
            </div>
            <h3 className="font-bold text-[#0B2545] text-base mb-1">WhatsApp Business Bridge</h3>
            <p className="text-xs text-[#5E6B7A] mb-3">
              Twilio API bridge. Send keyword to join sandbox, then text or send voice complaints.
            </p>
            <div className="bg-[#F7F5F2] border border-[#D9DEE5] rounded p-2.5 text-xs text-[#162033] mb-4 space-y-1">
              <div><span className="font-semibold text-[#5E6B7A]">Number:</span> +1 415 523 8886</div>
              <div><span className="font-semibold text-[#5E6B7A]">Join Text:</span> join [sandbox-code]</div>
            </div>
          </div>
          <div className="text-[11px] text-[#5E6B7A] text-center font-medium bg-[#F7F5F2] py-2 rounded">
            Integrated via Cloud Run /webhooks/whatsapp
          </div>
        </div>

        {/* IVR Voice Gateway */}
        <div className="bg-white border border-[#D9DEE5] rounded p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-amber-50 text-[#F59E0B] rounded">
                <Radio size={24} />
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-green-100 text-[#2E7D32]">
                Operational
              </span>
            </div>
            <h3 className="font-bold text-[#0B2545] text-base mb-1">Interactive Voice Response (IVR)</h3>
            <p className="text-xs text-[#5E6B7A] mb-3">
              Toll-free telephony bridge converting citizen voice recordings into structured text via Gemini.
            </p>
            <div className="bg-[#F7F5F2] border border-[#D9DEE5] rounded p-2.5 text-xs text-[#0B2545] font-mono mb-4">
              Toll-Free: 1800-JAN-SETU
            </div>
          </div>
          <div className="text-[11px] text-[#5E6B7A] text-center font-medium bg-[#F7F5F2] py-2 rounded">
            Synthesizes speech in 10 Indian Languages
          </div>
        </div>
      </div>

      {/* Real Pipeline Channel Simulator */}
      <div className="bg-white border border-[#D9DEE5] rounded p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-[#1565C0]" />
          <h2 className="text-base font-bold text-[#0B2545]">
            Interactive Channel Ingestion Simulator
          </h2>
        </div>
        <p className="text-xs text-[#5E6B7A] mb-6">
          Test real webhook ingestion by dispatching simulated citizen reports directly into the live JanSetu backend.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSimulate} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">
                Select Channel
              </label>
              <select
                value={simChannel}
                onChange={e => setSimChannel(e.target.value as any)}
                className="w-full p-2 border border-[#D9DEE5] rounded bg-white text-xs focus:outline-none focus:border-[#1565C0]"
              >
                <option value="WhatsApp">WhatsApp (POST /api/webhooks/twilio)</option>
                <option value="Telegram">Telegram (POST /api/requests channel=Telegram)</option>
                <option value="IVR">IVR Telephony (POST /api/requests channel=IVR)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">
                Target District
              </label>
              <select
                value={simDistrict}
                onChange={e => setSimDistrict(e.target.value)}
                className="w-full p-2 border border-[#D9DEE5] rounded bg-white text-xs focus:outline-none focus:border-[#1565C0]"
              >
                <option value="Pune">Pune</option>
                <option value="Latur">Latur</option>
                <option value="Patna">Patna</option>
                <option value="Bastar">Bastar</option>
                <option value="Dhubri">Dhubri</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">
              Simulated Citizen Message
            </label>
            <textarea
              rows={3}
              value={simMessage}
              onChange={e => setSimMessage(e.target.value)}
              className="w-full p-2.5 border border-[#D9DEE5] rounded text-xs focus:outline-none focus:border-[#1565C0]"
            />
          </div>

          <button
            type="submit"
            disabled={simulating}
            className="px-6 py-2 bg-[#0B2545] text-white rounded text-xs font-semibold hover:bg-[#081d36] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {simulating ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            {simulating ? "Transmitting to Pipeline..." : "Dispatch Simulated Report"}
          </button>
        </form>

        {simResult && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded text-xs space-y-2">
            <div className="flex items-center gap-2 text-[#2E7D32] font-bold">
              <CheckCircle2 size={16} />
              <span>{simResult.status}</span>
            </div>
            {simResult.ticket_id && (
              <div className="font-mono text-[#0B2545]">
                <span className="font-semibold">Generated Ticket ID:</span> {simResult.ticket_id}
              </div>
            )}
            <div>
              <span className="font-semibold text-[#5E6B7A]">Pipeline Response:</span>
              <pre className="mt-1 p-2 bg-white border border-green-200 rounded font-mono text-[11px] text-[#162033] overflow-x-auto">
                {simResult.response}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
