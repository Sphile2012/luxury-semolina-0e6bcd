import { useState, useRef, useEffect } from "react";
import useOfflineMode from "@/hooks/useOfflineMode";
import OfflineBanner from "./OfflineBanner";
import { functions } from "@/api/client";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, CheckCircle, EyeOff, MapPin } from "lucide-react";
import CheckInTracker from "./CheckInTracker";

const MODES = [
  {
    id: "urgent",
    label: "SOS",
    icon: Phone,
    color: "#F07170",
    holdDuration: 3000,
    desc: "Hold to send emergency alert",
  },
  {
    id: "discreet",
    label: "Silent",
    icon: EyeOff,
    color: "#8C8FA3",
    holdDuration: 1500,
    desc: "Silent alert to primary contact",
  },
  {
    id: "checkin",
    label: "Check-in",
    icon: MapPin,
    color: "#3CB371",
    holdDuration: 1500,
    desc: "Share live GPS location",
  },
];

function playAlarmSiren() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sawtooth"; gain.gain.setValueAtTime(0.7, ctx.currentTime);
    const now = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      osc.frequency.setValueAtTime(880, now + i * 0.5);
      osc.frequency.setValueAtTime(440, now + i * 0.5 + 0.25);
    }
    osc.start(now); osc.stop(now + 3);
  } catch {}
}

