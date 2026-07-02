import { useState, useEffect, useRef, useCallback } from "react";
import { functions } from "@/api/client";
import { AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FALL_THRESHOLD = 25;
const COUNTDOWN_SECONDS = 10;

export default function FallDetection({ user, onFallAlert }) {
  const [enabled, setEnabled] = useState(false);
  const [fallDetected, setFallDetected] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [alertSent, setAlertSent] = useState(false);
  const [sensitivity, setSensitivity] = useState("medium");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const countdownRef = useRef(null);
  const motionRef = useRef(null);
  const thresholds = { low: 30, medium: 25, high: 18 };

  const cancelFallAlert = useCallback(() => {
    clearInterval(countdownRef.current);
    setFallDetected(false);
    setCountdown(COUNTDOWN_SECONDS);
    setAlertSent(false);
  }, []);

  const triggerFallAlert = useCallback(async () => {
    clearInterval(countdownRef.current);
    setAlertSent(true);
    if (onFallAlert) onFallAlert();
    try {
      const position = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      ).catch(() => null);

      await functions.invoke("sendPanicAlert", {
        trigger_method: "auto",
        message: `🚨 FALL DETECTED — ${user?.full_name || "User"} may have fallen and needs help!`,
        latitude: position?.coords?.latitude,
        longitude: position?.coords?.longitude,
      });
    } catch (e) {
      console.error("Fall alert error:", e);
    }
    setTimeout(() => {
      setFallDetected(false);
      setCountdown(COUNTDOWN_SECONDS);
      setAlertSent(false);
    }, 4000);
  }, [user, onFallAlert]);

  useEffect(() => {
    if (!fallDetected || alertSent) return;
    setCountdown(COUNTDOWN_SECONDS);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          triggerFallAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [fallDetected, alertSent, triggerFallAlert]);

  useEffect(() => {
    if (!enabled) {
      if (motionRef.current) window.removeEventListener("devicemotion", motionRef.current);
      return;
    }
    const threshold = thresholds[sensitivity];
    let lastFallTime = 0;
    const handleMotion = (event) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const magnitude = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      const now = Date.now();
      if (magnitude > threshold && now - lastFallTime > 10000) {
        lastFallTime = now;
        setFallDetected(true);
      }
    };
    motionRef.current = handleMotion;
    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [enabled, sensitivity]);

  const requestPermissionAndEnable = async () => {
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      try {
        const result = await DeviceMotionEvent.requestPermission();
        if (result === "granted") setEnabled(true);
        else setPermissionDenied(true);
      } catch { setPermissionDenied(true); }
    } else {
      setEnabled(true);
    }
  };

  return (
    <>
      <AnimatePresence>
        {fallDetected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0f0f1a] border-2 border-red-500/60 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
              {alertSent ? (
                <>
                  <CheckCircle size={56} className="text-red-500 mx-auto mb-4" />
                  <h2 className="text-white text-2xl font-black mb-2">Alert Sent!</h2>
                  <p className="text-[#888] text-sm">Emergency contacts have been notified.</p>
                </>
              ) : (
                <>
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-20 h-20 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                    <AlertTriangle size={36} className="text-red-500" />
                  </motion.div>
                  <h2 className="text-white text-2xl font-black mb-1">Fall Detected!</h2>
                  <p className="text-[#aaa] text-sm mb-5">Alerting your emergency contacts in…</p>
                  <div className="text-7xl font-black text-red-500 mb-6 tabular-nums">{countdown}</div>
                  <button onClick={cancelFallAlert} className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg transition-colors">
                    ✅ I'm OK — Cancel
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`rounded-2xl border p-4 transition-colors ${enabled ? "bg-red-500/10 border-red-500/30" : "bg-white/[0.03] border-white/[0.07]"}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? "bg-red-500/20" : "bg-white/5"}`}>
              <Activity size={18} className={enabled ? "text-red-400" : "text-[#555]"} />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Fall Detection</p>
              <p className="text-[#555] text-xs">{enabled ? "🟢 Active — monitoring motion" : "Detects hard falls & alerts contacts"}</p>
            </div>
          </div>
          <button onClick={() => enabled ? setEnabled(false) : requestPermissionAndEnable()}
            className={`w-11 h-6 rounded-full transition-colors relative ${enabled ? "bg-red-600" : "bg-white/10"}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${enabled ? "left-6" : "left-1"}`} />
          </button>
        </div>
        {permissionDenied && <p className="text-amber-400 text-xs mb-2">⚠️ Motion sensor permission denied. Enable in device settings.</p>}
        {enabled && (
          <div className="flex items-center gap-2">
            <span className="text-[#666] text-xs">Sensitivity:</span>
            {["low", "medium", "high"].map(s => (
              <button key={s} onClick={() => setSensitivity(s)}
                className={`px-2 py-0.5 rounded-full text-xs capitalize transition-colors ${sensitivity === s ? "bg-red-600 text-white" : "bg-white/5 text-[#888]"}`}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
