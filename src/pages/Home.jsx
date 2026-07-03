import { useEffect, useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { entities, functions } from "@/api/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Plus, Zap, Users, HeartPulse,
  ChevronLeft, ChevronRight, MapPin, Shield,
  Phone, Navigation, Watch, Bell, Mic, Map,
  PhoneCall, History
} from "lucide-react";import LandingHero from "@/components/home/LandingHero";
import OnboardingSetup from "@/components/home/OnboardingSetup";
import HomeSkeleton from "@/components/home/HomeSkeleton";
import EmergencyCallingScreen from "@/components/home/EmergencyCallingScreen";
import TapToAlert from "@/components/home/TapToAlert";
import useBatteryMonitor from "@/hooks/useBatteryMonitor";
import useSmartLocation from "@/hooks/useSmartLocation";

/* ── helpers ─────────────────────────────────────────────────────── */
function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function fmtDist(m) {
  if (!m) return "—";
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
async function fetchNearby(lat, lng) {
  const r = 5000;
  const q = `[out:json][timeout:10];(node["amenity"="hospital"](around:${r},${lat},${lng});node["amenity"="clinic"](around:${r},${lat},${lng});node["emergency"="defibrillator"](around:${r},${lat},${lng}););out body;`;
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST", body: q, headers: { "Content-Type": "text/plain" }
    });
    return (await res.json()).elements || [];
  } catch { return []; }
}
function buildStats(contacts, alerts, locAvail, locSource, accuracy) {
  const resolved = alerts.filter(a => a.status === "resolved").length;
  const pct = Math.min(100, Math.round(30 + contacts.length * 10 + resolved * 5 + (locAvail ? 15 : 0)));
  const src = locSource === "gps" ? "GPS" : locSource === "network" ? "Network" : "Cached";
  return [
    { pct, label: "Your safety", sub: contacts.length > 0 ? `${contacts.length} contact${contacts.length !== 1 ? "s" : ""} ready` : "Add contacts to improve" },
    { pct: locAvail ? Math.max(30, Math.min(100, 100 - Math.round((accuracy || 200) / 5))) : 10, label: "Location accuracy", sub: locAvail ? `${src} · ±${Math.round(accuracy || 0)}m` : "Enable location services" },
    { pct: Math.min(100, contacts.length * 20), label: "Contact coverage", sub: `${contacts.length} of 5 recommended` },
  ];
}

