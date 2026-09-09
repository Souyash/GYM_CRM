import React from 'react';
import { MessageSquare, QrCode, Calendar, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenScanner?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenScanner
}) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-zinc-800 px-3 py-2 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {user.role === 'MEMBER' ? (
          <>
            {/* Feed & Community */}
            <button
              onClick={() => setCurrentTab('member_profile')}
              className={`flex flex-col items-center gap-1 p-1.5 transition ${
                currentTab === 'member_profile'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px]">Community</span>
            </button>

            {/* Central Turnstile Check-In Action */}
            <button
              onClick={onOpenScanner}
              className="flex flex-col items-center gap-1 -mt-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition">
                <QrCode className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                Check In
              </span>
            </button>

            {/* Membership Card */}
            <button
              onClick={() => setCurrentTab('member_profile')}
              className={`flex flex-col items-center gap-1 p-1.5 transition ${
                currentTab === 'member_profile'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px]">My Pass</span>
            </button>
          </>
        ) : (
          <>
            {/* Admin / Manager Navigation */}
            <button
              onClick={() => setCurrentTab(user.role === 'SUPER_ADMIN' ? 'admin_dashboard' : 'manager_dashboard')}
              className="flex flex-col items-center gap-1 p-1.5 text-emerald-600 dark:text-emerald-400 font-bold"
            >
              <Shield className="w-5 h-5" />
              <span className="text-[10px]">Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentTab('desk_billing')}
              className="flex flex-col items-center gap-1 p-1.5 text-slate-500 dark:text-zinc-400 font-medium"
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px]">Billing</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

