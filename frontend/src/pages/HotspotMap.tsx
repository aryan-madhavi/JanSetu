import { useState, useEffect, useRef } from "react";
import { fetchJson } from "../lib/api";
import { useApp } from "../context/AppContext";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, X, Info } from "lucide-react";

// Helper component to pan leaflet map
function MapPanController({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 8, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

export default function HotspotMap() {
  const { setDistrict, t } = useApp();
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<any | null>(null);
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [flyCoords, setFlyCoords] = useState<[number, number] | null>(null);

  // Layers
  const [layerDemand, setLayerDemand] = useState(true);
  const [layerDeficit, setLayerDeficit] = useState(true);

  // Google Maps vs Leaflet state
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);
  const [mapNotice, setMapNotice] = useState<string | null>(null);
  const googleMapRef = useRef<HTMLDivElement | null>(null);
  const googleMapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Load hotspots from API
  const loadHotspots = () => {
    setLoading(true);
    const param = selectedSector !== "All Sectors" ? `?sector=${encodeURIComponent(selectedSector.toLowerCase())}` : "";
    fetchJson<any[]>(`/hotspots${param}`)
      .then(data => {
        setHotspots(data);
        if (data.length > 0 && !selectedHotspot) {
          setSelectedHotspot(data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHotspots();
  }, [selectedSector]);

  // Try loading Google Maps JS if API key is provided
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey.includes("your-key")) {
      setUseGoogleMaps(false);
      return;
    }

    if ((window as any).google && (window as any).google.maps) {
      setUseGoogleMaps(true);
      return;
    }

    // Set auth failure listener
    (window as any).gm_authFailure = () => {
      console.warn("Google Maps Auth Failure. Falling back to OpenStreetMap Leaflet.");
      setUseGoogleMaps(false);
      setMapNotice("Using OpenStreetMap view (Google Maps key restricted or inactive).");
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => {
      if ((window as any).google && (window as any).google.maps) {
        setUseGoogleMaps(true);
      } else {
        setUseGoogleMaps(false);
      }
    };
    script.onerror = () => {
      console.warn("Failed to load Google Maps script. Falling back to Leaflet.");
      setUseGoogleMaps(false);
      setMapNotice("Using OpenStreetMap view.");
    };

    document.head.appendChild(script);

    // Timeout safety fallback
    const timeout = setTimeout(() => {
      if (!((window as any).google && (window as any).google.maps)) {
        setUseGoogleMaps(false);
      }
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  // Initialize and update Google Map if active
  useEffect(() => {
    if (!useGoogleMaps || !googleMapRef.current || !(window as any).google?.maps) return;

    if (!googleMapInstance.current) {
      googleMapInstance.current = new (window as any).google.maps.Map(googleMapRef.current, {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
          { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
        ]
      });
    }

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Add markers
    hotspots.forEach(h => {
      const marker = new (window as any).google.maps.Circle({
        strokeColor: h.score > 60 ? "#D32F2F" : "#1565C0",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: h.score > 60 ? "#D32F2F" : "#1565C0",
        fillOpacity: 0.45,
        map: googleMapInstance.current,
        center: { lat: h.lat, lng: h.lng },
        radius: Math.max(h.score * 1200, 15000),
      });

      marker.addListener("click", () => {
        setSelectedHotspot(h);
      });

      markersRef.current.push(marker);
    });
  }, [useGoogleMaps, hotspots]);

  const handleZoneClick = (h: any) => {
    setSelectedHotspot(h);
    setFlyCoords([h.lat, h.lng]);
    if (useGoogleMaps && googleMapInstance.current) {
      googleMapInstance.current.panTo({ lat: h.lat, lng: h.lng });
      googleMapInstance.current.setZoom(8);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#F7F5F2] overflow-hidden relative">
      {/* Sidebar Panel for Map Controls */}
      <div className="w-full md:w-80 bg-white border-r border-[#D9DEE5] flex flex-col shrink-0 z-10 shadow-sm overflow-y-auto">
        <div className="bg-[#F7F5F2] px-4 py-3 border-b border-[#D9DEE5]">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[#0B2545] flex items-center gap-2">
              <MapPin size={18} className="text-[#1565C0]" />
              {t("geospatial_view")}
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
              Demo data
            </span>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          <div>
            <label className="text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-2 block">
              Sector Overlay
            </label>
            <select 
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
              className="w-full bg-white border border-[#D9DEE5] rounded p-2 text-sm text-[#162033] focus:outline-none focus:border-[#1565C0]"
            >
              <option>All Sectors</option>
              <option>Water</option>
              <option>Roads</option>
              <option>Electricity</option>
              <option>Health</option>
              <option>Education</option>
              <option>Sanitation</option>
            </select>
          </div>
          
          <div>
            <label className="text-xs font-bold text-[#5E6B7A] uppercase tracking-wider mb-2 block">
              Active Layers
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-[#162033] cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={layerDemand} 
                  onChange={e => setLayerDemand(e.target.checked)}
                  className="accent-[#1565C0]" 
                />
                Citizen Demand Heatmap
              </label>
              <label className="flex items-center gap-2 text-sm text-[#162033] cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={layerDeficit} 
                  onChange={e => setLayerDeficit(e.target.checked)}
                  className="accent-[#1565C0]" 
                />
                Infrastructure Deficit Zones
              </label>
            </div>
          </div>

          {/* Critical Zones List */}
          <div className="border-t border-[#D9DEE5] pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-[#162033]">Critical Zones</h3>
              <span className="text-[10px] text-[#5E6B7A]">Top Priority</span>
            </div>

            {loading ? (
              <div className="p-4 text-center text-xs text-[#5E6B7A]">Loading hotspots...</div>
            ) : (
              <div className="space-y-2.5">
                {hotspots.slice(0, 5).map((h, i) => (
                  <div 
                    key={h.district + i}
                    onClick={() => handleZoneClick(h)}
                    className={`border rounded p-3 text-sm cursor-pointer transition-all ${
                      selectedHotspot?.district === h.district 
                        ? "bg-[#e8edf2] border-[#1565C0] shadow-sm" 
                        : "bg-[#F7F5F2] border-[#D9DEE5] hover:border-[#1565C0]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-semibold text-[#0B2545] text-xs">
                        {h.district}
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        h.score > 60 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                      }`}>
                        Score {h.score}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5E6B7A] capitalize">
                      Sector: {h.sector} • Deficit: {h.deficit}
                    </div>
                    <div className="text-[10px] text-[#1565C0] font-medium mt-1 truncate">
                      {h.scheme}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Map View */}
      <div className="flex-1 relative h-[500px] md:h-full w-full">
        {/* Fallback Notice */}
        {mapNotice && (
          <div className="absolute top-3 left-3 z-30 bg-white/90 backdrop-blur-sm border border-[#D9DEE5] rounded px-3 py-1.5 text-xs text-[#5E6B7A] flex items-center gap-1.5 shadow-sm">
            <Info size={14} className="text-[#1565C0]" />
            <span>{mapNotice}</span>
          </div>
        )}

        {useGoogleMaps ? (
          <div ref={googleMapRef} className="w-full h-full" />
        ) : (
          <MapContainer 
            center={[20.5937, 78.9629]} 
            zoom={5} 
            scrollWheelZoom={true} 
            className="w-full h-full"
          >
            {/* Clean OpenStreetMap Tiles without any API Key requirement */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapPanController coords={flyCoords} />

            {layerDemand && hotspots.map((h, i) => (
              <CircleMarker
                key={h.district + i}
                center={[h.lat, h.lng]}
                radius={Math.max(h.score * 0.35, 10)}
                pathOptions={{
                  color: h.score > 60 ? "#D32F2F" : "#1565C0",
                  fillColor: h.score > 60 ? "#D32F2F" : "#1565C0",
                  fillOpacity: 0.5,
                  weight: 2
                }}
                eventHandlers={{
                  click: () => setSelectedHotspot(h)
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <div className="font-bold text-[#0B2545]">{h.district}</div>
                    <div className="text-[#5E6B7A] capitalize">Sector: {h.sector}</div>
                    <div className="font-semibold text-red-700">Priority Score: {h.score}</div>
                    <div className="text-[11px] text-[#1565C0]">{h.scheme}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}

        {/* Drill-down Drawer on marker / zone click */}
        {selectedHotspot && (
          <div className="absolute bottom-4 right-4 z-30 max-w-sm w-full bg-white border border-[#D9DEE5] rounded shadow-xl p-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1565C0]">
                  District Inspection
                </span>
                <h3 className="font-bold text-base text-[#0B2545]">
                  {selectedHotspot.district} ({selectedHotspot.sector?.toUpperCase()})
                </h3>
              </div>
              <button 
                onClick={() => setSelectedHotspot(null)}
                className="text-[#5E6B7A] hover:text-[#0B2545]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-[#F7F5F2] p-2 rounded border border-[#D9DEE5]">
                <div className="text-[10px] text-[#5E6B7A]">Priority Score</div>
                <div className="font-bold text-sm text-[#0B2545]">{selectedHotspot.score}/100</div>
              </div>
              <div className="bg-[#F7F5F2] p-2 rounded border border-[#D9DEE5]">
                <div className="text-[10px] text-[#5E6B7A]">Deficit Index</div>
                <div className="font-bold text-sm text-red-700">{selectedHotspot.deficit}</div>
              </div>
            </div>

            <div className="text-xs text-[#5E6B7A] mb-3">
              <span className="font-semibold text-[#0B2545]">Matching Scheme:</span>{" "}
              {selectedHotspot.scheme}
            </div>

            <button
              onClick={() => setDistrict(selectedHotspot.district)}
              className="w-full py-1.5 bg-[#0B2545] text-white rounded text-xs font-semibold hover:bg-[#081d36] transition-colors"
            >
              Filter National Platform by {selectedHotspot.district}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
