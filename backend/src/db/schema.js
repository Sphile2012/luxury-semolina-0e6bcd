/**
 * Database schema definitions and migrations
 */

const SCHEMA_VERSION = 2;

/**
 * Core schema SQL
 */
const CORE_SCHEMA = `
  -- ══════════════════════════════════════════════════════════════════════════
  -- Core Tables
  -- ══════════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT DEFAULT '',
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    email_verified INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    last_login TEXT,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS safety_profiles (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL UNIQUE,
    owner_phone TEXT,
    custom_alert_message TEXT DEFAULT 'I need help! Please contact me immediately.',
    auto_call_911 INTEGER DEFAULT 0,
    device_connected INTEGER DEFAULT 0,
    device_name TEXT,
    device_imei TEXT,
    device_model TEXT,
    device_platform TEXT DEFAULT 'android',
    subscription_plan TEXT DEFAULT 'basic' CHECK(subscription_plan IN ('basic', 'standard', 'premium')),
    subscription_billing TEXT DEFAULT 'monthly' CHECK(subscription_billing IN ('monthly', 'annual')),
    subscription_updated_at TEXT,
    location_sharing INTEGER DEFAULT 1,
    safe_zones_alerts INTEGER DEFAULT 1,
    crime_alerts INTEGER DEFAULT 0,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_email) REFERENCES users(email) ON DELETE CASCADE
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
    is_active INTEGER DEFAULT 1,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_email) REFERENCES users(email) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'resolved', 'cancelled')),
    latitude REAL,
    longitude REAL,
    accuracy REAL,
    address TEXT,
    message TEXT DEFAULT 'I need help! Please contact me immediately.',
    trigger_method TEXT DEFAULT 'app_button',
    contacts_notified TEXT DEFAULT '[]',
    resolved_at TEXT,
    notes TEXT,
    audio_url TEXT,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_email) REFERENCES users(email) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS safe_zones (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'home' CHECK(type IN ('home', 'work', 'school', 'friend', 'custom')),
    zone_safety_type TEXT DEFAULT 'safe' CHECK(zone_safety_type IN ('safe', 'danger')),
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radius REAL DEFAULT 200,
    address TEXT,
    phone TEXT,
    hours TEXT,
    alert_on_exit INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_email) REFERENCES users(email) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS shared_devices (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL,
    device_id TEXT NOT NULL,
    device_name TEXT,
    device_type TEXT DEFAULT 'phone' CHECK(device_type IN ('phone', 'smartwatch', 'tablet')),
    platform TEXT DEFAULT 'android' CHECK(platform IN ('android', 'ios', 'watchos', 'wear_os', 'web')),
    last_latitude REAL,
    last_longitude REAL,
    last_accuracy REAL,
    last_address TEXT,
    last_location_update TEXT,
    battery_level INTEGER,
    battery_charging INTEGER DEFAULT 0,
    battery_updated_at TEXT,
    low_battery_alerted INTEGER DEFAULT 0,
    is_lost INTEGER DEFAULT 0,
    tracking_enabled INTEGER DEFAULT 1,
    geofence_status TEXT DEFAULT 'unknown',
    geofence_alerted INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_email) REFERENCES users(email) ON DELETE CASCADE
  );

  -- ══════════════════════════════════════════════════════════════════════════
  -- Advanced Features Tables
  -- ══════════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS location_streams (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL,
    altitude REAL,
    speed REAL,
    heading REAL,
    stale INTEGER DEFAULT 0,
    created_date TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    FOREIGN KEY (owner_email) REFERENCES users(email) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS community_incidents (
    id TEXT PRIMARY KEY,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    category TEXT NOT NULL DEFAULT 'other' CHECK(category IN ('crime', 'accident', 'hazard', 'suspicious', 'other')),
    severity TEXT DEFAULT 'medium' CHECK(severity IN ('low', 'medium', 'high')),
    description TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    verified INTEGER DEFAULT 0,
    created_date TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS journeys (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL,
    destination TEXT NOT NULL,
    destination_lat REAL,
    destination_lng REAL,
    duration_minutes INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled', 'overdue')),
    start_lat REAL,
    start_lng REAL,
    contacts TEXT DEFAULT '[]',
    check_in_frequency INTEGER DEFAULT 15,
    last_check_in TEXT,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('date')),
    completed_at TEXT,
    FOREIGN KEY (owner_email) REFERENCES users(email) ON DELETE CASCADE
  );

  -- ══════════════════════════════════════════════════════════════════════════
  -- Audit and Activity Tracking
  -- ══════════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata TEXT,
    created_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
  );

  -- ══════════════════════════════════════════════════════════════════════════
  -- Indexes for Performance
  -- ══════════════════════════════════════════════════════════════════════════

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
  
  CREATE INDEX IF NOT EXISTS idx_safety_profiles_owner ON safety_profiles(owner_email);
  
  CREATE INDEX IF NOT EXISTS idx_emergency_contacts_owner ON emergency_contacts(owner_email);
  CREATE INDEX IF NOT EXISTS idx_emergency_contacts_priority ON emergency_contacts(owner_email, priority);
  
  CREATE INDEX IF NOT EXISTS idx_alerts_owner ON alerts(owner_email);
  CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
  CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_date DESC);
  
  CREATE INDEX IF NOT EXISTS idx_safe_zones_owner ON safe_zones(owner_email);
  CREATE INDEX IF NOT EXISTS idx_safe_zones_active ON safe_zones(is_active);
  
  CREATE INDEX IF NOT EXISTS idx_shared_devices_owner ON shared_devices(owner_email);
  CREATE INDEX IF NOT EXISTS idx_shared_devices_device ON shared_devices(device_id);
  CREATE INDEX IF NOT EXISTS idx_shared_devices_active ON shared_devices(is_active);
  
  CREATE INDEX IF NOT EXISTS idx_location_streams_owner ON location_streams(owner_email);
  CREATE INDEX IF NOT EXISTS idx_location_streams_expires ON location_streams(expires_at);
  
  CREATE INDEX IF NOT EXISTS idx_community_incidents_expires ON community_incidents(expires_at);
  CREATE INDEX IF NOT EXISTS idx_community_incidents_category ON community_incidents(category);
  
  CREATE INDEX IF NOT EXISTS idx_journeys_owner ON journeys(owner_email);
  CREATE INDEX IF NOT EXISTS idx_journeys_status ON journeys(status);
  
  CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_email);
  CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_date DESC);
`;

/**
 * Schema migrations (version-based)
 */
const MIGRATIONS = {
  1: [
    // Initial schema (already applied in CORE_SCHEMA)
  ],
  2: [
    // Add missing columns for advanced features
    `ALTER TABLE journeys ADD COLUMN check_in_frequency INTEGER DEFAULT 15`,
    `ALTER TABLE journeys ADD COLUMN last_check_in TEXT`,
    `ALTER TABLE journeys ADD COLUMN destination_lat REAL`,
    `ALTER TABLE journeys ADD COLUMN destination_lng REAL`,
    `ALTER TABLE community_incidents ADD COLUMN severity TEXT DEFAULT 'medium'`,
    `ALTER TABLE community_incidents ADD COLUMN downvotes INTEGER DEFAULT 0`,
    `ALTER TABLE community_incidents ADD COLUMN verified INTEGER DEFAULT 0`,
  ],
};

module.exports = {
  SCHEMA_VERSION,
  CORE_SCHEMA,
  MIGRATIONS,
};
