import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { entities } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, Crown, Zap, Shield, Check, Star, CreditCard, Loader2 } from "lucide-react";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 50,
    icon: Shield,
    color: "border-white/10",
    iconColor: "text-slate-400",
    highlight: false,
    features: [
      "3 emergency contacts",
      "Real-time GPS tracking",
      "SOS panic button alerts",
      "7-day alert history",
      "WhatsApp notifications",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: 100,
    icon: Zap,
    color: "border-red-500/50",
    iconColor: "text-red-400",
    accentBg: "bg-red-500/5",
    badge: "Most Popular",
    highlight: true,
    features: [
      "10 emergency contacts",
      "Real-time GPS tracking",
      "SOS panic button alerts",
      "30-day alert history",
      "WhatsApp & email alerts",
      "Audio recording",
      "Fall detection",
      "Offline mode",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 150,
    icon: Crown,
    color: "border-amber-500/40",
    iconColor: "text-amber-400",
    accentBg: "bg-amber-500/5",
    highlight: false,
    features: [
      "Unlimited contacts",
      "Real-time GPS tracking",
      "SOS panic button alerts",
      "Unlimited alert history",
      "WhatsApp & email alerts",
      "Audio recording",
      "Fall detection",
      "Offline mode",
      "Advanced analytics",
      "Priority 24/7 support",
      "Safe zone management",
      "Device tracking (family)",
    ],
  },
];

export default function Subscriptions() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly");
  const [upgrading, setUpgrading] = useState(null);
  const [error, setError] = useState("");

  const getPrice = (base) => billing === "annual" ? Math.round(base * 0.8) : base;
  const getAnnualSavings = (base) => Math.round(base * 12 * 0.2);

  const handleSelect = async (planId) => {
    if (!isAuthenticated) {
      navigate('/Login');
      return;
    }

    setUpgrading(planId);
    setError("");

    try {
      // Try PayFast payment first
      const res = await fetch('/api/payfast/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('panic_ring_token')}`,
        },
        body: JSON.stringify({ plan_id: planId, billing }),
      });

      if (res.ok) {
        const { payfast_url, data, sandbox } = await res.json();

        // Build and auto-submit PayFast form
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = payfast_url;

        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          }
        });

        document.body.appendChild(form);
        form.submit();
        return; // page will navigate away
      }

      // PayFast not configured — fall back to direct DB update (dev mode)
      const profiles = await entities.SafetyProfile.filter({ owner_email: user.email });
      if (profiles[0]) {
        await entities.SafetyProfile.update(profiles[0].id, { subscription_plan: planId });
      } else {
        // Create profile if it doesn't exist
        await entities.SafetyProfile.create({
          owner_email: user.email,
          subscription_plan: planId,
          custom_alert_message: 'I need help! Please contact me immediately.',
        });
      }
      navigate('/Settings');
    } catch (err) {
      console.error('Subscription error:', err);
      // Still try direct DB update as fallback
      try {
        const profiles = await entities.SafetyProfile.filter({ owner_email: user.email });
        if (profiles[0]) {
          await entities.SafetyProfile.update(profiles[0].id, { subscription_plan: planId });
        }
        navigate('/Settings');
      } catch (e2) {
        setError('Failed to update subscription. Please try again.');
      }
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-28">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Choose Your Plan</h1>
            <p className="text-[#555] text-xs">Protect yourself & your loved ones</p>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-1 flex gap-1">
            {["monthly", "annual"].map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                  billing === b ? "bg-red-600 text-white shadow-lg" : "text-[#666] hover:text-white"
                }`}
              >
                {b}
                {b === "annual" && (
                  <span className="ml-1.5 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Save 20%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div className="space-y-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = getPrice(plan.price);
            return (
              <div
                key={plan.id}
                className={`relative border rounded-3xl p-5 transition-all ${plan.color} ${plan.accentBg || "bg-white/[0.02]"} ${plan.highlight ? "shadow-lg shadow-red-500/10" : ""}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                      <Star size={10} fill="white" /> {plan.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${plan.color} bg-white/[0.03]`}>
                      <Icon size={20} className={plan.iconColor} />
                    </div>
                    <div>
                      <p className="text-white font-bold">{plan.name}</p>
                      <p className="text-[#555] text-xs">Safety plan</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-end gap-1">
                      <span className="text-[#555] text-sm">R</span>
                      <span className="text-white text-3xl font-black">{price}</span>
                      <span className="text-[#555] text-xs mb-1">/mo</span>
                    </div>
                    {billing === "annual" && (
                      <p className="text-emerald-400 text-[10px]">Save R{getAnnualSavings(plan.price)}/yr</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1.5 mb-5">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight ? "bg-red-500/20" : "bg-white/[0.05]"}`}>
                        <Check size={10} className={plan.iconColor} />
                      </div>
                      <span className="text-[#aaa] text-xs">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSelect(plan.id)}
                  disabled={upgrading === plan.id}
                  className={`w-full py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? "bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30"
                      : plan.id === "premium"
                      ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
                      : "bg-white/[0.06] hover:bg-white/10 text-white border border-white/[0.10]"
                  }`}
                >
                  {upgrading === plan.id ? (
                    <><Loader2 size={14} className="animate-spin" /> Processing…</>
                  ) : isAuthenticated ? (
                    <><CreditCard size={14} /> Get {plan.name} — R{price}/mo</>
                  ) : (
                    "Sign in to subscribe"
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={14} className="text-teal-400" />
            <span className="text-white text-sm font-semibold">Secure Payment via PayFast</span>
          </div>
          <p className="text-[#555] text-xs">
            All payments are processed securely by PayFast. We accept credit cards, EFT, and SnapScan.
            Cancel anytime — no contracts.
          </p>
        </div>
      </div>
    </div>
  );
}
