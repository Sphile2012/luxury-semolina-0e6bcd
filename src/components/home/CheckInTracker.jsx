import { useState, useEffect, useRef } from "react";
import { functions } from "@/api/client";
import { motion } from "framer-motion";
import { MapPin, StopCircle, Clock, Navigation } from "lucide-react";

const DURATIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
];

export default function CheckInTracker({ user, onStop }) {
  const [duration, setDuration] = useState(30);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [pathPoints, setPathPoints] = useState([]);
  const [lastLocation, setLastLocation] = useState(null);
  const watchRef = useRef(null);
  const timerRef = useRef(null);

  const startTracking = () => {
    setStarted(true);
    setElapsed(0);
    setPathPoints([]);

    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 1 >= duration * 60) {
          stopTracking();
          return prev + 1;
        }
        return prev + 1;
      });
    }, 1000);

    if (navigator.geolocation) {
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const point = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: new Date().toISOString(),
          };
          setLastLocation(point);
          setPathPoints(prev => [...prev, point]);

          functions.invoke('updateDeviceLocation', {
            latitude: point.lat,
            longitude: point.lng,
            accuracy: point.accuracy,
            deviceId: localStorage.getItem('panic_ring_device_id') || 'checkin',
            deviceName: 'Check-in Mode',
            platform: 'android',
          }).catch(() => {});
        },
        (err) => console.warn("GPS error:", err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    }
  };

  const stopTracking = () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    onStop?.();
  };

  useEffect(() => {
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const remaining = Math.max(0, duration * 60 - elapsed);
  const pct = Math.min(100, (elapsed / (duration * 60)) * 100);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (!started) {
    return (
      <div className="w-full mb-8">
        <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
              <MapPin size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Check-in Mode</h3>
              <p className="text-[#666] text-xs">GPS path recorded & shared with your contacts</p>
            </div>
          </div>

          <p className="text-[#888] text-xs mb-3">Select tracking duration:</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {DURATIONS.map(d => (
              <button key={d.value} onClick={() => setDuration(d.value)}
                className={`py-2 rounded-xl text-xs font-medium transition-all ${duration === d.value ? "bg-emerald-600 text-white" : "bg-white/5 text-[#666] hover:text-white"}`}>
                {d.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={onStop} className="flex-1 py-2.5 rounded-xl bg-white/5 text-[#666] text-sm hover:bg-white/10 transition-colors">Cancel</button>
            <button onClick={startTracking} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
              <Navigation size={14} /> Start Tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full mb-8">
      <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
            <span className="text-emerald-400 text-sm font-bold">LIVE TRACKING</span>
          </div>
          <span className="text-[#666] text-xs">{pathPoints.length} pts recorded</span>
        </div>

        <div className="w-full h-2 bg-white/10 rounded-full mb-3 overflow-hidden">
          <motion.div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
        </div>

        <div className="flex justify-between text-xs mb-4">
          <div className="flex items-center gap-1 text-[#888]">
            <Clock size={11} /> <span>Elapsed: {fmt(elapsed)}</span>
          </div>
          <span className="text-emerald-400 font-mono font-bold">{fmt(remaining)} remaining</span>
        </div>

        {lastLocation && (
          <div className="bg-white/[0.03] rounded-xl p-3 mb-4 flex items-center gap-2">
            <MapPin size={13} className="text-emerald-400 shrink-0" />
            <span className="text-[#888] text-[11px] font-mono">
              {lastLocation.lat.toFixed(5)}, {lastLocation.lng.toFixed(5)}
              {lastLocation.accuracy && <span className="text-[#555]"> ±{Math.round(lastLocation.accuracy)}m</span>}
            </span>
          </div>
        )}

        <button onClick={stopTracking} className="w-full py-3 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-600/30 transition-colors flex items-center justify-center gap-2">
          <StopCircle size={16} /> Stop Check-in
        </button>
      </div>
    </motion.div>
  );
}
