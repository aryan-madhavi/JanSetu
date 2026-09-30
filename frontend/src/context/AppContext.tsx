import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchJson } from "../lib/api";

export interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: "policymaker" | "citizen";
}

export interface NotificationItem {
  id: string;
  text: string;
  district: string;
  sector: string;
  severity: number;
  time: string;
}

export type SupportedLang = "en" | "hi" | "ta" | "mr";

const translations: Record<SupportedLang, Record<string, string>> = {
  en: {
    platform_title: "JanSetu Platform",
    platform_sub: "Digital Infrastructure Command",
    citizen_portal: "Citizen Portal",
    national_overview: "National Overview",
    live_reports: "Live Reports",
    geospatial_view: "Geospatial View",
    priority_queue: "Priority Queue",
    deficit_analysis: "Deficit Analysis",
    data_query: "Data Query",
    input_channels: "Input Channels",
    recommended_projects: "Recommended Projects",
    impact_tracker: "Impact Tracker",
    all_districts: "All Districts",
    district_label: "District",
    connected: "Connected",
    modules_heading: "Modules",
    search_modules: "Search modules...",
    login: "Login",
    logout: "Logout",
    notifications: "Notifications",
    critical_alerts: "Critical P1 Grievances",
    no_notifications: "No new critical alerts.",
    view_details: "View Details",
    retry: "Retry",
    loading: "Loading data...",
    export_csv: "Export CSV",
    generate_report: "Generate Report",
    search_placeholder: "Search ID or keyword...",
    filter: "Filter"
  },
  hi: {
    platform_title: "जनसेतु मंच",
    platform_sub: "डिजिटल अवसंरचना कमान",
    citizen_portal: "नागरिक पोर्टल",
    national_overview: "राष्ट्रीय समीक्षा",
    live_reports: "लाइव रिपोर्ट",
    geospatial_view: "भू-स्थानिक दृश्य",
    priority_queue: "प्राथमिकता कतार",
    deficit_analysis: "घाटा विश्लेषण",
    data_query: "डेटा क्वेरी",
    input_channels: "इनपुट चैनल",
    recommended_projects: "अनुशंसित परियोजनाएं",
    impact_tracker: "प्रभाव ट्रैकर",
    all_districts: "सभी ज़िले",
    district_label: "ज़िला",
    connected: "सक्रिय",
    modules_heading: "मॉड्यूल",
    search_modules: "मॉड्यूल खोजें...",
    login: "लॉग इन",
    logout: "लॉग आउट",
    notifications: "सूचनाएं",
    critical_alerts: "गंभीर शिकायतें (P1)",
    no_notifications: "कोई नई गंभीर चेतावनी नहीं।",
    view_details: "विवरण देखें",
    retry: "पुनः प्रयास करें",
    loading: "डेटा लोड हो रहा है...",
    export_csv: "सीएसवी निर्यात",
    generate_report: "रिपोर्ट बनाएं",
    search_placeholder: "आईडी या कीवर्ड खोजें...",
    filter: "फ़िल्टर"
  },
  ta: {
    platform_title: "ஜன்சேது தளம்",
    platform_sub: "டிஜிட்டல் உள்கட்டமைப்பு கட்டளை",
    citizen_portal: "குடிமக்கள் போர்டல்",
    national_overview: "தேசிய கண்ணோட்டம்",
    live_reports: "நேரலை அறிக்கைகள்",
    geospatial_view: "புவிசார் பார்வை",
    priority_queue: "முன்னுரிமை வரிசை",
    deficit_analysis: "பற்றாக்குறை பகுப்பாய்வு",
    data_query: "தரவு வினவல்",
    input_channels: "உள்ளீட்டு சேனல்கள்",
    recommended_projects: "பரிந்துரைக்கப்பட்ட திட்டங்கள்",
    impact_tracker: "தாக்க கண்காணிப்பாளர்",
    all_districts: "அனைத்து மாவட்டங்களும்",
    district_label: "மாவட்டம்",
    connected: "இணைக்கப்பட்டது",
    modules_heading: "தொகுதிகள்",
    search_modules: "தொகுதிகளைத் தேடுங்கள்...",
    login: "உள்நுழைக",
    logout: "வெளியேறு",
    notifications: "அறிவிப்புகள்",
    critical_alerts: "முக்கிய புகார்கள் (P1)",
    no_notifications: "புதிய முக்கிய எச்சரிக்கைகள் இல்லை.",
    view_details: "விவரங்களைக் காண்க",
    retry: "மீண்டும் முயற்சிக்கவும்",
    loading: "தரவு ஏற்றப்படுகிறது...",
    export_csv: "CSV ஏற்றுமதி",
    generate_report: "அறிக்கை உருவாக்கவும்",
    search_placeholder: "தேடு...",
    filter: "வடிகட்டு"
  },
  mr: {
    platform_title: "जनसेतू व्यासपीठ",
    platform_sub: "डिजिटल पायाभूत सुविधा आदेश",
    citizen_portal: "नागरीक पोर्टल",
    national_overview: "राष्ट्रीय विहंगावलोकन",
    live_reports: "थेट अहवाल",
    geospatial_view: "भू-स्थानिक दृश्य",
    priority_queue: "प्राधान्य रांग",
    deficit_analysis: "तूट विश्लेषण",
    data_query: "डेटा क्वेरी",
    input_channels: "इनपुट चॅनेल्स",
    recommended_projects: "शिफारस केलेले प्रकल्प",
    impact_tracker: "प्रभाव ट्रॅकर",
    all_districts: "सर्व जिल्हे",
    district_label: "जिल्हा",
    connected: "कनेक्ट केले",
    modules_heading: "मॉड्यूल",
    search_modules: "मॉड्यूल शोधा...",
    login: "लॉग इन",
    logout: "लॉग आउट",
    notifications: "सूचना",
    critical_alerts: "गंभीर तक्रारी (P1)",
    no_notifications: "कोणत्याही नवीन गंभीर सूचना नाहीत.",
    view_details: "तपशील पहा",
    retry: "पुन्हा प्रयत्न करा",
    loading: "डेटा लोड होत आहे...",
    export_csv: "CSV निर्यात",
    generate_report: "अहवाल तयार करा",
    search_placeholder: "शोधा...",
    filter: "फिल्टर"
  }
};

