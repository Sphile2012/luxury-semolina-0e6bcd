import { useState } from "react";
import { Bluetooth, BluetoothConnected, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function DevicePanel({ profile, onSave }) {
  const [connecting, setConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState(profile?.device_name || "");

  const simulateConnect = async () => {
    setConnecting(true);
    await new Promise(r => setTimeout(r, 2000));
    const name = "PanicRing Pro-" + Math.floor(Math.random() * 1000);
    setDeviceName(name);
    await onSave({ device_connected: true, device_name: name });
    setConnecting(false);
  };

  const disconnect = () => {
    onSave({ device_connected: false, device_name: "" });
    setDeviceName("");
  };

  return (
    <div className="mb-6">
      <h2 className="text-[#666] text-xs uppercase tracking-widest mb-4">Panic Ring Device</h2>
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
        {profile?.device_connected ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <BluetoothConnected size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{profile.device_name || "Ring Device"}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <motion.div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
                  <p className="text-emerald-400 text-xs">Connected via Bluetooth</p>
                </div>
              </div>
            </div>
            <button onClick={disconnect} className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl hover:bg-red-500/20 transition-colors">
              Disconnect
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <Bluetooth size={32} className="text-[#444] mx-auto mb-3" />
            <p className="text-white text-sm font-medium mb-1">No device connected</p>
            <p className="text-[#555] text-xs mb-4">Pair your panic ring for instant SOS activation</p>
            <button
              onClick={simulateConnect}
              disabled={connecting}
              className="flex items-center gap-2 mx-auto bg-blue-600/80 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              {connecting ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Bluetooth size={14} /></motion.div> Scanning...</>
              ) : (
                <><Bluetooth size={14} /> Connect Device</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}