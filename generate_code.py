import os

files = {}

files["frontend/src/App.tsx"] = """import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Map as MapIcon, List, MessageSquare, Menu, X, BarChart2, Radio, Smartphone, AlertTriangle } from 'lucide-react';
import Overview from './pages/Overview';
import Feed from './pages/Feed';
import Clusters from './pages/Clusters';
import AskData from './pages/AskData';
import Landing from './pages/Landing';
import Mismatch from './pages/Mismatch';
import Channels from './pages/Channels';
import HotspotMap from './pages/HotspotMap';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
  const location = useLocation();
  const nav = [
    { name: 'Citizen Portal', path: '/', icon: <Smartphone size={20} /> },
    { name: 'Overview', path: '/overview', icon: <Home size={20} /> },
    { name: 'Live Feed', path: '/feed', icon: <Radio size={20} /> },
    { name: 'Hotspot Map', path: '/map', icon: <MapIcon size={20} /> },
    { name: 'Priority Rankings', path: '/priority', icon: <List size={20} /> },
    { name: 'Mismatch View', path: '/mismatch', icon: <AlertTriangle size={20} /> },
    { name: 'Ask the Data', path: '/ask', icon: <MessageSquare size={20} /> },
    { name: 'Channels', path: '/channels', icon: <Smartphone size={20} /> },
  ];

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy text-white transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:w-64`}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-saffron rounded-lg flex items-center justify-center font-bold text-white">J</div>
            <span className="text-xl font-bold font-sans">JanSetu | जनसेतु</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-white/70 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {nav.map(item => (
            <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-saffron text-white shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
      {isOpen && <div className="fixed inset-0 bg-navy/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-offwhite overflow-hidden text-navy font-sans">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-navy hover:text-saffron transition-colors">
                <Menu size={24} />
              </button>
              <h1 className="text-lg font-semibold hidden sm:block">Digital India Infrastructure Command</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-green/10 text-green px-3 py-1.5 rounded-full text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-green animate-pulse"></div>
                Live Systems Normal
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button className="px-3 py-1 bg-white shadow-sm rounded-md text-sm font-medium">EN</button>
                <button className="px-3 py-1 text-gray-500 hover:text-navy text-sm font-medium">हिं</button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-offwhite">
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
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
"""

files["frontend/src/pages/Landing.tsx"] = """import React, { useState, useEffect } from 'react';
import { Mic, UploadCloud, MapPin, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const greetings = ["नमस्ते", "வணக்கம்", "నమస్కారం", "নমস্কার", "નમસ્તે", "ನಮಸ್ಕಾರ", "നമസ്കാരം", "Hello"];

export default function Landing() {
  const [idx, setIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setIdx(p => (p + 1) % greetings.length), 2000);
    return () => clearInterval(i);
  }, []);

  if (submitted) return (
    <div className="min-h-full flex items-center justify-center p-4">
      <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green/10 text-green rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Request Logged!</h2>
        <p className="text-gray-600 mb-6">Ticket #IND-9281<br/>Severity: High • Sector: Roads</p>
        <button onClick={() => setSubmitted(false)} className="w-full bg-saffron text-white py-3 rounded-xl font-bold hover:bg-orange-500 transition-colors">Submit Another</button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8 relative">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-saffron via-white to-green"></div>
      
      <div className="max-w-2xl w-full space-y-8 text-center">
        <motion.h1 
          key={idx} 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="text-5xl md:text-7xl font-bold text-navy h-24"
        >
          {greetings[idx]}
        </motion.h1>

        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Report infrastructure issues directly to your local government using voice, text, or photos in your native language.
        </p>

        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-2xl space-y-8">
          <div className="relative">
            <button 
              onClick={() => { setIsRecording(!isRecording); if(isRecording) setTimeout(()=>setSubmitted(true), 1500) }}
              className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-[0_0_40px_rgba(239,68,68,0.5)]' : 'bg-saffron text-white hover:scale-105 shadow-xl'}`}
            >
              <Mic size={48} />
            </button>
            {isRecording && <p className="mt-4 font-medium text-red-500 animate-pulse">Listening... (Tap to stop)</p>}
            {!isRecording && <p className="mt-4 font-medium text-gray-500">Tap to speak in any language</p>}
          </div>

          <div className="flex items-center gap-4 text-gray-400">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span>OR</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          <div className="flex gap-4 justify-center">
            <button className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-600 transition-colors">
              <UploadCloud size={20} />
              <span className="font-medium">Upload Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
"""

