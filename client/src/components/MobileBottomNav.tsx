import React from 'react';
import { MessageSquare, QrCode, Calendar, User, Shield, HeartPulse, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

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
  const { unreadCount, setIsCenterOpen } = useNotifications();

  if (!user) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#050507]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 bottom-notch-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {user.role === 'MEMBER' ? (
          <>
            {/* Feed & Community */}
            <button
              onClick={() => setCurrentTab('community_feed')}
              className={`flex flex-col items-center gap-1 p-1.5 transition ${
                currentTab === 'community_feed'
                  ? 'text-[#ccff00] font-black'
                  : 'text-zinc-400 hover:text-white'
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
              <div className="w-12 h-12 rounded-full bg-[#ccff00] text-black flex items-center justify-center shadow-[0_0_20px_rgba(204,255,0,0.35)] active:scale-95 transition">
                <QrCode className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-black text-[#ccff00]">
                Check In
              </span>
            </button>

            {/* Membership Card */}
            <button
              onClick={() => setCurrentTab('member_profile')}
              className={`flex flex-col items-center gap-1 p-1.5 transition ${
                currentTab === 'member_profile'
                  ? 'text-[#ccff00] font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px]">My Pass</span>
            </button>

            {/* Zomato Activity & Notifications */}
            <button
              onClick={() => setIsCenterOpen(true)}
              className="relative flex flex-col items-center gap-1 p-1.5 transition text-zinc-400 hover:text-[#ccff00]"
            >
              <div className="relative">
                <Bell className="w-5 h-5 text-[#ccff00]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[8px] font-black animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px]">Alerts</span>
            </button>
          </>
        ) : (
          <>
            {/* Admin / Manager Navigation */}
            <button
              onClick={() => setCurrentTab(user.role === 'SUPER_ADMIN' ? 'admin_dashboard' : 'manager_dashboard')}
              className={`flex flex-col items-center gap-1 p-1.5 transition ${
                currentTab === 'admin_dashboard' || currentTab === 'manager_dashboard'
                  ? 'text-[#ccff00] font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-[10px]">Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentTab('community_feed')}
              className={`flex flex-col items-center gap-1 p-1.5 transition ${
                currentTab === 'community_feed'
                  ? 'text-[#ccff00] font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px]">Community</span>
            </button>
            <button
              onClick={() => setCurrentTab('desk_billing')}
              className={`flex flex-col items-center gap-1 p-1.5 transition ${
                currentTab === 'desk_billing'
                  ? 'text-[#ccff00] font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px]">Billing</span>
            </button>
            <button
              onClick={() => setCurrentTab('health_intelligence')}
              className={`flex flex-col items-center gap-1 p-1.5 transition ${
                currentTab === 'health_intelligence'
                  ? 'text-[#ccff00] font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <HeartPulse className="w-5 h-5" />
              <span className="text-[10px]">Health</span>
            </button>
            <button
              onClick={() => setCurrentTab('facility_qr')}
              className={`flex flex-col items-center gap-1 p-1.5 transition ${
                currentTab === 'facility_qr'
                  ? 'text-[#ccff00] font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span className="text-[10px]">Poster</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

