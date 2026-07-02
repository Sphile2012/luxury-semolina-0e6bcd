import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function cleanDeviceName(name) {
  if (!name) return 'My Phone';
  const bad = ['Windows NT', 'AppleWebKit', 'Mozilla', 'Gecko', 'Chrome', 'Safari'];
  if (bad.some(b => name.includes(b))) return 'My Phone';
  return name;
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'PanicRingApp/1.0', 'Accept': 'application/json' } }
    );
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json') && !contentType.includes('json')) {
      console.error('Geocode: unexpected content-type', contentType);
      return null;
    }
    const data = await res.json();
    if (data && data.address) {
      const addr = data.address;
      const parts = [
        addr.road || addr.pedestrian || addr.neighbourhood,
        addr.suburb || addr.city_district,
        addr.city || addr.town || addr.village,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : (data.display_name || '').split(',').slice(0, 3).join(',');
    }
  } catch (e) {
    console.error('Geocode error:', e);
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { latitude, longitude, accuracy, deviceId, deviceName, platform, batteryLevel, batteryCharging } = await req.json();

    if (!latitude || !longitude || !deviceId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const safeName = cleanDeviceName(deviceName);
    const address = await reverseGeocode(latitude, longitude);
    const now = new Date().toISOString();

    // Get or create/update SharedDevice
    const devices = await base44.entities.SharedDevice.filter({
      owner_email: user.email,
      device_id: deviceId,
    });

    // Only update if new reading is more accurate (lower accuracy value = better)
    if (devices.length > 0 && accuracy) {
      const existing = devices[0];
      const prevAccuracy = existing.last_accuracy || 9999;
      // Accept if significantly more accurate, or last update was >2 mins ago
      const lastUpdate = new Date(existing.last_location_update || 0).getTime();
      const stale = (Date.now() - lastUpdate) > 120000;
      if (!stale && accuracy > prevAccuracy * 2) {
        return Response.json({ success: true, skipped: true });
      }
    }

    const locationData = {
      last_latitude: latitude,
      last_longitude: longitude,
      last_location_update: now,
      last_accuracy: accuracy || null,
      tracking_enabled: true,
    };

    // Save battery info if provided
    if (batteryLevel != null) {
      locationData.battery_level = Math.round(batteryLevel * 100); // Battery API gives 0-1
      locationData.battery_charging = !!batteryCharging;
      locationData.battery_updated_at = now;
      // Reset low_battery_alerted when battery is back above threshold or charging
      if (batteryCharging || batteryLevel > 0.15) {
        locationData.low_battery_alerted = false;
      }
    }

    if (address) locationData.last_address = address;

    if (devices.length === 0) {
      await base44.entities.SharedDevice.create({
        owner_email: user.email,
        device_id: deviceId,
        device_name: safeName,
        device_type: 'phone',
        platform: platform || 'android',
        ...locationData,
      });
    } else {
      const existing = devices[0];
      const updates = { ...locationData };
      if (!existing.device_name || existing.device_name === 'Windows NT 10.0' || existing.device_name === 'My Phone') {
        updates.device_name = safeName;
      }
      await base44.entities.SharedDevice.update(existing.id, updates);
    }

    // Sync to SafetyProfile
    const profiles = await base44.entities.SafetyProfile.filter({ owner_email: user.email });
    if (profiles.length > 0) {
      await base44.entities.SafetyProfile.update(profiles[0].id, {
        device_imei: deviceId,
        device_name: safeName,
        device_platform: platform || profiles[0].device_platform,
      });
    }

    return Response.json({ success: true, address: address || null });
  } catch (error) {
    console.error('Location update error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});