files["frontend/src/pages/Feed.tsx"] = """import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, MapPin, Clock, Smartphone } from 'lucide-react';

const mockFeed = [
  { id: 1, text: "Road is completely washed away near the primary school.", source: "WhatsApp", lang: "hi", original: "प्राइमरी स्कूल के पास सड़क पूरी तरह बह गई है।", sector: "Roads", severity: "High", time: "2m ago", lat: 28.6139, lng: 77.2090 },
  { id: 2, text: "No electricity for 3 days in our village.", source: "Telegram", lang: "te", original: "మా గ్రామంలో 3 రోజులుగా కరెంటు లేదు.", sector: "Power", severity: "Critical", time: "5m ago", lat: 17.3850, lng: 78.4867 },
  { id: 3, text: "Water pipe broken, flooding the street.", source: "Voice", lang: "bn", original: "জলের পাইপ ফেটে রাস্তা ভেসে যাচ্ছে।", sector: "Water", severity: "Medium", time: "12m ago", lat: 22.5726, lng: 88.3639 },
];

export default function Feed() {
  const [items, setItems] = useState(mockFeed);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2">Live Citizen Feed</h1>
          <p className="text-gray-600">Real-time infrastructure requests from all channels</p>
        </div>
        <div className="bg-green/10 text-green px-4 py-2 rounded-xl font-bold flex items-center gap-2">
          <div className="w-3 h-3 bg-green rounded-full animate-pulse"></div>
          Receiving Signals
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {items.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      item.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                      item.severity === 'High' ? 'bg-saffron/20 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.severity}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                      {item.sector}
                    </span>
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Clock size={14} /> {item.time}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-navy mb-1">"{item.text}"</h3>
                  <p className="text-gray-500 text-sm italic mb-4">Original ({item.lang}): "{item.original}"</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={16} className="text-saffron" />
                      {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Smartphone size={16} className="text-navy" />
                      via {item.source}
                    </div>
                  </div>
                </div>
                
                <div className="md:w-48 h-32 bg-gray-100 rounded-xl relative overflow-hidden flex items-center justify-center border border-gray-200">
                  <MapPin className="text-gray-400" size={32} />
                  <div className="absolute inset-0 bg-blue-50/50"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
"""

files["frontend/src/pages/Overview.tsx"] = """import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', requests: 400 },
  { name: 'Tue', requests: 300 },
  { name: 'Wed', requests: 550 },
  { name: 'Thu', requests: 480 },
  { name: 'Fri', requests: 700 },
  { name: 'Sat', requests: 650 },
  { name: 'Sun', requests: 800 },
];

export default function Overview() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy mb-2">Command Center Overview</h1>
        <p className="text-gray-600">Aggregated insights across all digital public infrastructure channels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests (7d)', value: '12,482', icon: <Users size={24} />, color: 'bg-blue-500', trend: '+14%' },
          { label: 'Critical Hotspots', value: '34', icon: <AlertTriangle size={24} />, color: 'bg-red-500', trend: '-2' },
          { label: 'AI Extraction Rate', value: '98.4%', icon: <TrendingUp size={24} />, color: 'bg-saffron', trend: '+0.2%' },
          { label: 'Projects Initiated', value: '156', icon: <CheckCircle size={24} />, color: 'bg-green', trend: '+12' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.1}} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{stat.trend}</span>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
              <p className="text-3xl font-bold text-navy">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-navy mb-6">Inbound Demand Volume</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF9933" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF9933" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dx={-10} />
              <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Area type="monotone" dataKey="requests" stroke="#FF9933" strokeWidth={3} fillOpacity={1} fill="url(#colorReq)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
"""

files["frontend/src/pages/HotspotMap.tsx"] = """import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MapPin, AlertTriangle } from 'lucide-react';

export default function HotspotMap() {
  const position: [number, number] = [20.5937, 78.9629]; // India Center

  return (
    <div className="h-full w-full relative flex flex-col">
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl w-80">
        <h2 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
          <MapPin size={20} className="text-saffron" />
          Demand Heatmap
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Sector Filter</label>
            <select className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron">
              <option>All Sectors</option>
              <option>Roads & Highways</option>
              <option>Water Supply</option>
              <option>Electricity</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
            <AlertTriangle className="text-red-500 shrink-0" size={20} />
            <p className="text-sm text-red-800"><strong>4 Critical Zones</strong> identified with severe infrastructure deficits.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 z-0">
        <MapContainer center={position} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <CircleMarker center={[28.6139, 77.2090]} radius={15} pathOptions={{ color: '#FF9933', fillColor: '#FF9933', fillOpacity: 0.5 }}>
            <Popup>New Delhi - 450 Requests</Popup>
          </CircleMarker>
          <CircleMarker center={[19.0760, 72.8777]} radius={25} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.5 }}>
            <Popup>Mumbai - High Deficit</Popup>
          </CircleMarker>
        </MapContainer>
      </div>
    </div>
  );
}
"""

