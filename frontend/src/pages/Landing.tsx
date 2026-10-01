import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MapPin, CheckCircle2, 
  Volume2, AlertCircle, RefreshCw, Smartphone, Image as ImageIcon, X
} from "lucide-react";
import { API_BASE_URL, fetchJson } from "../lib/api";
import { useApp } from "../context/AppContext";

export default function Landing() {
  const { district, language, dataSource, pollTick } = useApp();

  const [recordingState, setRecordingState] = useState<"idle" | "listening" | "processing" | "uploaded">("idle");
  const [duration, setDuration] = useState(0);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Timer
  useEffect(() => {
    let interval: any;
    if (recordingState === "listening") {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [recordingState]);

  // Load Recent Reports in selected District
  const loadRecentReports = () => {
    setLoadingReports(true);
    const params = new URLSearchParams();
    if (district && district !== "All") {
      params.append("district", district);
    }
    if (dataSource) {
      params.append("source", dataSource);
    }
    params.append("limit", "5");
    fetchJson<any[]>(`/requests?${params.toString()}`)
      .then(data => setRecentReports(data))
      .catch(console.error)
      .finally(() => setLoadingReports(false));
  };

  useEffect(() => {
    loadRecentReports();
  }, [district, dataSource, pollTick]);

  // GPS Fetch
  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        console.warn("Geolocation warning:", err);
        // Fallback default coordinates
        setLocation({ lat: 18.5204, lng: 73.8567 });
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Mic Button handler
  const handleMicClick = async () => {
    if (recordingState === "idle" || recordingState === "uploaded") {
      try {
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
          await submitForm(audioBlob);
        };
        
        mediaRecorder.start(250);
        setRecordingState("listening");
      } catch (err: any) {
        console.error("Mic error:", err);
        setError("Microphone access was denied or not available. You can also type your grievance below.");
      }
    } else if (recordingState === "listening") {
      try {
        mediaRecorderRef.current?.stop();
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
      } catch (e) {
        console.error(e);
      }
      setRecordingState("processing");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const submitForm = async (audioBlob?: Blob) => {
    setError(null);
    setRecordingState("processing");

    try {
      const formData = new FormData();
      if (text.trim()) formData.append("text", text);
      if (audioBlob) {
        const ext = audioBlob.type.includes("wav") ? "wav" : (audioBlob.type.includes("ogg") ? "ogg" : "webm");
        formData.append("audio", audioBlob, `voice_report.${ext}`);
      }
      if (image) formData.append("image", image);
      if (district && district !== "All") formData.append("district", district);
      if (language) formData.append("language_hint", language === "hi" ? "Hindi" : (language === "ta" ? "Tamil" : (language === "mr" ? "Marathi" : "English")));
      if (location) {
        formData.append("lat", location.lat.toString());
        formData.append("lng", location.lng.toString());
      }

      const res = await fetch(`${API_BASE_URL}/requests`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || errJson.error || "Failed to submit grievance.");
      }

      const data = await res.json();
      setResult(data);
      setRecordingState("uploaded");
      loadRecentReports();
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
      setRecordingState("idle");
    }
  };

  const resetForm = () => {
    setResult(null);
    setText("");
    setImage(null);
    setImagePreview(null);
    setRecordingState("idle");
    setError(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Top Banner */}
      <div className="bg-[#0B2545] text-white rounded p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#1565C0] text-white">
              AI-Powered Citizen Ingestion
            </span>
            <span className="text-xs text-white/70">10 Indian Languages Supported</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Report Civic Infrastructure Failures
          </h1>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">
            Record voice in your mother tongue, upload a photograph, or type. Gemini automatically extracts sector, severity, and coordinates into the national priority queue.
          </p>
        </div>
        <div className="z-10 flex gap-4 shrink-0">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded p-4 text-center">
            <div className="text-2xl font-bold text-[#F59E0B]">24/7</div>
            <div className="text-[11px] text-white/80 uppercase tracking-wider mt-1">Multi-Channel IVR</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded p-4 text-center">
            <div className="text-2xl font-bold text-[#2E7D32]">100%</div>
            <div className="text-[11px] text-white/80 uppercase tracking-wider mt-1">Direct Verification</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Voice & Text Input Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#D9DEE5] rounded shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#0B2545] mb-1">
              Submit Grievance
            </h2>
            <p className="text-xs text-[#5E6B7A] mb-6">
              Push to speak, type your complaint, or attach photographic proof.
            </p>

            {/* Error Notification */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => submitForm()}
                  className="px-2.5 py-1 bg-red-600 text-white rounded font-medium hover:bg-red-700 shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Result Extraction Card */}
            {result ? (
              <div className="bg-green-50 border border-green-200 rounded p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-[#2E7D32] font-bold text-sm">
                    <CheckCircle2 size={18} />
                    <span>Grievance Registered Successfully</span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white border border-green-300 rounded text-[#0B2545]">
                    {result.ticket_id}
                  </span>
                </div>

                {/* Localized confirmation message */}
                <div className="bg-white border border-green-200 rounded p-3 text-sm text-[#162033]">
                  <p className="font-medium">{result.reply_text}</p>
                </div>

                {/* Audio Player for TTS reply */}
                {result.tts_audio_base64 && (
                  <div className="bg-white border border-green-200 rounded p-3 flex items-center gap-3">
                    <Volume2 size={20} className="text-[#1565C0] shrink-0" />
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-[#5E6B7A] uppercase tracking-wider mb-1">
                        Cloud TTS Audio Confirmation
                      </div>
                      <audio controls className="w-full h-8" autoPlay>
                        <source src={`data:audio/mp3;base64,${result.tts_audio_base64}`} type="audio/mp3" />
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  </div>
                )}

                {/* Extraction metadata */}
                {result.extraction && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2">
                    <div className="bg-white p-2 rounded border border-green-200">
                      <div className="text-[10px] text-[#5E6B7A] uppercase font-semibold">Sector</div>
                      <div className="font-bold text-[#0B2545] capitalize">{result.extraction.sector}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-green-200">
                      <div className="text-[10px] text-[#5E6B7A] uppercase font-semibold">Severity</div>
                      <div className="font-bold text-[#D32F2F]">{result.extraction.severity}/5</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-green-200">
                      <div className="text-[10px] text-[#5E6B7A] uppercase font-semibold">Language</div>
                      <div className="font-bold text-[#0B2545]">{result.extraction.language}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-green-200">
                      <div className="text-[10px] text-[#5E6B7A] uppercase font-semibold">Assigned District</div>
                      <div className="font-bold text-[#0B2545]">{district === "All" ? "Pune" : district}</div>
                    </div>
                  </div>
                )}

                <button
                  onClick={resetForm}
                  className="w-full py-2 bg-[#0B2545] text-white text-xs font-semibold rounded hover:bg-[#081d36] transition-colors"
                >
                  Submit Another Grievance
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Voice Push to Talk Section */}
                <div className="bg-[#F7F5F2] border border-[#D9DEE5] rounded p-6 flex flex-col items-center justify-center text-center">
                  <button
                    type="button"
                    onClick={handleMicClick}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 ${
                      recordingState === "listening"
                        ? "bg-red-600 text-white animate-pulse"
                        : "bg-[#0B2545] text-white hover:bg-[#1565C0]"
                    }`}
                  >
                    <Mic size={32} />
                  </button>

                  <div className="mt-3">
                    <span className="text-sm font-bold text-[#0B2545]">
                      {recordingState === "listening" ? `Recording... (${duration}s) - Tap to Stop` : "Push to Speak"}
                    </span>
                    <p className="text-xs text-[#5E6B7A] mt-0.5">
                      {recordingState === "listening" 
                        ? "Speak in Hindi, Marathi, Tamil, or your native language."
                        : "Tap microphone, speak naturally, and tap again to submit."}
                    </p>
                  </div>
                </div>

                {/* Text Input */}
                <div>
                  <label className="block text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-2">
                    Or Type Grievance in Any Language
                  </label>
                  <textarea
                    rows={3}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="e.g. पानी की पाइपलाइन टूटने से पिछले तीन दिनों से पूरे गांव में पीने का पानी नहीं आ रहा है..."
                    className="w-full p-3 border border-[#D9DEE5] rounded text-sm focus:outline-none focus:border-[#1565C0] font-sans"
                  />
                </div>

                {/* Geolocation & Photo Upload Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Photo Upload */}
                  <div>
                    <label className="block text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">
                      Attach Photo Proof
                    </label>
                    <label className="border border-dashed border-[#D9DEE5] rounded p-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#F7F5F2] transition-colors text-xs text-[#5E6B7A]">
                      <ImageIcon size={16} className="text-[#1565C0]" />
                      <span>{image ? image.name : "Select Image file..."}</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    {imagePreview && (
                      <div className="mt-2 relative inline-block">
                        <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded border border-[#D9DEE5]" />
                        <button
                          type="button"
                          onClick={() => { setImage(null); setImagePreview(null); }}
                          className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Geolocation */}
                  <div>
                    <label className="block text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">
                      Location Tagging
                    </label>
                    <button
                      type="button"
                      onClick={handleFetchLocation}
                      disabled={locating}
                      className="w-full border border-[#D9DEE5] rounded p-3 flex items-center justify-center gap-2 bg-white hover:bg-[#F7F5F2] transition-colors text-xs text-[#0B2545] font-medium"
                    >
                      <MapPin size={16} className="text-[#1565C0]" />
                      <span>
                        {locating 
                          ? "Detecting Coordinates..." 
                          : location 
                            ? `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}` 
                            : "Fetch GPS Location"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={() => submitForm()}
                  disabled={recordingState === "processing" || (!text.trim() && !image)}
                  className="w-full py-2.5 bg-[#0B2545] text-white rounded font-medium text-sm hover:bg-[#081d36] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {recordingState === "processing" ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Processing with Gemini AI...
                    </>
                  ) : (
                    "Submit Report to National Queue"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Reports & Help */}
        <div className="space-y-6">
          {/* Recent Reports in District */}
          <div className="bg-white border border-[#D9DEE5] rounded shadow-sm p-5">
            <div className="flex justify-between items-center mb-4 border-b border-[#D9DEE5] pb-2">
              <h3 className="font-bold text-sm text-[#0B2545]">
                Recent Reports ({district === "All" ? "National" : district})
              </h3>
              <span className="text-[10px] text-[#5E6B7A] font-medium">Live Feed</span>
            </div>

            {loadingReports ? (
              <div className="p-4 text-center text-xs text-[#5E6B7A]">Loading recent reports...</div>
            ) : (
              <div className="space-y-3">
                {recentReports.slice(0, 4).map((r, i) => (
                  <div key={r.id || i} className="p-2.5 bg-[#F7F5F2] border border-[#D9DEE5] rounded text-xs">
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <span className="font-mono font-bold text-[#0B2545] text-[11px]">{r.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        r.severity >= 4 ? "bg-red-100 text-red-700" : "bg-blue-100 text-[#1565C0]"
                      }`}>
                        Severity {r.severity}/5
                      </span>
                    </div>
                    <p className="text-[#162033] line-clamp-2">{r.english_summary || r.transcript_original}</p>
                    <div className="mt-1.5 text-[10px] text-[#5E6B7A] flex justify-between">
                      <span className="capitalize">{r.sector} • {r.district || "Pune"}</span>
                      <span>{r.timestamp ? r.timestamp.substring(0, 10) : "Today"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alternate Ingestion Channels Help Box */}
          <div className="bg-white border border-[#D9DEE5] rounded shadow-sm p-5 text-xs text-[#5E6B7A] space-y-3">
            <div className="font-bold text-sm text-[#0B2545] flex items-center gap-1.5">
              <Smartphone size={16} className="text-[#1565C0]" />
              Other Ways to Report
            </div>
            <p>
              Citizens without smartphones or internet can access JanSetu via automated bots and voice bridges:
            </p>
            <div className="space-y-2 pt-1 font-medium text-[#162033]">
              <div className="p-2 bg-[#F7F5F2] rounded border border-[#D9DEE5]">
                • <span className="font-semibold text-[#1565C0]">Telegram Bot:</span> @jansetu_gdg_bot
              </div>
              <div className="p-2 bg-[#F7F5F2] rounded border border-[#D9DEE5]">
                • <span className="font-semibold text-[#2E7D32]">WhatsApp Sandbox:</span> Send "join" to +1 415 523 8886
              </div>
              <div className="p-2 bg-[#F7F5F2] rounded border border-[#D9DEE5]">
                • <span className="font-semibold text-[#F59E0B]">Toll-Free IVR:</span> 1800-JAN-SETU
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