export default function PanicButton({ user, contacts, onAlertTriggered, hasActiveAlert, profile, audioUrl }) {
  const { isOnline, queuedAlerts, queueAlert, getCachedContacts, getCachedLocation } = useOfflineMode(contacts, user);
  const [selectedMode, setSelectedMode] = useState("urgent");
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const [checkInActive, setCheckInActive] = useState(false);
  const intervalRef = useRef(null);
  const mode = MODES.find(m => m.id === selectedMode);

  const startPress = () => {
    if (hasActiveAlert || checkInActive) return;
    setPressing(true);
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / mode.holdDuration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(intervalRef.current); triggerAlert(); }
    }, 30);
  };

  const endPress = () => {
    if (progress < 100) {
      clearInterval(intervalRef.current);
      setPressing(false);
      setProgress(0);
    }
  };

  const triggerAlert = async () => {
    setPressing(false);
    setTriggered(true);

    if (selectedMode === "checkin") {
      setTriggered(false); setProgress(0); setCheckInActive(true); return;
    }
    if (selectedMode === "urgent") playAlarmSiren();

    const modeMessages = {
      discreet: "⚫ Discreet alert. I may be in danger.",
      urgent: "🚨 EMERGENCY — I need immediate help!",
    };
    const alertMessage = modeMessages[selectedMode] || profile?.custom_alert_message || "I need help!";

    if (!isOnline) {
      const cachedContacts = await getCachedContacts();
      const cachedLoc = await getCachedLocation();
      const msg = encodeURIComponent(`${alertMessage}\n\n📍 ${cachedLoc ? `https://maps.google.com/?q=${cachedLoc.latitude},${cachedLoc.longitude}` : "Location unavailable"}`);
      (cachedContacts || []).forEach((c, i) => {
        if (c.phone) setTimeout(() => window.open(`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank"), i * 800);
      });
      await queueAlert({ message: alertMessage, latitude: cachedLoc?.latitude, longitude: cachedLoc?.longitude });
      setTimeout(() => { setTriggered(false); setProgress(0); onAlertTriggered?.(); }, 2000);
      return;
    }

    let lat = null, lng = null, accuracy = null, address = "";
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
      );
      lat = pos.coords.latitude; lng = pos.coords.longitude;
      accuracy = pos.coords.accuracy;
      address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {}

    try {
      const response = await functions.invoke('sendPanicAlert', {
        latitude: lat, longitude: lng, accuracy, address,
        message: alertMessage,
        trigger_method: selectedMode === "discreet" ? "app_button" : "panic_ring",
        ...(audioUrl ? { audio_url: audioUrl } : {})
      });
      if (response.success) {
        const links = response.whatsapp_links || [];
        const toOpen = selectedMode === "discreet" ? links.slice(0, 1) : links;
        toOpen.forEach((link, i) => setTimeout(() => window.open(link.url, '_blank'), i * 800));
      }
    } catch (err) { console.error('Alert error:', err); }

    setTimeout(() => { setTriggered(false); setProgress(0); onAlertTriggered?.(); }, 2000);
  };

  if (checkInActive) {
    return <CheckInTracker user={user} onStop={() => { setCheckInActive(false); setProgress(0); onAlertTriggered?.(); }} />;
  }

  const isUrgent = selectedMode === "urgent";

  return (
    <div className="flex flex-col items-center mb-8">
      <OfflineBanner isOnline={isOnline} queuedAlerts={queuedAlerts} />

      {/* Mode selector tabs */}
      {!hasActiveAlert && (
        <div
          className="flex gap-1 mb-8 p-1 rounded-2xl w-full"
          style={{ background: "var(--sos-surface2)", border: "1px solid var(--sos-border)" }}
        >
          {MODES.map(m => {
            const active = selectedMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m.id)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={active ? {
                  background: "#fff",
                  color: m.color,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                } : { color: "var(--sos-muted)" }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Helper text */}
      <p className="text-sm font-medium mb-1" style={{ color: "var(--sos-muted)" }}>
        {hasActiveAlert ? "Alert is active" : mode.desc}
      </p>
      <p className="text-[11px] mb-8" style={{ color: "var(--sos-dim)" }}>
        {hasActiveAlert
          ? "Emergency contacts have been notified"
          : pressing
          ? `Hold for ${((mode.holdDuration * (1 - progress / 100)) / 1000).toFixed(1)}s more…`
          : `Hold ${(mode.holdDuration / 1000).toFixed(1)}s to activate`}
      </p>

      {/* SOS button with ripple rings */}
      <div className="relative flex items-center justify-center mb-8"
        style={{ width: "min(240px, 85vw)", height: "min(240px, 85vw)" }}>

        {/* Ripple rings */}
        {(pressing || hasActiveAlert) && [1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            animate={{ scale: [1, 2.2 + i * 0.3], opacity: [0.35, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.4, ease: "easeOut" }}
            style={{
              width: "min(180px, 65vw)", height: "min(180px, 65vw)",
              background: mode.color,
              opacity: 0.35 - i * 0.08,
            }}
          />
        ))}

        {/* Idle soft pulse */}
        {!pressing && !hasActiveAlert && (
          <motion.div
            className="absolute rounded-full"
            animate={{ scale: [1, 1.18, 1], opacity: [0.25, 0.08, 0.25] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            style={{
              width: "min(200px, 72vw)", height: "min(200px, 72vw)",
              background: mode.color,
            }}
          />
        )}

        {/* Progress ring SVG */}
        <svg className="absolute" width="100%" height="100%" viewBox="0 0 220 220"
          style={{ transform: "rotate(-90deg)" }}>
          <circle cx={110} cy={110} r={100} fill="none"
            stroke={mode.color + "20"} strokeWidth={5} />
          {(pressing || hasActiveAlert) && (
            <circle cx={110} cy={110} r={100} fill="none"
              stroke={mode.color} strokeWidth={5}
              strokeDasharray={2 * Math.PI * 100}
              strokeDashoffset={2 * Math.PI * 100 * (1 - (hasActiveAlert ? 1 : progress / 100))}
              strokeLinecap="round"
              style={{ transition: pressing ? "none" : "stroke-dashoffset 0.3s ease" }}
            />
          )}
        </svg>

        {/* Main button */}
        <motion.button
          className="relative z-10 rounded-full flex flex-col items-center justify-center select-none focus:outline-none"
          style={{
            width: "min(168px, 60vw)", height: "min(168px, 60vw)",
            background: hasActiveAlert
              ? `linear-gradient(135deg, ${mode.color}, ${mode.color}cc)`
              : mode.color,
            boxShadow: `0 8px 32px ${mode.color}55, 0 2px 8px ${mode.color}33`,
          }}
          onMouseDown={startPress} onMouseUp={endPress} onMouseLeave={endPress}
          onTouchStart={startPress} onTouchEnd={endPress}
          animate={hasActiveAlert ? { scale: [1, 1.04, 1] } : pressing ? { scale: 0.95 } : { scale: 1 }}
          transition={hasActiveAlert ? { repeat: Infinity, duration: 1.2 } : { duration: 0.1 }}
          whileTap={{ scale: 0.94 }}
        >
          <AnimatePresence mode="wait">
            {triggered ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <CheckCircle size={52} className="text-white" />
              </motion.div>
            ) : (
              <motion.div key="main" className="flex flex-col items-center gap-2">
                {isUrgent || hasActiveAlert ? (
                  <>
                    <Phone size={36} className="text-white" strokeWidth={2.5} />
                    <span className="text-white font-black text-xl tracking-widest">
                      {hasActiveAlert ? "ACTIVE" : "SOS"}
                    </span>
                  </>
                ) : (
                  <>
                    {(() => { const Icon = mode.icon; return <Icon size={32} className="text-white" strokeWidth={2} />; })()}
                    <span className="text-white font-black text-sm tracking-wider uppercase">
                      {mode.label}
                    </span>
                  </>
                )}
                {pressing && (
                  <span className="text-white/80 text-xs font-mono">
                    {((mode.holdDuration * (1 - progress / 100)) / 1000).toFixed(1)}s
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Quick emergency actions below button */}
      <div className="grid grid-cols-3 gap-3 w-full">
        <a
          href="tel:10111"
          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
          style={{ background: "var(--sos-coral-pale)", border: "1px solid var(--sos-coral-light)" }}
        >
          <Phone size={18} style={{ color: "var(--sos-coral)" }} />
          <span className="text-[10px] font-bold" style={{ color: "var(--sos-coral-deep)" }}>Police</span>
          <span className="text-[10px] font-mono font-semibold" style={{ color: "var(--sos-coral)" }}>10111</span>
        </a>
        <a
          href="tel:10177"
          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
          style={{ background: "var(--sos-green-light)", border: "1px solid #b7e5cb" }}
        >
          <Phone size={18} style={{ color: "var(--sos-green)" }} />
          <span className="text-[10px] font-bold" style={{ color: "#2d8a5a" }}>Ambulance</span>
          <span className="text-[10px] font-mono font-semibold" style={{ color: "var(--sos-green)" }}>10177</span>
        </a>
        <a
          href="tel:112"
          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
          style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}
        >
          <Phone size={18} style={{ color: "#4F46E5" }} />
          <span className="text-[10px] font-bold" style={{ color: "#3730A3" }}>Emergency</span>
          <span className="text-[10px] font-mono font-semibold" style={{ color: "#4F46E5" }}>112</span>
        </a>
      </div>
    </div>
  );
}