interface AppContextType {
  district: string;
  setDistrict: (d: string) => void;
  districts: string[];
  language: SupportedLang;
  setLanguage: (l: SupportedLang) => void;
  t: (key: string) => string;
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
  notifications: NotificationItem[];
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (v: boolean) => void;
  refreshNotifications: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [district, setDistrict] = useState<string>("All");
  const [districts, setDistricts] = useState<string[]>([]);
  const [language, setLanguage] = useState<SupportedLang>("en");
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Fetch districts once
  useEffect(() => {
    fetchJson<string[]>("/districts")
      .then(data => setDistricts(data))
      .catch(err => console.error("Failed to fetch districts:", err));
  }, []);

  // Fetch current user session
  useEffect(() => {
    fetchJson<{ user: User }>("/auth/me")
      .then(res => {
        if (res && res.user) setUser(res.user);
      })
      .catch(() => {
        // Not authenticated
        setUser(null);
      });
  }, []);

  const refreshNotifications = async () => {
    try {
      const data = await fetchJson<any[]>("/requests?severity=5&limit=8");
      const mapped: NotificationItem[] = data.map(d => ({
        id: d.id,
        text: d.english_summary || d.transcript_original || "Critical infrastructure alert",
        district: d.district || "National",
        sector: d.sector || "Infrastructure",
        severity: d.severity || 5,
        time: d.timestamp ? d.timestamp.substring(11, 16) : "Just now"
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    refreshNotifications();
  }, []);

  const logout = async () => {
    try {
      await fetchJson("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <AppContext.Provider
      value={{
        district,
        setDistrict,
        districts,
        language,
        setLanguage,
        t,
        user,
        setUser,
        logout,
        notifications,
        isNotificationsOpen,
        setIsNotificationsOpen,
        refreshNotifications
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
