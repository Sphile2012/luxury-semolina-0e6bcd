/**
 * Central configuration module
 * Loads and validates all environment variables
 */
require('dotenv').config();

const config = {
  // ── Environment ───────────────────────────────────────────────────────────
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // ── Server ────────────────────────────────────────────────────────────────
  port: parseInt(process.env.PORT, 10) || 3001,
  
  // ── URLs ──────────────────────────────────────────────────────────────────
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',

  // ── Security ──────────────────────────────────────────────────────────────
  jwt: {
    secret: process.env.JWT_SECRET || 'guard-ring-secret-CHANGE-IN-PRODUCTION',
    expiresIn: process.env.JWT_EXPIRATION || '30d',
  },

  // ── Database ──────────────────────────────────────────────────────────────
  database: {
    dir: process.env.DATA_DIR || (
      process.env.NODE_ENV === 'production'
        ? '/tmp/guardring-data'
        : require('path').join(__dirname, '../../data')
    ),
    filename: 'guardring.db',
  },

  // ── PayFast ───────────────────────────────────────────────────────────────
  payfast: {
    sandbox: process.env.PAYFAST_SANDBOX !== 'false',
    merchantId: process.env.PAYFAST_MERCHANT_ID || '10000100',
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a',
    passphrase: process.env.PAYFAST_PASSPHRASE || 'jt7NOE43FZPn',
    url: process.env.PAYFAST_SANDBOX !== 'false'
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process',
  },

  // ── Twilio SMS ────────────────────────────────────────────────────────────
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
    enabled: !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
    ),
  },

  // ── Email (SMTP) ──────────────────────────────────────────────────────────
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
  },

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  rateLimit: {
    auth: parseInt(process.env.RATE_LIMIT_AUTH, 10) || 20,
    api: parseInt(process.env.RATE_LIMIT_API, 10) || 100,
  },

  // ── Logging ───────────────────────────────────────────────────────────────
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // ── Features ──────────────────────────────────────────────────────────────
  features: {
    communityMap: process.env.FEATURE_COMMUNITY_MAP !== 'false',
    liveLocation: process.env.FEATURE_LIVE_LOCATION !== 'false',
    journeyTracking: process.env.FEATURE_JOURNEY_TRACKING !== 'false',
    smsAlerts: process.env.FEATURE_SMS_ALERTS === 'true',
  },

  // ── External APIs ─────────────────────────────────────────────────────────
  nominatim: {
    url: process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org',
    userAgent: process.env.NOMINATIM_USER_AGENT || 'GuardRingApp/2.0',
  },
};

// Validate critical configuration
if (config.isProduction) {
  if (config.jwt.secret.includes('CHANGE') || config.jwt.secret.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET is weak or default. Please set a secure random secret!');
  }
}

module.exports = config;
