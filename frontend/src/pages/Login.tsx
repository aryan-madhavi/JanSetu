import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { fetchJson } from "../lib/api";
import { Shield, User, Lock, Phone, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setDistrict, districts } = useApp();

  const [mode, setMode] = useState<"policymaker" | "citizen" | "signup">("policymaker");
  const [email, setEmail] = useState("policymaker@jansetu.demo");
  const [password, setPassword] = useState("demo1234");
  const [phone, setPhone] = useState("9876543210");
  const [name, setName] = useState("Ramesh Kumar");
  const [selectedDistrict, setSelectedDistrict] = useState("Pune");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fillPolicymakerDemo = () => {
    setMode("policymaker");
    setEmail("policymaker@jansetu.demo");
    setPassword("demo1234");
    setError(null);
  };

  const fillCitizenDemo = () => {
    setMode("citizen");
    setName("Ramesh Kumar");
    setPhone("9876543210");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "policymaker") {
        const res = await fetchJson<{ user: any; token: string }>("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role: "policymaker" })
        });
        setUser(res.user);
        navigate("/overview");
      } else if (mode === "citizen") {
        const res = await fetchJson<{ user: any; token: string }>("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, name, role: "citizen" })
        });
        setUser(res.user);
        navigate("/");
      } else {
        // Signup
        const res = await fetchJson<{ user: any; token: string }>("/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, role: "citizen" })
        });
        setUser(res.user);
        if (selectedDistrict) setDistrict(selectedDistrict);
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4 py-12 bg-[#F7F5F2]">
      <div className="w-full max-w-md bg-white border border-[#D9DEE5] rounded shadow-sm p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0B2545] text-white mb-3">
            <Shield size={24} />
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545]">JanSetu Platform</h1>
          <p className="text-xs text-[#5E6B7A] mt-1 uppercase tracking-wider">
            National Infrastructure Governance Portal
          </p>
        </div>

        {/* Demo Credentials Box */}
        <div className="bg-[#F7F5F2] border border-[#D9DEE5] rounded p-3 mb-6 text-xs">
          <div className="font-semibold text-[#0B2545] mb-1.5 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#2E7D32]" />
            Demo Credentials (Instant Autofill)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillPolicymakerDemo}
              className="flex-1 py-1.5 px-2 bg-white border border-[#D9DEE5] rounded text-left hover:border-[#1565C0] transition-colors"
            >
              <div className="font-medium text-[#0B2545]">Policymaker Demo</div>
              <div className="text-[11px] text-[#5E6B7A]">policymaker@jansetu.demo</div>
            </button>
            <button
              type="button"
              onClick={fillCitizenDemo}
              className="flex-1 py-1.5 px-2 bg-white border border-[#D9DEE5] rounded text-left hover:border-[#1565C0] transition-colors"
            >
              <div className="font-medium text-[#0B2545]">Citizen Demo</div>
              <div className="text-[11px] text-[#5E6B7A]">Phone: 9876543210</div>
            </button>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex border-b border-[#D9DEE5] mb-5">
          <button
            type="button"
            onClick={() => { setMode("policymaker"); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors ${
              mode === "policymaker"
                ? "border-[#1565C0] text-[#0B2545]"
                : "border-transparent text-[#5E6B7A] hover:text-[#0B2545]"
            }`}
          >
            Policymaker Login
          </button>
          <button
            type="button"
            onClick={() => { setMode("citizen"); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors ${
              mode === "citizen"
                ? "border-[#1565C0] text-[#0B2545]"
                : "border-transparent text-[#5E6B7A] hover:text-[#0B2545]"
            }`}
          >
            Citizen Access
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors ${
              mode === "signup"
                ? "border-[#1565C0] text-[#0B2545]"
                : "border-transparent text-[#5E6B7A] hover:text-[#0B2545]"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {mode === "policymaker" && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-2.5 text-[#5E6B7A]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#D9DEE5] rounded focus:outline-none focus:border-[#1565C0]"
                    placeholder="name@dept.gov.in"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-2.5 text-[#5E6B7A]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#D9DEE5] rounded focus:outline-none focus:border-[#1565C0]"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </>
          )}

          {mode === "citizen" && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-2.5 text-[#5E6B7A]" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#D9DEE5] rounded focus:outline-none focus:border-[#1565C0]"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-2.5 text-[#5E6B7A]" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#D9DEE5] rounded focus:outline-none focus:border-[#1565C0]"
                    placeholder="Ramesh Kumar"
                  />
                </div>
              </div>
            </>
          )}

          {mode === "signup" && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">
                  Citizen Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D9DEE5] rounded focus:outline-none focus:border-[#1565C0]"
                  placeholder="Citizen Name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D9DEE5] rounded focus:outline-none focus:border-[#1565C0]"
                  placeholder="10-digit mobile"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-1">
                  Primary District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={e => setSelectedDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D9DEE5] rounded focus:outline-none focus:border-[#1565C0] bg-white"
                >
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2 px-4 bg-[#0B2545] text-white rounded font-medium hover:bg-[#081d36] transition-colors flex items-center justify-center gap-2"
          >
            {loading ? "Authenticating..." : mode === "signup" ? "Create Citizen Account" : "Access JanSetu"}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
