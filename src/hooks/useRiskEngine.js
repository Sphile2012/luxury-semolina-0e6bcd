/**
 * REQ 6 — AI Risk Detection (Movement Analysis)
 * Maintains rolling window of last 20 location samples
 * Analyzes every 60 seconds for anomalies
 */
import { useState, useEffect, useRef, useCallback } from "react";

const WINDOW_SIZE = 20;
const ANALYSIS_INTERVAL_MS = 60000;
const STATIONARY_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const SPEED_DROP_THRESHOLD_MS = 3 * 60 * 1000;  // 3 minutes
const MIN_SPEED_KMH = 5;
const STATIONARY_RADIUS_M = 30; // metres — considered "same spot"

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function speedKmh(sample1, sample2) {
  const dist = haversineMeters(sample1.lat, sample1.lng, sample2.lat, sample2.lng);
  const timeSec = (sample2.ts - sample1.ts) / 1000;
  if (timeSec <= 0) return 0;
  return (dist / timeSec) * 3.6;
}

export default function useRiskEngine({ enabled = false, contacts = [] } = {}) {
  const [warning, setWarning] = useState(null); // { type, message }
  const [showModal, setShowModal] = useState(false);
  const samplesRef = useRef([]);
  const intervalRef = useRef(null);
  const warningTimerRef = useRef(null);

  const addSample = useCallback((lat, lng) => {
    const sample = { lat, lng, ts: Date.now() };
    samplesRef.current = [...samplesRef.current.slice(-(WINDOW_SIZE - 1)), sample];
  }, []);

  const dismissWarning = useCallback(() => {
    setShowModal(false);
    setWarning(null);
    clearTimeout(warningTimerRef.current);
  }, []);

  const triggerWarning = useCallback((w) => {
    setWarning(w);
    setShowModal(true);

    // 60s countdown — if no response, open WhatsApp for contacts
    clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setShowModal(false);
      contacts.forEach((c, i) => {
        if (c.phone) {
          const msg = encodeURIComponent(
            `⚠️ *Risk Alert from Panic Ring*\n\n${w.message}\n\nPlease check on them immediately.\n\n_Sent via Panic Ring_`
          );
          setTimeout(() => window.open(`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank"), i * 800);
        }
      });
    }, 60000);
  }, [contacts]);

  const analyze = useCallback(() => {
    const samples = samplesRef.current;
    if (samples.length < 3) return;

    const now = Date.now();
    const recent = samples[samples.length - 1];

    // Check 1: Stationary > 10 min at unexpected location
    const oldestInWindow = samples[0];
    const windowDuration = now - oldestInWindow.ts;
    if (windowDuration >= STATIONARY_THRESHOLD_MS) {
      const maxDist = samples.reduce((max, s) =>
        Math.max(max, haversineMeters(recent.lat, recent.lng, s.lat, s.lng)), 0
      );
      if (maxDist < STATIONARY_RADIUS_M) {
        triggerWarning({
          type: "stationary",
          message: "You've been stationary for over 10 minutes. Are you safe?",
        });
        return;
      }
    }

    // Check 2: Speed drop from >5km/h to 0 for >3 min
    if (samples.length >= 4) {
      const prevSamples = samples.slice(-6, -1);
      const wasMoving = prevSamples.some((s, i) => {
        if (i === 0) return false;
        return speedKmh(prevSamples[i - 1], s) > MIN_SPEED_KMH;
      });

      if (wasMoving) {
        const stationaryStart = samples.findIndex((s, i) => {
          if (i === 0) return false;
          return speedKmh(samples[i - 1], s) < 0.5;
        });
        if (stationaryStart >= 0 && now - samples[stationaryStart].ts >= SPEED_DROP_THRESHOLD_MS) {
          triggerWarning({
            type: "speed_drop",
            message: "You've stopped moving suddenly. Are you safe?",
          });
        }
      }
    }
  }, [triggerWarning]);

  // Location tracking
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => addSample(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: false, maximumAge: 30000 }
    );

    intervalRef.current = setInterval(analyze, ANALYSIS_INTERVAL_MS);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalRef.current);
      clearTimeout(warningTimerRef.current);
    };
  }, [enabled, addSample, analyze]);

  return { warning, showModal, dismissWarning };
}