/* ── Metallic PANIC button ────────────────────────────────────────── */
function PanicBtn({ onStart, onEnd, active, pressing, pct }) {
  const CX = 130, CY = 130, RI = 100, RD = 84;
  const circ = 2 * Math.PI * (RI + 4);
  return (
    <div style={{ width: "min(240px,66vw)", height: "min(240px,66vw)", position: "relative", margin: "0 auto" }}>
      <svg viewBox="0 0 260 260" width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <radialGradient id="sO" cx="38%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#E8E8E8"/><stop offset="28%" stopColor="#B8B8B8"/>
            <stop offset="58%" stopColor="#848484"/><stop offset="82%" stopColor="#606060"/>
            <stop offset="100%" stopColor="#484848"/>
          </radialGradient>
          <radialGradient id="sI" cx="42%" cy="36%" r="58%">
            <stop offset="0%" stopColor="#D4D4D4"/><stop offset="35%" stopColor="#969696"/>
            <stop offset="70%" stopColor="#626262"/><stop offset="100%" stopColor="#3E3E3E"/>
          </radialGradient>
          <radialGradient id="rN" cx="36%" cy="26%" r="68%">
            <stop offset="0%" stopColor="#FF9090"/><stop offset="18%" stopColor="#E03030"/>
            <stop offset="54%" stopColor="#AA0000"/><stop offset="80%" stopColor="#720000"/>
            <stop offset="100%" stopColor="#4A0000"/>
          </radialGradient>
          <radialGradient id="rP" cx="40%" cy="36%" r="60%">
            <stop offset="0%" stopColor="#CC3030"/><stop offset="40%" stopColor="#860000"/>
            <stop offset="100%" stopColor="#380000"/>
          </radialGradient>
          <radialGradient id="dH" cx="32%" cy="22%" r="52%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.65)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
          <filter id="ds"><feDropShadow dx="0" dy="5" stdDeviation="9" floodColor="#000" floodOpacity="0.55"/></filter>
          <filter id="is"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.6"/></filter>
        </defs>
        <circle cx={CX} cy={CY} r="126" fill="url(#sO)" filter="url(#ds)"/>
        <circle cx={CX} cy={CY} r={RI+2} fill="none" stroke="#2C2C2C" strokeWidth="7"/>
        <circle cx={CX} cy={CY} r={RI} fill="url(#sI)"/>
        {/* 4 screws */}
        {[[CX,4],[256,CY],[CX,256],[4,CY]].map(([x,y],i)=>(
          <g key={i}>
            <circle cx={x} cy={y} r="9" fill="url(#sO)" stroke="#383838" strokeWidth="1.2"/>
            <line x1={x-5} y1={y} x2={x+5} y2={y} stroke="#4E4E4E" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1={x} y1={y-5} x2={x} y2={y+5} stroke="#4E4E4E" strokeWidth="1.8" strokeLinecap="round"/>
          </g>
        ))}
        {/* Progress arc */}
        {pressing && pct > 0 && (
          <circle cx={CX} cy={CY} r={RI+4} fill="none" stroke="#FF3333" strokeWidth="7"
            strokeDasharray={`${circ*pct/100} ${circ}`} strokeDashoffset={circ*0.25} strokeLinecap="round"
            style={{ transform:"rotate(-90deg)", transformOrigin:`${CX}px ${CY}px` }}/>
        )}
        {/* Red dome */}
        <circle cx={CX} cy={CY-3} r={RD} fill={pressing?"url(#rP)":"url(#rN)"} filter="url(#is)"/>
        <ellipse cx={CX-16} cy={CY-36} rx="36" ry="22" fill="url(#dH)"/>
        <text x={CX} y={CY+18} textAnchor="middle" fill="rgba(55,0,0,0.6)"
          fontSize="52" fontWeight="900" fontFamily="'Arial Black',Arial,sans-serif">!</text>
        {/* PANIC arcs */}
        <path id="tA" d={`M ${CX-96},${CY} A 96,96 0 0,1 ${CX+96},${CY}`} fill="none"/>
        <text fontSize="13" fontWeight="900" fontFamily="'Arial Black',Arial,sans-serif" fill="#C8C8C8" letterSpacing="7">
          <textPath href="#tA" startOffset="22%">PANIC</textPath></text>
        <path id="lA" d={`M ${CX},${CY-96} A 96,96 0 0,0 ${CX},${CY+96}`} fill="none"/>
        <text fontSize="11" fontWeight="900" fontFamily="'Arial Black',Arial,sans-serif" fill="#989898" letterSpacing="5">
          <textPath href="#lA" startOffset="14%">PANIC</textPath></text>
        <path id="rA" d={`M ${CX},${CY+96} A 96,96 0 0,0 ${CX},${CY-96}`} fill="none"/>
        <text fontSize="11" fontWeight="900" fontFamily="'Arial Black',Arial,sans-serif" fill="#989898" letterSpacing="5">
          <textPath href="#rA" startOffset="14%">PANIC</textPath></text>
        {/* Active pulses */}
        {active && (<>
          <circle cx={CX} cy={CY} r={RD+4} fill="none" stroke="#FF2222" strokeWidth="4" opacity="0.7">
            <animate attributeName="r" values={`${RD+4};${RD+44};${RD+4}`} dur="1.3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.7;0;0.7" dur="1.3s" repeatCount="indefinite"/>
          </circle>
        </>)}
      </svg>
      <button onMouseDown={onStart} onMouseUp={onEnd} onMouseLeave={onEnd}
        onTouchStart={onStart} onTouchEnd={onEnd}
        aria-label="PANIC — hold 2s to trigger SOS"
        style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)",
          width:"62%", height:"62%", borderRadius:"50%", background:"transparent", border:"none",
          cursor:"pointer", WebkitTapHighlightColor:"transparent", zIndex:10 }}/>
    </div>
  );
}

