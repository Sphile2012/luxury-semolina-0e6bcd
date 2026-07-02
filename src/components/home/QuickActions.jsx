import { Link } from "react-router-dom";
import { Map, Users, History, Navigation, Phone, MessageSquare, HelpCircle, Volume2 } from "lucide-react";
import SirenButton from "./SirenButton";

const actions = [
  { label: "Map",       icon: Map,        to: "/Map",         color: "#3b82f6", glow: "rgba(59,130,246,0.15)" },
  { label: "Contacts",  icon: Users,      to: "/Contacts",    color: "#a78bfa", glow: "rgba(167,139,250,0.15)" },
  { label: "History",   icon: History,    to: "/AlertHistory",color: "#f59e0b", glow: "rgba(245,158,11,0.15)" },
  { label: "Journey",   icon: Navigation, to: "/Journey",     color: "#06b6d4", glow: "rgba(6,182,212,0.15)" },
  { label: "Find Phone",icon: Phone,      to: "/FindMyPhone", color: "#ec4899", glow: "rgba(236,72,153,0.15)" },
  { label: "Fake Call", icon: MessageSquare, to: "/FakeCall", color: "#818cf8", glow: "rgba(129,140,248,0.15)" },
];

export default function QuickActions() {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
        Quick Access
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {actions.map(({ label, icon: Icon, to, color, glow }) => (
          <Link
            key={label}
            to={to}
            className="flex flex-col items-center gap-2.5 py-4 rounded-2xl transition-all active:scale-95"
            style={{
              background: "rgba(17,24,39,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: `0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = glow;
              e.currentTarget.style.borderColor = color + "40";
              e.currentTarget.style.boxShadow = `0 4px 24px ${glow}, 0 0 0 1px ${color}20, inset 0 1px 0 rgba(255,255,255,0.08)`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(17,24,39,0.7)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)";
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: glow, border: `1px solid ${color}30` }}
            >
              <Icon size={17} style={{ color }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: "#64748b" }}>{label}</span>
          </Link>
        ))}

        {/* Siren */}
        <SirenButton />

        {/* Help */}
        <Link
          to="/faq"
          className="flex flex-col items-center gap-2.5 py-4 rounded-2xl transition-all active:scale-95"
          style={{
            background: "rgba(17,24,39,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <HelpCircle size={17} style={{ color: "#475569" }} />
          </div>
          <span className="text-[10px] font-semibold" style={{ color: "#64748b" }}>Help</span>
        </Link>
      </div>
    </div>
  );
}
