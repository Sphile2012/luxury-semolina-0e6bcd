require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const entityRoutes = require('./routes/entities');
const functionRoutes = require('./routes/functions');
const payfastRoutes = require('./routes/payfast');
const advancedRoutes = require('./routes/advanced');

const app = express();
const PORT = process.env.PORT || 3001;

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
    // Allow all localhost origins (dev)
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    // Allow 127.0.0.1 (dev)
    if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return callback(null, true);
    // Allow configured production domains
    const allowed = (process.env.FRONTEND_URL || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    // Also allow any *.netlify.app domain
    if (origin.endsWith('.netlify.app')) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));

// ── Request logger (dev only) ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
      console.log(`${color}${req.method} ${req.path} ${res.statusCode} (${ms}ms)\x1b[0m`);
    });
    next();
  });
}

// ── Rate limiter for auth endpoints ──────────────────────────────────────────
const authAttempts = new Map();
// Clean up old entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 60000;
  for (const [key, times] of authAttempts) {
    const fresh = times.filter(t => t > cutoff);
    if (fresh.length === 0) authAttempts.delete(key);
    else authAttempts.set(key, fresh);
  }
}, 5 * 60 * 1000);

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
    uptime: Math.round(process.uptime()),
    version: '2.1.0',
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('\x1b[31mUnhandled error:\x1b[0m', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\x1b[32m✅ Panic Ring backend running on http://localhost:${PORT}\x1b[0m`);
  console.log(`   Routes: /api/auth  /api/entities  /api/functions  /api/health`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  // Force exit after 5s if connections hang
  setTimeout(() => process.exit(1), 5000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ── Catch unhandled promise rejections (prevent silent crashes) ───────────────
process.on('unhandledRejection', (reason) => {
  console.error('\x1b[31mUnhandled Promise Rejection:\x1b[0m', reason);
});
process.on('uncaughtException', (err) => {
  console.error('\x1b[31mUncaught Exception:\x1b[0m', err.message);
  // Don't exit — log and continue
});
