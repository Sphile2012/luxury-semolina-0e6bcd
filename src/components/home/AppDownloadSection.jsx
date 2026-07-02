import { Smartphone, Download, Check } from "lucide-react";
import { Shield } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const mobileFeatures = [
  "Ring setup and pairing",
  "Emergency contacts management",
  "Live tracking dashboard",
  "Alert history and reports",
];

const quickLinks = [
  { label: "Home", page: "Home" },
  { label: "Dashboard", page: "Home" },
  { label: "Ring Control", page: "Settings" },
  { label: "Emergency Contacts", page: "Contacts" },
  { label: "Guide", page: "History" },
];

const supportLinks = [
  { label: "FAQ", href: "#" },
  { label: "Complaints & Suggestions", href: "#" },
  { label: "WhatsApp Support", href: "https://wa.me/27000000000" },
  { label: "Email Support", href: "mailto:support@panicring.app" },
];

export default function AppDownloadSection() {
  return (
    <>
      {/* App Download */}
      <section className="py-16 px-6 bg-[#0a0a0f] border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <p className="text-teal-400 text-center text-sm mb-10">
            Download our mobile app to set up your ring, manage contacts, and monitor your safety status
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mobile App Card */}
            <div className="bg-[#141820] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                  <Smartphone size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Mobile App</h3>
                  <p className="text-[#8a9ab0] text-xs">Complete control at your fingertips</p>
                </div>
              </div>
              <ul className="space-y-2">
                {mobileFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                    <Check size={13} className="text-green-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Android APK Card */}
            <div className="bg-[#141820] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                    <Download size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Android APK</h3>
                    <p className="text-[#8a9ab0] text-xs">Direct download</p>
                  </div>
                </div>
                <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">Latest</span>
              </div>

              <a
                href="https://panic-ring-app.com/downloads/PanicRing-v2.1.0.apk"
                download
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors mb-4"
              >
                <Download size={16} />
                <div className="text-left">
                  <div className="text-sm leading-tight">Download APK</div>
                  <div className="text-[10px] font-normal opacity-80">Version 2.1.0 • 25MB</div>
                </div>
              </a>

              <p className="text-[#8a9ab0] text-xs text-center mb-3">Coming soon to app stores</p>
              <div className="flex justify-center gap-3">
                <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 text-xs">▶</div>
                <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 text-xs"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0f] border-t border-white/[0.06] px-6 py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#1a1a2e] border border-white/10 rounded-lg flex items-center justify-center">
                <Shield size={15} className="text-teal-400" />
              </div>
              <span className="text-white font-bold">PanicRing</span>
            </div>
            <p className="text-[#8a9ab0] text-xs leading-relaxed mb-5">
              Your personal safety companion. Advanced emergency response technology designed to keep you protected and give your family peace of mind.
            </p>
            <div className="flex gap-3">
              {["f", "𝕏", "in", "in"].map((s, i) => (
                <a key={i} href="#" className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/50 text-xs hover:bg-white/10 transition-colors">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map(({ label, page }) => (
                <li key={label}>
                  <Link to={createPageUrl(page)} className="text-[#8a9ab0] text-sm hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-2.5">
              {supportLinks.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-[#8a9ab0] text-sm hover:text-white transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-[#8a9ab0]">
              <li className="flex items-center gap-2">
                <span className="text-red-400">✉</span>
                <a href="mailto:poomeigh503@gmail.com" className="hover:text-white transition-colors">poomeigh503@gmail.com</a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">💬</span>
                <a href="https://wa.me/27000000000" className="hover:text-white transition-colors">24/7 WhatsApp Support</a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-teal-400">📍</span>
                <span>South Africa</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-10 pt-6 border-t border-white/[0.06] text-center text-[#555] text-xs">
          © 2026 PanicRing. All rights reserved.
        </div>
      </footer>
    </>
  );
}