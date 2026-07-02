import { useState, useRef, useEffect } from "react";
import useOfflineMode from "@/hooks/useOfflineMode";
import OfflineBanner from "./OfflineBanner";
import { functions } from "@/api/client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, Eye, EyeOff, Siren, MapPin, Clock } from "lucide-react";
import CheckInTracker from "./CheckInTracker";

const MODES = [
  {
    id: "discreet",
    label: "Discreet",
    icon: EyeOff,
    color: "#6366f1",
    borderColor: "border-indigo-900/60",
    bgActive: "bg-indigo-700",
    holdDuration: 1500,
    desc: "Silent alert + camera",
    ringColor: "#6366f1",
  },
  {
    id: "urgent",
    label: "Urgent",
    icon: Siren,
    color: "#ef4444",
    borderColor: "border-red-900/60",
    bgActive: "bg-red-600",
    holdDuration: 3000,
    desc: "Siren + all contacts",
    ringColor: "#ef4444",
  },
  {
    id: "checkin",
    label: "Check-in",
    icon: MapPin,
    color: "#10b981",
    borderColor: "border-emerald-900/60",
    bgActive: "bg-emerald-700",
    holdDuration: 1500,
    desc: "GPS path recording",
    ringColor: "#10b981",
  },
];

function playAlarmSiren() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = "sawtooth";
    gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
    const now = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      oscillator.frequency.setValueAtTime(880, now + i * 0.5);
      oscillator.frequency.setValueAtTime(440, now + i * 0.5 + 0.25);
    }
    oscillator.start(now);
    oscillator.stop(now + 3);
  } catch (e) {
    console.warn("Audio not supported", e);
  }
}

async function startCameraStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    return stream;
  } catch (e) {
    console.warn("Camera unavailable", e);
    return null;
  }
}

