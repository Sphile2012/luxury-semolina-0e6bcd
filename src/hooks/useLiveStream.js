/**
 * REQ 4 — Live Location Streaming
 * Pushes GPS coords every 10 seconds to backend when streaming is true
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { tokenStore } from "@/api/client";

const STREAM_INTERVAL_MS = 10000;
const API_BASE = import.meta.env.VITE_API_URL || "";

export default function useLiveStream({ userId, enabled = false } = {}) {
  const [streaming, setStreaming] = useState(false);
  const [lastPush, setLastPush] = useState(null);
  const intervalRef = useRef(null);

  const pushLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const token = tokenStore.get();
          await fetch(`${API_BASE}/api/stream/location`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              ts: Date.now(),
            }),
          });
          setLastPush(Date.now());
        } catch {}
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
    );
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStreaming(false);
      clearInterval(intervalRef.current);
      return;
    }
    setStreaming(true);
    pushLocation();
    intervalRef.current = setInterval(pushLocation, STREAM_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [enabled, pushLocation]);

  return { streaming, lastPush };
}
