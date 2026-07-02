import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const UserNotRegisteredError = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white/[0.03] border border-white/[0.07] rounded-3xl p-8 text-center">
        <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={28} className="text-amber-400" />
        </div>

        <h1 className="text-2xl font-black text-white mb-3">Access Restricted</h1>
        <p className="text-[#888] text-sm leading-relaxed mb-6">
          Your account is not yet registered for Panic Ring. Please contact the administrator to request access, or try a different account.
        </p>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-6 text-left space-y-2">
          <p className="text-[#666] text-xs font-medium uppercase tracking-widest mb-2">What to do:</p>
          <p className="text-[#888] text-xs">• Verify you're using the correct email address</p>
          <p className="text-[#888] text-xs">• Contact the app administrator for access</p>
          <p className="text-[#888] text-xs">• Try signing out and back in again</p>
        </div>

        <button
          onClick={() => logout()}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl transition-colors text-sm"
        >
          Sign Out & Try Again
        </button>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
