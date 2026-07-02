/**
 * REQ 1 — Enhanced GPS Accuracy with Fallback
 * Tries GPS → network → cached location (max 30min old)
 */
import { useState, useEffect, useCallback } from "react";

const CACHE_KEY = "pr_last_location";
const MAX_CACHE_AGE_MS = 30 * 60 * 1000; // 30 minutes
const ACCURACY_THRESHOLD = 150; // metres

function getCachedLocation() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const loc = JSON.parse(raw);
    if (!loc || !loc.ts) return null;
    if (Date.now() - loc.ts > MAX_CACHE_AGE_MS) return null;
    return loc;
  } catch {
    return null;
  }
}

function saveToCache(coords, source, accuracy) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy,
      source,
      ts: Date.now(),
    }));
  } catch {}
}

export default function useSmartLocation({ enabled = true } = {}) {
  const [state, setState] = useState({
    coords: null,
    source: null, // 'gps' | 'network' | 'cached'
    accuracy: null,
    unavailable: false,
    loading: true,
  });

  const acquire = useCallback(async () => {
    if (!navigator.geolocation) {
      const cached = getCachedLocation();
      if (cached) {
        setState({ coords: { latitude: cached.latitude, longitude: cached.longitude }, source: "cached", accuracy: cached.accuracy, unavailable: false, loading: false });
      } else {
        setState(s => ({ ...s, unavailable: true, loading: false }));
      }
      return;
    }

    // 1. Try GPS (high accuracy)
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      );
      const acc = pos.coords.accuracy;
      if (acc <= ACCURACY_THRESHOLD) {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        saveToCache(coords, "gps", acc);
        setState({ coords, source: "gps", accuracy: acc, unavailable: false, loading: false });
        return;
      }
      // GPS succeeded but accuracy is poor — try network next, keep GPS result as fallback
      const gpsFallback = { coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, accuracy: acc };

      // 2. Try network positioning
      try {
        const netPos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 30000,
          })
        );
        const netAcc = netPos.coords.accuracy;
        const netCoords = { latitude: netPos.coords.latitude, longitude: netPos.coords.longitude };
        const useNetwork = netAcc <= gpsFallback.accuracy;
        const coords = useNetwork ? netCoords : gpsFallback.coords;
        const acc = useNetwork ? netAcc : gpsFallback.accuracy;
        const source = useNetwork ? "network" : "gps";
        saveToCache(coords, source, acc);
        setState({ coords, source, accuracy: acc, unavailable: false, loading: false });
      } catch {
        // Network failed — use the poor GPS result
        saveToCache(gpsFallback.coords, "gps", gpsFallback.accuracy);
        setState({ coords: gpsFallback.coords, source: "gps", accuracy: gpsFallback.accuracy, unavailable: false, loading: false });
      }
    } catch {
      // GPS failed entirely — try network
      try {
        const netPos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 60000,
          })
        );
        const netAcc = netPos.coords.accuracy;
        const coords = { latitude: netPos.coords.latitude, longitude: netPos.coords.longitude };
        saveToCache(coords, "network", netAcc);
        setState({ coords, source: "network", accuracy: netAcc, unavailable: false, loading: false });
      } catch {
        // Both failed — try cache
        const cached = getCachedLocation();
        if (cached) {
          setState({
            coords: { latitude: cached.latitude, longitude: cached.longitude },
            source: "cached",
            accuracy: cached.accuracy,
            unavailable: false,
            loading: false,
          });
        } else {
          setState(s => ({ ...s, unavailable: true, loading: false }));
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    acquire();
  }, [enabled, acquire]);

  return { ...state, refresh: acquire };
}
