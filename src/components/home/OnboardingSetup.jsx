import { useState, useEffect } from "react";
import { entities } from "@/api/client";
import { getDeviceInfo } from "@/hooks/useDeviceFingerprint";
import { Shield, Smartphone, MapPin, CheckCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OnboardingSetup({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  const requestLocation = async () => {
    try {
      await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      setLocationGranted(true);
    } catch {
      setLocationGranted(false);
    }
  };

  const finishSetup = async () => {
    setSaving(true);
    try {
      const info = deviceInfo || getDeviceInfo();

      await entities.SafetyProfile.create({
        owner_email: user.email,
        device_imei: info.deviceId,
        device_name: info.deviceName,
        device_model: info.deviceName,
        device_platform: info.platform,
        device_connected: false,
        location_sharing: locationGranted,
        subscription_plan: "basic",
        custom_alert_message: "I need help! Please contact me immediately.",
      });

      await entities.SharedDevice.create({
        owner_email: user.email,
        device_id: info.deviceId,
        device_name: info.deviceName,
        device_type: info.deviceType || 'phone',
        platform: info.platform,
        tracking_enabled: locationGranted,
      });

      setStep(3);
      setTimeout(() => onComplete(), 1800);
    } catch (err) {
      console.error("Setup error:", err);
      setSaving(false);
    }
  };

  const steps = [
    {
      key: "welcome",
      content: (
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500/20 border border-red-500/40 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Shield size={40} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Welcome to Panic Ring</h2>
          <p className="text-[#888] text-sm leading-relaxed mb-8">
            Let's set up your safety profile in 2 quick steps. This takes less than a minute.
          </p>
          <button onClick={() => setStep(1)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2">
            Let's Get Started <ChevronRight size={16} />
          </button>
        </div>
      ),
    },
    {
      key: "device",
      content: (
        <div>
          <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/40 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Smartphone size={30} className="text-blue-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2 text-center">Device Detected</h2>
          <p className="text-[#888] text-xs text-center mb-6">We've automatically detected your device info</p>

          {deviceInfo && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 mb-4 space-y-3">
              <Row label="Device" value={deviceInfo.deviceName} />
              <Row label="Platform" value={deviceInfo.platform.replace('_', ' ').toUpperCase()} />
              <Row label="Device ID" value={deviceInfo.deviceId} mono />
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
            <p className="text-amber-400 text-xs leading-relaxed">
              ⚠️ Your unique Device ID is automatically generated and stored securely on this device.
            </p>
          </div>

          <button onClick={() => setStep(2)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2">
            Looks Good <ChevronRight size={16} />
          </button>
        </div>
      ),
    },
    {
      key: "location",
      content: (
        <div>
          <div className="w-16 h-16 bg-teal-500/20 border border-teal-500/40 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <MapPin size={30} className="text-teal-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2 text-center">Enable Location</h2>
          <p className="text-[#888] text-xs text-center mb-6 leading-relaxed">
            Location access lets us send your exact coordinates to emergency contacts during an SOS alert.
          </p>

          {locationGranted ? (
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-6">
              <CheckCircle size={20} className="text-green-400 shrink-0" />
              <p className="text-green-400 text-sm font-medium">Location access granted!</p>
            </div>
          ) : (
            <button onClick={requestLocation} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 mb-4">
              <MapPin size={16} /> Grant Location Access
            </button>
          )}

          <button onClick={finishSetup} disabled={saving} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2">
            {saving ? "Setting up..." : locationGranted ? "Complete Setup" : "Skip & Complete Setup"}
            {!saving && <ChevronRight size={16} />}
          </button>
        </div>
      ),
    },
    {
      key: "done",
      content: (
        <div className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-black text-white mb-3">You're All Set!</h2>
          <p className="text-[#888] text-sm">Your safety profile is ready. Stay protected.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {step < 3 && (
          <div className="flex justify-center gap-2 mb-8">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? "w-8 bg-red-500" : "w-4 bg-white/10"}`} />
            ))}
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-7">
            {steps[step].content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#666] text-xs">{label}</span>
      <span className={`text-white text-xs font-medium ${mono ? "font-mono text-[10px] text-teal-400" : ""}`}>{value}</span>
    </div>
  );
}
