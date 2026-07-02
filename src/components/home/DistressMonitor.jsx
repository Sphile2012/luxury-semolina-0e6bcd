import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, AlertTriangle, Volume2, MessageSquare } from "lucide-react";
import useDistressDetector from "@/hooks/useDistressDetector";
import { entities } from "@/api/client";

function playSecondaryAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(1200, now + i * 0.25);
      gain.gain.setValueAtTime(0.6, now + i * 0.25);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.25 + 0.2);
      osc.start(now + i * 0.25);
      osc.stop(now + i * 0.25 + 0.25);
    }
  } catch {}
}

const REASON_LABELS = {
  high_decibel: { icon: Volume2, label: "Loud sound detected", color: "text-orange-400" },
  keyword: { icon: MessageSquare, label: "Keyword detected", color: "text-red-400" },
};

export default function DistressMonitor({ active, alertId, user }) {
  const [event, setEvent] = useState(null);

  const handleDistress = useCallback(async (reason) => {
    playSecondaryAlarm();
    setEvent({ reason, time: new Date() });

    // Attach a note to the active alert
    if (alertId) {
      try {
        const label = reason === "keyword" ? "keyword 'help'" : "high-decibel audio";
        await entities.Alert.update(alertId, {
          notes: `⚠️ Secondary distress signal triggered: ${label} detected at ${new Date().toLocaleTimeString("en-ZA", { timeZone: "Africa/Johannesburg" })}`,
        });
      } catch {}
    }

    // Re-notify contacts via WhatsApp
    try {
      const contacts = await entities.EmergencyContact.filter({ owner_email: user?.email }, "priority");
      const msg = encodeURIComponent(`🚨 *SECONDARY DISTRESS SIGNAL — ${user?.full_name}*\n\nAudio analysis detected: ${reason === "keyword" ? "distress keyword spoken" : "sustained loud sound / screaming"}.\n\nPlease check on them immediately!\n\n_Sent via Panic Ring_`);
      contacts.slice(0, 2).forEach((c, i) => {
        if (c.phone) {
          setTimeout(() => window.open(`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank"), i * 600);
        }
      });
    } catch {}
  }, [alertId, user]);

  useDistressDetector({ active, onDistressDetected: handleDistress });

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-4"
        >
          <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 transition-colors ${
            event ? "bg-orange-500/10 border-orange-500/30" : "bg-white/[0.03] border-white/[0.06]"
          }`}>
            <motion.div
              animate={active ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                event ? "bg-orange-500/20" : "bg-white/5"
              }`}
            >
              <Mic size={14} className={event ? "text-orange-400" : "text-[#555]"} />
            </motion.div>

            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold">Distress Monitor Active</p>
              {event ? (() => {
                const cfg = REASON_LABELS[event.reason] || REASON_LABELS.high_decibel;
                const Icon = cfg.icon;
                return (
                  <div className={`flex items-center gap-1 mt-0.5 ${cfg.color}`}>
                    <Icon size={11} />
                    <span className="text-[11px] font-medium">
                      {cfg.label} · {event.time.toLocaleTimeString("en-ZA")}
                    </span>
                  </div>
                );
              })() : (
                <p className="text-[#555] text-[11px] mt-0.5">Listening for screams & keywords…</p>
              )}
            </div>

            {event && (
              <div className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 px-2 py-1 rounded-lg flex-shrink-0">
                <AlertTriangle size={11} className="text-orange-400" />
                <span className="text-orange-400 text-[10px] font-bold">TRIGGERED</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
