/**
 * REQ 14 — Journey Planner "Follow Me" Mode
 */
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { MapPin, Users, Play, Square, CheckCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function Journey() {
  const { user } = useAuth();
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState(30);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [currentPos, setCurrentPos] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [journeyId, setJourneyId] = useState(null);
  const [starting, setStarting] = useState(false);
  const intervalRef = useRef(null);
  const watchRef = useRef(null);
  const streamIntervalRef = useRef(null);
  const overdueNotifiedRef = useRef(false);

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts", user?.email],
    queryFn: () => entities.EmergencyContact.filter({ owner_email: user.email }, "priority", 20),
    enabled: !!user?.email,
  });

  const toggleContact = (id) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const startJourney = async () => {
    if (!destination.trim()) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      window.alert("Location is not available in this browser. Allow location or use a device with GPS.");
      return;
    }
    setStarting(true);
    overdueNotifiedRef.current = false;
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 })
      ).catch(() => null);

      const followerContacts = contacts.filter(c => selectedContacts.includes(c.id));

      // Notify backend
      try {
        const token = localStorage.getItem("pr_token");
        await fetch(`${API_BASE}/api/functions/startJourney`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            destination,
            duration_minutes: duration,
            contacts: followerContacts.map(c => ({ name: c.name, phone: c.phone })),
            start_lat: pos?.coords.latitude,
            start_lng: pos?.coords.longitude,
          }),
        });
      } catch {}

      const id = `journey_${Date.now()}`;
      setJourneyId(id);
      setActive(true);
      setElapsed(0);
      setCompleted(false);

      // Elapsed timer
      intervalRef.current = setInterval(() => {
        setElapsed(e => {
          const next = e + 1;
          if (next >= duration * 60 && !overdueNotifiedRef.current) {
            overdueNotifiedRef.current = true;
            notifyOverdue(followerContacts);
          }
          return next;
        });
      }, 1000);

      // Location refresh every 15s (watchPosition below handles continuous UI updates)
      streamIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (p) => {
            setCurrentPos({ lat: p.coords.latitude, lng: p.coords.longitude });
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
        );
      }, 15000);

      watchRef.current = navigator.geolocation.watchPosition(
        (p) => setCurrentPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    } catch {}
    setStarting(false);
  };

  const notifyOverdue = (followerContacts) => {
    const msg = encodeURIComponent(
      `⚠️ *Journey Overdue — Panic Ring*\n\n${user?.full_name || "Your contact"} has not arrived at "${destination}" within the estimated ${duration} minutes.\n\nPlease check on them.\n\n_Sent via Panic Ring_`
    );
    followerContacts.forEach((c, i) => {
      if (c.phone) {
        setTimeout(() => window.open(`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank"), i * 800);
      }
    });
  };

  const endJourney = async (auto = false) => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    clearInterval(streamIntervalRef.current);
    streamIntervalRef.current = null;
    if (watchRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }

    const followerContacts = contacts.filter(c => selectedContacts.includes(c.id));
    const msg = encodeURIComponent(
      auto
        ? `✅ *Journey Complete — Panic Ring*\n\n${user?.full_name || "Your contact"} has arrived at "${destination}" safely.\n\n_Sent via Panic Ring_`
        : `ℹ️ *Journey Ended — Panic Ring*\n\n${user?.full_name || "Your contact"} has manually ended their journey to "${destination}".\n\n_Sent via Panic Ring_`
    );
    followerContacts.forEach((c, i) => {
      if (c.phone) {
        setTimeout(() => window.open(`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank"), i * 800);
      }
    });

    try {
      const token = localStorage.getItem("pr_token");
      await fetch(`${API_BASE}/api/functions/endJourney`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ journey_id: journeyId, completed: auto }),
      });
    } catch {}

    setActive(false);
    if (auto) setCompleted(true);
  };

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(streamIntervalRef.current);
      if (watchRef.current != null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

  const remaining = Math.max(0, duration * 60 - elapsed);
  const remainingMin = Math.floor(remaining / 60);
  const remainingSec = remaining % 60;
  const elapsedMin = Math.floor(elapsed / 60);
  const elapsedSec = elapsed % 60;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <PageHeader
          title="Journey Planner"
          subtitle="Share your route with trusted contacts"
        />

        <AnimatePresence mode="wait">
          {completed ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <CheckCircle size={64} className="text-emerald-400 mx-auto mb-4" />
              <h2 className="text-white text-2xl font-bold mb-2">Journey Complete!</h2>
              <p className="text-[#666] text-sm mb-6">Your contacts have been notified of your safe arrival.</p>
              <button
                onClick={() => { setCompleted(false); setDestination(""); setElapsed(0); }}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
              >
                Plan New Journey
              </button>
            </motion.div>
          ) : active ? (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Active Journey Status */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-400 text-sm font-semibold">Journey Active</span>
                </div>
                <p className="text-white font-bold text-lg mb-1 truncate">→ {destination}</p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-[#888] text-xs mb-1">Elapsed</p>
                    <p className="text-white font-mono font-bold">
                      {String(elapsedMin).padStart(2, "0")}:{String(elapsedSec).padStart(2, "0")}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-[#888] text-xs mb-1">Remaining</p>
                    <p className={`font-mono font-bold ${remaining < 300 ? "text-red-400" : "text-white"}`}>
                      {String(remainingMin).padStart(2, "0")}:{String(remainingSec).padStart(2, "0")}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => endJourney(false)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors"
              >
                <Square size={18} />
                End Journey
              </button>
              {currentPos && (
                <p className="text-center text-[#555] text-[10px] font-mono mt-3">
                  Last location: {currentPos.lat.toFixed(5)}, {currentPos.lng.toFixed(5)}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Destination */}
              <div>
                <label className="text-[#888] text-xs uppercase tracking-wider mb-2 block">Destination</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                  <input
                    type="text"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="Where are you going?"
                    className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl pl-9 pr-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-red-500/40"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-[#888] text-xs uppercase tracking-wider mb-2 block">
                  Estimated Duration: <span className="text-white">{duration} min</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={480}
                  step={5}
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
                <div className="flex justify-between text-[#555] text-xs mt-1">
                  <span>5 min</span>
                  <span>8 hrs</span>
                </div>
              </div>

              {/* Follower Contacts */}
              <div>
                <label className="text-[#888] text-xs uppercase tracking-wider mb-2 block flex items-center gap-1">
                  <Users size={12} /> Follower Contacts
                </label>
                {contacts.length === 0 ? (
                  <p className="text-[#555] text-sm">No contacts added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {contacts.map(c => (
                      <button
                        key={c.id}
                        onClick={() => toggleContact(c.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                          selectedContacts.includes(c.id)
                            ? "bg-red-500/10 border-red-500/30"
                            : "bg-white/[0.03] border-white/[0.07]"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedContacts.includes(c.id) ? "bg-red-500 border-red-500" : "border-[#444]"
                        }`}>
                          {selectedContacts.includes(c.id) && <CheckCircle size={12} className="text-white" />}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{c.name}</p>
                          <p className="text-[#555] text-xs">{c.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={startJourney}
                disabled={!destination.trim() || starting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition-colors"
              >
                <Play size={18} />
                {starting ? "Starting..." : "Start Journey"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
