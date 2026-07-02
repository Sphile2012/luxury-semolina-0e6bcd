import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, CheckCircle, MapPin, ChevronDown, ChevronUp } from "lucide-react";

export default function ActiveAlertBanner({ alert, onResolve }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 text-white"
      style={{
        background: "linear-gradient(135deg, rgba(220,38,38,0.95), rgba(239,68,68,0.9))",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(239,68,68,0.4)",
        boxShadow: "0 4px 32px rgba(239,68,68,0.3), 0 0 0 1px rgba(239,68,68,0.2)",
      }}
    >
      {/* Main bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: "#fff", boxShadow: "0 0 8px rgba(255,255,255,0.8)" }}
          />
          <div>
            <p className="font-black text-sm tracking-wide">🚨 EMERGENCY ACTIVE</p>
            <p className="text-red-100 text-xs opacity-80">
              {alert?.contacts_notified?.length > 0
                ? `${alert.contacts_notified.length} contact${alert.contacts_notified.length !== 1 ? "s" : ""} notified · GPS live`
                : "Contacts notified · GPS shared"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={onResolve}
            className="flex items-center gap-1.5 text-red-600 text-xs font-black px-3 py-1.5 rounded-full"
            style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
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
          style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}
        >
          {alert?.address && (
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-red-200 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-100 text-xs font-semibold">{alert.address}</p>
                {alert.latitude && (
                  <button
                    onClick={() => window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`, "_blank")}
                    className="text-red-200 text-[10px] underline opacity-80"
                  >
                    Open in Google Maps →
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { window.location.href = "tel:10111"; }}
              className="flex items-center justify-center gap-2 font-black text-xs py-2.5 rounded-xl text-red-600"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
            >
              <Phone size={13} /> Call Police (10111)
            </button>
            <button
              onClick={() => { window.location.href = "tel:10177"; }}
              className="flex items-center justify-center gap-2 font-bold text-white text-xs py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <Phone size={13} /> Ambulance (10177)
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
