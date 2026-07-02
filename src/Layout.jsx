import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Map, Settings, Smartphone, Watch, Users, History,
  Navigation, HelpCircle, FileText, Shield, AlertTriangle,
  MessageSquare, Bell, X, Menu, ChevronRight, LogOut,
  Phone, BookOpen
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

// All navigation items grouped by section
const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { label: "Home",         icon: Home,         to: "/",             page: "Home" },
      { label: "Live Map",     icon: Map,           to: "/Map",          page: "Map" },
      { label: "Contacts",     icon: Users,         to: "/Contacts",     page: "Contacts" },
    ],
  },
  {
    label: "Safety",
    items: [
      { label: "Alert History",icon: History,       to: "/AlertHistory", page: "AlertHistory" },
      { label: "Journey",      icon: Navigation,    to: "/Journey",      page: "Journey" },
      { label: "Find My Phone",icon: Smartphone,    to: "/FindMyPhone",  page: "FindMyPhone" },
      { label: "Fake Call",    icon: Phone,         to: "/FakeCall",     page: "FakeCall" },
      { label: "Smartwatch",   icon: Watch,         to: "/Watch",        page: "Watch" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Settings",     icon: Settings,      to: "/Settings",     page: "Settings" },
      { label: "Subscriptions",icon: Bell,          to: "/Subscriptions",page: "Subscriptions" },
      { label: "User Guide",   icon: BookOpen,      to: "/Guide",        page: "Guide" },
      { label: "FAQ",          icon: HelpCircle,    to: "/faq",          page: "faq" },
      { label: "Feedback",     icon: MessageSquare, to: "/complaints",   page: "complaints" },
    ],
  },
];

// Bottom quick nav — just the 4 most-used items + hamburger
const BOTTOM_QUICK = [
  { label: "Home",     icon: Home,     to: "/",          page: "Home" },
  { label: "Map",      icon: Map,      to: "/Map",        page: "Map" },
  { label: "Contacts", icon: Users,    to: "/Contacts",   page: "Contacts" },
  { label: "Settings", icon: Settings, to: "/Settings",   page: "Settings" },
];

