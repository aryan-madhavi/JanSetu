import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, Map as MapIcon, List, MessageSquare, Menu, Radio, Smartphone, 
  AlertTriangle, Bell, User, Wifi, ChevronDown, Flag, LogOut, LogIn,
  Sparkles, TrendingUp, X, Shield
} from "lucide-react";
import { AppProvider, useApp, type SupportedLang } from "./context/AppContext";

import Overview from "./pages/Overview";
import Feed from "./pages/Feed";
import Clusters from "./pages/Clusters";
import AskData from "./pages/AskData";
import Landing from "./pages/Landing";
import Mismatch from "./pages/Mismatch";
import Channels from "./pages/Channels";
import HotspotMap from "./pages/HotspotMap";
import Recommendations from "./pages/Recommendations";
import Impact from "./pages/Impact";
import Login from "./pages/Login";

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
  const location = useLocation();
  const { t, user } = useApp();
  const [searchModule, setSearchModule] = useState("");

  const allNav = [
    { name: t("citizen_portal"), path: "/", icon: <Smartphone size={16} />, public: true },
    { name: t("national_overview"), path: "/overview", icon: <Home size={16} />, policymakerOnly: true },
    { name: t("live_reports"), path: "/feed", icon: <Radio size={16} />, policymakerOnly: true },
    { name: t("geospatial_view"), path: "/map", icon: <MapIcon size={16} />, policymakerOnly: true },
    { name: t("priority_queue"), path: "/priority", icon: <List size={16} />, policymakerOnly: true },
    { name: t("deficit_analysis"), path: "/mismatch", icon: <AlertTriangle size={16} />, policymakerOnly: true },
    { name: t("data_query"), path: "/ask", icon: <MessageSquare size={16} />, policymakerOnly: true },
    { name: t("input_channels"), path: "/channels", icon: <Smartphone size={16} />, public: true },
    { name: t("recommended_projects"), path: "/recommendations", icon: <Sparkles size={16} />, policymakerOnly: true },
    { name: t("impact_tracker"), path: "/impact", icon: <TrendingUp size={16} />, policymakerOnly: true },
  ];

  
  const visibleNav = allNav.filter(item => {
    if (user?.role === "citizen" && item.policymakerOnly) return false;
    if (searchModule.trim()) {
      return item.name.toLowerCase().includes(searchModule.toLowerCase());
    }
    return true;
  });

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#D9DEE5] flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:w-64 shrink-0`}>
        <div className="p-4 border-b border-[#D9DEE5] bg-[#F7F5F2]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-[#5E6B7A] uppercase tracking-wider">{t("modules_heading")}</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
              Demo data
            </span>
          </div>
          <div className="relative">
            <input 
              type="text" 
              value={searchModule}
              onChange={e => setSearchModule(e.target.value)}
              placeholder={t("search_modules")} 
              className="w-full bg-white border border-[#D9DEE5] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1565C0]" 
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {visibleNav.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                location.pathname === item.path 
                  ? "bg-[#e8edf2] text-[#0B2545] font-semibold border-r-2 border-[#1565C0]" 
                  : "text-[#5E6B7A] hover:bg-[#F7F5F2] hover:text-[#0B2545]"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
      {isOpen && <div className="fixed inset-0 bg-[#0B2545]/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  );
};

const Header = ({ setIsOpen }: { setIsOpen: (v: boolean) => void }) => {
  const navigate = useNavigate();
  const { 
    district, 
    setDistrict, 
    districts, 
    language, 
    setLanguage, 
    t, 
    user, 
    logout,
    notifications,
    isNotificationsOpen,
    setIsNotificationsOpen
  } = useApp();

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isDistrictMenuOpen, setIsDistrictMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const langNames: Record<SupportedLang, string> = {
    en: "English",
    hi: "हिन्दी",
    ta: "தமிழ்",
    mr: "मराठी"
  };

  return (
    <header className="bg-[#0B2545] text-white h-14 flex items-center justify-between px-4 shrink-0 shadow-sm z-30 relative">
      <div className="flex items-center gap-4">
        <button onClick={() => setIsOpen(true)} className="md:hidden text-white/80 hover:text-white">
          <Menu size={20} />
        </button>
        <Link to="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-[#0B2545] font-bold">
            <Shield size={18} className="text-[#0B2545]" />
          </div>
          <div className="hidden sm:block leading-tight">
            <h1 className="text-[15px] font-semibold tracking-wide">{t("platform_title")}</h1>
            <p className="text-[11px] text-white/70 uppercase tracking-wider">{t("platform_sub")}</p>
          </div>
        </Link>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-5 text-sm">
        {/* District Selector */}
        <div className="relative">
          <button
            onClick={() => { setIsDistrictMenuOpen(!isDistrictMenuOpen); setIsLangMenuOpen(false); setIsProfileMenuOpen(false); }}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-white/10 rounded border border-white/20 cursor-pointer hover:bg-white/15 text-xs sm:text-sm font-medium"
          >
            <MapIcon size={14} className="text-[#F59E0B]" />
            <span>{district === "All" ? t("all_districts") : `${t("district_label")}: ${district}`}</span>
            <ChevronDown size={14} className="text-white/70" />
          </button>

          {isDistrictMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white text-[#162033] rounded shadow-lg border border-[#D9DEE5] py-1 z-50 max-h-60 overflow-y-auto">
              <button
                onClick={() => { setDistrict("All"); setIsDistrictMenuOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-[#F7F5F2] ${district === "All" ? "text-[#1565C0] font-bold bg-[#e8edf2]" : ""}`}
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
          <Wifi size={16} className="text-[#2E7D32]" />
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
