import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Haversine distance in meters between two lat/lng points
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const deviceData = body.data || body;
    const { owner_email, last_latitude, last_longitude, device_id } = deviceData;

    if (!owner_email || last_latitude == null || last_longitude == null) {
      return Response.json({ skipped: true, reason: 'Missing location or owner' });
    }

    const base44 = createClientFromRequest(req);

    // Get user's safe zones
    const safeZones = await base44.asServiceRole.entities.SafeZone.filter({ owner_email });
    if (safeZones.length === 0) {
      return Response.json({ skipped: true, reason: 'No safe zones defined' });
    }

    // Check inside/outside for each zone
    const zonesWithStatus = safeZones.map(zone => {
      if (!zone.latitude || !zone.longitude) return null;
      const dist = distanceMeters(last_latitude, last_longitude, zone.latitude, zone.longitude);
      return { ...zone, inside: dist <= (zone.radius || 200), distance: Math.round(dist) };
    }).filter(Boolean);

    const insideAny = zonesWithStatus.some(z => z.inside);

    // Get device record
    const devices = await base44.asServiceRole.entities.SharedDevice.filter({ owner_email, device_id });
    if (devices.length === 0) return Response.json({ skipped: true, reason: 'Device not found' });

    const device = devices[0];
    const newStatus = insideAny ? 'inside' : 'outside';
    const prevStatus = device.geofence_status || 'unknown';

    // Determine if a transition just occurred
    const exitedZone = !insideAny && prevStatus === 'inside';
    const enteredZone = insideAny && prevStatus === 'outside';
    const shouldAlert = exitedZone || enteredZone;

    // Update device geofence status
    await base44.asServiceRole.entities.SharedDevice.update(device.id, {
      geofence_status: newStatus,
      geofence_alerted: shouldAlert ? true : device.geofence_alerted,
    });

    if (!shouldAlert) {
      return Response.json({ status: newStatus, alerted: false });
    }

    // Fetch contacts and profile
    const contacts = await base44.asServiceRole.entities.EmergencyContact.filter({ owner_email });
    const profiles = await base44.asServiceRole.entities.SafetyProfile.filter({ owner_email });
    const deviceLabel = device.device_name || 'your device';
    const address = device.last_address || `${last_latitude.toFixed(5)}, ${last_longitude.toFixed(5)}`;
    const mapsUrl = `https://www.google.com/maps?q=${last_latitude},${last_longitude}`;
    const timeStr = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });

    const zoneNames = exitedZone
      ? zonesWithStatus.filter(z => !z.inside).map(z => z.name).join(', ')
      : zonesWithStatus.filter(z => z.inside).map(z => z.name).join(', ');

    const eventType = exitedZone ? 'EXITED' : 'ENTERED';
    const emoji = exitedZone ? '⚠️' : '✅';
    const alertMessage = exitedZone
      ? `${emoji} Safe Zone Alert: ${deviceLabel} has LEFT safe zone "${zoneNames}". Location: ${address}`
      : `${emoji} Safe Zone Alert: ${deviceLabel} has ENTERED safe zone "${zoneNames}". Location: ${address}`;

    // Create Alert record
    await base44.asServiceRole.entities.Alert.create({
      owner_email,
      status: exitedZone ? 'active' : 'resolved',
      latitude: last_latitude,
      longitude: last_longitude,
      address,
      message: alertMessage,
      trigger_method: 'auto',
      contacts_notified: contacts.map(c => c.email || c.phone).filter(Boolean),
    });

    // Build WhatsApp message
    const waMsg = encodeURIComponent(
      `${emoji} *GEOFENCE ALERT — ${eventType} SAFE ZONE*\n\n` +
      `📱 Device: ${deviceLabel}\n` +
      `📍 Zone: ${zoneNames}\n` +
      `🗺 Location: ${address}\n` +
      `🔗 Maps: ${mapsUrl}\n` +
      `⏰ Time: ${timeStr}\n\n` +
      `_Sent via Panic Ring Safety System_`
    );

    // Send notifications (email + record WhatsApp links)
    const whatsappLinks = [];
    const notifyPromises = contacts.map(async (c) => {
      if (c.notify_email && c.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: c.email,
          subject: `${emoji} Geofence Alert: ${deviceLabel} has ${eventType} safe zone "${zoneNames}"`,
          body: `Hi ${c.name},\n\nThis is an automated geofence alert from Panic Ring.\n\n${alertMessage}\n\n📍 Google Maps: ${mapsUrl}\n⏰ Time: ${timeStr}\n\nPlease check in with them.\n\n— Panic Ring Safety System`,
        }).catch(() => {});
      }
      if (c.notify_sms && c.phone) {
        const phone = c.phone.replace(/[^0-9]/g, '');
        whatsappLinks.push(`https://wa.me/${phone}?text=${waMsg}`);
      }
    });

    await Promise.allSettled(notifyPromises);

    return Response.json({
      status: newStatus,
      event: eventType,
      alerted: true,
      zones: zoneNames,
      contacts_notified: contacts.length,
      whatsapp_links: whatsappLinks,
    });
  } catch (error) {
    console.error('Geofence check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});