export default function Layout({ children, currentPageName }) {
  const [open, setOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (page) =>
    page === "Home"
      ? location.pathname === "/"
      : location.pathname.toLowerCase().includes(page.toLowerCase());

  return (
    <div className="min-h-screen" style={{ background: "var(--nt-bg)" }}>
      {/* Ambient glow blobs */}
      <div className="nt-blob-blue" style={{ width: 600, height: 600, top: -200, left: -200 }} />
      <div className="nt-blob-cyan"  style={{ width: 400, height: 400, top: "40%", right: -150 }} />

      {/* ── TOP HEADER BAR ─────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{
          height: 56,
          background: "rgba(11,15,26,0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#dc2626,#ef4444)",
              boxShadow: "0 0 12px rgba(239,68,68,0.4)",
              border: "1px solid rgba(239,68,68,0.3)",
            }}
          >
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-black text-white text-base tracking-tight">Panic Ring</span>
        </Link>

        {/* Right side: SOS quick + hamburger */}
        <div className="flex items-center gap-2">
          {/* Mini SOS pill */}
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
            style={{
              background: "linear-gradient(135deg,#dc2626,#ef4444)",
              boxShadow: "0 0 10px rgba(239,68,68,0.3)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fff",
            }}
          >
            <AlertTriangle size={11} />
            SOS
          </Link>

          {/* Hamburger button */}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all"
            style={{
              background: open ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.05)",
              border: open ? "1px solid rgba(6,182,212,0.25)" : "1px solid rgba(255,255,255,0.08)",
            }}
            aria-label="Open menu"
          >
            <Menu size={18} style={{ color: open ? "#06b6d4" : "#94a3b8" }} />
          </button>
        </div>
      </header>

      {/* ── PAGE CONTENT (offset by header + bottom bar) ─────────── */}
      <div style={{ paddingTop: 56, paddingBottom: 64, position: "relative", zIndex: 1 }}>
        {children}
      </div>

      {/* ── BOTTOM QUICK-ACCESS BAR ────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 6px)",
          paddingTop: 6,
          paddingLeft: 8,
          paddingRight: 8,
          background: "rgba(11,15,26,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.35)",
        }}
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          {BOTTOM_QUICK.map(({ label, icon: Icon, to, page }) => {
            const active = isActive(page);
            return (
              <Link
                key={page}
                to={to}
                className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all relative"
              >
                {active && (
                  <span
                    className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full"
                    style={{
                      width: 24, height: 2,
                      background: "linear-gradient(90deg,#3b82f6,#06b6d4)",
                      boxShadow: "0 0 6px rgba(6,182,212,0.8)",
                    }}
                  />
                )}
                <div
                  className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
                  style={active ? {
                    background: "rgba(6,182,212,0.12)",
                    border: "1px solid rgba(6,182,212,0.2)",
                    boxShadow: "0 0 10px rgba(6,182,212,0.12)",
                  } : {
                    background: "transparent",
                    border: "1px solid transparent",
                  }}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8}
                    style={{ color: active ? "#06b6d4" : "#475569" }} />
                </div>
                <span className="text-[10px] font-semibold"
                  style={{ color: active ? "#67e8f9" : "#475569" }}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Hamburger in bottom bar too */}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl"
          >
            <div className="w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Menu size={18} style={{ color: "#475569" }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: "#475569" }}>More</span>
          </button>
        </div>
      </nav>

      {/* ── SLIDE-OUT DRAWER OVERLAY ────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            />

            {/* Drawer panel — slides in from right */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[80vw] max-w-xs flex flex-col overflow-hidden"
              style={{
                background: "rgba(13,17,30,0.97)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "-8px 0 40px rgba(0,0,0,0.6)",
              }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg,#dc2626,#ef4444)",
                      boxShadow: "0 0 12px rgba(239,68,68,0.35)",
                    }}
                  >
                    <Shield size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">Panic Ring</p>
                    {user && (
                      <p className="text-[10px]" style={{ color: "#475569" }}>
                        {user.full_name || user.email}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <X size={16} style={{ color: "#64748b" }} />
                </button>
              </div>

              {/* Nav sections */}
              <div className="flex-1 overflow-y-auto py-3">
                {NAV_SECTIONS.map((section) => (
                  <div key={section.label} className="mb-2">
                    <p
                      className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "#334155" }}
                    >
                      {section.label}
                    </p>
                    {section.items.map(({ label, icon: Icon, to, page }) => {
                      const active = isActive(page);
                      return (
                        <Link
                          key={page}
                          to={to}
                          className="flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all"
                          style={active ? {
                            background: "rgba(6,182,212,0.1)",
                            border: "1px solid rgba(6,182,212,0.18)",
                          } : {
                            border: "1px solid transparent",
                          }}
                          onMouseEnter={e => {
                            if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                          }}
                          onMouseLeave={e => {
                            if (!active) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {/* Icon box */}
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={active ? {
                              background: "rgba(6,182,212,0.15)",
                              border: "1px solid rgba(6,182,212,0.25)",
                            } : {
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            <Icon size={15}
                              strokeWidth={active ? 2.5 : 1.8}
                              style={{ color: active ? "#06b6d4" : "#475569" }} />
                          </div>

                          {/* Label */}
                          <span
                            className="flex-1 text-sm font-semibold"
                            style={{ color: active ? "#e2e8f0" : "#64748b" }}
                          >
                            {label}
                          </span>

                          {/* Active indicator */}
                          {active && (
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: "#06b6d4", boxShadow: "0 0 6px rgba(6,182,212,0.8)" }}
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Drawer footer */}
              <div
                className="flex-shrink-0 px-4 py-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                {isAuthenticated ? (
                  <button
                    onClick={() => { logout(); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.15)",
                      color: "#f87171",
                    }}
                  >
                    <LogOut size={15} />
                    <span className="text-sm font-semibold">Sign Out</span>
                  </button>
                ) : (
                  <Link
                    to="/Login"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
                    style={{
                      background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
                      boxShadow: "0 0 16px rgba(6,182,212,0.25)",
                    }}
                  >
                    Sign In
                  </Link>
                )}

                <p className="text-center text-[10px] mt-3" style={{ color: "#1e293b" }}>
                  Panic Ring v1.0 · Stay Protected
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
