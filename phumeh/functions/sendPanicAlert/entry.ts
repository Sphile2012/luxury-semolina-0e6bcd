import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { latitude, longitude, accuracy, message, address, audio_url } = await req.json();

    const contacts = await base44.entities.EmergencyContact.filter(
      { owner_email: user.email },
      'priority'
    );

    if (contacts.length === 0) {
      return Response.json({
        error: 'No emergency contacts found. Please add contacts first.'
      }, { status: 400 });
    }

    const profiles = await base44.entities.SafetyProfile.filter({ owner_email: user.email });
    const profile = profiles[0];
    const alertMessage = profile?.custom_alert_message || message || 'I need help! Please contact me immediately.';

    const alert = await base44.entities.Alert.create({
      owner_email: user.email,
      status: 'active',
      latitude,
      longitude,
      address,
      message: alertMessage,
      trigger_method: 'app_button',
      contacts_notified: contacts.map(c => c.email).filter(Boolean),
      ...(audio_url ? { audio_url } : {})
    });

    const locationUrl = latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : 'Location unavailable';

    const accuracyText = accuracy ? ` (±${Math.round(accuracy)}m accuracy)` : '';
    const addressText = address ? `\n📍 Address: ${address}` : '';
    const audioText = audio_url ? `\n🎙️ Audio Recording: ${audio_url}` : '';

    const whatsappLinks = contacts
      .filter(c => c.phone)
      .map(c => {
        const contactMessage = `🚨 *EMERGENCY ALERT FROM ${user.full_name}*\n\n${alertMessage}\n\n📱 Contact: ${user.email}\n📍 Live Location: ${locationUrl}${accuracyText}${addressText}${audioText}\n⏰ Time: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}\n\nPriority: ${c.priority || 'Normal'}\nRelationship: ${c.relationship || 'Contact'}\n\n*Please respond immediately or call emergency services if needed.*\n\n_Sent via Panic Ring App_`;
        return {
          name: c.name,
          phone: c.phone,
          url: `https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(contactMessage)}`
        };
      });

    // Send emails
    const emailPromises = contacts
      .filter(c => c.email && c.notify_email)
      .map(c => base44.asServiceRole.integrations.Core.SendEmail({
        to: c.email,
        subject: `🚨 EMERGENCY ALERT - ${user.full_name} needs help!`,
        body: `EMERGENCY ALERT FROM ${user.full_name}\n\n${alertMessage}\n\nLocation: ${locationUrl}${accuracyText}${addressText}\nTime: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}${audio_url ? `\n\n🎙️ Emergency Audio Recording:\n${audio_url}` : ''}\n\nPlease respond immediately.\n\n---\nSent via Panic Ring App`
      }).catch(e => console.error('Email error:', e)));

    await Promise.allSettled(emailPromises);

    return Response.json({
      success: true,
      alert_id: alert.id,
      contacts_notified: contacts.length,
      location_url: locationUrl,
      whatsapp_links: whatsappLinks
    });

  } catch (error) {
    console.error('Panic alert error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});