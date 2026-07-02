// Panic Ring Service Worker — Offline Mode + Background Sync
const CACHE_NAME = 'panic-ring-v2';
const SYNC_TAG = 'panic-alert-sync';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});

// ── Background Sync ──────────────────────────────────────────────────────────
// Fires automatically when the device regains connectivity
self.addEventListener('sync', async (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(notifyClientsToFlush());
  }
});

async function notifyClientsToFlush() {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach(client => client.postMessage({ type: 'FLUSH_QUEUE' }));
}

// ── Message Handler ──────────────────────────────────────────────────────────
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {};
  const port = event.ports?.[0];
  const respond = (data) => port?.postMessage(data);

  const cache = await caches.open(CACHE_NAME);

  if (type === 'CACHE_CONTACTS') {
    await cache.put('/offline/contacts', jsonResponse(payload));
    respond({ ok: true, count: payload?.length });
  }

  if (type === 'CACHE_LOCATION') {
    await cache.put('/offline/location', jsonResponse(payload));
    respond({ ok: true });
  }

  if (type === 'GET_CONTACTS') {
    const res = await cache.match('/offline/contacts');
    respond({ data: res ? await res.json() : null });
  }

  if (type === 'GET_LOCATION') {
    const res = await cache.match('/offline/location');
    respond({ data: res ? await res.json() : null });
  }

  if (type === 'QUEUE_ALERT') {
    const existing = await cache.match('/offline/queue');
    const queue = existing ? await existing.json() : [];
    queue.push({ ...payload, queued_at: Date.now(), id: crypto.randomUUID() });
    await cache.put('/offline/queue', jsonResponse(queue));
    // Register background sync
    try { await self.registration.sync.register(SYNC_TAG); } catch {}
    respond({ ok: true, count: queue.length });
  }

  if (type === 'GET_QUEUE') {
    const res = await cache.match('/offline/queue');
    respond({ data: res ? await res.json() : [] });
  }

  if (type === 'CLEAR_QUEUE') {
    await cache.put('/offline/queue', jsonResponse([]));
    respond({ ok: true });
  }

  if (type === 'REMOVE_QUEUED_ALERT') {
    const existing = await cache.match('/offline/queue');
    const queue = existing ? await existing.json() : [];
    const updated = queue.filter(item => item.id !== payload.id);
    await cache.put('/offline/queue', jsonResponse(updated));
    respond({ ok: true, remaining: updated.length });
  }
});

function jsonResponse(data) {
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}
