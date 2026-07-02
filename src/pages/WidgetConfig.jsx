/**
 * REQ 17 — Widget Configuration Page
 */
import { Link } from "react-router-dom";
import { AlertTriangle, Phone, Navigation, CheckSquare, Siren } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

const SHORTCUTS = [
  {
    name: "SOS Alert",
    description: "Trigger emergency SOS immediately",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    url: "/",
  },
  {
    name: "Check-in",
    description: "Send a safe check-in to contacts",
    icon: CheckSquare,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    url: "/",
  },
  {
    name: "Fake Call",
    description: "Schedule a fake incoming call",
    icon: Phone,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    url: "/FakeCall",
  },
  {
    name: "Journey",
    description: "Start a Follow Me journey",
    icon: Navigation,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    url: "/Journey",
  },
];

export default function WidgetConfig() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <PageHeader
          title="App Shortcuts"
          subtitle="Available home screen shortcuts"
        />

        <p className="text-[#666] text-sm mb-6">
          Install Panic Ring as a PWA to access these shortcuts from your home screen. Long-press the app icon to see quick actions.
        </p>

        <div className="space-y-3">
          {SHORTCUTS.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.name}
                to={s.url}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-98 ${s.bg}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <Icon size={22} className={s.color} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{s.name}</p>
                  <p className="text-[#666] text-xs">{s.description}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
          <p className="text-[#888] text-xs">
            💡 <strong className="text-white">Tip:</strong> On Android, tap the browser menu → "Add to Home Screen". On iOS, tap Share → "Add to Home Screen".
          </p>
        </div>
      </div>
    </div>
  );
}
