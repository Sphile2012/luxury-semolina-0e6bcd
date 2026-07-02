import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, X, PhoneOff, MapPin, Shield } from "lucide-react";

/**
 * Full-screen emergency calling UI shown when SOS is triggered.
 * Shows a countdown, cycling through contacts being notified.
 */
export default function EmergencyCallingScreen({ contacts = [], alert, onDismiss, user }) {
  const [elapsed, setElapsed] = useState(0);
  const [currentContactIdx, setCurrentContactIdx] = useState(0);
  const [notifiedCount, setNotifiedCount] = useState(0);
  const [phase, setPhase] = useState("dialing"); // dialing | notifying | complete

  useEffect(() => {
    const timer = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cycle through contacts every 4 seconds
  useEffect(() => {
    if (contacts.length === 0) return;
    const interval = setInterval(() => {
      setCurrentContactIdx(idx => {
        const next = (idx + 1) % contacts.length;
        if (next === 0) {
          setPhase("complete");
          setNotifiedCount(contacts.length);
          clearInterval(interval);
        } else {
          setNotifiedCount(n => n + 1);
        }
        return next;
      });
    }, 3000);
    // Mark first as notified immediately
    setNotifiedCount(1);
    setPhase("notifying");
    return () => clearInterval(interval);
  }, [contacts.length]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const callPolice = () => {
    window.location.href = "tel:10111";
  };

  const callContact = (contact) => {
    if (contact?.phone) window.location.href = `tel:${contact.phone}`;
  };

  const currentContact = contacts[currentContactIdx];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#0a0010] via-[#1a0020] to-[#0a0010] flex flex-col items-center justify-between px-6 py-12"
    >
      {/* Header */}
      <div className="text-center w-full">
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/40 px-4 py-2 rounded-full mb-4"
        >
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-red-400 text-sm font-bold tracking-wider">EMERGENCY ACTIVE</span>
        </motion.div>
        <p className="text-white/60 text-sm">{formatTime(elapsed)} elapsed</p>
      </div>

      {/* Current contact being notified */}
      <div className="flex flex-col items-center gap-6 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentContactIdx}
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Avatar with pulse rings */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute w-36 h-36 rounded-full border-2 border-red-500/40"
              />
              <motion.div
                animate={{ scale: [1, 1.7, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                className="absolute w-36 h-36 rounded-full border-2 border-red-500/20"
              />
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-900/80 to-red-600/40 border-4 border-red-500/60 flex items-center justify-center shadow-2xl shadow-red-500/30">
                <span className="text-white font-black text-4xl">
                  {currentContact
                    ? currentContact.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
                    : "SOS"}
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-white font-black text-2xl">
                {phase === "complete" ? "All Contacts Notified" : (currentContact?.name || "Emergency Alert")}
              </p>
              <p className="text-white/50 text-sm mt-1">
                {phase === "complete"
                  ? `${notifiedCount} contact${notifiedCount !== 1 ? "s" : ""} alerted via WhatsApp`
                  : phase === "dialing"
                  ? "Sending emergency alert…"
                  : `Notifying contact ${notifiedCount} of ${contacts.length}`}
              </p>
              {currentContact?.phone && phase !== "complete" && (
                <p className="text-red-400/80 text-sm mt-0.5 font-mono">{currentContact.phone}</p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Contact avatars row */}
        {contacts.length > 1 && (
          <div className="flex items-center gap-3 justify-center">
            {contacts.map((c, i) => (
              <motion.button
                key={c.id || i}
                onClick={() => callContact(c)}
                animate={i === currentContactIdx && phase !== "complete" ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
                className={`flex flex-col items-center gap-1.5 transition-all ${i === currentContactIdx && phase !== "complete" ? "opacity-100" : "opacity-40"}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 font-bold text-sm
                  ${i < notifiedCount ? "bg-emerald-600/40 border-emerald-400/60 text-white" : "bg-white/10 border-white/20 text-white/60"}`}>
                  {c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <span className="text-white/50 text-[10px] truncate max-w-[56px]">{c.name.split(" ")[0]}</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Location info */}
        {alert?.address && (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 w-full">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={14} className="text-red-400" />
              <span className="text-white/60 text-xs uppercase tracking-wider">Your Location</span>
            </div>
            <p className="text-white text-sm font-medium">{alert.address}</p>
            {alert.latitude && (
              <button
                onClick={() => window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`, "_blank")}
                className="text-red-400 text-xs mt-1 underline"
              >
                Open in Google Maps →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="w-full space-y-3">
        {/* Call Police */}
        <button
          onClick={callPolice}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 text-base shadow-lg shadow-red-600/30 transition-colors"
        >
          <Phone size={20} />
          CALL POLICE — 10111
        </button>

        {/* Call current contact directly */}
        {currentContact?.phone && (
          <button
            onClick={() => callContact(currentContact)}
            className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-3 text-sm transition-colors border border-white/10"
          >
            <PhoneCall size={16} />
            Call {currentContact.name}
          </button>
        )}

        {/* Resolve / dismiss */}
        <button
          onClick={onDismiss}
          className="w-full text-white/40 text-sm py-2 hover:text-white/60 transition-colors flex items-center justify-center gap-2"
        >
          <X size={14} /> Dismiss screen (alert stays active)
        </button>
      </div>
    </motion.div>
  );
}

function PhoneCall({ size, ...props }) {
  return <Phone size={size} {...props} />;
}
