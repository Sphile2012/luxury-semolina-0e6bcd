import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { imei, email, phone } = await req.json();

    if (!imei && !email && !phone) {
      return Response.json({ success: false, error: 'Please provide at least a Device ID, email, or phone number.' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    let deviceMap = new Map(); // keyed by device_id to deduplicate

    // Helper to add devices, keeping the most recently updated per device_id
    const addDevices = (found) => {
      for (const d of found) {
        const key = d.device_id || d.id;
        const existing = deviceMap.get(key);
        const dTime = new Date(d.last_location_update || d.updated_date || 0).getTime();
        const eTime = existing ? new Date(existing.last_location_update || existing.updated_date || 0).getTime() : -1;
        if (!existing || dTime > eTime) {
          deviceMap.set(key, d);
        }
      }
    };

    // Search by IMEI/device_id
    if (imei) {
      const found = await base44.asServiceRole.entities.SharedDevice.filter({ device_id: imei.trim() });
      addDevices(found);
    }

    // Search by email (exact match)
    if (email) {
      const found = await base44.asServiceRole.entities.SharedDevice.filter({ owner_email: email.trim().toLowerCase() });
      addDevices(found);
    }

    // Search by phone: match owner_phone on SafetyProfile
    if (phone) {
      const normalizedPhone = phone.replace(/[^0-9]/g, '');
      const allProfiles = await base44.asServiceRole.entities.SafetyProfile.list();
      const matchedProfiles = allProfiles.filter(p => {
        const stored = (p.owner_phone || '').replace(/[^0-9]/g, '');
        return stored && stored === normalizedPhone;
      });
      for (const p of matchedProfiles) {
        const found = await base44.asServiceRole.entities.SharedDevice.filter({ owner_email: p.owner_email });
        addDevices(found);
      }
    }

    // SafetyProfile fallback — covers cases where SharedDevice doesn't exist or for IMEI/email hits
    let profileResults = [];
    if (imei) {
      const found = await base44.asServiceRole.entities.SafetyProfile.filter({ device_imei: imei.trim() });
      profileResults.push(...found);
    }
    if (email) {
      const found = await base44.asServiceRole.entities.SafetyProfile.filter({ owner_email: email.trim().toLowerCase() });
      profileResults.push(...found);
    }

    for (const p of profileResults) {
      // Only add as fallback if no SharedDevice found for this owner
      const hasDevice = [...deviceMap.values()].find(d => d.owner_email === p.owner_email);
      if (!hasDevice && p.device_imei) {
        deviceMap.set(p.device_imei, {
          id: p.id,
          device_name: p.device_name || 'Registered Device',
          device_type: 'phone',
          platform: p.device_platform || 'android',
          owner_email: p.owner_email,
          device_id: p.device_imei,
          is_lost: false,
          tracking_enabled: false,
          last_latitude: null,
          last_longitude: null,
          last_location_update: null,
          _from_profile: true,
        });
      }
    }

    const devices = [...deviceMap.values()];

    // Filter out stale test/placeholder device_ids
    const cleanDevices = devices.filter(d =>
      d.device_id &&
      !d.device_id.startsWith('preview') &&
      d.device_id !== 'test-device-123'
    );

    // Enrich with owner_phone from SafetyProfile
    const ownerEmails = [...new Set(cleanDevices.map(d => d.owner_email).filter(Boolean))];
    const phoneMap = {};
    for (const ownerEmail of ownerEmails) {
      const profiles = await base44.asServiceRole.entities.SafetyProfile.filter({ owner_email: ownerEmail });
      if (profiles[0]?.owner_phone) phoneMap[ownerEmail] = profiles[0].owner_phone;
    }
    cleanDevices.forEach(d => { if (phoneMap[d.owner_email]) d.owner_phone = phoneMap[d.owner_email]; });

    if (cleanDevices.length === 0) {
      return Response.json({
        success: false,
        error: 'No device found. Please check your details and try again.',
      });
    }

    // Sort: devices with location first, then by last updated
    cleanDevices.sort((a, b) => {
      const aHasLoc = a.last_latitude != null ? 1 : 0;
      const bHasLoc = b.last_latitude != null ? 1 : 0;
      if (bHasLoc !== aHasLoc) return bHasLoc - aHasLoc;
      return new Date(b.last_location_update || 0) - new Date(a.last_location_update || 0);
    });

    return Response.json({ success: true, devices: cleanDevices });
  } catch (error) {
    console.error('Find My Phone error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});