export default function PanicButton({ user, contacts, onAlertTriggered, hasActiveAlert, profile, audioUrl }) {
  const { isOnline, queuedAlerts, queueAlert, getCachedContacts, getCachedLocation } = useOfflineMode(contacts, user);
  const [selectedMode, setSelectedMode] = useState("urgent");
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [checkInActive, setCheckInActive] = useState(false);
  const intervalRef = useRef(null);
  const videoRef = useRef(null);

  const mode = MODES.find(m => m.id === selectedMode);

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    };
  }, [cameraStream]);

  const startPress = () => {
    if (hasActiveAlert || checkInActive) return;
    setPressing(true);
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / mode.holdDuration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current);
        triggerAlert();
      }
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
      setTriggered(false);
      setProgress(0);
      setCheckInActive(true);
      return;
    }

    if (selectedMode === "urgent") playAlarmSiren();
    if (selectedMode === "discreet") {
      const stream = await startCameraStream();
      if (stream) setCameraStream(stream);
    }

    const modeMessages = {
      discreet: "⚫ Discreet alert sent. I may be in danger — please check on me silently.",
      urgent: "🚨 URGENT EMERGENCY — I need immediate help! Please call me or emergency services NOW.",
    };
    const alertMessage = modeMessages[selectedMode] || profile?.custom_alert_message || "I need help!";

    if (!isOnline) {
      const cachedContacts = await getCachedContacts();
      const cachedLoc = await getCachedLocation();
      const msg = encodeURIComponent(`${alertMessage}\n\n📍 ${cachedLoc ? `https://www.google.com/maps?q=${cachedLoc.latitude},${cachedLoc.longitude}` : "Location unavailable"}`);
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
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      accuracy = pos.coords.accuracy;
      address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
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
    } catch (error) {
      console.error('Alert error:', error);
    }

    setTimeout(() => {
      setTriggered(false);
      setProgress(0);
      onAlertTriggered?.();
    }, 2000);
  };

  if (checkInActive) {
    return <CheckInTracker user={user} onStop={() => { setCheckInActive(false); setProgress(0); onAlertTriggered?.(); }} />;
  }

  return (
    <div className="flex flex-col items-center mb-8">
      <OfflineBanner isOnline={isOnline} queuedAlerts={queuedAlerts} />

      {!hasActiveAlert && (
        <div
          className="flex gap-2 mb-6 p-1.5 rounded-2xl"
          style={{
            background: "rgba(17,24,39,0.8)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}
        >
          {MODES.map(m => {
            const Icon = m.icon;
            const active = selectedMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m.id)}
                className="flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={active ? {
                  background: `${m.color}22`,
                  border: `1px solid ${m.color}44`,
                  color: m.color,
                  boxShadow: `0 0 12px ${m.color}33`,
                } : { color: "#334155", border: "1px solid transparent" }}
              >
                <Icon size={15} style={{ color: active ? m.color : "#334155" }} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[#666] text-xs mb-1 tracking-wide">
        {hasActiveAlert ? "Alert Active" : mode.desc}
      </p>
      <p className="text-[#444] text-[10px] mb-4">
        {hasActiveAlert
          ? "Emergency services alerted"
          : pressing
          ? `Hold for ${((mode.holdDuration * (1 - progress / 100)) / 1000).toFixed(1)}s more…`
          : `Hold ${(mode.holdDuration / 1000).toFixed(1)}s to activate`}
      </p>

      <AnimatePresence>
        {cameraStream && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 160 }} exit={{ opacity: 0, height: 0 }} className="w-full mb-4 rounded-2xl overflow-hidden border border-indigo-500/30">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-center" style={{ width: "min(220px, 80vw)", height: "min(220px, 80vw)" }}>
        {(pressing || hasActiveAlert) && (
          <>
            <motion.div className="absolute rounded-full border" animate={{ scale: [1, 1.6], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }} style={{ width: "min(200px, 72vw)", height: "min(200px, 72vw)", borderColor: mode.color + "60" }} />
            <motion.div className="absolute rounded-full border" animate={{ scale: [1, 1.9], opacity: [0.3, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.4 }} style={{ width: "min(200px, 72vw)", height: "min(200px, 72vw)", borderColor: mode.color + "40" }} />
          </>
        )}

        <svg className="absolute" width="100%" height="100%" viewBox="0 0 220 220" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={110} cy={110} r={100} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
          <circle cx={110} cy={110} r={100}
            fill="none"
            stroke={`url(#ring-gradient-${selectedMode})`}
            strokeWidth={6}
            strokeDasharray={2 * Math.PI * 100}
            strokeDashoffset={2 * Math.PI * 100 * (1 - (hasActiveAlert ? 1 : progress / 100))}
            strokeLinecap="round"
            style={{ transition: pressing ? "none" : "stroke-dashoffset 0.3s ease", filter: `drop-shadow(0 0 8px ${mode.ringColor}99)` }}
          />
          <defs>
            <linearGradient id="ring-gradient-discreet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="ring-gradient-urgent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <linearGradient id="ring-gradient-checkin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>

        <motion.button
          className="relative z-10 rounded-full flex flex-col items-center justify-center select-none focus:outline-none"
          style={{
            width: "min(176px, 64vw)", height: "min(176px, 64vw)",
            background: hasActiveAlert
              ? `linear-gradient(135deg, ${mode.color}cc, ${mode.color}88)`
              : "rgba(13,13,21,0.9)",
            border: `2px solid ${mode.color}44`,
            boxShadow: hasActiveAlert || pressing
              ? `0 0 40px ${mode.color}55, 0 0 80px ${mode.color}22, inset 0 1px 0 rgba(255,255,255,0.1)`
              : `0 0 20px ${mode.color}22, inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
          onMouseDown={startPress} onMouseUp={endPress} onMouseLeave={endPress}
          onTouchStart={startPress} onTouchEnd={endPress}
          animate={hasActiveAlert ? { scale: [1, 1.03, 1] } : pressing ? { scale: 0.97 } : { scale: 1 }}
          transition={hasActiveAlert ? { repeat: Infinity, duration: 1.2 } : {}}
        >
          <AnimatePresence mode="wait">
            {triggered ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <CheckCircle className="text-green-400" size={52} />
              </motion.div>
            ) : (
              <motion.div key="alert" className="flex flex-col items-center gap-1">
                {(() => { const Icon = mode.icon; return <Icon size={40} style={{ color: hasActiveAlert ? "#fff" : mode.color }} />; })()}
                <span className="font-black text-base tracking-widest uppercase" style={{ color: hasActiveAlert ? "#fff" : mode.color }}>
                  {hasActiveAlert ? "SOS" : mode.label.toUpperCase()}
                </span>
                {pressing && (
                  <span className="text-xs mt-1 font-mono" style={{ color: mode.color }}>
                    {((mode.holdDuration * (1 - progress / 100)) / 1000).toFixed(1)}s
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
