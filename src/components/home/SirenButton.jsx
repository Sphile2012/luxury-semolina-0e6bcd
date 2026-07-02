import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, AlertTriangle } from "lucide-react";

/**
 * Loud alarm siren with flashing screen — REQ 7
 * Accessible from home screen quick actions
 */
export default function SirenButton() {
  const [active, setActive] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [secondsActive, setSecondsActive] = useState(0);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const audioCtxRef = useRef(null);
  const sirenNodesRef = useRef([]);
  const timerRef = useRef(null);
  const flashRef = useRef(null);
  const wakeLockRef = useRef(null);

  const startSiren = async () => {
    setActive(true);
    setSecondsActive(0);
    setShowContinuePrompt(false);

    // Request wake lock so screen stays on
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch {}

    // Web Audio API siren
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      const playBeep = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        gain.gain.setValueAtTime(0.9, ctx.currentTime);
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
        osc.frequency.linearRampToValueAtTime(1400, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.7);
        sirenNodesRef.current.push(osc);
      };

      // Play immediately and repeat
      playBeep();
      const id = setInterval(playBeep, 750);
      sirenNodesRef.current.push({ stop: () => clearInterval(id) });
    } catch {
      // AudioContext not available — handled below
    }
  };

  const stopSiren = () => {
    setActive(false);
    setFlashOn(false);
    setShowContinuePrompt(false);
    clearInterval(timerRef.current);
    clearInterval(flashRef.current);

    // Stop audio
    try {
      sirenNodesRef.current.forEach(n => { try { n.stop?.(); } catch {} });
      sirenNodesRef.current = [];
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    } catch {}

    // Release wake lock
    try { wakeLockRef.current?.release(); wakeLockRef.current = null; } catch {}
  };

  // Flash screen at 2fps while active
  useEffect(() => {
    if (!active) { setFlashOn(false); return; }
    flashRef.current = setInterval(() => setFlashOn(f => !f), 500);
    return () => clearInterval(flashRef.current);
  }, [active]);

  // Elapsed timer + 60-second prompt
  useEffect(() => {
    if (!active) return;
    timerRef.current = setInterval(() => {
      setSecondsActive(s => {
        const next = s + 1;
        if (next === 60) setShowContinuePrompt(true);
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [active]);

  // Cleanup on unmount
  useEffect(() => () => stopSiren(), []);

  if (active) {
    return (
      <>
        {/* Flashing overlay */}
        <AnimatePresence>
          {flashOn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-white pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Continue prompt after 60s */}
        {showContinuePrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center px-6"
          >
            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 w-full max-w-sm text-center">
              <AlertTriangle size={40} className="text-amber-400 mx-auto mb-3" />
              <h3 className="text-white font-black text-xl mb-2">Keep Siren Running?</h3>
              <p className="text-[#888] text-sm mb-6">The siren has been active for 60 seconds.</p>
              <div className="flex gap-3">
                <button onClick={stopSiren} className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-bold text-sm">
                  Stop
                </button>
                <button onClick={() => setShowContinuePrompt(false)} className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-colors">
                  Continue
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Active siren control */}
        <div className="fixed bottom-24 left-0 right-0 z-[9990] flex justify-center px-6 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            className="bg-red-600 rounded-3xl px-6 py-4 flex items-center gap-4 shadow-2xl shadow-red-600/50 pointer-events-auto"
          >
            <div className="flex items-center gap-2">
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-3 h-3 bg-white rounded-full" />
              <span className="text-white font-black text-sm">SIREN ACTIVE — {secondsActive}s</span>
            </div>
            <button
              onClick={stopSiren}
              className="bg-white text-red-600 font-black text-xs px-4 py-2 rounded-xl"
            >
              STOP
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <button
      onClick={startSiren}
      className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95 hover:bg-amber-500/20 w-full"
    >
      <Volume2 size={20} className="text-amber-400" />
      <span className="text-[#888] text-xs font-medium">Siren</span>
    </button>
  );
}
