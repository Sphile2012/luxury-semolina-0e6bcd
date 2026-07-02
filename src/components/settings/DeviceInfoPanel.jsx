import { useState, useEffect } from "react";
import { Smartphone, MapPin, Copy, Check } from "lucide-react";

export default function DeviceInfoPanel({ profile, onSave }) {
  const [deviceInfo, setDeviceInfo] = useState({ imei: null, model: null, platform: null });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const info = {
      model: navigator.userAgentData?.model || 'Unknown',
      platform: navigator.userAgentData?.platform || navigator.platform,
      imei: localStorage.getItem('device_imei') || generateDeviceId(),
    };
    if (!localStorage.getItem('device_imei')) {
      localStorage.setItem('device_imei', info.imei);
    }
    setDeviceInfo(info);
    if (profile?.id) {
      onSave({ device_imei: info.imei, device_model: info.model, device_platform: info.platform });
    }
  }, []);

  const generateDeviceId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `PR-${timestamp}-${random}`.toUpperCase();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const findMyPhone = async () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
      );
      const { latitude, longitude } = position.coords;
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
    } catch {
      alert('Failed to locate device. Please enable location services.');
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-[#666] text-xs uppercase tracking-widest mb-4">Device Information</h2>
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
            <Smartphone size={18} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">This Device</h3>
            <p className="text-[#666] text-xs">{deviceInfo.platform}</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-[#888] text-xs">Device ID</span>
            <div className="flex items-center gap-2">
              <span className="text-white text-xs font-mono">{deviceInfo.imei?.slice(0, 16)}…</span>
              <button onClick={() => copyToClipboard(deviceInfo.imei)}
                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-[#666]" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[#888] text-xs">Model</span>
            <span className="text-white text-xs">{deviceInfo.model}</span>
          </div>
        </div>

        <button onClick={findMyPhone}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors text-sm">
          <MapPin size={16} />
          Find My Phone
        </button>
        <p className="text-[#666] text-xs mt-3 text-center">Track your device location in real-time</p>
      </div>
    </div>
  );
}
