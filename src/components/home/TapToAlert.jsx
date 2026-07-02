import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";

/**
 * Hidden tap-target: tap 4 times quickly to trigger SOS — REQ 2 (hidden button)
 * Renders an invisible overlay + countdown indicator
 */
export default function TapToAlert({ onTriggered, corner = "bottom-right" }) {
  const [tapCount, setTapCount] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);
  const resetTimer = useRef(null);

  const REQUIRED_TAPS = 4;
  const WINDOW_MS = 2000;

  const handleTap = useCallback(() => {
    setTapCount(prev => {
      const next = prev + 1;
      setShowIndicator(true);

      // Clear existing reset timer
      clearTimeout(resetTimer.current);

      if (next >= REQUIRED_TAPS) {
        // Trigger!
        setTimeout(() => {
          setTapCount(0);
          setShowIndicator(false);
          onTriggered?.();
        }, 300);
        return REQUIRED_TAPS;
      }

      // Auto-reset if not completed within window
      resetTimer.current = setTimeout(() => {
        setTapCount(0);
        setShowIndicator(false);
      }, WINDOW_MS);

      return next;
    });
  }, [onTriggered]);

  const cornerClasses = {
    "bottom-right": "bottom-20 right-4",
    "bottom-left": "bottom-20 left-4",
    "top-right": "top-20 right-4",
    "top-left": "top-20 left-4",
  };

  return (
    <>
      {/* Invisible tap target */}
      <button
        onClick={handleTap}
        aria-label="Hidden SOS trigger"
        className={`fixed ${cornerClasses[corner]} z-40 w-14 h-14 opacity-0`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      />

      {/* Visual feedback indicator */}
      <AnimatePresence>
        {showIndicator && tapCount > 0 && tapCount < REQUIRED_TAPS && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`fixed ${cornerClasses[corner]} z-50 pointer-events-none`}
          >
            <div className="bg-black/80 border border-red-500/40 rounded-2xl px-3 py-2 flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: REQUIRED_TAPS }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${i < tapCount ? "bg-red-500" : "bg-white/20"}`}
                  />
                ))}
              </div>
              <span className="text-white text-xs font-medium">{REQUIRED_TAPS - tapCount} more</span>
            </div>
          </motion.div>
        )}

        {tapCount >= REQUIRED_TAPS && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed ${cornerClasses[corner]} z-50 pointer-events-none`}
          >
            <div className="bg-red-600 rounded-2xl px-3 py-2 flex items-center gap-2">
              <Shield size={12} className="text-white" />
              <span className="text-white text-xs font-bold">SOS!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
