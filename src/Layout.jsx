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
      { label: "Home",          icon: Home,        to: "/",             page: "Home" },
      { label: "Live Map",      icon: Map,          to: "/Map",          page: "Map" },
      { label: "Contacts",      icon: Users,        to: "/Contacts",     page: "Contacts" },
    ],
  },
  {
    label: "Safety",
    items: [
      { label: "Alert History", icon: History,      to: "/AlertHistory", page: "AlertHistory" },
      { label: "Journey",       icon: Navigation,   to: "/Journey",      page: "Journey" },
      { label: "Find My Phone", icon: Smartphone,   to: "/FindMyPhone",  page: "FindMyPhone" },
      { label: "Fake Call",     icon: Phone,        to: "/FakeCall",     page: "FakeCall" },
      { label: "Smartwatch",    icon: Watch,        to: "/Watch",        page: "Watch" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Settings",      icon: Settings,     to: "/Settings",     page: "Settings" },
      { label: "Subscriptions", icon: Bell,         to: "/Subscriptions",page: "Subscriptions" },
      { label: "User Guide",    icon: BookOpen,     to: "/Guide",        page: "Guide" },
      { label: "FAQ",           icon: HelpCircle,   to: "/faq",          page: "faq" },
      { label: "Feedback",      icon: MessageSquare,to: "/complaints",   page: "complaints" },
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

  // Detect home page to use matching teal theme
  const isHome = location.pathname === "/";

  return (
    <div style={{ minHeight: "100dvh", background: isHome
      ? "linear-gradient(180deg,#C2D8DA 0%,#D2E8EA 32%,#B4DAE0 100%)"
      : "var(--sos-bg)" }}>

      {/* ── TOP HEADER ───────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{
          height: 56,
          background: isHome ? "rgba(194,216,218,0.92)" : "rgba(255,255,255,0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: isHome
            ? "1px solid rgba(255,255,255,0.55)"
            : "1px solid var(--sos-border)",
          boxShadow: "0 1px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "#C01818", boxShadow: "0 2px 8px rgba(192,24,24,0.4)" }}>
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-black text-base tracking-tight"
            style={{ color: isHome ? "#1C3A3C" : "#1A1D23" }}>
            Panic Ring
          </span>
        </Link>

        {/* SOS pill + hamburger */}
        <div className="flex items-center gap-2">
          <Link to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-white"
            style={{ background: "#C01818", boxShadow: "0 2px 8px rgba(192,24,24,0.4)" }}>
            <AlertTriangle size={11} />
            SOS
          </Link>

          {/* ☰ HAMBURGER BUTTON — prominent */}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center justify-center rounded-xl transition-all"
            style={{
              width: 42, height: 42,
              background: open
                ? "rgba(192,24,24,0.12)"
                : isHome ? "rgba(255,255,255,0.55)" : "#F1F3F7",
              border: `1.5px solid ${open ? "rgba(192,24,24,0.3)" : "rgba(0,0,0,0.1)"}`,
              gap: 5, padding: "10px 11px",
            }}
            aria-label="Open menu"
          >
            {/* 3 hamburger lines */}
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: "block", width: "100%", height: 2, borderRadius: 2,
                background: open ? "#C01818" : isHome ? "#2A4A4E" : "#3A3A3A",
                transition: "all 0.2s",
                transform: open && i === 0 ? "rotate(45deg) translate(4px, 4px)"
                  : open && i === 2 ? "rotate(-45deg) translate(4px, -4px)"
                  : open && i === 1 ? "scaleX(0)" : "none",
                opacity: open && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        </div>
      </header>

      {/* ── PAGE CONTENT ─────────────────────────────────── */}
      <div style={{ paddingTop: 56, paddingBottom: 64, position: "relative", zIndex: 1 }}>
        {children}
      </div>

      {/* ── BOTTOM TAB BAR ───────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom,0px), 6px)",
          paddingTop: 6, paddingLeft: 8, paddingRight: 8,
          background: isHome ? "rgba(194,216,218,0.95)" : "rgba(255,255,255,0.97)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderTop: isHome ? "1px solid rgba(255,255,255,0.6)" : "1px solid #E8EAED",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.07)",
        }}>
        <div className="max-w-md mx-auto flex items-center justify-around">
          {BOTTOM_QUICK.map(({ label, icon: Icon, to, page }) => {
            const active = isActive(page);
            return (
              <Link key={page} to={to}
                className="flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl relative"
                style={{ minWidth: 52 }}>
                {active && (
                  <span className="absolute rounded-full"
                    style={{ top: -1, left: "50%", transform: "translateX(-50%)",
                      width: 20, height: 2.5, background: "#C01818",
                      boxShadow: "0 0 5px rgba(192,24,24,0.6)" }} />
                )}
                <div className="w-9 h-9 flex items-center justify-center rounded-xl"
                  style={active ? {
                    background: "rgba(192,24,24,0.1)",
                    border: "1px solid rgba(192,24,24,0.2)",
                  } : { background: "transparent", border: "1px solid transparent" }}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8}
                    style={{ color: active ? "#C01818" : isHome ? "#3A5A5E" : "#8C8FA3" }} />
                </div>
                <span className="text-[10px] font-semibold"
                  style={{ color: active ? "#C01818" : isHome ? "#3A5A5E" : "#8C8FA3" }}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* ☰ MORE button in tab bar */}
          <button onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl"
            style={{ minWidth: 52 }}>
            <div className="w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ background: isHome ? "rgba(255,255,255,0.45)" : "#F1F3F7",
                border: "1px solid rgba(0,0,0,0.08)" }}>
              <Menu size={18} style={{ color: isHome ? "#2A4A4E" : "#8C8FA3" }} />
            </div>
            <span className="text-[10px] font-semibold"
              style={{ color: isHome ? "#3A5A5E" : "#8C8FA3" }}>More</span>
          </button>
        </div>
      </nav>

      {/* ── SLIDE-OUT DRAWER ─────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div key="bd"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} />

            {/* Drawer panel */}
            <motion.div key="dw"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 flex flex-col overflow-hidden"
              style={{ width: "82vw", maxWidth: 300, background: "#fff",
                borderLeft: "1px solid #E8EAED", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)" }}>

              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: "1px solid #E8EAED", background: "#FAFBFC" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "#C01818" }}>
                    <Shield size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-black text-sm" style={{ color: "#1A1D23" }}>Panic Ring</p>
                    {user && (
                      <p style={{ fontSize: 11, color: "#8C8FA3" }}>
                        {user.full_name || user.email}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "#F1F3F7", border: "1px solid #E8EAED" }}>
                  <X size={16} style={{ color: "#8C8FA3" }} />
                </button>
              </div>

              {/* Nav items */}
              <div className="flex-1 overflow-y-auto py-2">
                {NAV_SECTIONS.map((section) => (
                  <div key={section.label} className="mb-1">
                    <p className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "#C4C7D4" }}>{section.label}</p>
                    {section.items.map(({ label, icon: Icon, to, page }) => {
                      const active = isActive(page);
                      return (
                        <Link key={page} to={to}
                          className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl transition-all"
                          style={active ? {
                            background: "rgba(192,24,24,0.08)",
                            border: "1px solid rgba(192,24,24,0.15)",
                          } : { border: "1px solid transparent" }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#F8F9FB"; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={active ? { background: "#C01818" }
                              : { background: "#F1F3F7", border: "1px solid #E8EAED" }}>
                            <Icon size={15} strokeWidth={active ? 2.5 : 1.8}
                              style={{ color: active ? "#fff" : "#8C8FA3" }} />
                          </div>
                          <span className="flex-1 text-sm font-semibold"
                            style={{ color: active ? "#C01818" : "#1A1D23" }}>
                            {label}
                          </span>
                          {active && (
                            <div className="w-1.5 h-1.5 rounded-full"
                              style={{ background: "#C01818" }} />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Drawer footer */}
              <div className="flex-shrink-0 px-4 py-4"
                style={{ borderTop: "1px solid #E8EAED", background: "#FAFBFC" }}>
                {isAuthenticated ? (
                  <button onClick={() => { logout(); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{ background: "#FDE8E8", border: "1px solid #F9A8A7", color: "#C01818" }}>
                    <LogOut size={15} />
                    <span className="text-sm font-semibold">Sign Out</span>
                  </button>
                ) : (
                  <Link to="/Login"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
                    style={{ background: "#C01818", display: "flex" }}>
                    Sign In
                  </Link>
                )}
                <p className="text-center mt-3"
                  style={{ color: "#C4C7D4", fontSize: 10 }}>
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
