import { MapPin } from "lucide-react";

export default function StatusBar({ user, profile, loading, contactCount = 0 }) {
  if (loading) return (
    <div className="mb-6">
      <div className="h-3 w-24 rounded-lg animate-pulse mb-2" style={{ background: "var(--sos-border)" }} />
      <div className="h-8 w-56 rounded-lg animate-pulse" style={{ background: "var(--sos-border)" }} />
    </div>
  );

  const firstName = user?.full_name?.split(" ")[0] || "there";

  return (
    <div className="mb-6 page-enter">
      {/* Greeting */}
      <p className="text-sm font-medium mb-1" style={{ color: "var(--sos-muted)" }}>
        Hello, {firstName}
      </p>

      {/* Big headline — matches image */}
      <h1 className="text-3xl font-black leading-tight mb-1" style={{ color: "var(--sos-text)" }}>
        Emergency Help<br />Needed?
      </h1>
      <p className="text-sm" style={{ color: "var(--sos-muted)" }}>
        Rapid alerts to your emergency contacts
      </p>

      {/* Location pill */}
      <div className="flex items-center gap-1.5 mt-3">
        <MapPin size={13} style={{ color: "var(--sos-coral)" }} />
        <span className="text-xs font-medium" style={{ color: "var(--sos-coral)" }}>
          {profile?.location_sharing ? "GPS Active — location sharing on" : "Location sharing off"}
        </span>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={contactCount > 0
            ? { background: "var(--sos-green-light)", color: "var(--sos-green)" }
            : { background: "var(--sos-coral-pale)", color: "var(--sos-coral-deep)" }
          }
        >
          {contactCount > 0 ? `✓ ${contactCount} contact${contactCount !== 1 ? "s" : ""} ready` : "⚠ No contacts set"}
        </div>
        {profile?.subscription_plan && (
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize"
            style={{ background: "var(--sos-surface2)", color: "var(--sos-muted)", border: "1px solid var(--sos-border)" }}
          >
            {profile.subscription_plan} plan
          </div>
        )}
      </div>
    </div>
  );
}
