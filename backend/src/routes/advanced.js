/**
 * Advanced Safety Features — Backend Routes
 * REQ 4: Live Location Streaming
 * REQ 9: SMS Alerts
 * REQ 11: Contact Escalation
 * REQ 14: Journey Planner
 * REQ 16: Community Safety Map
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── REQ 4: Live Location Streaming ───────────────────────────────────────────

// POST /api/stream/location — store latest coords for authenticated user
router.post('/stream/location', authMiddleware, (req, res) => {
  try {
    const user = req.user;
    const { latitude, longitude, accuracy, stale = false } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    db.raw.prepare(`
      INSERT INTO location_streams (id, owner_email, latitude, longitude, accuracy, stale, created_date, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), user.email, latitude, longitude, accuracy || null, stale ? 1 : 0, now.toISOString(), expiresAt);

    // Clean up old entries for this user (keep only last 100)
    db.raw.prepare(`
      DELETE FROM location_streams
      WHERE owner_email = ? AND id NOT IN (
        SELECT id FROM location_streams WHERE owner_email = ? ORDER BY created_date DESC LIMIT 100
      )
    `).run(user.email, user.email);

    res.json({ success: true });
  } catch (err) {
    console.error('stream/location POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stream/location/:userId — get latest coords for a user
router.get('/stream/location/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date().toISOString();

    // userId can be email or owner_email
    const row = db.raw.prepare(`
      SELECT * FROM location_streams
      WHERE owner_email = ? AND expires_at > ?
      ORDER BY created_date DESC LIMIT 1
    `).get(userId, now);

    if (!row) return res.json({ found: false });
    res.json({ found: true, data: row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── REQ 9: SMS Alerts ─────────────────────────────────────────────────────────

// POST /api/functions/sendSMS
router.post('/functions/sendSMS', (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'phone and message are required' });
    }

    // Log the SMS (real SMS via env-configured provider like Twilio)
    console.log(`[SMS] To: ${phone} | Message: ${message.substring(0, 80)}...`);

    // If Twilio credentials are configured, send real SMS
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (accountSid && authToken && fromNumber) {
      // Real Twilio integration (non-blocking)
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const body = new URLSearchParams({ To: phone, From: fromNumber, Body: message });
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }).catch(err => console.error('[SMS Twilio error]', err.message));

      return res.json({ success: true, provider: 'sms' });
    }

    // No provider configured — return whatsapp fallback
    res.json({ success: true, provider: 'whatsapp', fallback_url: `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── REQ 11: Contact Escalation ────────────────────────────────────────────────

// POST /api/functions/escalateAlert
router.post('/functions/escalateAlert', authMiddleware, (req, res) => {
  try {
    const user = req.user;
    const { alertId } = req.body;

    if (!alertId) return res.status(400).json({ error: 'alertId is required' });

    const alert = db.getById('alerts', alertId);
    if (!alert || alert.owner_email !== user.email) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const contacts = db.filter('emergency_contacts', { owner_email: user.email }, 'priority', 20);
    if (!contacts.length) return res.json({ success: false, reason: 'No contacts' });

    // Parse existing notes to find last escalation step
    let notes = [];
    try { notes = JSON.parse(alert.notes || '[]'); } catch { notes = []; }

    const notifiedCount = notes.filter(n => n.type === 'escalation').length;
    const nextContact = contacts[notifiedCount];

    if (!nextContact) {
      return res.json({ success: false, reason: 'All contacts already notified', escalated: false });
    }

    const step = {
      type: 'escalation',
      contact_id: nextContact.id,
      contact_name: nextContact.name,
      contact_phone: nextContact.phone,
      ts: new Date().toISOString(),
    };
    notes.push(step);

    db.update('alerts', alertId, { notes: JSON.stringify(notes) });

    // Build WhatsApp link
    const msg = encodeURIComponent(
      `🚨 *ESCALATED EMERGENCY ALERT*\n\n${user.full_name || user.email} needs help!\n\nThis is escalation #${notifiedCount + 1}. Previous contacts have not responded.\n\nPlease respond immediately!\n\n_Sent via Panic Ring_`
    );
    const whatsappUrl = nextContact.phone
      ? `https://wa.me/${nextContact.phone.replace(/[^0-9]/g, '')}?text=${msg}`
      : null;

    res.json({
      success: true,
      escalated: true,
      contact: nextContact,
      whatsapp_url: whatsappUrl,
      step_number: notifiedCount + 1,
      total_contacts: contacts.length,
    });
  } catch (err) {
    console.error('escalateAlert error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── REQ 14: Journey Planner ───────────────────────────────────────────────────

// POST /api/functions/startJourney
router.post('/functions/startJourney', authMiddleware, (req, res) => {
  try {
    const user = req.user;
    const { destination, duration_minutes, contacts = [], start_lat, start_lng } = req.body;

    if (!destination || !duration_minutes) {
      return res.status(400).json({ error: 'destination and duration_minutes are required' });
    }

    const journeyId = uuidv4();
    const now = new Date().toISOString();

    db.raw.prepare(`
      INSERT INTO journeys (id, owner_email, destination, duration_minutes, status, start_lat, start_lng, contacts, created_date, updated_date)
      VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
    `).run(journeyId, user.email, destination, duration_minutes, start_lat || null, start_lng || null, JSON.stringify(contacts), now, now);

    // Build WhatsApp notifications for followers
    const whatsappLinks = contacts
      .filter(c => c.phone)
      .map(c => {
        const msg = encodeURIComponent(
          `🗺️ *Journey Started — Panic Ring*\n\n${user.full_name || user.email} has started a journey to "${destination}".\n\nEstimated duration: ${duration_minutes} minutes.\n\nThey will notify you when they arrive safely.\n\n_Sent via Panic Ring_`
        );
        return { name: c.name, url: `https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${msg}` };
      });

    res.json({ success: true, journey_id: journeyId, whatsapp_links: whatsappLinks });
  } catch (err) {
    console.error('startJourney error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/functions/endJourney
router.post('/functions/endJourney', authMiddleware, (req, res) => {
  try {
    const user = req.user;
    const { journey_id, completed = false } = req.body;

    if (!journey_id) return res.status(400).json({ error: 'journey_id is required' });

    const now = new Date().toISOString();
    db.raw.prepare(`
      UPDATE journeys SET status = ?, completed_at = ?, updated_date = ? WHERE id = ? AND owner_email = ?
    `).run(completed ? 'completed' : 'ended', now, now, journey_id, user.email);

    res.json({ success: true });
  } catch (err) {
    console.error('endJourney error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── REQ 16: Community Safety Map ─────────────────────────────────────────────

// GET /api/incidents?lat=&lng=&radius=10000
router.get('/incidents', (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;
    const now = new Date().toISOString();

    // Get all non-expired incidents
    const all = db.raw.prepare(`
      SELECT * FROM community_incidents WHERE expires_at > ? ORDER BY created_date DESC LIMIT 500
    `).all(now);

    if (!lat || !lng) {
      return res.json({ incidents: all });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radius);

    const nearby = all.filter(inc =>
      haversineMeters(userLat, userLng, inc.lat, inc.lng) <= maxRadius
    );

    res.json({ incidents: nearby });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/incidents — create incident (anonymized to 3 decimal places)
router.post('/incidents', (req, res) => {
  try {
    const { lat, lng, category = 'other', description = '' } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const VALID_CATEGORIES = ['crime', 'accident', 'hazard', 'suspicious', 'other'];
    const safeCategory = VALID_CATEGORIES.includes(category) ? category : 'other';

    // Anonymize to 3 decimal places (~111m precision)
    const anonLat = Math.round(parseFloat(lat) * 1000) / 1000;
    const anonLng = Math.round(parseFloat(lng) * 1000) / 1000;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();
    const id = uuidv4();

    db.raw.prepare(`
      INSERT INTO community_incidents (id, lat, lng, category, description, upvotes, created_date, expires_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, anonLat, anonLng, safeCategory, description.substring(0, 200), now.toISOString(), expiresAt);

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/incidents/:id/upvote
router.post('/incidents/:id/upvote', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.raw.prepare(`
      UPDATE community_incidents SET upvotes = upvotes + 1 WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const updated = db.raw.prepare('SELECT upvotes FROM community_incidents WHERE id = ?').get(id);
    res.json({ success: true, upvotes: updated?.upvotes || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