/* ── Teal pin tile ─────────────────────────────────────────────── */
function PinTile({ icon: Icon, label, value, dim }) {
  return (
    <div className="flex flex-col items-center" style={{ flex: 1, minWidth: 0, padding: "0 2px" }}>
      <span style={{ fontSize: 9, color: "#5A6A6E", fontWeight: 600, textAlign: "center",
        marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        maxWidth: "100%", width: "100%" }}>{label}</span>
      <div style={{ position: "relative", width: 34, height: 44, flexShrink: 0 }}>
        <svg viewBox="0 0 34 44" width="34" height="44" style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <radialGradient id={`pg${label.replace(/\s/g, "")}`} cx="38%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#52CCD4"/><stop offset="100%" stopColor="#168890"/>
            </radialGradient>
          </defs>
          <path d="M17 1C9.3 1 3 7.3 3 15c0 8.8 11.6 24.5 13.2 26.5.4.5 1.2.5 1.6 0C19.4 39.5 31 23.8 31 15 31 7.3 24.7 1 17 1z"
            fill={`url(#pg${label.replace(/\s/g, "")})`}/>
          <circle cx="17" cy="15" r="8" fill="rgba(255,255,255,0.2)"/>
        </svg>
        <div style={{ position: "absolute", top: 5, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <Icon size={12} color="#fff" strokeWidth={2.5}/>
        </div>
      </div>
      <span style={{ fontSize: 10, color: dim ? "#8A9AA0" : "#1C3038", fontWeight: 700,
        marginTop: 1, textAlign: "center" }}>{value}</span>
    </div>
  );
}

/* ── Feature card shown below PANIC button ─────────────────────── */
const FEATURES = [
  { icon: Phone,     label: "SOS Alert",      desc: "Instant emergency alert",        color: "#E03030", bg: "rgba(224,48,48,0.1)" },
  { icon: MapPin,    label: "Live GPS",        desc: "Real-time tracking",             color: "#1A8A90", bg: "rgba(26,138,144,0.1)" },
  { icon: Users,     label: "Contacts",        desc: "Emergency contact list",         color: "#7C3AC9", bg: "rgba(124,58,201,0.1)" },
  { icon: Navigation,label: "Journey",         desc: "Share your route",               color: "#2D8A5A", bg: "rgba(45,138,90,0.1)" },
  { icon: PhoneCall, label: "Fake Call",       desc: "Escape any situation",           color: "#4A7AC9", bg: "rgba(74,122,201,0.1)" },
  { icon: Mic,       label: "Voice SOS",       desc: "Hands-free emergency",           color: "#C97A1A", bg: "rgba(201,122,26,0.1)" },
  { icon: Watch,     label: "Smartwatch",      desc: "Fall detection + health",        color: "#189098", bg: "rgba(24,144,152,0.1)" },
  { icon: Bell,      label: "Alerts",          desc: "Low battery + zone alerts",      color: "#B01818", bg: "rgba(176,24,24,0.1)" },
  { icon: Map,       label: "Safe Zones",      desc: "Geofencing protection",          color: "#2A7A80", bg: "rgba(42,122,128,0.1)" },
  { icon: History,   label: "Alert History",   desc: "Full incident log",              color: "#6A3A90", bg: "rgba(106,58,144,0.1)" },
  { icon: Shield,    label: "Find My Phone",   desc: "Locate any device",              color: "#1A6A8A", bg: "rgba(26,106,138,0.1)" },
  { icon: Zap,       label: "Subscriptions",   desc: "Basic · Standard · Premium",    color: "#8A7A1A", bg: "rgba(138,122,26,0.1)" },
];

/* ── Main component ────────────────────────────────────────────── */
export default function Home() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { coords, source: locSource, accuracy, unavailable: locUnavail, loading: locLoading } =
    useSmartLocation({ enabled: true });

  const [statIdx, setStatIdx] = useState(0);
  const [showCalling, setShowCalling] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [holdPct, setHoldPct] = useState(0);
  const [nearbyDists, setNearbyDists] = useState({ hospital: null, defib: null });
  const holdRef = useRef(null);
  const nearbyFetched = useRef(false);

  const { data: profile, isLoading: profLoad } = useQuery({
    queryKey: ['safetyProfile', user?.email],
    queryFn: () => entities.SafetyProfile.filter({ owner_email: user.email }).then(d => d[0] || null),
    enabled: !!user?.email, staleTime: 60000,
  });
  const { data: alerts = [], isLoading: alertLoad } = useQuery({
    queryKey: ['alerts', user?.email],
    queryFn: () => entities.Alert.filter({ owner_email: user.email }, '-created_date', 10),
    enabled: !!user?.email, staleTime: 20000, refetchInterval: 30000,
  });
  const { data: contacts = [], isLoading: contLoad } = useQuery({
    queryKey: ['contacts', user?.email],
    queryFn: () => entities.EmergencyContact.filter({ owner_email: user.email }, 'priority', 20),
    enabled: !!user?.email, staleTime: 120000,
  });

  const loading = profLoad || alertLoad || contLoad;
  const activeAlert = alerts.find(a => a.status === 'active') || null;
  const needsOnboarding = !loading && isAuthenticated && !profile;
  const locAvail = !!coords && !locUnavail;
  const stats = buildStats(contacts, alerts, locAvail, locSource, accuracy);

  useBatteryMonitor(user, contacts);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['alerts', user?.email] });
    queryClient.invalidateQueries({ queryKey: ['safetyProfile', user?.email] });
  }, [queryClient, user?.email]);

  // Fetch nearby once GPS ready
  useEffect(() => {
    if (!coords || nearbyFetched.current) return;
    nearbyFetched.current = true;
    fetchNearby(coords.latitude, coords.longitude).then(els => {
      let mH = Infinity, mD = Infinity;
      for (const e of els) {
        const d = haversineM(coords.latitude, coords.longitude, e.lat, e.lon);
        if (e.tags?.amenity === "hospital" || e.tags?.amenity === "clinic") { if (d < mH) mH = d; }
        if (e.tags?.emergency === "defibrillator") { if (d < mD) mD = d; }
      }
      setNearbyDists({ hospital: mH === Infinity ? null : mH, defib: mD === Infinity ? null : mD });
    });
  }, [coords]);

  // Stream location → active alert
  useEffect(() => {
    if (!activeAlert || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      pos => entities.Alert.update(activeAlert.id, { latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      null, { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [activeAlert?.id]);

  // Battery push
  useEffect(() => {
    if (!user?.email || !profile?.device_imei || !('getBattery' in navigator)) return;
    const push = async () => {
      try {
        const bat = await navigator['getBattery']?.();
        if (!bat) return;
        const info = (await import("@/hooks/useDeviceFingerprint")).getDeviceInfo();
        await functions.invoke("updateDeviceLocation", {
          latitude: coords?.latitude, longitude: coords?.longitude, accuracy: accuracy || null,
          deviceId: info.deviceId, deviceName: info.deviceName, platform: info.platform,
          batteryLevel: bat.level, batteryCharging: bat.charging,
        });
      } catch {}
    };
    push();
    const iv = setInterval(push, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [user?.email, profile?.device_imei, coords, accuracy]);

  const handleResolved = async (alertId) => {
    await entities.Alert.update(alertId, { status: 'resolved', resolved_at: new Date().toISOString() });
    setShowCalling(false);
    invalidateAll();
  };
  const handleTriggered = useCallback(() => { setShowCalling(true); invalidateAll(); }, [invalidateAll]);

  const startHold = useCallback(() => {
    setPressing(true); setHoldPct(0);
    const t = Date.now();
    holdRef.current = setInterval(() => {
      const p = Math.min(100, ((Date.now() - t) / 2000) * 100);
      setHoldPct(p);
      if (p >= 100) { clearInterval(holdRef.current); setPressing(false); setHoldPct(0); handleTriggered(); }
    }, 30);
  }, [handleTriggered]);

  const cancelHold = useCallback(() => { clearInterval(holdRef.current); setPressing(false); setHoldPct(0); }, []);

  if (isLoadingAuth || (isAuthenticated && loading)) return <HomeSkeleton />;
  if (!isAuthenticated) return <LandingHero onGetStarted={() => navigate('/Login')} />;
  if (!loading && needsOnboarding) return <OnboardingSetup user={user} onComplete={invalidateAll} />;

  const cur = stats[statIdx];
  const pinItems = [
    { label: "Emergency", icon: Plus,       value: nearbyDists.hospital != null ? fmtDist(nearbyDists.hospital) : locAvail ? "…" : "—", dim: !locAvail },
    { label: "Defibrill.", icon: Zap,        value: nearbyDists.defib != null ? fmtDist(nearbyDists.defib) : locAvail ? "…" : "—", dim: !locAvail },
    { label: "Rescuers",   icon: Users,      value: String(contacts.length), dim: false },
    { label: "Users",      icon: HeartPulse, value: "0", dim: true },
  ];

  return (
    /* scrollable page, no height:100dvh so content can grow */
    <div style={{
      width: "100%", maxWidth: 480, margin: "0 auto",
      minHeight: "100dvh",
      background: "linear-gradient(180deg,#C2D8DA 0%,#D2E8EA 32%,#B4DAE0 100%)",
      overflowX: "hidden",
    }}>
      {/* Overlays */}
      <AnimatePresence>
        {showCalling && activeAlert && (
          <EmergencyCallingScreen contacts={contacts} alert={activeAlert}
            user={user} onDismiss={() => setShowCalling(false)} />
        )}
      </AnimatePresence>
      <TapToAlert corner="bottom-right" onTriggered={handleTriggered} />

      {/* Active alert strip */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div key="strip" initial={{ y: -48 }} animate={{ y: 0 }} exit={{ y: -48 }}
            style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center",
              justifyContent: "space-between", padding: "0 16px", height: 44, background: "#C01818" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}
                style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff" }} />
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>🚨 EMERGENCY ACTIVE</span>
            </div>
            <button onClick={() => handleResolved(activeAlert.id)}
              style={{ background: "#fff", color: "#B01010", fontWeight: 900, fontSize: 11,
                padding: "4px 12px", borderRadius: 999, border: "none", cursor: "pointer" }}>
              Resolve
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPS status pill — compact, sits under the Layout header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px", background: "rgba(255,255,255,0.5)",
        borderBottom: "1px solid rgba(255,255,255,0.7)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span style={{ color: "#C01818", fontWeight: 900, fontSize: 18, lineHeight: 1 }}>i</span>
          <span style={{ color: "#1C2A2C", fontWeight: 800, fontSize: 13 }}>
            {user?.full_name?.split(" ")[0]
              ? `Hello, ${user.full_name.split(" ")[0]}`
              : "Panic Ring"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%",
            background: locAvail ? "#22C55E" : "#F59E0B",
            boxShadow: locAvail ? "0 0 4px #22C55E" : "none" }} />
          <span style={{ fontSize: 10, color: "#3A6A6E", fontWeight: 600 }}>
            {locLoading ? "Locating…" : locUnavail ? "No GPS" : locSource === "gps" ? "GPS" : locSource === "network" ? "Cell" : "Cached"}
            {locAvail && accuracy && !locLoading ? ` ±${Math.round(accuracy)}m` : ""}
          </span>
        </div>
      </div>

      {/* ── NEARBY ROW */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-around",
        padding: "10px 6px", background: "rgba(255,255,255,0.44)",
        borderBottom: "1px solid rgba(255,255,255,0.65)" }}>
        {pinItems.map(item => (
          <PinTile key={item.label} icon={item.icon} label={item.label} value={item.value} dim={item.dim} />
        ))}
      </div>

      {/* ── SAFETY % (swipeable) */}
      <div style={{ position: "relative", padding: "24px 0 16px", display: "flex",
        flexDirection: "column", alignItems: "center" }}>
        <button onClick={() => setStatIdx(i => (i - 1 + stats.length) % stats.length)}
          style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
            width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(255,255,255,0.72)", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", zIndex: 1 }}>
          <ChevronLeft size={18} color="#268A90" />
        </button>
        <button onClick={() => setStatIdx(i => (i + 1) % stats.length)}
          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(255,255,255,0.72)", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", zIndex: 1 }}>
          <ChevronRight size={18} color="#268A90" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div key={statIdx} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.2 }}
            style={{ textAlign: "center", padding: "0 52px", width: "100%" }}>
            <p style={{ fontSize: "clamp(48px,14vw,72px)", fontWeight: 900, color: "#36A6B2",
              lineHeight: 1, margin: "0 0 2px" }}>{cur.pct}%</p>
            <p style={{ fontSize: "clamp(15px,4.5vw,24px)", fontWeight: 600, color: "#36A6B2",
              margin: "0 0 4px" }}>{cur.label}</p>
            <p style={{ fontSize: 12, color: "#527A80", margin: 0 }}>{cur.sub}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
              {stats.map((_, i) => (
                <button key={i} onClick={() => setStatIdx(i)}
                  style={{ width: i === statIdx ? 18 : 7, height: 7, borderRadius: 4,
                    background: i === statIdx ? "#36A6B2" : "rgba(54,166,178,0.28)",
                    border: "none", cursor: "pointer", transition: "all 0.2s" }} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── WAVE + PANIC BUTTON */}
      <div style={{ position: "relative" }}>
        <svg viewBox="0 0 480 100" preserveAspectRatio="none"
          style={{ width: "100%", height: "clamp(60px,18vw,100px)", display: "block" }}>
          <path d="M0,55 Q80,14 200,42 Q320,70 420,24 Q456,8 480,20 L480,100 L0,100 Z" fill="rgba(255,255,255,0.46)" />
          <path d="M0,70 Q80,32 200,58 Q320,82 420,40 Q456,24 480,36 L480,100 L0,100 Z" fill="rgba(255,255,255,0.76)" />
        </svg>
        <div style={{ background: "rgba(255,255,255,0.76)", padding: "0 16px 16px",
          display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ fontSize: 10, color: "#8A6060", fontWeight: 700, letterSpacing: 2,
            marginBottom: 8, textTransform: "uppercase", textAlign: "center" }}>
            {pressing ? `Hold… ${Math.round(holdPct)}%` : activeAlert ? "Alert active" : "Hold 2s to trigger SOS"}
          </p>
          <PanicBtn onStart={startHold} onEnd={cancelHold} active={!!activeAlert}
            pressing={pressing} pct={holdPct} />
          {pressing && <p style={{ fontSize: 10, color: "#999", marginTop: 4 }}>Release to cancel</p>}

          {/* Bottom 3 buttons — row layout, no overlap */}
          <div style={{ display: "flex", gap: 12, marginTop: 20, width: "100%",
            justifyContent: "center", alignItems: "flex-end", flexWrap: "nowrap" }}>

            {/* HELP OTHERS */}
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => navigate('/Contacts')}
              style={{ width: "clamp(80px,24vw,100px)", height: "clamp(80px,24vw,100px)",
                borderRadius: "50%", border: "none", cursor: "pointer", flexShrink: 0,
                background: "radial-gradient(circle at 40% 32%, #F06060, #AC1616)",
                boxShadow: "4px 5px 16px rgba(156,18,18,0.55)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} color="#fff" strokeWidth={2} />
              <span style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(8px,2.2vw,10px)",
                textAlign: "center", marginTop: 3, lineHeight: 1.2 }}>HELP{"\n"}OTHERS</span>
            </motion.button>

            {/* I NEED HELP */}
            <motion.button onMouseDown={startHold} onMouseUp={cancelHold}
              onMouseLeave={cancelHold} onTouchStart={startHold} onTouchEnd={cancelHold}
              animate={activeAlert ? { scale: [1, 1.04, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.3 }}
              style={{ width: "clamp(108px,33vw,130px)", height: "clamp(108px,33vw,130px)",
                borderRadius: "50%", border: "none", cursor: "pointer", flexShrink: 0, zIndex: 10,
                background: pressing
                  ? "radial-gradient(circle at 42% 36%, #CC2828, #860000)"
                  : "radial-gradient(circle at 38% 30%, #E53030, #9C0E0E)",
                boxShadow: pressing
                  ? "0 3px 18px rgba(130,0,0,0.72)"
                  : "5px 7px 20px rgba(156,14,14,0.62)",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", position: "relative" }}>
              {pressing && (
                <motion.div style={{ position: "absolute", inset: 0, borderRadius: "50%",
                  border: "4px solid rgba(255,255,255,0.35)" }}
                  animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.7 }} />
              )}
              <span style={{ color: "#fff", fontWeight: 900,
                fontSize: "clamp(10px,3vw,13px)", textAlign: "center", lineHeight: 1.2, zIndex: 1 }}>
                {pressing ? "SENDING…" : "I NEED\nHELP"}
              </span>
            </motion.button>

            {/* Alert History */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/AlertHistory')}
              style={{ width: "clamp(80px,24vw,100px)", height: "clamp(80px,24vw,100px)",
                borderRadius: "50%", border: "none", cursor: "pointer", flexShrink: 0,
                background: "radial-gradient(circle at 38% 32%, #DCDCDC, #ADADAD)",
                boxShadow: "3px 4px 10px rgba(0,0,0,0.2)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <History size={16} color="#666" strokeWidth={2} />
              <span style={{ color: "#666", fontWeight: 700, fontSize: "clamp(8px,2.2vw,10px)",
                textAlign: "center", marginTop: 3, lineHeight: 1.2 }}>ALERT{"\n"}HISTORY</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── FEATURES SHOWCASE */}
      <div style={{ padding: "20px 16px 32px", background: "rgba(255,255,255,0.35)" }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: "#2A5A60", letterSpacing: 2,
          textTransform: "uppercase", marginBottom: 14, textAlign: "center" }}>
          Everything you need to stay safe
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {FEATURES.map(({ icon: Icon, label, desc, color, bg }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.7)",
              borderRadius: 14, padding: "12px 8px", textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "default" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg,
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                <Icon size={18} color={color} strokeWidth={2} />
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#1C2A2C",
                margin: "0 0 2px", lineHeight: 1.2 }}>{label}</p>
              <p style={{ fontSize: 9, color: "#6A7A7E", margin: 0, lineHeight: 1.3 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Quick action buttons */}
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Link to="/Contacts"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
              background: "rgba(255,255,255,0.8)", borderRadius: 14,
              textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Users size={20} color="#7C3AC9" />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#1C2A2C", margin: 0 }}>Contacts</p>
              <p style={{ fontSize: 10, color: "#8A9AA0", margin: 0 }}>
                {contacts.length > 0 ? `${contacts.length} added` : "Add now"}
              </p>
            </div>
          </Link>
          <Link to="/Map"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
              background: "rgba(255,255,255,0.8)", borderRadius: 14,
              textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Map size={20} color="#189098" />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#1C2A2C", margin: 0 }}>Live Map</p>
              <p style={{ fontSize: 10, color: "#8A9AA0", margin: 0 }}>
                {locAvail ? "Location active" : "Enable GPS"}
              </p>
            </div>
          </Link>
          <Link to="/Journey"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
              background: "rgba(255,255,255,0.8)", borderRadius: 14,
              textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Navigation size={20} color="#2D8A5A" />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#1C2A2C", margin: 0 }}>Journey</p>
              <p style={{ fontSize: 10, color: "#8A9AA0", margin: 0 }}>Share your route</p>
            </div>
          </Link>
          <Link to="/Subscriptions"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
              background: "rgba(255,255,255,0.8)", borderRadius: 14,
              textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Shield size={20} color="#C01818" />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#1C2A2C", margin: 0 }}>Upgrade</p>
              <p style={{ fontSize: 10, color: "#8A9AA0", margin: 0 }}>
                {profile?.subscription_plan ?? "Basic"} plan
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* spacer for bottom nav */}
      <div style={{ height: "max(env(safe-area-inset-bottom,0px),64px)" }} />
    </div>
  );
}
