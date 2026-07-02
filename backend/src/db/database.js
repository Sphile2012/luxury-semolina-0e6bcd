const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use /tmp on production (Render free tier) or local data/ dir in dev.
// For production with persistent data, mount a Render Disk at /data
// and set DATA_DIR=/data in your environment variables.
const DATA_DIR = process.env.DATA_DIR ||
  (process.env.NODE_ENV === 'production'
    ? '/tmp/panicring-data'
    : path.join(__dirname, '../../data'));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const sqlite = new Database(path.join(DATA_DIR, 'panicring.db'));
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// ── Schema ────────────────────────────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT DEFAULT '',
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS safety_profiles (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL,
    owner_phone TEXT,
    custom_alert_message TEXT DEFAULT 'I need help! Please contact me immediately.',
    auto_call_911 INTEGER DEFAULT 0,
    device_connected INTEGER DEFAULT 0,
    device_name TEXT,
    device_imei TEXT,
    device_model TEXT,
    device_platform TEXT,
    subscription_plan TEXT DEFAULT 'basic',
    location_sharing INTEGER DEFAULT 1,
    safe_zones_alerts INTEGER DEFAULT 1,
    crime_alerts INTEGER DEFAULT 0,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS emergency_contacts (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    relationship TEXT DEFAULT 'friend',
    priority INTEGER DEFAULT 1,
    notify_sms INTEGER DEFAULT 1,
    notify_email INTEGER DEFAULT 1,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    latitude REAL,
    longitude REAL,
    address TEXT,
    message TEXT DEFAULT 'I need help! Please contact me immediately.',
    trigger_method TEXT DEFAULT 'app_button',
    contacts_notified TEXT DEFAULT '[]',
    resolved_at TEXT,
    notes TEXT,
    audio_url TEXT,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS safe_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    type TEXT DEFAULT 'home',
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radius REAL DEFAULT 200,
    address TEXT,
    phone TEXT,
    hours TEXT,
    alert_on_exit INTEGER DEFAULT 1,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shared_devices (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL,
    device_id TEXT NOT NULL,
    device_name TEXT,
    device_type TEXT DEFAULT 'phone',
    platform TEXT DEFAULT 'android',
    last_latitude REAL,
    last_longitude REAL,
    last_accuracy REAL,
    last_address TEXT,
    last_location_update TEXT,
    battery_level REAL,
    battery_charging INTEGER DEFAULT 0,
    battery_updated_at TEXT,
    low_battery_alerted INTEGER DEFAULT 0,
    is_lost INTEGER DEFAULT 0,
    tracking_enabled INTEGER DEFAULT 1,
    geofence_status TEXT DEFAULT 'unknown',
    geofence_alerted INTEGER DEFAULT 0,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_safety_profiles_owner   ON safety_profiles(owner_email);
  CREATE INDEX IF NOT EXISTS idx_emergency_contacts_owner ON emergency_contacts(owner_email);
  CREATE INDEX IF NOT EXISTS idx_alerts_owner            ON alerts(owner_email);
  CREATE INDEX IF NOT EXISTS idx_safe_zones_owner        ON safe_zones(owner_email);
  CREATE INDEX IF NOT EXISTS idx_shared_devices_owner    ON shared_devices(owner_email);
  CREATE INDEX IF NOT EXISTS idx_shared_devices_device   ON shared_devices(device_id);
  CREATE INDEX IF NOT EXISTS idx_users_email             ON users(email);
`);

// ── Advanced Safety Features — additive schema migrations ────────────────────
const migrations = [
  // REQ 4 — Live location stream
  `CREATE TABLE IF NOT EXISTS location_streams (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL,
    stale INTEGER DEFAULT 0,
    created_date TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_location_streams_owner ON location_streams(owner_email)`,

  // REQ 16 — Community incidents
  `CREATE TABLE IF NOT EXISTS community_incidents (
    id TEXT PRIMARY KEY,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    description TEXT,
    upvotes INTEGER DEFAULT 0,
    created_date TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_community_incidents_expires ON community_incidents(expires_at)`,

  // REQ 14 — Journeys
  `CREATE TABLE IF NOT EXISTS journeys (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL,
    destination TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    start_lat REAL,
    start_lng REAL,
    contacts TEXT DEFAULT '[]',
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now')),
    completed_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_journeys_owner ON journeys(owner_email)`,

  // REQ 5 — zone_safety_type column on safe_zones
  `ALTER TABLE safe_zones ADD COLUMN zone_safety_type TEXT DEFAULT 'safe'`,

  // Live alert location quality (metres, from Geolocation API)
  `ALTER TABLE alerts ADD COLUMN accuracy REAL`,
];

for (const sql of migrations) {
  try { sqlite.exec(sql); } catch (e) {
    // Ignore "already exists" / "duplicate column" errors
    if (!e.message.includes('already exists') && !e.message.includes('duplicate column')) {
      console.warn('[DB migration warning]', e.message);
    }
  }
}

// ── Boolean fields that need int↔bool conversion ──────────────────────────────
const BOOL_FIELDS = new Set([
  'auto_call_911','device_connected','location_sharing','safe_zones_alerts','crime_alerts',
  'notify_sms','notify_email','alert_on_exit','battery_charging','low_battery_alerted',
  'is_lost','tracking_enabled','geofence_alerted',
]);

function deserializeRow(row) {
  if (!row) return null;
  const out = { ...row };
  // Parse JSON arrays
  if ('contacts_notified' in out) {
    try { out.contacts_notified = JSON.parse(out.contacts_notified || '[]'); } catch { out.contacts_notified = []; }
  }
  // Convert integers to booleans
  for (const f of BOOL_FIELDS) {
    if (f in out) out[f] = out[f] === 1 || out[f] === true;
  }
  return out;
}

function serializeValue(key, val) {
  if (Array.isArray(val)) return JSON.stringify(val);
  if (BOOL_FIELDS.has(key) && typeof val === 'boolean') return val ? 1 : 0;
  return val;
}

// ── Table name map ────────────────────────────────────────────────────────────
const TABLE_MAP = {
  users:              'users',
  safety_profiles:    'safety_profiles',
  emergency_contacts: 'emergency_contacts',
  alerts:             'alerts',
  safe_zones:         'safe_zones',
  shared_devices:     'shared_devices',
};

// ── Helper API ────────────────────────────────────────────────────────────────
const db = {
  // Raw sqlite instance for advanced queries
  raw: sqlite,

  getById(table, id) {
    const row = sqlite.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
    return deserializeRow(row);
  },

  getAll(table, sort = 'created_date', limit = 200) {
    const col = sort.startsWith('-') ? sort.slice(1) : sort;
    const dir = sort.startsWith('-') ? 'DESC' : 'ASC';
    const rows = sqlite.prepare(`SELECT * FROM ${table} ORDER BY ${col} ${dir} LIMIT ?`).all(Number(limit));
    return rows.map(deserializeRow);
  },

  filter(table, filters = {}, sort = 'created_date', limit = 100) {
    const keys = Object.keys(filters);
    const where = keys.length ? 'WHERE ' + keys.map(k => `${k} = ?`).join(' AND ') : '';
    const values = keys.map(k => filters[k]);
    const col = sort.startsWith('-') ? sort.slice(1) : sort;
    const dir = sort.startsWith('-') ? 'DESC' : 'ASC';
    const rows = sqlite.prepare(
      `SELECT * FROM ${table} ${where} ORDER BY ${col} ${dir} LIMIT ?`
    ).all(...values, Number(limit));
    return rows.map(deserializeRow);
  },

  insert(table, data) {
    const now = new Date().toISOString();
    const record = { ...data, updated_date: data.updated_date || now, created_date: data.created_date || now };
    const keys = Object.keys(record);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => serializeValue(k, record[k]));
    sqlite.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`).run(...values);
    return this.getById(table, record.id);
  },

  update(table, id, updates) {
    const now = new Date().toISOString();
    const data = { ...updates, updated_date: now };
    delete data.id;
    const keys = Object.keys(data);
    if (!keys.length) return this.getById(table, id);
    const set = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => serializeValue(k, data[k]));
    sqlite.prepare(`UPDATE ${table} SET ${set} WHERE id = ?`).run(...values, id);
    return this.getById(table, id);
  },

  delete(table, id) {
    sqlite.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    return { success: true };
  },

  // Direct prepared statement access
  prepare: (sql) => sqlite.prepare(sql),
};

module.exports = db;
