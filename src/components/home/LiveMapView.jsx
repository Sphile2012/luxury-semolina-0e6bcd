import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import RouteOverlay from "./RouteOverlay";
import { entities } from "@/api/client";
import { MapPin, Radio } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const alertIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:#ef4444;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(239,68,68,0.3)">
    <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const deviceIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:24px;height:24px;background:#14b8a6;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4)">
    <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><rect x='5' y='2' width='14' height='20' rx='2' ry='2'/><line x1='12' y1='18' x2='12.01' y2='18'/></svg>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch {}
    }
  }, [points, map]);
  return null;
}

export default function LiveMapView({ user, alerts = [] }) {
  const [liveAlerts, setLiveAlerts] = useState(alerts);

  useEffect(() => { setLiveAlerts(alerts); }, [alerts]);

  const { data: devices = [] } = useQuery({
    queryKey: ["sharedDevices", user?.email],
    queryFn: () => entities.SharedDevice.filter({ owner_email: user.email }),
    enabled: !!user?.email,
    staleTime: 20000,
    refetchInterval: 20000,
  });

  const activeAlerts = liveAlerts.filter(a => a.status === "active" && a.latitude && a.longitude);
  const trackedDevices = devices.filter(d => d.last_latitude && d.last_longitude);

  const allPoints = [
    ...activeAlerts.map(a => [a.latitude, a.longitude]),
    ...trackedDevices.map(d => [d.last_latitude, d.last_longitude]),
  ];

  const defaultCenter = [-26.2041, 28.0473];
  const hasPoints = allPoints.length > 0;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-sm font-semibold flex items-center gap-2">
          <Radio size={14} className="text-teal-400" />
          Live Map
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-[#555]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Alerts
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /> Devices
          </span>
          <span className="flex items-center gap-1">
            <span style={{ display: 'inline-block', width: 14, height: 3, background: '#facc15', borderRadius: 2, verticalAlign: 'middle' }} /> Route
          </span>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-white/[0.07]" style={{ height: 240 }}>
        <MapContainer
          center={defaultCenter}
          zoom={10}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {hasPoints && <FitBounds points={allPoints} />}

          {activeAlerts.map(a => (
            <Marker key={a.id} position={[a.latitude, a.longitude]} icon={alertIcon}>
              <Popup>
                <div style={{ minWidth: 140 }}>
                  <p style={{ fontWeight: 700, color: "#ef4444", marginBottom: 2 }}>🚨 Active Alert</p>
                  <p style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>{a.owner_email}</p>
                  {a.address && <p style={{ fontSize: 11 }}>{a.address}</p>}
                </div>
              </Popup>
              <Circle center={[a.latitude, a.longitude]} radius={150} color="#ef4444" fillColor="#ef4444" fillOpacity={0.08} weight={1} />
            </Marker>
          ))}

          {activeAlerts.map(a => <RouteOverlay key={`route-${a.id}`} alert={a} />)}

          {trackedDevices.map(d => (
            <Marker key={d.id} position={[d.last_latitude, d.last_longitude]} icon={deviceIcon}>
              <Popup>
                <div style={{ minWidth: 140 }}>
                  <p style={{ fontWeight: 700, color: "#0d9488", marginBottom: 2 }}>📱 {d.device_name || "Device"}</p>
                  {d.last_address && <p style={{ fontSize: 11, color: "#555" }}>{d.last_address}</p>}
                  {d.last_accuracy && <p style={{ fontSize: 10, color: "#888", marginTop: 2 }}>±{Math.round(d.last_accuracy)}m accuracy</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {!hasPoints && (
        <p className="text-center text-[#444] text-xs mt-2 flex items-center justify-center gap-1">
          <MapPin size={11} /> No active locations to display
        </p>
      )}
    </div>
  );
}
