import { Shield, MapPin, Video, Bell } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import PricingSection from "@/components/home/PricingSection";
import AppDownloadSection from "@/components/home/AppDownloadSection";

const features = [
  {
    icon: Bell,
    title: "Instant SOS",
    desc: "One tap emergency alert to all your contacts",
    color: "text-red-400",
    border: "border-red-500/20",
    bg: "bg-red-500/10",
  },
  {
    icon: MapPin,
    title: "Live GPS",
    desc: "Real-time location tracking every 3 seconds",
    color: "text-teal-400",
    border: "border-teal-500/20",
    bg: "bg-teal-500/10",
  },
  {
    icon: Video,
    title: "Auto Recording",
    desc: "Automatic video evidence during alerts",
    color: "text-green-400",
    border: "border-green-500/20",
    bg: "bg-green-500/10",
  },
];

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Dashboard", to: "/Home" },
  { label: "Ring Control", to: "/Settings" },
  { label: "Emergency Contacts", to: "/Contacts" },
  { label: "Guide", to: "/Guide" },
  { label: "FAQ", to: "/faq" },
];

export default function LandingHero({ onGetStarted }) {
  return (
    <div className="bg-gradient-to-br from-[#0d1117] via-[#0f1923] to-[#0a0a14] flex flex-col">
      {/* Top Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">Panic Ring</span>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className={`text-sm transition-colors ${
                (to === "/" || (label === "Home"))
                  ? "text-teal-400 font-medium"
                  : "text-[#aaa] hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGetStarted}
            className="bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            My Profile
          </button>
          <button className="hidden md:flex items-center gap-1.5 border border-white/20 text-white text-sm px-3 py-2 rounded-full hover:border-white/40 transition-colors">
            <span>↓</span> Get App
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8 tracking-widest uppercase">
          <Shield size={12} />
          Personal Safety Guardian
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-3">
          Your Personal
        </h1>
        <h1 className="text-5xl md:text-6xl font-black text-red-500 leading-tight mb-6">
          Safety Guardian
        </h1>

        <p className="text-[#8a9ab0] text-base md:text-lg max-w-xl leading-relaxed mb-10">
          Wearable panic ring with instant SOS alerts, live GPS tracking, and
          automatic emergency response. Stay protected 24/7 with just one tap.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <button
            onClick={onGetStarted}
            className="bg-red-500 hover:bg-red-600 text-white font-bold px-7 py-3 rounded-full text-sm transition-colors shadow-lg shadow-red-500/25"
          >
            Get Started Free
          </button>
          <button
            onClick={onGetStarted}
            className="border border-white/25 text-white font-medium px-6 py-3 rounded-full text-sm hover:border-white/50 transition-colors"
          >
            Sign In
          </button>
          <button className="border border-white/25 text-white font-medium px-6 py-3 rounded-full text-sm hover:border-white/50 transition-colors">
            Watch Demo
          </button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {features.map(({ icon: Icon, title, desc, color, border, bg }) => (
            <div
              key={title}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 flex flex-col items-center text-center"
            >
              <div className={`${color} mb-3`}>
                <Icon size={24} />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
              <p className="text-[#8a9ab0] text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <PricingSection onSelectPlan={onGetStarted} />
      <AppDownloadSection />
      {/* Footer - Privacy Policy required for Play Store */}
      <div className="text-center py-6 border-t border-white/[0.06] text-[#444] text-xs">
        <Link to="/privacy" className="hover:text-white transition-colors underline underline-offset-2">Privacy Policy</Link>
        <span className="mx-3">·</span>
        <span>© {new Date().getFullYear()} Panic Ring. All rights reserved.</span>
      </div>
    </div>
  );
}