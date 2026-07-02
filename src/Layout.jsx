import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Map, Settings, Smartphone, Watch, Users, History,
  Navigation, HelpCircle, MessageSquare, Bell, X, Menu,
  LogOut, Phone, BookOpen, Shield, AlertTriangle
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { label: "Home",          icon: Home,         to: "/",             page: "Home" },
      { label: "Live Map",      icon: Map,           to: "/Map",          page: "Map" },
      { label: "Contacts",      icon: Users,         to: "/Contacts",     page: "Contacts" },
    ],
  },
  {
    label: "Safety",
    items: [
      { label: "Alert History", icon: History,       to: "/AlertHistory", page: "AlertHistory" },
      { label: "Journey",       icon: Navigation,    to: "/Journey",      page: "Journey" },
      { label: "Find My Phone", icon: Smartphone,    to: "/FindMyPhone",  page: "FindMyPhone" },
      { label: "Fake Call",     icon: Phone,         to: "/FakeCall",     page: "FakeCall" },
      { label: "Smartwatch",    icon: Watch,         to: "/Watch",        page: "Watch" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Settings",      icon: Settings,      to: "/Settings",     page: "Settings" },
      { label: "Subscriptions", icon: Bell,          to: "/Subscriptions",page: "Subscriptions" },
      { label: "User Guide",    icon: BookOpen,      to: "/Guide",        page: "Guide" },
      { label: "FAQ",           icon: HelpCircle,    to: "/faq",          page: "faq" },
      { label: "Feedback",      icon: MessageSquare, to: "/complaints",   page: "complaints" },
    ],
  },
];

const BOTTOM_QUICK = [
  { label: "Home",     icon: Home,     to: "/",         page: "Home" },
  { label: "Map",      icon: Map,      to: "/Map",       page: "Map" },
  { label: "Contacts", icon: Users,    to: "/Contacts",  page: "Contacts" },
  { label: "Settings", icon: Settings, to: "/Settings",  page: "Settings" },
];

export default function Layout({ children, currentPageName }) {
  const [open, setOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (page) =>
    page === "Home"
      ? location.pathname === "/"
      : location.pathname.toLowerCase().includes(page.toLowerCase());

  return (
    <div className="min-h-screen" style={{ background: "var(--sos-bg)" }}>

      {/* ── TOP HEADER ──────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{
          height: 56,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--sos-border)",
          boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--sos-coral)", boxShadow: "0 2px 8px rgba(240,113,112,0.4)" }}
          >
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-black text-base tracking-tight" style={{ color: "var(--sos-text)" }}>
            Panic Ring
          </span>
        </Link>

        {/* SOS pill + hamburger */}
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-white"
            style={{ background: "var(--sos-coral)", boxShadow: "0 2px 8px rgba(240,113,112,0.35)" }}
          >
            <AlertTriangle size={11} />
            SOS
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: open ? "var(--sos-coral-pale)" : "var(--sos-surface2)",
              border: `1px solid ${open ? "var(--sos-coral-light)" : "var(--sos-border)"}`,
            }}
            aria-label="Open menu"
          >
            <Menu size={18} style={{ color: open ? "var(--sos-coral)" : "var(--sos-muted)" }} />
          </button>
        </div>
      </header>

      {/* ── PAGE CONTENT ────────────────────────────────────── */}
      <div style={{ paddingTop: 56, paddingBottom: 64, position: "relative", zIndex: 1 }}>
        {children}
      </div>

      {/* ── BOTTOM BAR ──────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 6px)",
          paddingTop: 6,
          paddingLeft: 8,
          paddingRight: 8,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid var(--sos-border)",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
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
                    style={{ width: 24, height: 2, background: "var(--sos-coral)", boxShadow: "0 0 6px rgba(240,113,112,0.6)" }}
                  />
                )}
                <div
                  className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
                  style={active ? {
                    background: "var(--sos-coral-pale)",
                    border: "1px solid var(--sos-coral-light)",
                  } : {
                    background: "transparent",
                    border: "1px solid transparent",
                  }}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8}
                    style={{ color: active ? "var(--sos-coral)" : "var(--sos-dim)" }} />
                </div>
                <span className="text-[10px] font-semibold"
                  style={{ color: active ? "var(--sos-coral)" : "var(--sos-dim)" }}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* More / hamburger */}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl"
          >
            <div className="w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ background: "var(--sos-surface2)", border: "1px solid var(--sos-border)" }}>
              <Menu size={18} style={{ color: "var(--sos-muted)" }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: "var(--sos-dim)" }}>More</span>
          </button>
        </div>
      </nav>

      {/* ── SLIDE-OUT DRAWER ────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(3px)" }}
            />

            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[82vw] max-w-xs flex flex-col overflow-hidden"
              style={{
                background: "#fff",
                borderLeft: "1px solid var(--sos-border)",
                boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
              }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: "1px solid var(--sos-border)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--sos-coral)", boxShadow: "0 2px 8px rgba(240,113,112,0.35)" }}
                  >
                    <Shield size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-black text-sm" style={{ color: "var(--sos-text)" }}>Panic Ring</p>
                    {user && (
                      <p className="text-[11px]" style={{ color: "var(--sos-muted)" }}>
                        {user.full_name || user.email}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--sos-surface2)", border: "1px solid var(--sos-border)" }}
                >
                  <X size={16} style={{ color: "var(--sos-muted)" }} />
                </button>
              </div>

              {/* Nav items */}
              <div className="flex-1 overflow-y-auto py-3">
                {NAV_SECTIONS.map((section) => (
                  <div key={section.label} className="mb-2">
                    <p className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--sos-dim)" }}>
                      {section.label}
                    </p>
                    {section.items.map(({ label, icon: Icon, to, page }) => {
                      const active = isActive(page);
                      return (
                        <Link
                          key={page}
                          to={to}
                          className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl transition-all"
                          style={active ? {
                            background: "var(--sos-coral-pale)",
                            border: "1px solid var(--sos-coral-light)",
                          } : { border: "1px solid transparent" }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--sos-surface2)"; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                        >
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={active ? {
                              background: "var(--sos-coral)",
                              boxShadow: "0 2px 8px rgba(240,113,112,0.3)",
                            } : {
                              background: "var(--sos-surface2)",
                              border: "1px solid var(--sos-border)",
                            }}
                          >
                            <Icon size={15} strokeWidth={active ? 2.5 : 1.8}
                              style={{ color: active ? "#fff" : "var(--sos-muted)" }} />
                          </div>
                          <span className="flex-1 text-sm font-semibold"
                            style={{ color: active ? "var(--sos-coral-deep)" : "var(--sos-text)" }}>
                            {label}
                          </span>
                          {active && (
                            <div className="w-1.5 h-1.5 rounded-full"
                              style={{ background: "var(--sos-coral)" }} />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-4 py-4"
                style={{ borderTop: "1px solid var(--sos-border)" }}>
                {isAuthenticated ? (
                  <button
                    onClick={() => { logout(); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: "var(--sos-coral-pale)",
                      border: "1px solid var(--sos-coral-light)",
                      color: "var(--sos-coral-deep)",
                    }}
                  >
                    <LogOut size={15} />
                    <span className="text-sm font-semibold">Sign Out</span>
                  </button>
                ) : (
                  <Link to="/Login"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
                    style={{ background: "var(--sos-coral)", boxShadow: "0 4px 12px rgba(240,113,112,0.3)" }}
                  >
                    Sign In
                  </Link>
                )}
                <p className="text-center text-[10px] mt-3" style={{ color: "var(--sos-dim)" }}>
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
