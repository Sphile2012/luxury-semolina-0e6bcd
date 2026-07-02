import { Phone, Mail, Pencil, Trash2, Star, MessageSquare, PhoneCall, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const relationshipColors = {
  family:    { text: "text-rose-400",   bg: "bg-rose-500/10 border-rose-500/20" },
  friend:    { text: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  colleague: { text: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  neighbor:  { text: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
  other:     { text: "text-[#666]",     bg: "bg-white/5 border-white/10" },
};

const avatarColors = [
  "from-red-900/80 to-red-600/40",
  "from-blue-900/80 to-blue-600/40",
  "from-purple-900/80 to-purple-600/40",
  "from-teal-900/80 to-teal-600/40",
  "from-amber-900/80 to-amber-600/40",
];

export default function ContactCard({ contact, onEdit, onDelete, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const rel = relationshipColors[contact.relationship] || relationshipColors.other;
  const initials = contact.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const gradientColor = avatarColors[index % avatarColors.length];

  const openWhatsApp = () => {
    const msg = encodeURIComponent("Hi, I'm checking in from Panic Ring.");
    window.open(`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden"
    >
      {/* Main row */}
      <div className="p-4 flex items-center gap-4">
        {/* Avatar with priority badge */}
        <div className="relative flex-shrink-0">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradientColor} border border-white/10 flex items-center justify-center text-white font-bold text-sm`}>
            {initials}
          </div>
          {contact.priority === 1 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
              <Star size={10} className="text-white fill-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-semibold text-sm truncate">{contact.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize flex-shrink-0 ${rel.bg} ${rel.text}`}>
              {contact.relationship || "other"}
            </span>
          </div>
          <p className="text-[#666] text-xs mt-0.5">{contact.phone}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${contact.priority === 1 ? "bg-red-500" : contact.priority <= 3 ? "bg-amber-400" : "bg-[#444]"}`} />
            <span className="text-[#555] text-[10px]">Priority #{contact.priority || 1}</span>
          </div>
        </div>

        {/* Call button — primary action */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={`tel:${contact.phone}`}
            className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/25 transition-colors"
          >
            <Phone size={15} className="text-emerald-400" />
          </a>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            {expanded ? <ChevronUp size={14} className="text-[#666]" /> : <ChevronDown size={14} className="text-[#666]" />}
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
            className="border-t border-white/[0.05] px-4 pb-3 pt-3"
          >
            <div className="grid grid-cols-4 gap-2 mb-3">
              <a
                href={`tel:${contact.phone}`}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                <Phone size={16} className="text-emerald-400" />
                <span className="text-emerald-400 text-[10px] font-medium">Call</span>
              </a>
              <button
                onClick={openWhatsApp}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors"
              >
                <MessageSquare size={16} className="text-green-400" />
                <span className="text-green-400 text-[10px] font-medium">WhatsApp</span>
              </button>
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                >
                  <Mail size={16} className="text-blue-400" />
                  <span className="text-blue-400 text-[10px] font-medium">Email</span>
                </a>
              )}
              <button
                onClick={() => onEdit(contact)}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <Pencil size={16} className="text-[#888]" />
                <span className="text-[#888] text-[10px] font-medium">Edit</span>
              </button>
            </div>

            {contact.email && (
              <p className="text-[#555] text-xs mb-2 flex items-center gap-1">
                <Mail size={10} /> {contact.email}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {contact.notify_sms && (
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">SMS ✓</span>
                )}
                {contact.notify_email && (
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">Email ✓</span>
                )}
              </div>
              <button
                onClick={() => onDelete(contact.id)}
                className="flex items-center gap-1 text-red-400/60 hover:text-red-400 text-xs transition-colors"
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