files["frontend/src/pages/Clusters.tsx"] = """import React from 'react';
import { ShieldAlert, TrendingDown, ArrowRight } from 'lucide-react';

export default function Clusters() {
  const clusters = [
    { id: 1, name: "Vidarbha Water Crisis", district: "Nagpur, MH", score: 92.4, requests: 1240, deficit: 0.85, sector: "Water" },
    { id: 2, name: "Coastal Highway Washout", district: "Udupi, KA", score: 88.1, requests: 850, deficit: 0.72, sector: "Roads" },
    { id: 3, name: "Substation Failure", district: "Bhopal, MP", score: 85.5, requests: 2100, deficit: 0.45, sector: "Power" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy mb-2">Priority Leaderboard</h1>
        <p className="text-gray-600">AI-ranked infrastructure projects based on Demand × Deficit Scoring</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
              <th className="p-4 font-semibold">Rank</th>
              <th className="p-4 font-semibold">Project Cluster</th>
              <th className="p-4 font-semibold">Sector</th>
              <th className="p-4 font-semibold text-center">Citizen Demand</th>
              <th className="p-4 font-semibold text-center">Deficit Index</th>
              <th className="p-4 font-semibold text-right">Priority Score</th>
              <th className="p-4 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clusters.map((c, i) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-saffron text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : 'bg-orange-100 text-orange-700'}`}>
                    #{i + 1}
                  </div>
                </td>
                <td className="p-4">
                  <p className="font-bold text-navy">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.district}</p>
                </td>
                <td className="p-4">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{c.sector}</span>
                </td>
                <td className="p-4 text-center font-medium text-navy">{c.requests}</td>
                <td className="p-4 text-center text-red-500 font-medium">{c.deficit.toFixed(2)}</td>
                <td className="p-4 text-right">
                  <span className="text-xl font-bold text-navy">{c.score.toFixed(1)}</span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-saffron hover:bg-orange-50 p-2 rounded-lg transition-colors flex items-center gap-1 font-medium text-sm">
                    Review <ArrowRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"""

files["frontend/src/pages/AskData.tsx"] = """import React, { useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

export default function AskData() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Namaste! I am your JanSetu AI policy assistant. You can ask me to analyze demand hotspots, find infrastructure mismatches, or draft policy briefs based on our live data.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Based on the latest data from the Priority Engine, the Vidarbha region shows a 45% spike in water-related requests compared to last month. The district infrastructure deficit is high (0.85). I recommend allocating emergency funds to the Jal Jeevan Mission projects in this area.' 
      }]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy flex items-center gap-2">
          Ask the Data <Sparkles className="text-saffron" size={28} />
        </h1>
        <p className="text-gray-600">Powered by Gemini 2.5 Pro</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-white shrink-0">
                  <Bot size={20} />
                </div>
              )}
              <div className={`p-4 rounded-2xl max-w-[80%] ${m.role === 'user' ? 'bg-saffron text-white rounded-tr-none' : 'bg-gray-50 border border-gray-100 text-navy rounded-tl-none'}`}>
                {m.content}
              </div>
              {m.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {["Which district needs the most funding?", "Summarize water complaints", "Draft policy brief for Roads"].map(q => (
              <button key={q} onClick={() => setInput(q)} className="shrink-0 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm hover:border-saffron hover:text-saffron transition-colors">
                {q}
              </button>
            ))}
          </div>
          <form onSubmit={handleSend} className="relative">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about the infrastructure data..."
              className="w-full bg-white border border-gray-200 rounded-xl py-4 pl-4 pr-14 focus:outline-none focus:ring-2 focus:ring-saffron shadow-sm"
            />
            <button type="submit" className="absolute right-2 top-2 bottom-2 bg-navy text-white px-4 rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
"""

files["frontend/src/pages/Mismatch.tsx"] = """import React from 'react';

export default function Mismatch() {
  return (
    <div className="p-8 max-w-7xl mx-auto flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <h2 className="text-2xl font-bold mb-2 text-navy">Mismatch View</h2>
        <p>Scatter plot visualization coming soon...</p>
      </div>
    </div>
  );
}
"""

files["frontend/src/pages/Channels.tsx"] = """import React from 'react';

export default function Channels() {
  return (
    <div className="p-8 max-w-7xl mx-auto flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <h2 className="text-2xl font-bold mb-2 text-navy">Omnichannel Integrations</h2>
        <p>Telegram & WhatsApp QR codes coming soon...</p>
      </div>
    </div>
  );
}
"""

for k,v in files.items():
    with open(k, "w") as f:
        f.write(v)

