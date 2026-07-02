import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation when battery_level drops below 15%
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    // Can be called directly with a device_id, or via entity automation payload
    const deviceId = body.device_id || body.event?.entity_id || body.data?.id;

    if (!deviceId) {
      return Response.json({ error: 'Missing device identifier' }, { status: 400 });
    }

    // Fetch fresh device record (prefer data from automation payload, else fetch by id)
    let device = body.data || null;
    if (!device) {
      const results = await base44.asServiceRole.entities.SharedDevice.filter({ device_id: deviceId });
      device = results[0] || null;
    }

    if (!device) {
      return Response.json({ error: 'Device not found' }, { status: 404 });
    }

    const batteryPct = device.battery_level;

    // Guard: only alert when truly low and not already alerted this cycle
    if (batteryPct == null || batteryPct > 15 || device.low_battery_alerted) {
      return Response.json({ success: true, skipped: true });
    }

    // Mark as alerted so we don't spam
    await base44.asServiceRole.entities.SharedDevice.update(device.id, {
      low_battery_alerted: true,
    });

    // Get the owner's emergency contacts
    const contacts = await base44.asServiceRole.entities.EmergencyContact.filter({
      owner_email: device.owner_email,
    });

    const deviceName = device.device_name || 'Device';
    const charging = device.battery_charging ? ' (now charging)' : '';
    const locationPart = device.last_latitude
      ? `\n📍 Last location: https://www.google.com/maps?q=${device.last_latitude},${device.last_longitude}`
      : '';

    const message = `⚠️ Low Battery Alert — ${deviceName} is at ${batteryPct}%${charging}. The tracker may go offline soon.${locationPart}\n\nSent by Panic Ring`;

    // Notify the owner by email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: device.owner_email,
      subject: `⚠️ Low Battery: ${deviceName} is at ${batteryPct}%`,
      body: `Your device <strong>${deviceName}</strong> has a low battery level of <strong>${batteryPct}%</strong>${charging}.<br><br>` +
        (device.last_latitude
          ? `📍 <a href="https://www.google.com/maps?q=${device.last_latitude},${device.last_longitude}">View last known location</a><br><br>`
          : '') +
        `Act now before the tracker goes offline.<br><br><em>Panic Ring Safety System</em>`,
    });

    // Also WhatsApp top priority contacts (up to 2)
    const topContacts = contacts
      .filter(c => c.phone)
      .sort((a, b) => (a.priority || 99) - (b.priority || 99))
      .slice(0, 2);

    const whatsappLinks = topContacts.map(c => ({
      name: c.name,
      url: `https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`,
    }));

    return Response.json({
      success: true,
      alerted: true,
      owner: device.owner_email,
      battery_level: batteryPct,
      whatsapp_links: whatsappLinks,
    });
  } catch (error) {
    console.error('Low battery alert error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});