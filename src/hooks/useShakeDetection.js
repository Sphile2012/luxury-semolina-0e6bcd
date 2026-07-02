/**
 * REQ 2 — Shake Detection
 * Detects 3+ threshold crossings (>25 m/s²) within 1.5 seconds
 * 15-second cooldown between triggers
 */
import { useState, useEffect, useRef, useCallback } from "react";

const THRESHOLD = 25; // m/s²
const WINDOW_MS = 1500;
const REQUIRED_CROSSINGS = 3;
const COOLDOWN_MS = 15000;

export default function useShakeDetection({ enabled = true } = {}) {
  const [shakeDetected, setShakeDetected] = useState(false);
  const crossingsRef = useRef([]);
  const lastTriggerRef = useRef(0);

  const resetShake = useCallback(() => {
    setShakeDetected(false);
    crossingsRef.current = [];
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (typeof DeviceMotionEvent === "undefined") return;

    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;

      const magnitude = Math.sqrt(
        (acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2
      );

      if (magnitude > THRESHOLD) {
        const now = Date.now();
        // Remove old crossings outside the window
        crossingsRef.current = crossingsRef.current.filter(t => now - t < WINDOW_MS);
        crossingsRef.current.push(now);

        if (crossingsRef.current.length >= REQUIRED_CROSSINGS) {
          if (now - lastTriggerRef.current >= COOLDOWN_MS) {
            lastTriggerRef.current = now;
            crossingsRef.current = [];
            setShakeDetected(true);
          }
        }
      }
    };

    // iOS 13+ requires permission
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission()
        .then(permission => {
          if (permission === "granted") {
            window.addEventListener("devicemotion", handleMotion);
          }
        })
        .catch(() => {});
    } else {
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [enabled]);

  return { shakeDetected, resetShake };
}
