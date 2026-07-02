import { useState, useEffect } from "react";
import { functions } from "@/api/client";
import { Watch } from "lucide-react";

export default function WatchSupport({ user }) {
  const [watchConnected, setWatchConnected] = useState(false);
  const [watchType, setWatchType] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("wearos")) { setWatchType("wear_os"); setWatchConnected(true); }
    else if (ua.includes("watchos")) { setWatchType("watchos"); setWatchConnected(true); }
  }, []);

  const syncWithWatch = async () => {
    setSyncing(true);
    try {
      await functions.invoke("syncWatchLocation", { watchType });
    } catch (error) {
      console.error("Watch sync error:", error);
    } finally {
      setSyncing(false);
    }
  };

  if (!watchConnected) return null;

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-3">
        <Watch size={20} className="text-blue-400" />
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Smart Watch Connected</p>
          <p className="text-[#666] text-xs capitalize">{watchType?.replace("_", " ")}</p>
        </div>
        <button onClick={syncWithWatch} disabled={syncing}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-full disabled:opacity-50 transition-colors">
          {syncing ? "Syncing..." : "Sync"}
        </button>
      </div>
    </div>
  );
}
