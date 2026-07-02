/**
 * Panic Ring Safety App — API Client
 * All requests go to the Express backend.
 */

// Empty = use relative paths through Vite proxy → backend
const BASE_URL = import.meta.env.VITE_API_URL || '';

// ── Token storage ─────────────────────────────────────────────────────────────
export const tokenStore = {
  get: () => localStorage.getItem('panic_ring_token'),
  set: (t) => localStorage.setItem('panic_ring_token', t),
  clear: () => localStorage.removeItem('panic_ring_token'),
};

// ── Core fetch ────────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = tokenStore.get();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  register: (email, password, full_name) =>
    apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, full_name }) }),

  login: (email, password) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => apiFetch('/api/auth/me'),

  logout: () => tokenStore.clear(),
};

// ── Entity factory ────────────────────────────────────────────────────────────
function makeEntity(name) {
  return {
    filter: (filters = {}, sort = 'created_date', limit = 50) =>
      apiFetch(`/api/entities/${name}/filter`, {
        method: 'POST',
        body: JSON.stringify({ filters, sort, limit }),
      }),

    list: (sort = '-created_date', limit = 100) =>
      apiFetch(`/api/entities/${name}/list?sort=${encodeURIComponent(sort)}&limit=${limit}`),

    get: (id) => apiFetch(`/api/entities/${name}/${id}`),

    create: (data) =>
      apiFetch(`/api/entities/${name}`, { method: 'POST', body: JSON.stringify(data) }),

    update: (id, data) =>
      apiFetch(`/api/entities/${name}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id) =>
      apiFetch(`/api/entities/${name}/${id}`, { method: 'DELETE' }),

    // No-op subscribe — real-time can be added later with SSE/WebSocket
    subscribe: () => () => {},
  };
}

export const entities = {
  SafetyProfile:    makeEntity('SafetyProfile'),
  EmergencyContact: makeEntity('EmergencyContact'),
  Alert:            makeEntity('Alert'),
  SafeZone:         makeEntity('SafeZone'),
  SharedDevice:     makeEntity('SharedDevice'),
};

// ── Functions ─────────────────────────────────────────────────────────────────
export const functions = {
  invoke: (name, payload = {}) =>
    apiFetch(`/api/functions/${name}`, { method: 'POST', body: JSON.stringify(payload) }),
};

// ── Default export ────────────────────────────────────────────────────────────
const phumeClient = { auth, entities, functions };
export default phumeClient;
