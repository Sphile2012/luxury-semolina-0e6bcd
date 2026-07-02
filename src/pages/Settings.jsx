import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { Shield, Bell, MapPin, Phone, Crown, LogOut, CheckCircle } from "lucide-react";
import SubscriptionPanel from "@/components/settings/SubscriptionPanel";
import DevicePanel from "@/components/settings/DevicePanel";
import DeviceInfoPanel from "@/components/settings/DeviceInfoPanel";

export default function Settings() {
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['safetyProfile', user?.email],
    queryFn: () => entities.SafetyProfile.filter({ owner_email: user.email }),
    enabled: !!user?.email,
    staleTime: 30000,
  });

  const rawProfile = profileData?.[0];
  const profileId = rawProfile?.id;
  const defaultProfile = {
    custom_alert_message: 'I need help! Please contact me immediately.',
    auto_call_911: false, device_connected: false, device_name: '',
    subscription_plan: 'basic', location_sharing: true, safe_zones_alerts: true, crime_alerts: false,
  };
  const [localProfile, setLocalProfile] = useState(null);
  const setProfile = setLocalProfile;
  const profile = localProfile ?? rawProfile ?? defaultProfile;

  const [savedKey, setSavedKey] = useState(null);

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: async (updates) => {
      const merged = { ...profile, ...updates };
      setLocalProfile(merged);
      if (profileId) {
        await entities.SafetyProfile.update(profileId, updates);
      } else {
        await entities.SafetyProfile.create({ ...merged, owner_email: user.email });
      }
      return Object.keys(updates)[0];
    },
    onSuccess: (key) => {
      queryClient.invalidateQueries({ queryKey: ['safetyProfile', user?.email] });
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 1800);
    },
  });

  const toggle = (key) => save({ [key]: !profile[key] });


  if (isLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--nt-bg)" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#06b6d4", borderTopColor: "transparent" }} />
    </div>
  );

  const Toggle = ({ label, desc, field, icon: Icon, iconColor }) => (
    <div
      className="flex items-center justify-between py-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={16} className="opacity-80" />
        </div>
        <div>
          <p className="text-white text-sm font-medium">{label}</p>
          <p className="text-xs" style={{ color: "#475569" }}>{desc}</p>
        </div>
      </div>
      <button
        onClick={() => toggle(field)}
        className="relative w-11 h-6 rounded-full transition-all"
        style={profile[field]
          ? { background: "linear-gradient(135deg,#3b82f6,#06b6d4)", boxShadow: "0 0 12px rgba(6,182,212,0.4)" }
          : { background: "rgba(255,255,255,0.08)" }
        }
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${profile[field] ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );

  const ntCard = {
    background: "rgba(17,24,39,0.7)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
  };

  return (
    <div className="min-h-screen text-white page-enter" style={{ background: "var(--nt-bg)" }}>
      <div className="nt-blob-blue" style={{ width: 400, height: 400, top: -100, right: -100 }} />
      <div className="max-w-md mx-auto px-4 pt-6 pb-24 relative z-10">

        {/* User Profile Header */}
        <div className="flex items-center gap-4 mb-8 rounded-3xl p-5" style={ntCard}>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#7f1d1d,#dc2626)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div className="flex-1">
            <p className="text-white font-bold">{user?.full_name}</p>
            <p className="text-sm" style={{ color: "#475569" }}>{user?.email}</p>
            <div
              className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={profile.subscription_plan === 'premium'
                ? { background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#fcd34d" }
                : { background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#93c5fd" }
              }
            >
              <Crown size={10} />
              {profile.subscription_plan.charAt(0).toUpperCase() + profile.subscription_plan.slice(1)} Plan
            </div>
          </div>
        </div>

        <DevicePanel profile={profile} onSave={save} />
        <DeviceInfoPanel profile={profile} onSave={save} />

        {/* Safety Settings */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>Safety Settings</h2>
          <div className="rounded-2xl px-4" style={ntCard}>
            <Toggle label="Location Sharing" desc="Share GPS during emergencies" field="location_sharing" icon={MapPin} iconColor="bg-blue-500/15 text-blue-400" />
            <Toggle label="Auto-call Emergency" desc="Automatically call when SOS triggered" field="auto_call_911" icon={Phone} iconColor="bg-red-500/15 text-red-400" />
            <Toggle label="Safe Zone Alerts" desc="Notify when near safe zones" field="safe_zones_alerts" icon={Shield} iconColor="bg-emerald-500/15 text-emerald-400" />
            <Toggle label="Crime Alerts" desc="Area crime & safety notifications" field="crime_alerts" icon={Bell} iconColor="bg-amber-500/15 text-amber-400" />
          </div>
        </div>

        {/* Phone Number */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>Your Phone Number</h2>
          <div className="rounded-2xl p-4" style={ntCard}>
            <p className="text-xs mb-2" style={{ color: "#334155" }}>Used so others can find your device via "Find My Phone"</p>
            <input
              type="tel"
              value={profile.owner_phone || ""}
              onChange={e => setLocalProfile(p => ({ ...(p ?? rawProfile ?? defaultProfile), owner_phone: e.target.value }))}
              onBlur={() => save({ owner_phone: profile.owner_phone })}
              className="w-full bg-transparent text-sm focus:outline-none"
              style={{ color: "#f1f5f9" }}
              placeholder="e.g. 0821234567"
            />
          </div>
        </div>

        {/* Alert Message */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>Custom Alert Message</h2>
          <div className="rounded-2xl p-4" style={ntCard}>
            <textarea
              value={profile.custom_alert_message}
              onChange={e => setLocalProfile(p => ({ ...(p ?? rawProfile ?? defaultProfile), custom_alert_message: e.target.value }))}
              onBlur={() => save({ custom_alert_message: profile.custom_alert_message })}
              className="w-full bg-transparent text-sm resize-none focus:outline-none"
              style={{ color: "#f1f5f9" }}
              rows={3}
              placeholder="Your emergency message..."
            />
          </div>
        </div>

        <SubscriptionPanel plan={profile.subscription_plan} onUpgrade={(plan) => save({ subscription_plan: plan })} />

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#475569" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#f1f5f9"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}