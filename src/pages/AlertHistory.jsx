import { useState, useEffect } from "react";
import { entities } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, MapPin, Clock, Mic, Users, Filter } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const STATUS_CONFIG = {
  active: {
    label: "Active",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/15 border-red-500/30",
    dot: "bg-red-400",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  false_alarm: {
    label: "False Alarm",
    icon: XCircle,
    color: "text-slate-400",
    bg: "bg-white/5 border-white/10",
    dot: "bg-slate-500",
  },
};

const TRIGGER_LABELS = {
  panic_ring: "Panic Ring Device",
  app_button: "App Button",
  auto: "Automatic",
  manual: "Manual",
};

function AlertCard({ alert }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[alert.status] || STATUS_CONFIG.resolved;
  const Icon = cfg.icon;

  const createdAt = alert.created_date ? new Date(alert.created_date) : null;
  const resolvedAt = alert.resolved_at ? new Date(alert.resolved_at) : null;

  const duration = createdAt && resolvedAt
    ? Math.round((resolvedAt - createdAt) / 60000)
    : null;

  return (
    <div
      className={`rounded-2xl border transition-all cursor-pointer ${cfg.bg} ${expanded ? "shadow-lg" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
          <Icon size={16} className={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            {createdAt && (
              <span className="text-[#555] text-xs">
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
            )}
          </div>
          <p className="text-white text-sm font-medium leading-snug line-clamp-2">
            {alert.message || "Emergency alert triggered"}
          </p>
          {alert.address && (
            <div className="flex items-center gap-1 mt-1.5">
              <MapPin size={11} className="text-[#555] flex-shrink-0" />
              <span className="text-[#555] text-xs truncate">{alert.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.05] pt-3">

          {/* Timestamp row */}
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-[#444] text-[10px] uppercase tracking-wider mb-0.5">Triggered</p>
              <p className="text-white text-xs font-medium">
                {createdAt ? format(createdAt, "dd MMM yyyy, HH:mm:ss") : "—"}
              </p>
            </div>
            {resolvedAt && (
              <div>
                <p className="text-[#444] text-[10px] uppercase tracking-wider mb-0.5">Resolved</p>
                <p className="text-white text-xs font-medium">
                  {format(resolvedAt, "dd MMM yyyy, HH:mm:ss")}
                </p>
              </div>
            )}
            {duration !== null && (
              <div>
                <p className="text-[#444] text-[10px] uppercase tracking-wider mb-0.5">Duration</p>
                <p className="text-white text-xs font-medium">{duration} min</p>
              </div>
            )}
          </div>

          {/* Trigger method */}
          <div className="flex items-center gap-2">
            <AlertTriangle size={12} className="text-[#555]" />
            <span className="text-[#666] text-xs">
              Trigger: <span className="text-white">{TRIGGER_LABELS[alert.trigger_method] || alert.trigger_method || "Unknown"}</span>
            </span>
          </div>

          {/* Coordinates */}
          {alert.latitude && alert.longitude && (
            <a
              href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl p-2.5 hover:bg-white/[0.07] transition-colors"
            >
              <MapPin size={13} className="text-red-400" />
              <span className="text-xs text-[#888]">
                {Number(alert.latitude).toFixed(5)}, {Number(alert.longitude).toFixed(5)}
              </span>
              <span className="ml-auto text-[10px] text-red-400 font-medium">Open Map →</span>
            </a>
          )}

          {/* Contacts notified */}
          {alert.contacts_notified?.length > 0 && (
            <div className="flex items-start gap-2">
              <Users size={12} className="text-[#555] mt-0.5" />
              <div>
                <p className="text-[#666] text-xs mb-1">Contacts notified:</p>
                <div className="flex flex-wrap gap-1">
                  {alert.contacts_notified.map((c, i) => (
                    <span key={i} className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-2 py-0.5 text-[#aaa] text-xs">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Audio */}
          {alert.audio_url && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Mic size={12} className="text-emerald-400" />
                <span className="text-[#666] text-xs">Audio recording</span>
              </div>
              <audio
                controls
                src={alert.audio_url}
                className="w-full h-8 rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Notes */}
          {alert.notes && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <p className="text-[#444] text-[10px] uppercase tracking-wider mb-1">Notes</p>
              <p className="text-[#888] text-xs leading-relaxed">{alert.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AlertHistory() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (isAuthenticated && user) {
      entities.Alert.filter({ owner_email: user.email }, "-created_date", 50)
        .then(setAlerts)
        .finally(() => setLoading(false));
    } else if (!isLoadingAuth) {
      setLoading(false);
    }
  }, [isAuthenticated, isLoadingAuth, user]);

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.status === filter);

  const counts = {
    all: alerts.length,
    active: alerts.filter(a => a.status === "active").length,
    resolved: alerts.filter(a => a.status === "resolved").length,
    false_alarm: alerts.filter(a => a.status === "false_alarm").length,
  };

  if (isLoadingAuth) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/"
            className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Alert History</h1>
            <p className="text-[#555] text-xs">{alerts.length} incident{alerts.length !== 1 ? "s" : ""} recorded</p>
          </div>
        </div>

        {/* Summary stats */}
        {!loading && alerts.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Total", value: counts.all, color: "text-white" },
              { label: "Resolved", value: counts.resolved, color: "text-emerald-400" },
              { label: "False Alarms", value: counts.false_alarm, color: "text-slate-400" },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-3 text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[#555] text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {!loading && alerts.length > 0 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "resolved", label: "Resolved" },
              { key: "false_alarm", label: "False Alarm" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                  ${filter === tab.key
                    ? "bg-red-600 text-white"
                    : "bg-white/[0.05] text-[#666] hover:text-white hover:bg-white/10"}`}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${filter === tab.key ? "bg-white/20" : "bg-white/10"}`}>
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Alert list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/[0.03] border border-white/[0.07] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.07] rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-[#333]" />
            </div>
            <p className="text-[#555] font-medium">
              {filter === "all" ? "No alerts recorded yet" : `No ${filter.replace("_", " ")} alerts`}
            </p>
            <p className="text-[#333] text-xs mt-1">Your incident history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}