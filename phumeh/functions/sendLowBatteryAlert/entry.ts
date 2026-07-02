import { createClientFromRequest } from "npm:@base44/sdk@0.8.23";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const batteryLevel = body.battery_level ?? 0;

    // Get emergency contacts
    const contacts = await base44.entities.EmergencyContact.filter({
      owner_email: user.email,
    });

    if (!contacts.length) {
      return Response.json({ success: false, reason: "No contacts" });
    }

    const message = `⚠️ Low Battery Alert — ${user.full_name || user.email}'s device battery is critically low at ${batteryLevel}%. They may lose contact soon. Please check on them.`;

    // Notify all contacts with email enabled
    const emailTargets = contacts.filter((c) => c.notify_email && c.email);
    await Promise.all(
      emailTargets.map((c) =>
        base44.integrations.Core.SendEmail({
          to: c.email,
          subject: `⚠️ Low Battery Alert — ${user.full_name || "Your contact"} (${batteryLevel}%)`,
          body: message,
        })
      )
    );

    // Log a status update record as a note-type alert
    await base44.entities.Alert.create({
      owner_email: user.email,
      status: "resolved",
      message: `[Auto] Device battery dropped to ${batteryLevel}%. Silent low-power alert sent to ${emailTargets.length} contact(s).`,
      trigger_method: "auto",
    });

    return Response.json({
      success: true,
      contacts_notified: emailTargets.length,
      battery_level: batteryLevel,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});