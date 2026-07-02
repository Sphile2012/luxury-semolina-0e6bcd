import { Watch as WatchIcon } from "lucide-react";
import WatchDashboard from "@/components/smartwatch/WatchDashboard";
import FallDetection from "@/components/smartwatch/FallDetection";
import { useAuth } from "@/lib/AuthContext";

export default function WatchPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <WatchIcon size={20} className="text-blue-400" />
            </div>
          <div>
            <h1 className="text-2xl font-bold">Smartwatch</h1>
            <p className="text-[#555] text-sm">Live health monitoring & fall detection</p>
          </div>
        </div>

        <WatchDashboard user={user} />
      </div>
    </div>
  );
}