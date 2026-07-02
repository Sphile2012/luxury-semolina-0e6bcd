import { Phone, Mail, Pencil, Trash2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const avatarBg = [
  { bg: "#FDE8E8", color: "#D95F5E" },
  { bg: "#E8F0FD", color: "#3B6FD9" },
  { bg: "#E8FDF0", color: "#2D8A5A" },
  { bg: "#F3E8FD", color: "#7C3AC9" },
  { bg: "#FDF6E8", color: "#B87A1A" },
];

export default function ContactCard({ contact, onEdit, onDelete, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const av = avatarBg[index % avatarBg.length];
  const initials = contact.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const openWhatsApp = () => {
    const msg = encodeURIComponent("Hi, I'm checking in via Panic Ring.");
    window.open(`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
    >
      {/* Main row */}
      <div className="p-4 flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: av.bg, color: av.color }}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm truncate" style={{ color: "var(--sos-text)" }}>
              {contact.name}
            </p>
            {/* Safe status badge — always show for emergency contacts */}
            <span className="sos-badge-safe flex-shrink-0">Safe</span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--sos-muted)" }}>{contact.phone}</p>
          <p className="text-[10px] mt-0.5 capitalize" style={{ color: "var(--sos-dim)" }}>
            {contact.relationship || "contact"} · Priority #{contact.priority || 1}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={`tel:${contact.phone}`}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{ background: "var(--sos-coral)", boxShadow: "0 2px 8px rgba(240,113,112,0.3)" }}
          >
            <Phone size={14} className="text-white" />
          </a>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{ background: "var(--sos-surface2)", border: "1px solid var(--sos-border)" }}
          >
            {expanded
              ? <ChevronUp size={14} style={{ color: "var(--sos-muted)" }} />
              : <ChevronDown size={14} style={{ color: "var(--sos-muted)" }} />
            }
          </button>
        </div>
      </div>

      {/* Expanded actions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ borderTop: "1px solid var(--sos-border)" }}
            className="px-4 pb-3 pt-3"
          >
            <div className="grid grid-cols-4 gap-2 mb-3">
              <a href={`tel:${contact.phone}`}
                className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all"
                style={{ background: "var(--sos-green-light)" }}>
                <Phone size={15} style={{ color: "var(--sos-green)" }} />
                <span className="text-[10px] font-semibold" style={{ color: "var(--sos-green)" }}>Call</span>
              </a>
              <button onClick={openWhatsApp}
                className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all"
                style={{ background: "#E8FDF0" }}>
                <MessageSquare size={15} style={{ color: "#2D8A5A" }} />
                <span className="text-[10px] font-semibold" style={{ color: "#2D8A5A" }}>WhatsApp</span>
              </button>
              {contact.email && (
                <a href={`mailto:${contact.email}`}
                  className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all"
                  style={{ background: "#E8F0FD" }}>
                  <Mail size={15} style={{ color: "#3B6FD9" }} />
                  <span className="text-[10px] font-semibold" style={{ color: "#3B6FD9" }}>Email</span>
                </a>
              )}
              <button onClick={() => onEdit(contact)}
                className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all"
                style={{ background: "var(--sos-surface2)", border: "1px solid var(--sos-border)" }}>
                <Pencil size={15} style={{ color: "var(--sos-muted)" }} />
                <span className="text-[10px] font-semibold" style={{ color: "var(--sos-muted)" }}>Edit</span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 flex-wrap">
                {contact.notify_sms && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "#EEF2FF", color: "#4F46E5" }}>SMS ✓</span>
                )}
                {contact.notify_email && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "#F3E8FD", color: "#7C3AC9" }}>Email ✓</span>
                )}
              </div>
              <button
                onClick={() => onDelete(contact.id)}
                className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: "var(--sos-coral)" }}
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
