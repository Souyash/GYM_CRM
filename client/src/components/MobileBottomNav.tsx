import React, { useState, useEffect } from 'react';
import {
  Home,
  BarChart2,
  Plus,
  Trophy,
  User,
  Shield,
  Calendar,
  HeartPulse,
  QrCode,
  Bell,
  MessageSquare
} from 'lucide-react';
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
  const [memberSubpart, setMemberSubpart] = useState<string>('HOME');

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail) setMemberSubpart(e.detail);
    };
    window.addEventListener('member-subpart-change', handler);
    return () => window.removeEventListener('member-subpart-change', handler);
  }, []);

  if (!user) return null;

  const handleMemberNav = (targetSubpart: 'HOME' | 'FITNESS' | 'PASS' | 'COMMUNITY') => {
    if (targetSubpart === 'COMMUNITY') {
      setCurrentTab('community_feed');
      setMemberSubpart('COMMUNITY');
    } else {
      setCurrentTab('member_profile');
      setMemberSubpart(targetSubpart);
      window.dispatchEvent(new CustomEvent('member-subpart-change', { detail: targetSubpart }));
    }
  };

  return (
    <div className="md:hidden fixed bottom-3 left-4 right-4 z-40 max-w-md mx-auto">
      <div className="snapset-dock rounded-full px-4 py-2 flex items-center justify-around">
        {user.role === 'MEMBER' ? (
          <>
            {/* 1. Home Tab (Screen 1 Inspo) */}
            <button
              type="button"
              onClick={() => handleMemberNav('HOME')}
              className={`flex flex-col items-center gap-0.5 p-1 transition cursor-pointer ${
                currentTab === 'member_profile' && memberSubpart === 'HOME'
                  ? 'text-white font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition ${
                  currentTab === 'member_profile' && memberSubpart === 'HOME'
                    ? 'bg-white/15 text-[#ccff00]'
                    : ''
                }`}
              >
                <Home className="w-4 h-4" />
              </div>
              <span className="text-[10px] tracking-tight">Home</span>
            </button>

            {/* 2. Progress / Lifts Tab (Screen 3 Inspo) */}
            <button
              type="button"
              onClick={() => handleMemberNav('FITNESS')}
              className={`flex flex-col items-center gap-0.5 p-1 transition cursor-pointer ${
                currentTab === 'member_profile' && memberSubpart === 'FITNESS'
                  ? 'text-white font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition ${
                  currentTab === 'member_profile' && memberSubpart === 'FITNESS'
                    ? 'bg-white/15 text-[#ccff00]'
                    : ''
                }`}
              >
                <BarChart2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] tracking-tight">Progress</span>
            </button>

            {/* 3. Center Elevated Action Pod (+) */}
            <button
              type="button"
              onClick={onOpenScanner}
              className="relative -mt-6 flex flex-col items-center cursor-pointer group"
              title="Quick Turnstile QR Check-In"
            >
              <div className="w-12 h-12 rounded-full bg-[#181C28] border-2 border-[#ccff00] text-[#ccff00] group-hover:bg-[#ccff00] group-hover:text-black flex items-center justify-center shadow-[0_0_22px_rgba(204,255,0,0.35)] active:scale-95 transition-all duration-200">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[9px] font-black text-[#ccff00] tracking-wider uppercase mt-1">
                Scan
              </span>
            </button>

            {/* 4. Rank / Community Tab */}
            <button
              type="button"
              onClick={() => handleMemberNav('COMMUNITY')}
              className={`flex flex-col items-center gap-0.5 p-1 transition cursor-pointer ${
                currentTab === 'community_feed'
                  ? 'text-white font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition ${
                  currentTab === 'community_feed' ? 'bg-white/15 text-[#ccff00]' : ''
                }`}
              >
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-[10px] tracking-tight">Rank</span>
            </button>

            {/* 5. Profile / Pass Tab */}
            <button
              type="button"
              onClick={() => handleMemberNav('PASS')}
              className={`flex flex-col items-center gap-0.5 p-1 transition cursor-pointer ${
                currentTab === 'member_profile' && memberSubpart === 'PASS'
                  ? 'text-white font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition ${
                  currentTab === 'member_profile' && memberSubpart === 'PASS'
                    ? 'bg-white/15 text-[#ccff00]'
                    : ''
                }`}
              >
                <User className="w-4 h-4" />
              </div>
              <span className="text-[10px] tracking-tight">Profile</span>
            </button>
          </>
        ) : (
          /* Staff & Manager Navigation with the same sleek floating dock */
          <>
            <button
              type="button"
              onClick={() =>
                setCurrentTab(user.role === 'SUPER_ADMIN' ? 'admin_dashboard' : 'manager_dashboard')
              }
              className={`flex flex-col items-center gap-0.5 p-1 transition ${
                currentTab === 'admin_dashboard' || currentTab === 'manager_dashboard'
                  ? 'text-[#ccff00] font-bold'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="text-[10px]">Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('community_feed')}
              className={`flex flex-col items-center gap-0.5 p-1 transition ${
                currentTab === 'community_feed' ? 'text-[#ccff00] font-bold' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-[10px]">Feed</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('desk_billing')}
              className={`flex flex-col items-center gap-0.5 p-1 transition ${
                currentTab === 'desk_billing' ? 'text-[#ccff00] font-bold' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-[10px]">Billing</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('health_intelligence')}
              className={`flex flex-col items-center gap-0.5 p-1 transition ${
                currentTab === 'health_intelligence' ? 'text-[#ccff00] font-bold' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <HeartPulse className="w-4 h-4" />
              <span className="text-[10px]">Health</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('facility_qr')}
              className={`flex flex-col items-center gap-0.5 p-1 transition ${
                currentTab === 'facility_qr' ? 'text-[#ccff00] font-bold' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span className="text-[10px]">Poster</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
