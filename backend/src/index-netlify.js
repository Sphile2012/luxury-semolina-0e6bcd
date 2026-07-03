/**
 * Netlify-compatible Express app export.
 * This file mirrors index.js but does NOT call app.listen() —
 * serverless-http handles the request/response lifecycle instead.
 */
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const entityRoutes = require('./routes/entities');
const functionRoutes = require('./routes/functions');
const payfastRoutes = require('./routes/payfast');
const advancedRoutes = require('./routes/advanced');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── CORS — allow any localhost port + configured production URL ───────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return callback(null, true);
    const allowed = (process.env.FRONTEND_URL || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (origin.endsWith('.netlify.app')) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));

// ── Rate limiter for auth endpoints ──────────────────────────────────────────
const authAttempts = new Map();

function rateLimit(maxPerMinute) {
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const attempts = (authAttempts.get(key) || []).filter(t => now - t < 60000);
    if (attempts.length >= maxPerMinute) {
      return res.status(429).json({ error: 'Too many attempts. Please wait a minute.' });
    }
    attempts.push(now);
    authAttempts.set(key, attempts);
    next();
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', rateLimit(20), authRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/functions', functionRoutes);
app.use('/api/payfast', payfastRoutes);
app.use('/api', advancedRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.1.0',
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
