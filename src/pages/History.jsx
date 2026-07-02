import { useState, useEffect } from "react";
import { entities } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { formatDistanceToNow, format } from "date-fns";
import { MapPin, Clock, AlertTriangle, CheckCircle, XCircle, Filter } from "lucide-react";

const statusConfig = {
  active: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Active" },
  resolved: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Resolved" },
  false_alarm: { icon: XCircle, color: "text-[#666]", bg: "bg-white/5 border-white/10", label: "False Alarm" },
};

export default function History() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (!isLoadingAuth) setLoading(false);
      return;
    }
    entities.Alert.filter({ owner_email: user.email }, "-created_date", 50)
      .then(data => { setAlerts(data); setLoading(false); });
  }, [isAuthenticated, isLoadingAuth, user]);

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.status === filter);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Incident History</h1>
          <p className="text-[#666] text-sm mt-1">{alerts.length} total incidents recorded</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["all", "active", "resolved", "false_alarm"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${filter === f ? "bg-red-600 text-white" : "bg-white/5 text-[#888] hover:bg-white/10"}`}
            >
              {f === "false_alarm" ? "False Alarm" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#444] text-sm">No incidents found</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(alert => {
              const cfg = statusConfig[alert.status] || statusConfig.resolved;
              return (
                <div key={alert.id} className={`border rounded-2xl p-4 ${cfg.bg}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <cfg.icon size={16} className={cfg.color} />
                      <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <span className="text-[#555] text-xs">
                      {format(new Date(alert.created_date), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium mb-2">{alert.message || "Emergency Alert"}</p>
                  <div className="flex flex-wrap gap-3">
                    {alert.address && (
                      <span className="flex items-center gap-1 text-[#555] text-xs">
                        <MapPin size={11} /> {alert.address}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[#555] text-xs capitalize">
                      Trigger: {alert.trigger_method?.replace("_", " ")}
                    </span>
                    {alert.contacts_notified?.length > 0 && (
                      <span className="text-[#555] text-xs">
                        Notified: {alert.contacts_notified.join(", ")}
                      </span>
                    )}
                  </div>
                  {alert.resolved_at && (
                    <p className="text-[#555] text-xs mt-2">
                      Resolved {formatDistanceToNow(new Date(alert.resolved_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}