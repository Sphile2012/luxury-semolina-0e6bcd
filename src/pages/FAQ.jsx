import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const faqSections = [
  {
    title: "General Questions",
    items: [
      {
        question: "What is Panic Ring and how does it work?",
        answer: "Panic Ring is an advanced personal safety device that combines a wearable ring with a smartphone app. When you press the ring button or activate SOS in the app, it instantly sends emergency alerts to your designated contacts with your live GPS location updating every 3 seconds. The system includes fall detection, automatic police contact, and works even if your SIM card is removed through IMEI tracking.",
      },
      {
        question: "What devices are compatible with Panic Ring?",
        answer: "Panic Ring works with all modern Android (5.0+) and iOS (12+) smartphones. The ring connects via Bluetooth Low Energy. The web app works on any modern browser.",
      },
      {
        question: "How long does the battery last?",
        answer: "The Panic Ring wearable lasts up to 7 days on standby with normal use. The app runs continuously in the background with minimal battery drain thanks to optimized GPS polling.",
      },
    ],
  },
  {
    title: "Safety Features",
    items: [
      {
        question: "How does fall detection work?",
        answer: "The ring's built-in accelerometer detects sudden impacts and unusual motion patterns associated with falls. If a fall is detected and you don't respond within 30 seconds, an SOS is automatically triggered.",
      },
      {
        question: "What happens when I activate SOS?",
        answer: "When SOS is triggered, your emergency contacts receive an immediate WhatsApp message and email with your real-time location, a Google Maps link, and your custom emergency message. Your location updates every 3 seconds until the alert is resolved.",
      },
      {
        question: "Can I use the app without the ring?",
        answer: "Yes. The app works fully as a standalone safety app with the SOS button, GPS tracking, fake call, and audio recording features — even without the physical ring.",
      },
    ],
  },
  {
    title: "Subscription & Pricing",
    items: [
      {
        question: "What is included in the Basic plan?",
        answer: "The Basic plan (R50/mo) includes up to 3 emergency contacts, real-time GPS tracking, SOS alerts via WhatsApp & email, and 7-day alert history.",
      },
      {
        question: "Can I upgrade or downgrade my plan?",
        answer: "Yes, you can change your subscription plan at any time from Settings → Subscription. Changes take effect immediately.",
      },
      {
        question: "Is there a free trial?",
        answer: "Yes, all new users start with a 14-day free trial of the Standard plan. No credit card required.",
      },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      {
        question: "Is my location data secure?",
        answer: "Yes. All location data is encrypted in transit and at rest. Your location is only ever shared with your chosen emergency contacts and only during active SOS events.",
      },
      {
        question: "Who can see my emergency alerts?",
        answer: "Only the emergency contacts you explicitly add to your profile receive your alerts. Panic Ring staff do not have access to your personal alert data.",
      },
    ],
  },
];

export default function FAQ() {
  const [expanded, setExpanded] = useState({});
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const toggle = (sectionIdx, itemIdx) => {
    const key = `${sectionIdx}-${itemIdx}`;
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Minimal Nav */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/faq" className="text-sm text-teal-500 font-medium">FAQ</Link>
          <button
            onClick={() => navigate(isAuthenticated ? '/Settings' : '/Login')}
            className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            {isAuthenticated ? 'My Profile' : 'Sign In'}
          </button>
          <button className="flex items-center gap-1 border border-gray-300 text-gray-700 text-sm px-3 py-2 rounded-full hover:border-gray-400 transition-colors">
            ↓ Get App
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h1>
          <p className="text-teal-500 text-sm">Find answers to common questions about Panic Ring features, setup, and usage</p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {faqSections.map((section, sIdx) => (
            <div key={sIdx}>
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-teal-500 rounded-full inline-block" />
                {section.title}
              </h2>
              <div className="space-y-2">
                {section.items.map((item, iIdx) => {
                  const key = `${sIdx}-${iIdx}`;
                  const open = !!expanded[key];
                  return (
                    <div key={iIdx} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggle(sIdx, iIdx)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-800">{item.question}</span>
                        {open
                          ? <ChevronUp size={16} className="text-teal-500 flex-shrink-0" />
                          : <ChevronDown size={16} className="text-teal-500 flex-shrink-0" />}
                      </button>
                      {open && (
                        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                          <p className="pt-3">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}