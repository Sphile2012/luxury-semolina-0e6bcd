import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { latitude, longitude, accuracy, watchType } = await req.json();

    const devices = await base44.entities.SharedDevice.filter({
      owner_email: user.email,
      device_type: 'smartwatch',
    });

    if (devices.length === 0) {
      await base44.entities.SharedDevice.create({
        owner_email: user.email,
        device_id: `watch_${user.email}_${Date.now()}`,
        device_name: watchType === 'watchos' ? 'Apple Watch' : 'Wear OS Watch',
        device_type: 'smartwatch',
        platform: watchType || 'wear_os',
        last_latitude: latitude,
        last_longitude: longitude,
        last_location_update: new Date().toISOString(),
        tracking_enabled: true,
      });
    } else {
      await base44.entities.SharedDevice.update(devices[0].id, {
        last_latitude: latitude,
        last_longitude: longitude,
        last_location_update: new Date().toISOString(),
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Watch sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});