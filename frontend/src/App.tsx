import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  MapPin, 
  Layers, 
  Sliders, 
  Radio, 
  Database, 
  Menu,
  ChevronDown,
  Flag,
  Bell,
  User,
  LogOut,
  LogIn,
  X,
  FileText,
  Lightbulb,
  TrendingUp,
  Activity,
  Wifi,
} from "lucide-react";

import { AppProvider, useApp, type SupportedLang } from "./context/AppContext";

// Pages
import Landing from "./pages/Landing";
import Overview from "./pages/Overview";
import Feed from "./pages/Feed";
import Clusters from "./pages/Clusters";
import AskData from "./pages/AskData";
import HotspotMap from "./pages/HotspotMap";
import Mismatch from "./pages/Mismatch";
import Channels from "./pages/Channels";
import Login from "./pages/Login";
import Recommendations from "./pages/Recommendations";
import Impact from "./pages/Impact";

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) => {
  const location = useLocation();
  const { t, user, dataSource } = useApp();


  const allNavItems = [
    { name: t("citizen_portal"), path: "/", icon: FileText, roles: ["citizen", "policymaker"] },
    { name: t("national_overview"), path: "/overview", icon: BarChart3, roles: ["policymaker"] },
    { name: t("live_reports"), path: "/feed", icon: Radio, roles: ["policymaker"] },
    { name: t("geospatial_view"), path: "/map", icon: MapPin, roles: ["policymaker"] },
    { name: t("priority_queue"), path: "/clusters", icon: Sliders, roles: ["policymaker"] },
    { name: t("deficit_analysis"), path: "/mismatch", icon: Layers, roles: ["policymaker"] },
    { name: t("data_query"), path: "/ask", icon: Database, roles: ["policymaker"] },
    { name: t("input_channels"), path: "/channels", icon: Radio, roles: ["citizen", "policymaker"] },
    { name: t("recommended_projects"), path: "/recommendations", icon: Lightbulb, roles: ["policymaker"] },
    { name: t("impact_tracker"), path: "/impact", icon: TrendingUp, roles: ["policymaker"] },
  ];

  const navItems = allNavItems.filter(item => {
    if (user?.role === "citizen") {
      return item.roles.includes("citizen");
    }
    return true;
  });

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-[#F7F5F2] border-r border-[#D9DEE5] flex flex-col justify-between
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold tracking-wider text-[#5E6B7A] uppercase">
              {t("modules_heading")}
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-300">
              {dataSource === "live" ? "Live Mode" : "Demo data"}
            </span>
          </div>

          <div className="mb-4">
            <input 
              type="text" 
              placeholder={t("search_modules")} 
              className="w-full px-3 py-1.5 bg-white border border-[#D9DEE5] rounded text-xs text-[#162033] focus:outline-none focus:border-[#1565C0]"
            />
          </div>

          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors
                    ${isActive 
                      ? "bg-[#e8edf2] text-[#0B2545] font-semibold border-r-2 border-[#1565C0]" 
                      : "text-[#5E6B7A] hover:bg-[#eae8e3] hover:text-[#0B2545]"}
                  `}
                >
                  <Icon size={16} className={isActive ? "text-[#1565C0]" : "text-[#5E6B7A]"} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {user && (
          <div className="p-3 border-t border-[#D9DEE5] bg-white/50 text-xs">
            <div className="font-semibold text-[#0B2545] truncate">{user.name}</div>
            <div className="text-[10px] text-[#5E6B7A] capitalize">{user.role} mode</div>
          </div>
        )}
      </aside>
    </>
  );
};

const Header = ({ setIsOpen }: { setIsOpen: (v: boolean | ((v: boolean) => boolean)) => void }) => {
  const { 
    district, 
    setDistrict, 
    districts, 
    language, 
    setLanguage, 
    dataSource, 
    setDataSource, 
    liveCount,
    t, 
    user, 
    logout, 
    notifications, 
    isNotificationsOpen, 
    setIsNotificationsOpen 
  } = useApp();
  
  const [isDistrictMenuOpen, setIsDistrictMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const langNames: Record<SupportedLang, string> = {
    en: "English",
    hi: "हिंदी",
    ta: "தமிழ்",
    mr: "मराठी"
  };

  return (
    <header className="h-14 bg-[#0B2545] text-white flex items-center justify-between px-4 z-40 border-b border-[#0B2545] shrink-0">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsOpen((prev: boolean) => !prev)}
          className="md:hidden text-white/80 hover:text-white"
        >
          <Menu size={20} />
        </button>

        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#1565C0] flex items-center justify-center font-bold text-base text-white shadow-sm">
            <Activity size={18} />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight leading-none text-white">
              JanSetu Platform
            </div>
            <div className="text-[9px] text-[#90CAF9] tracking-wider font-medium">
              {t("platform_sub")}
            </div>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Live / Demo Data Source Toggle */}
        <button
          onClick={() => setDataSource(dataSource === "all" ? "live" : "all")}
          title={dataSource === "all" ? "Showing Live + Demo data. Click to switch to Live Only" : "Showing Live Only. Click to switch to Live + Demo"}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all border ${
            dataSource === "live"
              ? "bg-emerald-600 text-white border-emerald-400 shadow-sm"
              : "bg-white/10 hover:bg-white/20 text-white/90 border-white/20"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${dataSource === "live" ? "bg-white animate-ping" : "bg-emerald-400"}`}></span>
          <span>{dataSource === "live" ? t("source_live") : t("source_all")}</span>
          <span className="text-[10px] opacity-75 font-mono hidden sm:inline">({liveCount} live)</span>
        </button>

        {/* Global District Selector */}
        <div className="relative">
          <button 
            onClick={() => { setIsDistrictMenuOpen(!isDistrictMenuOpen); setIsLangMenuOpen(false); setIsProfileMenuOpen(false); }}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded border border-white/20 transition-colors text-xs"
          >
            <MapPin size={12} className="text-[#90CAF9]" />
            <span className="font-medium truncate max-w-[100px] sm:max-w-none">
              {district === "All" ? t("all_districts") : district}
            </span>
            <ChevronDown size={14} className="text-white/70" />
          </button>

          {isDistrictMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white text-[#162033] rounded shadow-lg border border-[#D9DEE5] py-1 z-50 max-h-60 overflow-y-auto">
              <button
                onClick={() => { setDistrict("All"); setIsDistrictMenuOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#F7F5F2] ${district === "All" ? "text-[#1565C0] font-bold bg-[#e8edf2]" : ""}`}
              >
                {t("all_districts")}
              </button>
              {districts.map(d => (
                <button
                  key={d}
                  onClick={() => { setDistrict(d); setIsDistrictMenuOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#F7F5F2] ${district === d ? "text-[#1565C0] font-bold bg-[#e8edf2]" : ""}`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Connectivity status */}
        <div className="hidden lg:flex items-center gap-2">
          <Wifi size={14} className="text-[#2E7D32]" />
          <span className="text-xs text-white/80">{t("connected")}</span>
        </div>
        
        <div className="h-6 w-px bg-white/20 hidden sm:block"></div>
        
        {/* Language Selector */}
        <div className="relative">
          <button 
            onClick={() => { setIsLangMenuOpen(!isLangMenuOpen); setIsDistrictMenuOpen(false); setIsProfileMenuOpen(false); }}
            className="flex items-center gap-1 cursor-pointer hover:text-white/80 transition-colors text-xs sm:text-sm"
          >
            <Flag size={14} />
            <span>{langNames[language]}</span>
            <ChevronDown size={14} className="text-white/70" />
          </button>

          {isLangMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-32 bg-white text-[#162033] rounded shadow-lg border border-[#D9DEE5] py-1 z-50">
              {(["en", "hi", "ta", "mr"] as SupportedLang[]).map(l => (
                <button
                  key={l}
                  onClick={() => { setLanguage(l); setIsLangMenuOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#F7F5F2] ${language === l ? "font-bold text-[#1565C0] bg-[#e8edf2]" : ""}`}
                >
                  {langNames[l]}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileMenuOpen(false); }}
            className="relative hover:text-white/80 transition-colors p-1"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#F59E0B] rounded-full border border-[#0B2545]"></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white text-[#162033] rounded shadow-xl border border-[#D9DEE5] z-50 overflow-hidden">
              <div className="bg-[#F7F5F2] px-4 py-3 border-b border-[#D9DEE5] flex justify-between items-center">
                <div className="font-semibold text-xs text-[#0B2545] flex items-center gap-1.5">
                  <Bell size={14} className="text-[#1565C0]" />
                  {t("critical_alerts")}
                </div>
                <button onClick={() => setIsNotificationsOpen(false)} className="text-[#5E6B7A] hover:text-[#0B2545]">
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-[#D9DEE5]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#5E6B7A]">{t("no_notifications")}</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="p-3 hover:bg-[#F7F5F2] transition-colors cursor-pointer" onClick={() => { setIsNotificationsOpen(false); navigate("/feed"); }}>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                          {n.sector}
                        </span>
                        <span className="text-[10px] text-[#5E6B7A]">{n.time}</span>
                      </div>
                      <p className="text-xs text-[#162033] font-medium line-clamp-2">{n.text}</p>
                      <div className="text-[10px] text-[#5E6B7A] mt-1 font-mono">
                        {n.id} • {n.district}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Profile Menu */}
        <div className="relative">
          <button 
            onClick={() => { setIsProfileMenuOpen(!isProfileMenuOpen); setIsNotificationsOpen(false); }}
            className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <User size={14} />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-white text-[#162033] rounded shadow-lg border border-[#D9DEE5] py-2 z-50">
              {user ? (
                <>
                  <div className="px-4 py-2 border-b border-[#D9DEE5]">
                    <div className="font-semibold text-xs text-[#0B2545]">{user.name}</div>
                    <div className="text-[11px] text-[#5E6B7A] capitalize">{user.role} Account</div>
                  </div>
                  <button
                    onClick={async () => {
                      await logout();
                      setIsProfileMenuOpen(false);
                      navigate("/login");
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    {t("logout")}
                  </button>
                </>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-[#D9DEE5] text-xs text-[#5E6B7A]">
                    Guest Session
                  </div>
                  <Link
                    to="/login"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="w-full text-left px-4 py-2 text-xs text-[#1565C0] font-medium hover:bg-[#F7F5F2] flex items-center gap-2"
                  >
                    <LogIn size={14} />
                    {t("login")}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AppProvider>
      <BrowserRouter>
        <div className="flex flex-col h-screen bg-[#F7F5F2] text-[#162033] font-sans">
          <Header setIsOpen={setIsSidebarOpen} />
          
          <div className="flex-1 flex overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F7F5F2]">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/overview" element={<Overview />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/clusters" element={<Clusters />} />
                <Route path="/priority" element={<Clusters />} />
                <Route path="/ask" element={<AskData />} />
                <Route path="/map" element={<HotspotMap />} />
                <Route path="/mismatch" element={<Mismatch />} />
                <Route path="/channels" element={<Channels />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/impact" element={<Impact />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
