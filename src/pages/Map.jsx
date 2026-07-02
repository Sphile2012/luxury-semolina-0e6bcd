import { useState, useEffect, useRef, Fragment } from "react";
import { entities } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Plus, Shield, Trash2, Bell, BellOff, MapPin, Navigation } from "lucide-react";
import SafeZoneCreator from "@/components/map/SafeZoneCreator";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});

const tealIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});

const typeColors = {
  home: "#14b8a6", work: "#6366f1", school: "#f59e0b",
  police: "#3b82f6", hospital: "#ef4444", fire_station: "#f97316",
  security: "#8b5cf6", other: "#10b981",
};

// Component to pan map to user location when it becomes available
function RecenterMap({ location }) {
  const map = useMap();
  const centeredRef = useRef(false);
  useEffect(() => {
    if (location && !centeredRef.current) {
      map.setView([location.lat, location.lng], 15, { animate: true });
      centeredRef.current = true;
    }
  }, [location, map]);
  return null;
}

export default function Map() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const watchIdRef = useRef(null);

  // Watch user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLocationError(null);
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setLocationError("Location access denied. Enable location to see yourself on the map.");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Load alerts and safe zones
  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated || !user) { setLoading(false); return; }

    Promise.all([
      entities.Alert.filter({ owner_email: user.email, status: "active" }),
      entities.SafeZone.filter({ owner_email: user.email }),
    ]).then(([alertData, zoneData]) => {
      setAlerts(alertData);
      setSafeZones(zoneData);
      setLoading(false);
    }).catch((err) => {
      console.error("Map load error:", err);
      setLoading(false);
    });
  }, [isAuthenticated, isLoadingAuth, user]);

  const handleSaveZone = async (zoneData) => {
    if (!user) return;
    try {
      const created = await entities.SafeZone.create({ ...zoneData, owner_email: user.email });
      setSafeZones(prev => [...prev, created]);
    } catch (err) {
      console.error("Save zone error:", err);
    }
    setCreating(false);
  };

  const handleDeleteZone = async (zoneId) => {
    setDeleting(zoneId);
    try {
      await entities.SafeZone.delete(zoneId);
      setSafeZones(prev => prev.filter(z => z.id !== zoneId));
    } catch (err) {
      console.error("Delete zone error:", err);
    }
    setDeleting(null);
  };

  // Default center: Johannesburg
  const mapCenter = [-26.2041, 28.0473];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Live Map</h1>
            <p className="text-[#666] text-sm mt-0.5">Your location & safe zones</p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setCreating(true)}
              disabled={creating}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={16} /> Add Zone
            </button>
          )}
        </div>

        {/* Location error banner */}
        {locationError && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
            <Navigation size={14} className="text-amber-400 shrink-0" />
            <p className="text-amber-400 text-xs">{locationError}</p>
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[#888]">
            <div className="w-3 h-3 bg-blue-500 rounded-full" /> You
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#888]">
            <div className="w-3 h-3 bg-red-500 rounded-full" /> Active alert
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#888]">
            <div className="w-3 h-3 bg-teal-400 rounded-full" /> Safe zone
          </div>
        </div>

        {/* Map */}
        <div className="rounded-3xl overflow-hidden border border-white/10 relative" style={{ height: 420 }}>
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> &copy; <a href="https://carto.com">CARTO</a>'
            />

            {/* Auto-pan to user when GPS arrives */}
            <RecenterMap location={location} />

            {/* User location */}
            {location && (
              <>
                <Marker position={[location.lat, location.lng]}>
                  <Popup>
                    📍 You are here
                    {location.accuracy ? ` (±${Math.round(location.accuracy)}m)` : ""}
                    <br />
                    <a
                      href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 text-xs"
                    >
                      Open in Google Maps
                    </a>
                  </Popup>
                </Marker>
                {location.accuracy && (
                  <Circle
                    center={[location.lat, location.lng]}
                    radius={location.accuracy}
                    color="#3b82f6"
                    fillColor="#3b82f6"
                    fillOpacity={0.1}
                    weight={1}
                  />
                )}
              </>
            )}

            {/* Active alerts */}
            {alerts.filter(a => a.latitude && a.longitude).map(alert => (
              <Marker key={alert.id} position={[alert.latitude, alert.longitude]} icon={redIcon}>
                <Popup>
                  🚨 <strong>Active Alert</strong><br />
                  {alert.message}<br />
                  <a
                    href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-500 text-xs"
                  >
                    Open in Google Maps
                  </a>
                </Popup>
              </Marker>
            ))}

            {/* Safe zones */}
            {safeZones.filter(z => z.latitude && z.longitude).map(zone => {
              const color = typeColors[zone.type] || "#14b8a6";
              return (
                <Fragment key={zone.id}>
                  <Circle
                    center={[zone.latitude, zone.longitude]}
                    radius={zone.radius || 200}
                    color={color}
                    fillColor={color}
                    fillOpacity={0.12}
                    weight={2}
                  />
                  <Marker position={[zone.latitude, zone.longitude]} icon={tealIcon}>
                    <Popup>
                      <strong>{zone.name}</strong><br />
                      Type: {zone.type?.replace("_", " ")}<br />
                      Radius: {zone.radius || 200}m<br />
                      {zone.alert_on_exit ? "✅ Exit alerts ON" : "❌ Exit alerts OFF"}
                    </Popup>
                  </Marker>
                </Fragment>
              );
            })}

            {creating && (
              <SafeZoneCreator onSave={handleSaveZone} onCancel={() => setCreating(false)} />
            )}
          </MapContainer>
        </div>

        {/* Location coordinates display */}
        {location && (
          <div className="mt-3 flex items-center gap-2 text-[#555] text-xs">
            <MapPin size={11} />
            <span className="font-mono">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
            {location.accuracy && <span>±{Math.round(location.accuracy)}m</span>}
            <a
              href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-teal-500 hover:text-teal-400 transition-colors"
            >
              Open in Google Maps →
            </a>
          </div>
        )}

        {/* My Safe Zones list */}
        {isAuthenticated && (
          <div className="mt-6">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Shield size={16} className="text-teal-400" />
              My Safe Zones
              <span className="text-[#666] text-xs font-normal">({safeZones.length})</span>
            </h2>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
              </div>
            ) : safeZones.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 text-center">
                <Shield size={32} className="mx-auto text-[#333] mb-3" />
                <p className="text-[#666] text-sm">No safe zones yet</p>
                <p className="text-[#444] text-xs mt-1">Tap "Add Zone" to define a boundary.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {safeZones.map(z => {
                  const color = typeColors[z.type] || "#14b8a6";
                  return (
                    <div key={z.id} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: color + "20", border: `1px solid ${color}40` }}
                      >
                        <Shield size={16} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{z.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[#555] text-xs capitalize">{z.type?.replace("_", " ")} · {z.radius || 200}m</span>
                          {z.alert_on_exit
                            ? <span className="flex items-center gap-1 text-teal-400 text-[10px]"><Bell size={9} /> Alerts on</span>
                            : <span className="flex items-center gap-1 text-[#555] text-[10px]"><BellOff size={9} /> Alerts off</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteZone(z.id)}
                        disabled={deleting === z.id}
                        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!isAuthenticated && !isLoadingAuth && (
          <div className="mt-6 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 text-center">
            <p className="text-[#666] text-sm mb-3">Sign in to save and manage your safe zones</p>
            <a href="/Login" className="inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors">
              Sign In
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
