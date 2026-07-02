import { useState, useEffect, useCallback, useRef } from "react";
import { functions } from "@/api/client";

// ── LocalStorage helpers ──────────────────────────────────────────────────────
const LS_CONTACTS = 'pr_contacts';
const LS_LOCATION = 'pr_location';
const LS_QUEUE    = 'pr_queue';

function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Service Worker messaging ──────────────────────────────────────────────────
function swMessage(type, payload = {}) {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker?.controller) return resolve(null);
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(null), 3000);
    channel.port1.onmessage = (e) => { clearTimeout(timer); resolve(e.data); };
    navigator.serviceWorker.controller.postMessage({ type, payload }, [channel.port2]);
  });
}

export default function useOfflineMode(contacts, user) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swReady, setSwReady]   = useState(false);
  const [queuedAlerts, setQueuedAlerts] = useState(lsGet(LS_QUEUE) || []);
  const lastLocation = useRef(lsGet(LS_LOCATION));
  const flushing = useRef(false);

  // Register service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').then(() => setSwReady(true)).catch(() => {});
    const handler = (e) => { if (e.data?.type === 'FLUSH_QUEUE') flushQueue(); };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  // Online/offline tracking
  useEffect(() => {
    const goOnline  = () => { setIsOnline(true); flushQueue(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  // Cache contacts
  useEffect(() => {
    if (!contacts?.length) return;
    lsSet(LS_CONTACTS, contacts);
    if (swReady) swMessage('CACHE_CONTACTS', contacts);
  }, [contacts, swReady]);

  // Cache location every 30s
  useEffect(() => {
    if (!navigator.geolocation) return;
    const trackLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            latitude:  pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy:  pos.coords.accuracy,
            ts: Date.now(),
          };
          lastLocation.current = loc;
          lsSet(LS_LOCATION, loc);
          if (swReady) swMessage('CACHE_LOCATION', loc);
        },
        () => {}
      );
    };
    trackLocation();
    const iv = setInterval(trackLocation, 30000);
    return () => clearInterval(iv);
  }, [swReady]);

  const queueAlert = useCallback(async (alertData) => {
    const item = { ...alertData, queued_at: Date.now(), id: crypto.randomUUID() };
    const queue = lsGet(LS_QUEUE) || [];
    queue.push(item);
    lsSet(LS_QUEUE, queue);
    setQueuedAlerts([...queue]);
    await swMessage('QUEUE_ALERT', item);
    return item;
  }, []);

  const flushQueue = useCallback(async () => {
    if (flushing.current) return;
    const queue = lsGet(LS_QUEUE) || [];
    if (queue.length === 0) return;
    flushing.current = true;

    const remaining = [];
    for (const item of queue) {
      try {
        await functions.invoke('sendPanicAlert', {
          latitude:  item.latitude,
          longitude: item.longitude,
          address:   item.address,
          message:   item.message,
          audio_url: item.audio_url,
        });
        await swMessage('REMOVE_QUEUED_ALERT', { id: item.id });
      } catch {
        // Backend failed — WhatsApp fallback
        const msg = encodeURIComponent(
          `🚨 *EMERGENCY ALERT (queued offline)*\n\n${item.message || 'I need help!'}\n\n📍 Location: ${
            item.latitude
              ? `https://www.google.com/maps?q=${item.latitude},${item.longitude}`
              : 'Unavailable'
          }\n⏰ Alert time: ${new Date(item.queued_at).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}\n\n_Sent via Panic Ring_`
        );
        (item.contacts || []).forEach((c, i) => {
          if (c.phone) {
            setTimeout(() => window.open(`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank'), i * 800);
          }
        });
        remaining.push(item);
      }
    }

    lsSet(LS_QUEUE, remaining);
    setQueuedAlerts(remaining);
    if (remaining.length === 0) await swMessage('CLEAR_QUEUE');
    flushing.current = false;
  }, []);

  const getCachedContacts = useCallback(async () => {
    const ls = lsGet(LS_CONTACTS);
    if (ls?.length) return ls;
    const res = await swMessage('GET_CONTACTS');
    return res?.data || [];
  }, []);

  const getCachedLocation = useCallback(async () => {
    const ls = lsGet(LS_LOCATION);
    if (ls) return ls;
    const res = await swMessage('GET_LOCATION');
    return res?.data || lastLocation.current;
  }, []);

  return { isOnline, swReady, queuedAlerts, queueAlert, flushQueue, getCachedContacts, getCachedLocation };
}
