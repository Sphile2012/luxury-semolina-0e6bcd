import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, CheckCircle, MapPin, ChevronDown, ChevronUp } from "lucide-react";

export default function ActiveAlertBanner({ alert, onResolve }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50"
      style={{
        background: "var(--sos-coral)",
        boxShadow: "0 4px 20px rgba(240,113,112,0.4)",
      }}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-2.5 h-2.5 rounded-full bg-white flex-shrink-0"
            style={{ boxShadow: "0 0 8px rgba(255,255,255,0.8)" }}
          />
          <div>
            <p className="font-black text-white text-sm tracking-wide">🚨 EMERGENCY ACTIVE</p>
            <p className="text-white/80 text-xs">
              {alert?.contacts_notified?.length > 0
                ? `${alert.contacts_notified.length} contact${alert.contacts_notified.length !== 1 ? "s" : ""} notified · GPS live`
                : "Contacts notified · GPS shared"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded(e => !e)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            {expanded ? <ChevronUp size={14} className="text-white" /> : <ChevronDown size={14} className="text-white" />}
          </button>
          <button
            onClick={onResolve}
            className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full"
            style={{ background: "#fff", color: "var(--sos-coral-deep)" }}
          >
            <CheckCircle size={12} /> Resolve
          </button>
        </div>
      </div>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="px-4 pb-4 pt-2 space-y-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}
        >
          {alert?.address && (
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-white/80 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white text-xs font-semibold">{alert.address}</p>
                {alert.latitude && (
                  <button
                    onClick={() => window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`, "_blank")}
                    className="text-white/70 text-[10px] underline">
                    Open in Google Maps →
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { window.location.href = "tel:10111"; }}
              className="flex items-center justify-center gap-2 font-black text-xs py-2.5 rounded-xl"
              style={{ background: "#fff", color: "var(--sos-coral-deep)" }}
            >
              <Phone size={13} /> Police (10111)
            </button>
            <button
              onClick={() => { window.location.href = "tel:10177"; }}
              className="flex items-center justify-center gap-2 font-bold text-white text-xs py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              <Phone size={13} /> Ambulance (10177)
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
