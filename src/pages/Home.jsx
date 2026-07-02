import { useEffect, useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { entities, functions } from "@/api/client";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Plus, Zap, Users, HeartPulse, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import LandingHero from "@/components/home/LandingHero";
import OnboardingSetup from "@/components/home/OnboardingSetup";
import HomeSkeleton from "@/components/home/HomeSkeleton";
import EmergencyCallingScreen from "@/components/home/EmergencyCallingScreen";
import TapToAlert from "@/components/home/TapToAlert";
import useBatteryMonitor from "@/hooks/useBatteryMonitor";
import useSmartLocation from "@/hooks/useSmartLocation";

// ── Haversine: metres between two coords ─────────────────────────────
function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(m) {
  if (!m) return "—";
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

// Nearest emergency facility types via Overpass API (OpenStreetMap)
// Returns closest distance in metres for hospitals, defibrillators
async function fetchNearby(lat, lng) {
  const r = 5000; // 5 km radius
  const query = `[out:json][timeout:10];
(
  node["amenity"="hospital"](around:${r},${lat},${lng});
  node["amenity"="clinic"](around:${r},${lat},${lng});
  node["emergency"="defibrillator"](around:${r},${lat},${lng});
  node["emergency"="ambulance_station"](around:${r},${lat},${lng});
);
out body;`;
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: { "Content-Type": "text/plain" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.elements || [];
  } catch {
    return null;
  }
}

// ── Safety stats for swipeable panel ─────────────────────────────────
function buildStats(contacts, alerts, locAvailable, locationSource, accuracy) {
  const resolved = alerts.filter(a => a.status === "resolved").length;
  const safetyPct = Math.min(
    100,
    Math.round(30 + contacts.length * 10 + resolved * 5 + (locAvailable ? 15 : 0))
  );
  const sourceLabel = locationSource === "gps" ? "GPS" : locationSource === "network" ? "Network" : "Cached";
  const accText = accuracy ? `±${Math.round(accuracy)}m` : "";
  return [
    {
      pct: safetyPct,
      label: "Your safety",
      sub: contacts.length > 0 ? `${contacts.length} contact${contacts.length !== 1 ? "s" : ""} ready` : "Add contacts to improve",
    },
    {
      pct: locAvailable ? Math.max(30, Math.min(100, 100 - Math.round((accuracy || 200) / 5))) : 10,
      label: "Location accuracy",
      sub: locAvailable ? `${sourceLabel} · ${accText}` : "Enable location services",
    },
    {
      pct: Math.min(100, contacts.length * 20),
      label: "Contact coverage",
      sub: `${contacts.length} of 5 recommended`,
    },
  ];
}

// ── Metallic PANIC button SVG ─────────────────────────────────────────
function PanicButtonSVG({ onStart, onEnd, isActive, pressing, holdPct }) {
  return (
    <div
      className="relative flex items-center justify-center mx-auto select-none"
      style={{ width: "min(270px, 76vw)", height: "min(270px, 76vw)" }}
    >
      <svg viewBox="0 0 280 280" width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <radialGradient id="sg1" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#ECECEC" /><stop offset="25%" stopColor="#C0C0C0" />
            <stop offset="55%" stopColor="#888" /><stop offset="80%" stopColor="#646464" />
            <stop offset="100%" stopColor="#4A4A4A" />
          </radialGradient>
          <radialGradient id="sg2" cx="42%" cy="38%" r="58%">
            <stop offset="0%" stopColor="#D8D8D8" /><stop offset="35%" stopColor="#9A9A9A" />
            <stop offset="70%" stopColor="#646464" /><stop offset="100%" stopColor="#404040" />
          </radialGradient>
          <radialGradient id="rd1" cx="36%" cy="26%" r="68%">
            <stop offset="0%" stopColor="#FF9090" /><stop offset="20%" stopColor="#E03030" />
            <stop offset="55%" stopColor="#AA0000" /><stop offset="80%" stopColor="#720000" />
            <stop offset="100%" stopColor="#4A0000" />
          </radialGradient>
          <radialGradient id="rd2" cx="40%" cy="36%" r="60%">
            <stop offset="0%" stopColor="#CC4040" /><stop offset="40%" stopColor="#880000" />
            <stop offset="100%" stopColor="#3A0000" />
          </radialGradient>
          <radialGradient id="dh" cx="33%" cy="24%" r="52%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="9" floodColor="#000" floodOpacity="0.55" />
          </filter>
          <filter id="is" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.65" />
          </filter>
          {/* Circular progress track */}
          <path id="progressTrack" d="M 140,30 A 110,110 0 1,1 139.99,30" fill="none" />
        </defs>

        {/* Outer brushed steel disc */}
        <circle cx="140" cy="140" r="136" fill="url(#sg1)" filter="url(#ds)" />

        {/* Inner steel ring inset */}
        <circle cx="140" cy="140" r="108" fill="none" stroke="#2E2E2E" strokeWidth="7" />
        <circle cx="140" cy="140" r="105" fill="url(#sg2)" />

        {/* 4 screws */}
        {[[140,14],[266,140],[140,266],[14,140]].map(([cx,cy],i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="9.5" fill="url(#sg1)" stroke="#3A3A3A" strokeWidth="1.2" />
            <line x1={cx-5.5} y1={cy} x2={cx+5.5} y2={cy} stroke="#505050" strokeWidth="1.8" strokeLinecap="round" />
            <line x1={cx} y1={cy-5.5} x2={cx} y2={cy+5.5} stroke="#505050" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        ))}

        {/* Hold progress arc */}
        {pressing && holdPct > 0 && (
          <circle
            cx="140" cy="140" r="110"
            fill="none" stroke="#FF4444" strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 110 * holdPct / 100} ${2 * Math.PI * 110}`}
            strokeDashoffset={2 * Math.PI * 110 * 0.25}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "140px 140px" }}
          />
        )}

        {/* Red dome */}
        <circle cx="140" cy="136" r="90"
          fill={pressing ? "url(#rd2)" : "url(#rd1)"}
          filter="url(#is)"
        />
        {/* Dome gloss highlight */}
        <ellipse cx="116" cy="100" rx="40" ry="26" fill="url(#dh)" />

        {/* Exclamation mark */}
        <text x="140" y="152" textAnchor="middle"
          fill="rgba(60,0,0,0.65)" fontSize="56" fontWeight="900" fontFamily="'Arial Black',Arial,sans-serif">!</text>

        {/* PANIC arcs */}
        <path id="ta" d="M 35,140 A 105,105 0 0,1 245,140" fill="none" />
        <text fontSize="14" fontWeight="900" fontFamily="'Arial Black',Arial,sans-serif" fill="#CACACA" letterSpacing="7">
          <textPath href="#ta" startOffset="22%">PANIC</textPath>
        </text>
        <path id="la" d="M 140,35 A 105,105 0 0,0 140,245" fill="none" />
        <text fontSize="12" fontWeight="900" fontFamily="'Arial Black',Arial,sans-serif" fill="#9A9A9A" letterSpacing="5">
          <textPath href="#la" startOffset="14%">PANIC</textPath>
        </text>
        <path id="ra" d="M 140,245 A 105,105 0 0,0 140,35" fill="none" />
        <text fontSize="12" fontWeight="900" fontFamily="'Arial Black',Arial,sans-serif" fill="#9A9A9A" letterSpacing="5">
          <textPath href="#ra" startOffset="14%">PANIC</textPath>
        </text>

        {/* Active pulse */}
        {isActive && (
          <>
            <circle cx="140" cy="140" r="92" fill="none" stroke="#FF3030" strokeWidth="4" opacity="0.7">
              <animate attributeName="r" values="92;135;92" dur="1.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="1.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="140" cy="140" r="92" fill="none" stroke="#FF6060" strokeWidth="2" opacity="0.4">
              <animate attributeName="r" values="92;150;92" dur="1.3s" begin="0.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur="1.3s" begin="0.3s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>

      {/* Invisible touch target over dome */}
      <button
        className="absolute rounded-full focus:outline-none cursor-pointer"
        style={{ width: "65%", height: "65%", zIndex: 10, background: "transparent", WebkitTapHighlightColor: "transparent" }}
        onMouseDown={onStart} onMouseUp={onEnd} onMouseLeave={onEnd}
        onTouchStart={onStart} onTouchEnd={onEnd}
        aria-label="PANIC — hold to trigger emergency alert"
      />
    </div>
  );
}

// ── Teal location pin tile ────────────────────────────────────────────
function PinTile({ icon: Icon, label, value, loading: tileLoading }) {
  return (
    <div className="flex flex-col items-center" style={{ flex: 1, minWidth: 0, padding: "0 4px" }}>
      <span style={{ fontSize: 10, color: "#5A6A6E", fontWeight: 600, textAlign: "center", marginBottom: 4, whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div className="relative flex items-center justify-center" style={{ width: 40, height: 50, flexShrink: 0 }}>
        <svg viewBox="0 0 40 50" width="40" height="50" style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <radialGradient id={`pg_${label.replace(/\s/g,"")}`} cx="38%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#56D0D8" /><stop offset="100%" stopColor="#189098" />
            </radialGradient>
          </defs>
          <path d="M20 2C10.6 2 3 9.6 3 18.5c0 10.2 13.8 27.2 15.8 29.5.6.6 1.8.6 2.4 0C23.2 45.7 37 28.7 37 18.5 37 9.6 29.4 2 20 2z"
            fill={`url(#pg_${label.replace(/\s/g,"")})`} />
          <circle cx="20" cy="18.5" r="10" fill="rgba(255,255,255,0.22)" />
        </svg>
        <div style={{ position: "relative", zIndex: 1, marginTop: -8 }}>
          <Icon size={14} color="#fff" strokeWidth={2.5} />
        </div>
      </div>
      <span style={{ fontSize: 11, color: "#1E3038", fontWeight: 700, marginTop: 2, textAlign: "center" }}>
        {tileLoading ? "…" : value}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function Home() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Smart GPS with fallback (REQ 1)
  const { coords, source: locSource, accuracy, unavailable: locUnavailable, loading: locLoading } =
    useSmartLocation({ enabled: true });

  const [statIdx, setStatIdx] = useState(0);
  const [showCallingScreen, setShowCallingScreen] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [holdPct, setHoldPct] = useState(0);
  const [nearbyDists, setNearbyDists] = useState({ hospital: null, defibrillator: null });
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const holdInterval = useRef(null);
  const nearbyFetched = useRef(false);

  // ── Queries
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['safetyProfile', user?.email],
    queryFn: () => entities.SafetyProfile.filter({ owner_email: user.email }).then(d => d[0] || null),
    enabled: !!user?.email, staleTime: 60000,
  });
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', user?.email],
    queryFn: () => entities.Alert.filter({ owner_email: user.email }, '-created_date', 10),
    enabled: !!user?.email, staleTime: 20000, refetchInterval: 30000,
  });
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts', user?.email],
    queryFn: () => entities.EmergencyContact.filter({ owner_email: user.email }, 'priority', 20),
    enabled: !!user?.email, staleTime: 120000,
  });

  const loading = profileLoading || alertsLoading || contactsLoading;
  const activeAlert = alerts.find(a => a.status === 'active') || null;
  const needsOnboarding = !loading && isAuthenticated && !profile;
  const locAvailable = !!coords && !locUnavailable;
  const stats = buildStats(contacts, alerts, locAvailable, locSource, accuracy);

  useBatteryMonitor(user, contacts);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['alerts', user?.email] });
    queryClient.invalidateQueries({ queryKey: ['safetyProfile', user?.email] });
  }, [queryClient, user?.email]);

  // Fetch real nearby facility distances once GPS is available
  useEffect(() => {
    if (!coords || nearbyFetched.current) return;
    nearbyFetched.current = true;
    setNearbyLoading(true);
    fetchNearby(coords.latitude, coords.longitude).then(elements => {
      if (!elements) { setNearbyLoading(false); return; }
      let minHospital = Infinity, minDefib = Infinity;
      for (const el of elements) {
        const d = haversineM(coords.latitude, coords.longitude, el.lat, el.lon);
        if (el.tags?.amenity === "hospital" || el.tags?.amenity === "clinic") {
          if (d < minHospital) minHospital = d;
        }
        if (el.tags?.emergency === "defibrillator") {
          if (d < minDefib) minDefib = d;
        }
      }
      setNearbyDists({
        hospital: minHospital === Infinity ? null : minHospital,
        defibrillator: minDefib === Infinity ? null : minDefib,
      });
      setNearbyLoading(false);
    });
  }, [coords]);

  // Stream location → active alert
  useEffect(() => {
    if (!activeAlert || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      pos => entities.Alert.update(activeAlert.id, {
        latitude: pos.coords.latitude, longitude: pos.coords.longitude,
      }), null, { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [activeAlert?.id]);

  // Battery push to backend
  useEffect(() => {
    if (!user?.email || !profile?.device_imei) return;
    if (!('getBattery' in navigator)) return;
    const push = async () => {
      try {
        const bat = await navigator['getBattery']?.();
        if (!bat) return;
        const info = (await import("@/hooks/useDeviceFingerprint")).getDeviceInfo();
        await functions.invoke("updateDeviceLocation", {
          latitude: coords?.latitude, longitude: coords?.longitude,
          accuracy: accuracy || null,
          deviceId: info.deviceId, deviceName: info.deviceName,
          platform: info.platform,
          batteryLevel: bat.level, batteryCharging: bat.charging,
        });
      } catch {}
    };
    push();
    const iv = setInterval(push, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [user?.email, profile?.device_imei, coords, accuracy]);

  const handleAlertResolved = async (alertId) => {
    await entities.Alert.update(alertId, { status: 'resolved', resolved_at: new Date().toISOString() });
    setShowCallingScreen(false);
    invalidateAll();
  };

  const handleAlertTriggered = useCallback(() => {
    setShowCallingScreen(true);
    invalidateAll();
  }, [invalidateAll]);

  // Hold 2s → SOS
  const startHold = useCallback(() => {
    setPressing(true);
    setHoldPct(0);
    const start = Date.now();
    holdInterval.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / 2000) * 100);
      setHoldPct(pct);
      if (pct >= 100) {
        clearInterval(holdInterval.current);
        setPressing(false);
        setHoldPct(0);
        handleAlertTriggered();
      }
    }, 30);
  }, [handleAlertTriggered]);

  const cancelHold = useCallback(() => {
    clearInterval(holdInterval.current);
    setPressing(false);
    setHoldPct(0);
  }, []);

  if (isLoadingAuth || (isAuthenticated && loading)) return <HomeSkeleton />;
  if (!isAuthenticated) return <LandingHero onGetStarted={() => navigate('/Login')} />;
  if (!loading && needsOnboarding) return <OnboardingSetup user={user} onComplete={invalidateAll} />;

  const cur = stats[statIdx];

  const nearbyItems = [
    {
      label: "Emergency",
      icon: Plus,
      value: nearbyDists.hospital != null ? fmtDist(nearbyDists.hospital) : locAvailable ? "searching…" : "—",
    },
    {
      label: "Defibrillator",
      icon: Zap,
      value: nearbyDists.defibrillator != null ? fmtDist(nearbyDists.defibrillator) : locAvailable ? "searching…" : "—",
    },
    { label: "Rescuers",  icon: Users,      value: String(contacts.length) },
    { label: "Users",     icon: HeartPulse, value: "0" },
  ];

  return (
    <div
      className="flex flex-col"
      style={{
        minHeight: "100dvh",
        height: "100dvh",
        background: "linear-gradient(180deg, #C4D8DA 0%, #D4E9EB 28%, #B6DCE2 100%)",
        overflowX: "hidden",
        overflowY: "auto",
        maxWidth: 480,
        width: "100%",
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Overlays */}
      <AnimatePresence>
        {showCallingScreen && activeAlert && (
          <EmergencyCallingScreen
            contacts={contacts} alert={activeAlert}
            user={user} onDismiss={() => setShowCallingScreen(false)}
          />
        )}
      </AnimatePresence>
      <TapToAlert corner="bottom-right" onTriggered={handleAlertTriggered} />

      {/* Active alert strip */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            key="alertStrip"
            initial={{ y: -52 }} animate={{ y: 0 }} exit={{ y: -52 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
            style={{ height: 44, background: "#C41A1A", maxWidth: 480, margin: "0 auto" }}
          >
            <div className="flex items-center gap-2">
              <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}
                className="w-2.5 h-2.5 rounded-full bg-white" />
              <span className="text-white font-black" style={{ fontSize: 13 }}>🚨 EMERGENCY ACTIVE</span>
            </div>
            <button onClick={() => handleAlertResolved(activeAlert.id)}
              className="bg-white text-red-700 font-black rounded-full px-3 py-1" style={{ fontSize: 11 }}>
              Resolve
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP BAR */}
      <header
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{
          height: 52,
          background: "rgba(255,255,255,0.58)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.72)",
          marginTop: activeAlert ? 44 : 0,
        }}
      >
        <div className="flex items-center gap-0.5">
          <span style={{ color: "#C41A1A", fontWeight: 900, fontSize: 22, lineHeight: 1 }}>i</span>
          <span style={{ color: "#1E2A2C", fontWeight: 900, fontSize: 16 }}>
            {user?.full_name?.split(" ")[0]
              ? `HELLO, ${user.full_name.split(" ")[0].toUpperCase()}`
              : "PANIC RING"}
          </span>
        </div>
        {/* Location indicator + settings */}
        <div className="flex items-center gap-3">
          {!locUnavailable && (
            <div className="flex items-center gap-1" style={{ opacity: locLoading ? 0.5 : 1 }}>
              <div className="w-2 h-2 rounded-full"
                style={{ background: locAvailable ? "#22C55E" : "#F59E0B",
                  boxShadow: locAvailable ? "0 0 5px #22C55E" : "none" }} />
              <span style={{ fontSize: 10, color: "#3A6A6E", fontWeight: 600 }}>
                {locLoading ? "Locating…" : locSource === "gps" ? "GPS" : locSource === "network" ? "Cell" : "Cached"}
                {accuracy && !locLoading ? ` ±${Math.round(accuracy)}m` : ""}
              </span>
            </div>
          )}
          {locUnavailable && (
            <div className="flex items-center gap-1">
              <MapPin size={12} color="#F59E0B" />
              <span style={{ fontSize: 10, color: "#B87A00", fontWeight: 600 }}>No GPS</span>
            </div>
          )}
          <Link to="/Settings" aria-label="Settings">
            <Settings size={20} color="#1E2A2C" />
          </Link>
        </div>
      </header>

      {/* ── NEARBY ROW */}
      <div
        className="flex items-start justify-around flex-shrink-0 px-2 py-3"
        style={{ background: "rgba(255,255,255,0.42)", borderBottom: "1px solid rgba(255,255,255,0.65)" }}
      >
        {nearbyItems.map(item => (
          <PinTile key={item.label} icon={item.icon} label={item.label}
            value={item.value} loading={nearbyLoading && locAvailable && item.value === "searching…"} />
        ))}
      </div>

      {/* ── SAFETY % PANEL (swipeable, flex-1) */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 relative" style={{ minHeight: 180 }}>
        <button
          onClick={() => setStatIdx(i => (i - 1 + stats.length) % stats.length)}
          className="absolute flex items-center justify-center rounded-full"
          style={{ left: 6, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.7)" }}
          aria-label="Previous stat"
        >
          <ChevronLeft size={18} color="#2A8A90" />
        </button>
        <button
          onClick={() => setStatIdx(i => (i + 1) % stats.length)}
          className="absolute flex items-center justify-center rounded-full"
          style={{ right: 6, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.7)" }}
          aria-label="Next stat"
        >
          <ChevronRight size={18} color="#2A8A90" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={statIdx}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.2 }}
            className="text-center"
            style={{ paddingLeft: 40, paddingRight: 40 }}
          >
            <p style={{ fontSize: "clamp(52px,16vw,80px)", fontWeight: 900, color: "#38A8B5", lineHeight: 1, marginBottom: 2 }}>
              {cur.pct}%
            </p>
            <p style={{ fontSize: "clamp(18px,5.5vw,28px)", fontWeight: 600, color: "#38A8B5", marginBottom: 4 }}>
              {cur.label}
            </p>
            <p style={{ fontSize: 12, color: "#527A80" }}>{cur.sub}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              {stats.map((_, i) => (
                <button key={i} onClick={() => setStatIdx(i)}
                  style={{
                    width: i === statIdx ? 18 : 7, height: 7, borderRadius: 4,
                    background: i === statIdx ? "#38A8B5" : "rgba(56,168,181,0.28)",
                    transition: "all 0.2s", border: "none",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── BOTTOM SECTION: wave + PANIC button + circles */}
      <div className="flex-shrink-0 relative" style={{ paddingBottom: "max(env(safe-area-inset-bottom,0px), 72px)" }}>
        {/* White wave */}
        <svg viewBox="0 0 480 180" preserveAspectRatio="none"
          style={{ width: "100%", height: "clamp(120px,38vw,180px)", display: "block", marginBottom: -2 }}>
          <path d="M0,80 Q80,24 180,58 Q290,96 400,44 Q450,24 480,38 L480,180 L0,180 Z"
            fill="rgba(255,255,255,0.48)" />
          <path d="M0,100 Q80,46 180,76 Q290,112 400,62 Q450,42 480,56 L480,180 L0,180 Z"
            fill="rgba(255,255,255,0.76)" />
        </svg>

        {/* PANIC button */}
        <div className="relative flex flex-col items-center" style={{ zIndex: 2, marginTop: -20 }}>
          <p style={{ fontSize: 10, color: "#8A6060", fontWeight: 700, letterSpacing: 2, marginBottom: 4, textTransform: "uppercase" }}>
            {pressing ? `Hold… ${Math.round(holdPct)}%` : activeAlert ? "Alert active — tap to view" : "Hold 2 s to trigger SOS"}
          </p>

          <PanicButtonSVG
            onStart={startHold}
            onEnd={cancelHold}
            isActive={!!activeAlert}
            pressing={pressing}
            holdPct={holdPct}
          />

          {pressing && (
            <p style={{ fontSize: 10, color: "#999", marginTop: 4 }}>Release to cancel</p>
          )}
        </div>

        {/* Bottom circles */}
        <div className="relative" style={{ height: "clamp(100px,32vw,130px)", zIndex: 3 }}>
          {/* HELP OTHERS */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => navigate('/Contacts')}
            className="absolute flex flex-col items-center justify-center rounded-full"
            style={{
              width: "clamp(88px,26vw,108px)", height: "clamp(88px,26vw,108px)",
              bottom: 12, left: "calc(50% - clamp(112px,33vw,130px))",
              background: "radial-gradient(circle at 40% 32%, #F06060, #B01818)",
              boxShadow: "4px 5px 16px rgba(160,20,20,0.55), inset -3px -3px 8px rgba(0,0,0,0.22), inset 2px 2px 6px rgba(255,140,140,0.2)",
            }}
          >
            <Users size={18} color="#fff" strokeWidth={2} />
            <span className="text-white font-black text-center leading-tight"
              style={{ fontSize: "clamp(9px,2.4vw,11px)", marginTop: 3 }}>HELP{"\n"}OTHERS</span>
          </motion.button>

          {/* I NEED HELP */}
          <motion.button
            onMouseDown={startHold} onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold} onTouchEnd={cancelHold}
            className="absolute flex flex-col items-center justify-center rounded-full"
            style={{
              width: "clamp(118px,36vw,144px)", height: "clamp(118px,36vw,144px)",
              bottom: 0, left: "50%", transform: "translateX(-50%)",
              background: pressing
                ? "radial-gradient(circle at 42% 36%, #CC2828, #880000)"
                : "radial-gradient(circle at 38% 30%, #E83535, #A01010)",
              boxShadow: pressing
                ? "0 3px 20px rgba(136,0,0,0.72), inset -3px -4px 10px rgba(0,0,0,0.32)"
                : "5px 7px 22px rgba(160,16,16,0.62), inset -4px -5px 12px rgba(0,0,0,0.26), inset 2px 2px 7px rgba(255,140,140,0.18)",
              zIndex: 10,
            }}
            animate={activeAlert ? { scale: [1, 1.04, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.3 }}
          >
            {pressing && (
              <motion.div className="absolute inset-0 rounded-full border-4 border-white/35"
                animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 0.72 }} />
            )}
            <span className="text-white font-black text-center leading-tight"
              style={{ fontSize: "clamp(11px,3.4vw,14px)", zIndex: 1 }}>
              {pressing ? "SENDING…" : "I NEED\nHELP"}
            </span>
          </motion.button>

          {/* Grey expand circle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/AlertHistory')}
            className="absolute flex items-center justify-center rounded-full"
            style={{
              width: "clamp(52px,15vw,64px)", height: "clamp(52px,15vw,64px)",
              bottom: 38, right: "calc(50% - clamp(112px,33vw,130px))",
              background: "radial-gradient(circle at 38% 32%, #E2E2E2, #B2B2B2)",
              boxShadow: "3px 4px 10px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(0,0,0,0.12), inset 1px 1px 4px rgba(255,255,255,0.55)",
            }}
          >
            <span style={{ fontSize: 16, color: "#777", lineHeight: 1 }}>↗</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
