import { Bluetooth, Shield, Crown, Zap, Wifi, WifiOff } from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const planConfig = {
  premium:  { icon: Crown,  color: "#f59e0b", label: "Premium",  bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)" },
  standard: { icon: Zap,    color: "#06b6d4", label: "Standard", bg: "rgba(6,182,212,0.12)",   border: "rgba(6,182,212,0.25)" },
  basic:    { icon: Shield, color: "#3b82f6", label: "Basic",    bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.25)" },
};

export default function StatusBar({ user, profile, loading, contactCount = 0 }) {
  if (loading) return (
    <div className="mb-8">
      <div className="h-4 w-28 rounded-lg animate-pulse mb-2" style={{ background: "rgba(255,255,255,0.05)" }} />
      <div className="h-7 w-48 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>
  );

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const plan = planConfig[profile?.subscription_plan] || planConfig.basic;
  const PlanIcon = plan.icon;

  return (
    <div className="mb-8 page-enter">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: "#64748b" }}>{getGreeting()}</p>
          <h1 className="text-2xl font-black" style={{ color: "#f1f5f9" }}>
            {firstName} 👋
          </h1>
          <p className="text-xs mt-1" style={{ color: "#334155" }}>Stay safe, stay protected</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Plan badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: plan.bg, border: `1px solid ${plan.border}`, color: plan.color }}
          >
            <PlanIcon size={11} />
            {plan.label}
          </div>

          {/* Ring connection */}
          {profile?.device_connected ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium"
              style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#67e8f9" }}
            >
              <div className="nt-dot-active" style={{ width: 6, height: 6 }} />
              Ring Online
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#475569" }}
            >
              <Bluetooth size={10} />
              No Ring
            </div>
          )}
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={contactCount > 0
            ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#6ee7b7" }
            : { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#fcd34d" }
          }
        >
          {contactCount > 0 ? `✓ ${contactCount} contact${contactCount !== 1 ? "s" : ""} ready` : "⚠ No contacts set"}
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={profile?.location_sharing
            ? { background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#93c5fd" }
            : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#475569" }
          }
        >
          {profile?.location_sharing ? "📍 GPS Active" : "📍 GPS Off"}
        </div>
      </div>
    </div>
  );
}
