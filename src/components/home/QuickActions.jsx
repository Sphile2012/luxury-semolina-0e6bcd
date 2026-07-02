import { Link } from "react-router-dom";
import { Map, Users, History, Navigation, Phone, MessageSquare, HelpCircle } from "lucide-react";
import SirenButton from "./SirenButton";

const actions = [
  { label: "Map",        icon: Map,           to: "/Map",         color: "#4A90D9", bg: "#E8F0FD" },
  { label: "Contacts",   icon: Users,         to: "/Contacts",    color: "#7C3AC9", bg: "#F3E8FD" },
  { label: "History",    icon: History,       to: "/AlertHistory",color: "#B87A1A", bg: "#FDF6E8" },
  { label: "Journey",    icon: Navigation,    to: "/Journey",     color: "#2D8A5A", bg: "#E8FDF0" },
  { label: "Find Phone", icon: Phone,         to: "/FindMyPhone", color: "#D95F5E", bg: "#FDE8E8" },
  { label: "Fake Call",  icon: MessageSquare, to: "/FakeCall",    color: "#6D6BCC", bg: "#EFEFF9" },
];

export default function QuickActions() {
  return (
    <div className="mb-8">
      <p className="sos-section-label">Quick Access</p>
      <div className="grid grid-cols-3 gap-3">
        {actions.map(({ label, icon: Icon, to, color, bg }) => (
          <Link
            key={label}
            to={to}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all active:scale-95"
            style={{
              background: bg,
              border: "1px solid transparent",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${color}22`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
            >
              <Icon size={17} style={{ color }} />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: "#5A5E72" }}>{label}</span>
          </Link>
        ))}

        {/* Siren */}
        <SirenButton />

        {/* Help */}
        <Link
          to="/faq"
          className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all active:scale-95"
          style={{ background: "var(--sos-surface2)", border: "1px solid var(--sos-border)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <HelpCircle size={17} style={{ color: "var(--sos-muted)" }} />
          </div>
          <span className="text-[11px] font-semibold" style={{ color: "var(--sos-muted)" }}>Help</span>
        </Link>
      </div>
    </div>
  );
}
