/**
 * REQ 7 — Siren + Flashing Screen
 * Web Audio API sawtooth alarm, CSS flash at 2Hz, Wake Lock
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2 } from "lucide-react";

function createSirenAudio() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = "sawtooth";
    gainNode.gain.setValueAtTime(1.0, ctx.currentTime);

    // Repeating frequency sweep
    const schedule = () => {
      const now = ctx.currentTime;
      for (let i = 0; i < 100; i++) {
        oscillator.frequency.setValueAtTime(880, now + i * 0.5);
        oscillator.frequency.setValueAtTime(440, now + i * 0.5 + 0.25);
      }
    };
    schedule();
    oscillator.start();
    return { ctx, oscillator, gainNode };
  } catch {
    return null;
  }
}

export default function Siren({ onClose }) {
  const [active, setActive] = useState(false);
  const [flash, setFlash] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showContinue, setShowContinue] = useState(false);
  const audioRef = useRef(null);
  const flashIntervalRef = useRef(null);
  const elapsedIntervalRef = useRef(null);
  const wakeLockRef = useRef(null);

  const startSiren = useCallback(async () => {
    setActive(true);
    setElapsed(0);
    setShowContinue(false);

    // Audio
    audioRef.current = createSirenAudio();

    // Flash at 2Hz (250ms on, 250ms off)
    flashIntervalRef.current = setInterval(() => {
      setFlash(f => !f);
    }, 250);

    // Elapsed timer
    elapsedIntervalRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= 60) {
          setShowContinue(true);
        }
        return e + 1;
      });
    }, 1000);

    // Wake Lock
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {}
  }, []);

  const stopSiren = useCallback(() => {
    setActive(false);
    setFlash(false);
    setShowContinue(false);

    // Stop audio
    try {
      audioRef.current?.oscillator?.stop();
      audioRef.current?.ctx?.close();
    } catch {}
    audioRef.current = null;

    clearInterval(flashIntervalRef.current);
    clearInterval(elapsedIntervalRef.current);

    // Release wake lock
    try { wakeLockRef.current?.release(); } catch {}
    wakeLockRef.current = null;

    onClose?.();
  }, [onClose]);

  const continueSiren = useCallback(() => {
    setShowContinue(false);
    setElapsed(0);
  }, []);

  useEffect(() => {
    startSiren();
    return () => {
      try { audioRef.current?.oscillator?.stop(); audioRef.current?.ctx?.close(); } catch {}
      clearInterval(flashIntervalRef.current);
      clearInterval(elapsedIntervalRef.current);
      try { wakeLockRef.current?.release(); } catch {}
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-colors duration-100"
      style={{ backgroundColor: flash ? "#ffffff" : "#0A0A0F" }}
    >
      {/* Fallback text if audio unavailable */}
      <div className="text-center px-8">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="mb-6"
        >
          <Volume2
            size={80}
            className={flash ? "text-red-600" : "text-white"}
          />
        </motion.div>

        <h1
          className={`text-5xl font-black tracking-widest mb-4 ${flash ? "text-red-600" : "text-white"}`}
        >
          🚨 ALARM 🚨
        </h1>

        <p className={`text-xl font-bold mb-2 ${flash ? "text-gray-800" : "text-red-400"}`}>
          EMERGENCY SIREN ACTIVE
        </p>

        <p className={`text-sm mb-8 ${flash ? "text-gray-600" : "text-[#888]"}`}>
          {elapsed}s elapsed
        </p>

        {/* Continue prompt after 60s */}
        <AnimatePresence>
          {showContinue && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 bg-black/80 rounded-2xl p-4 border border-white/20"
            >
              <p className="text-white font-semibold mb-3">Continue siren?</p>
              <div className="flex gap-3">
                <button
                  onClick={continueSiren}
                  className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold text-sm"
                >
                  Continue
                </button>
                <button
                  onClick={stopSiren}
                  className="flex-1 py-2 rounded-xl bg-white/10 text-white font-bold text-sm"
                >
                  Stop
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STOP button */}
        <button
          onClick={stopSiren}
          className="w-32 h-32 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 flex flex-col items-center justify-center gap-1 transition-all shadow-2xl border-4 border-red-400"
        >
          <X size={40} className="text-white" />
          <span className="text-white font-black text-lg">STOP</span>
        </button>
      </div>
    </div>
  );
}
