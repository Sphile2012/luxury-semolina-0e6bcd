/**
 * REQ 11 — Escalation Status Banner
 * Shows on active alert: "Notified: Mom (2 min ago) → Next: Dad in 3 min"
 */
import { useEffect, useState } from "react";
import { ChevronRight, Clock } from "lucide-react";

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

function timeUntil(ts) {
  const diff = Math.floor((new Date(ts).getTime() - Date.now()) / 1000);
  if (diff <= 0) return "now";
  if (diff < 60) return `${diff}s`;
  return `${Math.floor(diff / 60)}m`;
}

export default function EscalationStatus({ alertId, contacts = [] }) {
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    if (!alertId || !contacts.length) return;

    // Build escalation timeline from contacts sorted by priority
    const sorted = [...contacts].sort((a, b) => (a.priority || 1) - (b.priority || 1));
    const timeout = 5 * 60 * 1000; // 5 min default per contact

    const now = Date.now();
    const built = sorted.map((c, i) => ({
      contact: c,
      notifiedAt: new Date(now + i * timeout).toISOString(),
      status: i === 0 ? "notified" : "pending",
    }));
    setSteps(built);
  }, [alertId, contacts]);

  if (!steps.length) return null;

  const notified = steps.filter(s => s.status === "notified");
  const pending = steps.filter(s => s.status === "pending");
  const last = notified[notified.length - 1];
  const next = pending[0];

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mb-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Clock size={12} className="text-amber-400 flex-shrink-0" />
        {last && (
          <span className="text-amber-300 text-xs">
            Notified: <strong>{last.contact.name}</strong> ({timeAgo(last.notifiedAt)})
          </span>
        )}
        {next && (
          <>
            <ChevronRight size={12} className="text-amber-500" />
            <span className="text-amber-400 text-xs">
              Next: <strong>{next.contact.name}</strong> in {timeUntil(next.notifiedAt)}
            </span>
          </>
        )}
        {!next && notified.length > 0 && (
          <span className="text-emerald-400 text-xs">All contacts notified</span>
        )}
      </div>
    </div>
  );
}
