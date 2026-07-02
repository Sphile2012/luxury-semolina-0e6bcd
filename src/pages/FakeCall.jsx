import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Volume2, VolumeX, Clock, User, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

// Preset caller profiles — REQ 15
const PRESETS = [
  { name: "Mom", number: "+27 82 000 0001", avatar: "👩", color: "from-pink-900/80 to-pink-600/40" },
  { name: "Boss",   number: "+27 82 000 0002", avatar: "👔", color: "from-blue-900/80 to-blue-600/40" },
  { name: "Doctor", number: "+27 82 000 0003", avatar: "👨‍⚕️", color: "from-teal-900/80 to-teal-600/40" },
  { name: "Partner",number: "+27 82 000 0004", avatar: "💑", color: "from-purple-900/80 to-purple-600/40" },
];

const DELAYS = [
  { label: "Now",    value: 0 },
  { label: "1 min",  value: 60 },
  { label: "5 min",  value: 300 },
  { label: "10 min", value: 600 },
];

export default function FakeCall() {
  const [screen, setScreen] = useState("setup"); // setup | ringing | answered
  const [selected, setSelected] = useState(0);
  const [customName, setCustomName] = useState("");
  const [delay, setDelay] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const ringRef = useRef(null);
  const timerRef = useRef(null);

  const caller = customName.trim()
    ? { name: customName.trim(), number: "Unknown", avatar: "📱", color: "from-gray-900/80 to-gray-600/40" }
    : PRESETS[selected];

  const startCall = () => {
    if (delay === 0) {
      triggerRinging();
    } else {
      setCountdown(delay);
      setScreen("countdown");
    }
  };

  const triggerRinging = () => {
    setScreen("ringing");
    // Play ring tone via Web Audio
    playRingTone();
  };

  const playRingTone = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playChime = (time) => {
        [523, 659, 784].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.3, time + i * 0.1);
          gain.gain.linearRampToValueAtTime(0, time + i * 0.1 + 0.15);
          osc.start(time + i * 0.1);
          osc.stop(time + i * 0.1 + 0.2);
        });
      };
      playChime(ctx.currentTime);
      const id = setInterval(() => playChime(ctx.currentTime), 2000);
      ringRef.current = { stop: () => { clearInterval(id); ctx.close(); } };
    } catch {}
  };

  const answerCall = () => {
    ringRef.current?.stop();
    setScreen("answered");
  };

  const endCall = () => {
    ringRef.current?.stop();
    clearInterval(timerRef.current);
    setScreen("setup");
    setCallDuration(0);
  };

  // Countdown before ringing
  useEffect(() => {
    if (screen !== "countdown") return;
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(id);
          triggerRinging();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [screen]);

  // Call duration timer
  useEffect(() => {
    if (screen !== "answered") return;
    timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [screen]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── SETUP SCREEN ─────────────────────────────────────────────────────────────
  if (screen === "setup") {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white">
        <div className="max-w-md mx-auto px-4 pt-6 pb-24">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link to="/" className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Fake Call</h1>
              <p className="text-[#555] text-xs">Trigger a convincing incoming call</p>
            </div>
          </div>

          {/* Caller presets */}
          <div className="mb-6">
            <h2 className="text-[#666] text-xs uppercase tracking-widest mb-3">Choose Caller</h2>
            <div className="grid grid-cols-2 gap-3">
              {PRESETS.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => { setSelected(i); setCustomName(""); }}
                  className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                    selected === i && !customName
                      ? "bg-red-500/15 border-red-500/40"
                      : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="text-2xl">{p.avatar}</span>
                  <div className="text-left">
                    <p className="text-white font-semibold text-sm">{p.name}</p>
                    <p className="text-[#555] text-[10px] font-mono">{p.number}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom name */}
          <div className="mb-6">
            <h2 className="text-[#666] text-xs uppercase tracking-widest mb-3">Custom Caller Name</h2>
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 focus-within:border-red-500/40 transition-colors">
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full bg-transparent text-white placeholder-[#333] focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Delay */}
          <div className="mb-8">
            <h2 className="text-[#666] text-xs uppercase tracking-widest mb-3">Schedule Delay</h2>
            <div className="grid grid-cols-4 gap-2">
              {DELAYS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDelay(d.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    delay === d.value ? "bg-red-600 text-white" : "bg-white/5 text-[#666] hover:text-white"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={startCall}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 text-base transition-colors shadow-lg shadow-green-600/30"
          >
            <Phone size={20} />
            {delay > 0 ? `Schedule Call in ${fmt(delay)}` : "Trigger Fake Call Now"}
          </button>
        </div>
      </div>
    );
  }

  // ── COUNTDOWN SCREEN ─────────────────────────────────────────────────────────
  if (screen === "countdown") {
    return (
      <div className="fixed inset-0 bg-[#0A0A0F] flex flex-col items-center justify-center z-50">
        <p className="text-[#555] text-sm mb-4">Fake call incoming in…</p>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-32 h-32 rounded-full bg-green-500/10 border-4 border-green-500/30 flex items-center justify-center mb-6"
        >
          <span className="text-white text-6xl font-black">{countdown}</span>
        </motion.div>
        <p className="text-[#666] text-sm mb-8">Stay natural. Phone will ring shortly.</p>
        <button onClick={endCall} className="text-[#555] text-sm underline">Cancel</button>
      </div>
    );
  }

  // ── RINGING SCREEN (matches image) ───────────────────────────────────────────
  if (screen === "ringing") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-between py-16 px-6"
        style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #0a0a14 100%)" }}
      >
        {/* Caller info */}
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${caller.color} border-4 border-white/20 flex items-center justify-center text-5xl shadow-2xl`}>
              {caller.avatar}
            </div>
          </motion.div>
          <div className="text-center">
            <h1 className="text-white font-black text-3xl">{caller.name}</h1>
            <p className="text-white/60 text-sm mt-1">{caller.number}</p>
            <motion.p
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-white/40 text-sm mt-1"
            >
              Incoming call…
            </motion.p>
          </div>
        </div>

        {/* Ripple rings */}
        <div className="relative flex items-center justify-center" style={{ height: 120 }}>
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
              className="absolute w-16 h-16 rounded-full border-2 border-green-400/40"
            />
          ))}
        </div>

        {/* Answer / Decline */}
        <div className="flex items-center justify-between w-full max-w-xs">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={endCall}
              className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <PhoneOff size={26} />
            </button>
            <span className="text-white/50 text-xs">Decline</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <motion.button
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              onClick={answerCall}
              className="w-16 h-16 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-600/40 transition-colors"
            >
              <Phone size={26} />
            </motion.button>
            <span className="text-white/50 text-xs">Answer</span>
          </div>
        </div>
      </div>
    );
  }

  // ── ANSWERED SCREEN ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between py-16 px-6"
      style={{ background: "linear-gradient(180deg, #0f1a0f 0%, #0a0a14 100%)" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${caller.color} border-4 border-green-400/30 flex items-center justify-center text-4xl`}>
          {caller.avatar}
        </div>
        <h1 className="text-white font-black text-2xl">{caller.name}</h1>
        <p className="text-green-400 font-mono text-xl">{fmt(callDuration)}</p>
      </div>

      {/* In-call controls */}
      <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => setMuted(m => !m)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${muted ? "bg-white/30" : "bg-white/10"}`}>
            {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </button>
          <span className="text-white/40 text-xs">{muted ? "Unmute" : "Mute"}</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => setSpeaker(s => !s)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${speaker ? "bg-white/30" : "bg-white/10"}`}>
            <Volume2 size={22} />
          </button>
          <span className="text-white/40 text-xs">Speaker</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
            <User size={22} />
          </button>
          <span className="text-white/40 text-xs">Contacts</span>
        </div>
      </div>

      {/* End call */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={endCall}
          className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow-lg transition-colors"
        >
          <PhoneOff size={26} />
        </button>
        <span className="text-white/40 text-xs">End Call</span>
      </div>
    </div>
  );
}
