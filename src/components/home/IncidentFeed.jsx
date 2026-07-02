import { useState, useEffect, useRef } from "react";
import { AlertTriangle, MapPin, MessageSquare, CheckCircle, Clock, Radio, Mic, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EVENT_ICONS = {
  alert_created:  { icon: AlertTriangle, color: "text-red-400",     bg: "bg-red-500/15" },
  status_change:  { icon: CheckCircle,   color: "text-emerald-400", bg: "bg-emerald-500/15" },
  location_ping:  { icon: MapPin,        color: "text-blue-400",    bg: "bg-blue-500/15" },
  note:           { icon: MessageSquare, color: "text-purple-400",  bg: "bg-purple-500/15" },
  audio:          { icon: Mic,           color: "text-amber-400",   bg: "bg-amber-500/15" },
};

function FeedEvent({ event, isNew }) {
  const cfg = EVENT_ICONS[event.type] || EVENT_ICONS.note;
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -12 } : false}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-3 items-start"
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Icon size={14} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm leading-snug">{event.message}</p>
        {event.sub && <p className="text-[#555] text-xs mt-0.5 truncate">{event.sub}</p>}
        <p className="text-[#444] text-[10px] mt-0.5">{event.time}</p>
      </div>
    </motion.div>
  );
}

function formatTime(ts) {
  const d = new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 5)  return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

function buildInitialEvents(alert) {
  const events = [];
  events.push({
    id: "created",
    type: "alert_created",
    message: "🚨 Emergency alert activated",
    sub: `${alert.contacts_notified?.length || 0} contact(s) notified`,
    time: formatTime(alert.created_date),
    ts: new Date(alert.created_date).getTime(),
  });
  if (alert.latitude && alert.longitude) {
    events.push({
      id: "loc-initial",
      type: "location_ping",
      message: "📍 Location captured",
      sub: alert.address || `${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}`,
      time: formatTime(alert.created_date),
      ts: new Date(alert.created_date).getTime() + 1,
    });
  }
  if (alert.audio_url) {
    events.push({
      id: "audio",
      type: "audio",
      message: "🎙️ Audio recording attached",
      sub: "Tap to listen",
      time: formatTime(alert.created_date),
      ts: new Date(alert.created_date).getTime() + 2,
      url: alert.audio_url,
    });
  }
  if (alert.notes) {
    events.push({
      id: "note-0",
      type: "note",
      message: alert.notes,
      time: formatTime(alert.updated_date || alert.created_date),
      ts: new Date(alert.updated_date || alert.created_date).getTime() + 3,
    });
  }
  return events.sort((a, b) => a.ts - b.ts);
}

export default function IncidentFeed({ alert }) {
  const [events, setEvents] = useState(() => buildInitialEvents(alert));
  const [newIds, setNewIds] = useState(new Set());
  const [collapsed, setCollapsed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const prevAlertRef = useRef(alert);
  const bottomRef = useRef(null);

  // Elapsed timer
  useEffect(() => {
    const start = new Date(alert.created_date).getTime();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [alert.created_date]);

  // No real-time subscription needed — parent component refetches via React Query
  useEffect(() => {
    // Polling handled by parent's refetchInterval on alerts query
  }, [alert.id]);

  // Location pings every 30 seconds
  useEffect(() => {
    const iv = setInterval(() => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((pos) => {
        const ping = {
          id: `ping-${Date.now()}`,
          type: "location_ping",
          message: "📍 Location ping",
          sub: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
          time: "just now",
          ts: Date.now(),
        };
        setEvents(prev => [...prev, ping]);
        setNewIds(prev => new Set([...prev, ping.id]));
      });
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  // Scroll to bottom on new events
  useEffect(() => {
    if (!collapsed) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events, collapsed]);

  const formatElapsed = (s) => {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  };

  return (
    <div className="bg-[#0D0A0A] border border-red-500/20 rounded-2xl overflow-hidden mb-4">
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            <Radio size={14} className="text-red-400" />
          </motion.div>
          <span className="text-white text-sm font-semibold">Incident Feed</span>
          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-mono">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#555] text-xs">
            <Clock size={11} />
            <span className="font-mono">{formatElapsed(elapsed)}</span>
          </div>
          {collapsed ? <ChevronDown size={14} className="text-[#555]" /> : <ChevronUp size={14} className="text-[#555]" />}
        </div>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 max-h-72 overflow-y-auto">
              {/* Divider */}
              <div className="h-px bg-white/[0.05]" />
              {events.map((event) => (
                <FeedEvent key={event.id} event={event} isNew={newIds.has(event.id)} />
              ))}
              {/* Audio player if present */}
              {events.find(e => e.url) && (
                <div className="pt-1">
                  <audio
                    controls
                    src={events.find(e => e.url).url}
                    className="w-full h-8 rounded-lg"
                    style={{ filter: "invert(1) hue-rotate(180deg)" }}
                  />
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}