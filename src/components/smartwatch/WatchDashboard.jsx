import { useState, useEffect } from "react";
import { functions } from "@/api/client";
import { Watch, Heart, Footprints, Battery, Activity, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import FallDetection from "./FallDetection";

function useSimulatedBiometrics(active) {
  const [bpm, setBpm] = useState(72);
  const [steps, setSteps] = useState(4821);
  const [battery] = useState(78);
  const [spO2, setSpO2] = useState(97);

  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => {
      setBpm(prev => Math.min(110, Math.max(58, prev + Math.round((Math.random() - 0.5) * 4))));
      setSteps(prev => prev + Math.floor(Math.random() * 3));
      setSpO2(prev => Math.min(100, Math.max(94, prev + Math.round((Math.random() - 0.5) * 1))));
    }, 3000);
    return () => clearInterval(iv);
  }, [active]);

  return { bpm, steps, battery, spO2 };
}

function HeartBeat({ bpm }) {
  return (
    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 60 / bpm, ease: "easeInOut" }}>
      <Heart size={20} className="text-red-400 fill-red-400" />
    </motion.div>
  );
}

function Stat({ icon, label, value, unit, color, sub }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-[#666] text-xs">{label}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-white text-2xl font-black tabular-nums">{value}</span>
        <span className="text-[#555] text-xs mb-0.5">{unit}</span>
      </div>
      {sub && <span className="text-[#555] text-[10px]">{sub}</span>}
    </div>
  );
}

export default function WatchDashboard({ user }) {
  const [connected, setConnected] = useState(false);
  const [watchType, setWatchType] = useState(null);
  const [pairing, setPairing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { bpm, steps, battery, spO2 } = useSimulatedBiometrics(connected);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("wearos")) { setWatchType("WearOS"); setConnected(true); }
    else if (ua.includes("watchos")) { setWatchType("Apple Watch"); setConnected(true); }
  }, []);

  const simulatePair = async () => {
    setPairing(true);
    await new Promise(r => setTimeout(r, 2000));
    setWatchType("WearOS (Simulated)");
    setConnected(true);
    setPairing(false);
  };

  const syncLocation = async () => {
    setSyncing(true);
    try { await functions.invoke("syncWatchLocation", { watchType }); } catch {}
    setSyncing(false);
  };

  if (!connected) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 text-center">
        <Watch size={36} className="mx-auto text-[#333] mb-3" />
        <p className="text-white font-semibold mb-1">No Smartwatch Detected</p>
        <p className="text-[#555] text-xs mb-4">Connect your WearOS or Apple Watch for live health monitoring & fall detection.</p>
        <button onClick={simulatePair} disabled={pairing}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
          {pairing ? "Pairing…" : "Pair Smartwatch"}
        </button>
      </div>
    );
  }

  const bpmStatus = bpm > 100 ? { label: "Elevated", color: "text-amber-400" } : bpm < 60 ? { label: "Low", color: "text-blue-400" } : { label: "Normal", color: "text-emerald-400" };

  return (
    <div className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Watch size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{watchType}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs">Connected</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[#666] text-xs">
              <Battery size={12} /><span>{battery}%</span>
            </div>
            <button onClick={syncLocation} disabled={syncing}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50">
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.04] border border-red-500/20 rounded-2xl p-4 col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <HeartBeat bpm={bpm} />
            <span className="text-[#666] text-xs">Heart Rate</span>
            <span className={`text-xs ml-auto font-medium ${bpmStatus.color}`}>{bpmStatus.label}</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-white text-4xl font-black tabular-nums">{bpm}</span>
            <span className="text-[#555] text-sm mb-1">BPM</span>
          </div>
          <div className="mt-2 flex items-center gap-0.5 h-6 overflow-hidden opacity-60">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div key={i} className="flex-1 bg-red-500 rounded-sm"
                animate={{ height: [2, i % 7 === 3 ? 22 : i % 7 === 4 ? 6 : 4, 2] }}
                transition={{ repeat: Infinity, duration: 60 / bpm, delay: i * 0.05, ease: "linear" }}
                style={{ minHeight: 2 }} />
            ))}
          </div>
        </div>

        <Stat icon={<Activity size={16} />} label="SpO₂" value={spO2} unit="%" color="#818cf8" sub="Blood oxygen" />
        <Stat icon={<Footprints size={16} />} label="Steps" value={steps.toLocaleString()} unit="steps" color="#34d399" sub="Today" />
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 col-span-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#666] text-xs">Battery</span>
            <span className="text-[#888] text-xs">{battery}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div className="h-2 rounded-full transition-all" style={{ width: `${battery}%`, background: battery > 30 ? "#10b981" : "#ef4444" }} />
          </div>
        </div>
      </div>

      <FallDetection user={user} />
    </div>
  );
}
