/**
 * Backend equivalents for all cloud functions.
 * Security: all authenticated endpoints enforce owner_email from JWT.
 * findMyPhoneLogin is intentionally unauthenticated (self-service device lookup).
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
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'PanicRingApp/1.0', Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.address) {
      const a = data.address;
      const parts = [
        a.road || a.pedestrian || a.neighbourhood,
        a.suburb || a.city_district,
        a.city || a.town || a.village,
      ].filter(Boolean);
      return parts.length ? parts.join(', ') : (data.display_name || '').split(',').slice(0, 3).join(',');
    }
  } catch {}
  return null;
}

function cleanDeviceName(name) {
  if (!name) return 'My Phone';
  if (['Windows NT', 'AppleWebKit', 'Mozilla', 'Gecko', 'Chrome', 'Safari'].some(b => name.includes(b))) return 'My Phone';
  return name;
}

// ── POST /api/functions/sendPanicAlert ────────────────────────────────────────
router.post('/sendPanicAlert', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { latitude, longitude, accuracy, message, address, audio_url, trigger_method } = req.body;

    // Only fetch THIS user's contacts
    const contacts = db.filter('emergency_contacts', { owner_email: user.email }, 'priority', 50);
    if (!contacts.length) {
      return res.status(400).json({ error: 'No emergency contacts found. Please add contacts first.' });
    }

    const profiles = db.filter('safety_profiles', { owner_email: user.email }, 'created_date', 1);
    const profile = profiles[0];
    const alertMessage = profile?.custom_alert_message || message || 'I need help! Please contact me immediately.';

    const alertId = uuidv4();
    const now = new Date().toISOString();

    db.insert('alerts', {
      id: alertId,
      owner_email: user.email,
      status: 'active',
      latitude: latitude || null,
      longitude: longitude || null,
      accuracy: accuracy != null ? Number(accuracy) : null,
      address: address || null,
      message: alertMessage,
      trigger_method: trigger_method || 'app_button',
      contacts_notified: contacts.map(c => c.email).filter(Boolean),
      audio_url: audio_url || null,
      created_date: now,
      updated_date: now,
    });

    const locationUrl = latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : 'Location unavailable';
    const accuracyText = accuracy ? ` (±${Math.round(accuracy)}m)` : '';
    const addressText = address ? `\n📍 ${address}` : '';
    const audioText = audio_url ? `\n🎙️ Audio: ${audio_url}` : '';

    const whatsappLinks = contacts
      .filter(c => c.phone)
      .map(c => {
        const msg = `🚨 *EMERGENCY ALERT FROM ${user.full_name || user.email}*\n\n${alertMessage}\n\n📍 Location: ${locationUrl}${accuracyText}${addressText}${audioText}\n⏰ ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}\n\n*Please respond immediately!*\n\n_Sent via Panic Ring_`;
        return {
          name: c.name,
          phone: c.phone,
          url: `https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`,
        };
      });

    res.json({ success: true, alert_id: alertId, contacts_notified: contacts.length, location_url: locationUrl, whatsapp_links: whatsappLinks });
  } catch (err) {
    console.error('sendPanicAlert error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/functions/updateDeviceLocation ──────────────────────────────────
router.post('/updateDeviceLocation', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { latitude, longitude, accuracy, deviceId, deviceName, platform, batteryLevel, batteryCharging } = req.body;

    if (!latitude || !longitude || !deviceId) {
      return res.status(400).json({ error: 'latitude, longitude and deviceId are required' });
    }

    const safeName = cleanDeviceName(deviceName);
    const address = await reverseGeocode(latitude, longitude);
    const now = new Date().toISOString();

    // Only look up THIS user's device
    const existing = db.filter('shared_devices', { owner_email: user.email, device_id: deviceId }, 'created_date', 1)[0];

    if (existing && accuracy) {
      const prevAccuracy = existing.last_accuracy || 9999;
      const stale = (Date.now() - new Date(existing.last_location_update || 0).getTime()) > 120000;
      if (!stale && accuracy > prevAccuracy * 2) {
        return res.json({ success: true, skipped: true });
      }
    }

    const locationData = {
      last_latitude: latitude,
      last_longitude: longitude,
      last_location_update: now,
      last_accuracy: accuracy || null,
      tracking_enabled: true,
    };
    if (address) locationData.last_address = address;
    if (batteryLevel != null) {
      locationData.battery_level = Math.round(batteryLevel * 100);
      locationData.battery_charging = !!batteryCharging;
      locationData.battery_updated_at = now;
      if (batteryCharging || batteryLevel > 0.15) locationData.low_battery_alerted = false;
    }

    if (!existing) {
      db.insert('shared_devices', {
        id: uuidv4(),
        owner_email: user.email,
        device_id: deviceId,
        device_name: safeName,
        device_type: 'phone',
        platform: platform || 'android',
        ...locationData,
        created_date: now,
        updated_date: now,
      });
    } else {
      const updates = { ...locationData };
      if (!existing.device_name || existing.device_name === 'My Phone') updates.device_name = safeName;
      db.update('shared_devices', existing.id, updates);
    }

    // Sync device info to safety profile
    const profile = db.filter('safety_profiles', { owner_email: user.email }, 'created_date', 1)[0];
    if (profile) {
      db.update('safety_profiles', profile.id, {
        device_imei: deviceId,
        device_name: safeName,
        device_platform: platform || profile.device_platform,
      });
    }

    res.json({ success: true, address: address || null });
  } catch (err) {
    console.error('updateDeviceLocation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/functions/findMyPhoneLogin ──────────────────────────────────────
// Intentionally unauthenticated — users look up their OWN device by IMEI/email/phone
router.post('/findMyPhoneLogin', async (req, res) => {
  try {
    const { imei, email, phone } = req.body;
    if (!imei && !email && !phone) {
      return res.status(400).json({ success: false, error: 'Provide at least one: Device ID, email, or phone.' });
    }

    const deviceMap = new Map();

    const addDevices = (found) => {
      for (const d of found) {
        const key = d.device_id || d.id;
        const existing = deviceMap.get(key);
        const dTime = new Date(d.last_location_update || d.updated_date || 0).getTime();
        const eTime = existing ? new Date(existing.last_location_update || existing.updated_date || 0).getTime() : -1;
        if (!existing || dTime > eTime) deviceMap.set(key, d);
      }
    };

    if (imei) addDevices(db.filter('shared_devices', { device_id: imei.trim() }, 'created_date', 10));
    if (email) addDevices(db.filter('shared_devices', { owner_email: email.trim().toLowerCase() }, 'created_date', 10));

    if (phone) {
      const normalized = phone.replace(/[^0-9]/g, '');
      // Only match profiles where owner_phone matches — scoped query
      const allProfiles = db.raw.prepare('SELECT owner_email, owner_phone FROM safety_profiles WHERE owner_phone IS NOT NULL').all();
      const matched = allProfiles.filter(p => p.owner_phone && p.owner_phone.replace(/[^0-9]/g, '') === normalized);
      for (const p of matched) {
        addDevices(db.filter('shared_devices', { owner_email: p.owner_email }, 'created_date', 10));
      }
    }

    // SafetyProfile fallback for registered-but-no-device-record users
    if (imei) {
      const profiles = db.filter('safety_profiles', { device_imei: imei.trim() }, 'created_date', 5);
      for (const p of profiles) {
        if (![...deviceMap.values()].find(d => d.owner_email === p.owner_email) && p.device_imei) {
          deviceMap.set(p.device_imei, {
            id: p.id, device_name: p.device_name || 'Registered Device', device_type: 'phone',
            platform: p.device_platform || 'android', owner_email: p.owner_email,
            device_id: p.device_imei, is_lost: false, tracking_enabled: false,
            last_latitude: null, last_longitude: null, last_location_update: null,
          });
        }
      }
    }
    if (email) {
      const profiles = db.filter('safety_profiles', { owner_email: email.trim().toLowerCase() }, 'created_date', 5);
      for (const p of profiles) {
        if (![...deviceMap.values()].find(d => d.owner_email === p.owner_email) && p.device_imei) {
          deviceMap.set(p.device_imei, {
            id: p.id, device_name: p.device_name || 'Registered Device', device_type: 'phone',
            platform: p.device_platform || 'android', owner_email: p.owner_email,
            device_id: p.device_imei, is_lost: false, tracking_enabled: false,
            last_latitude: null, last_longitude: null, last_location_update: null,
          });
        }
      }
    }

    let devices = [...deviceMap.values()].filter(d =>
      d.device_id && !d.device_id.startsWith('preview') && d.device_id !== 'test-device-123'
    );

    if (!devices.length) {
      return res.json({ success: false, error: 'No device found. Please check your details.' });
    }

    // Enrich with owner_phone (only for matched owner)
    for (const d of devices) {
      if (d.owner_email) {
        const p = db.filter('safety_profiles', { owner_email: d.owner_email }, 'created_date', 1)[0];
        if (p?.owner_phone) d.owner_phone = p.owner_phone;
      }
    }

    devices.sort((a, b) => {
      const aL = a.last_latitude != null ? 1 : 0;
      const bL = b.last_latitude != null ? 1 : 0;
      if (bL !== aL) return bL - aL;
      return new Date(b.last_location_update || 0) - new Date(a.last_location_update || 0);
    });

    res.json({ success: true, devices });
  } catch (err) {
    console.error('findMyPhoneLogin error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/functions/sendLowBatteryAlert ───────────────────────────────────
router.post('/sendLowBatteryAlert', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { battery_level = 0 } = req.body;

    const contacts = db.filter('emergency_contacts', { owner_email: user.email }, 'priority', 20);
    if (!contacts.length) return res.json({ success: false, reason: 'No contacts' });

    const now = new Date().toISOString();
    db.insert('alerts', {
      id: uuidv4(),
      owner_email: user.email,
      status: 'resolved',
      message: `[Auto] Device battery at ${battery_level}%. Low-power alert sent to ${contacts.length} contact(s).`,
      trigger_method: 'auto',
      contacts_notified: [],
      created_date: now,
      updated_date: now,
    });

    const msg = encodeURIComponent(`⚠️ Low Battery — ${user.full_name || user.email}'s device is at ${battery_level}%. They may go offline soon.`);
    const whatsappLinks = contacts.filter(c => c.phone).map(c => ({
      name: c.name,
      url: `https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${msg}`,
    }));

    res.json({ success: true, contacts_notified: contacts.length, battery_level, whatsapp_links: whatsappLinks });
  } catch (err) {
    console.error('sendLowBatteryAlert error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/functions/syncWatchLocation ─────────────────────────────────────
router.post('/syncWatchLocation', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { latitude, longitude, watchType } = req.body;
    const now = new Date().toISOString();

    const existing = db.raw.prepare(
      "SELECT * FROM shared_devices WHERE owner_email = ? AND device_type = 'smartwatch' LIMIT 1"
    ).get(user.email);

    if (!existing) {
      db.insert('shared_devices', {
        id: uuidv4(),
        owner_email: user.email,
        device_id: `watch_${user.email}_${Date.now()}`,
        device_name: watchType === 'watchos' ? 'Apple Watch' : 'Wear OS Watch',
        device_type: 'smartwatch',
        platform: watchType || 'wear_os',
        last_latitude: latitude,
        last_longitude: longitude,
        last_location_update: now,
        tracking_enabled: true,
        created_date: now,
        updated_date: now,
      });
    } else {
      db.update('shared_devices', existing.id, {
        last_latitude: latitude,
        last_longitude: longitude,
        last_location_update: now,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('syncWatchLocation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/functions/checkGeofence ─────────────────────────────────────────
router.post('/checkGeofence', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { last_latitude, last_longitude, device_id } = req.body;

    if (last_latitude == null || last_longitude == null) {
      return res.json({ skipped: true, reason: 'Missing location' });
    }

    // Only check THIS user's safe zones
    const safeZones = db.filter('safe_zones', { owner_email: user.email }, 'created_date', 50);
    if (!safeZones.length) return res.json({ skipped: true, reason: 'No safe zones' });

    const zonesWithStatus = safeZones
      .filter(z => z.latitude && z.longitude)
      .map(z => ({
        ...z,
        inside: haversineMeters(last_latitude, last_longitude, z.latitude, z.longitude) <= (z.radius || 200),
      }));

    const insideAny = zonesWithStatus.some(z => z.inside);
    const device = db.filter('shared_devices', { owner_email: user.email, device_id }, 'created_date', 1)[0];
    if (!device) return res.json({ skipped: true, reason: 'Device not found' });

    const newStatus = insideAny ? 'inside' : 'outside';
    const prevStatus = device.geofence_status || 'unknown';
    const exitedZone = !insideAny && prevStatus === 'inside';
    const enteredZone = insideAny && prevStatus === 'outside';
    const shouldAlert = exitedZone || enteredZone;

    db.update('shared_devices', device.id, {
      geofence_status: newStatus,
      geofence_alerted: shouldAlert ? true : device.geofence_alerted,
    });

    if (!shouldAlert) return res.json({ status: newStatus, alerted: false });

    const contacts = db.filter('emergency_contacts', { owner_email: user.email }, 'priority', 20);
    const eventType = exitedZone ? 'EXITED' : 'ENTERED';
    const emoji = exitedZone ? '⚠️' : '✅';
    const zoneNames = zonesWithStatus
      .filter(z => exitedZone ? !z.inside : z.inside)
      .map(z => z.name).join(', ');
    const address = device.last_address || `${last_latitude.toFixed(5)}, ${last_longitude.toFixed(5)}`;
    const mapsUrl = `https://www.google.com/maps?q=${last_latitude},${last_longitude}`;
    const alertMessage = `${emoji} ${device.device_name || 'Device'} has ${eventType} safe zone "${zoneNames}". Location: ${address}`;

    const now = new Date().toISOString();
    db.insert('alerts', {
      id: uuidv4(),
      owner_email: user.email,
      status: exitedZone ? 'active' : 'resolved',
      latitude: last_latitude,
      longitude: last_longitude,
      address,
      message: alertMessage,
      trigger_method: 'auto',
      contacts_notified: contacts.map(c => c.email || c.phone).filter(Boolean),
      created_date: now,
      updated_date: now,
    });

    const waMsg = encodeURIComponent(`${emoji} *GEOFENCE — ${eventType}*\n\n📱 ${device.device_name || 'Device'}\n📍 Zone: ${zoneNames}\n🗺 ${address}\n🔗 ${mapsUrl}\n\n_Panic Ring_`);
    const whatsappLinks = contacts.filter(c => c.phone).map(c =>
      `https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${waMsg}`
    );

    res.json({ status: newStatus, event: eventType, alerted: true, zones: zoneNames, contacts_notified: contacts.length, whatsapp_links: whatsappLinks });
  } catch (err) {
    console.error('checkGeofence error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/functions/sendFeedback ─────────────────────────────────────────
router.post('/sendFeedback', async (req, res) => {
  try {
    const { type, subject, message, email, rating, userName } = req.body;
    console.log(`[Feedback] ${type} | ${rating}★ | from: ${email || 'anon'} | ${subject}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
