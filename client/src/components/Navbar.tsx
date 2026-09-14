import React, { useState, useEffect } from 'react';
import {
  Shield,
  LogOut,
  User as UserIcon,
  QrCode,
  Users,
  Activity,
  CreditCard,
  Building2,
  Sun,
  Moon,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Globe,
  HeartPulse,
  Bell
} from 'lucide-react';
import { IronVaultLogo } from './IronVaultLogo';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenScanner?: () => void;
  onViewPublicSite?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenScanner,
  onViewPublicSite
}) => {
  const { user, logout } = useAuth();
  const { unreadCount, setIsCenterOpen } = useNotifications();
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gym_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gym_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gym_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Keyboard shortcut: Cmd+S for check-in
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (onOpenScanner) onOpenScanner();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenScanner]);

  return (
    <header className="sticky top-0 z-40 bg-[#050507]/90 backdrop-blur-xl border-b border-white/10 transition-colors duration-200 navbar-notch-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand & Gym Tenant Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer select-none">
              <span className="font-['Unbounded',sans-serif] font-black text-xl sm:text-2xl tracking-tight text-white flex items-center">
                FID<span className="text-[#ccff00]">GIT</span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#ccff00] text-black">
                OS
              </span>
            </div>

            {/* Active Tenant Gym Badge */}
            {user?.gym && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0e1015] border border-white/10 text-xs ml-2">
                <Building2 className="w-3.5 h-3.5 text-[#ccff00]" />
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-zinc-200 max-w-[160px] truncate">
                    {user.gym.name}
                  </span>
                  <span className="font-mono text-[10px] font-black bg-[#ccff00] text-black px-1.5 py-0.5 rounded-full">
                    {user.gym.inviteCode}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Clean Commercial Navigation Tabs */}
          {user && (
            <div className="hidden md:flex items-center gap-2.5">
              {/* Navigation Links */}
              <nav className="flex items-center gap-1.5 bg-[#0e1015] p-1.5 rounded-full border border-white/10">
                {user.role === 'SUPER_ADMIN' && (
                  <button
                    onClick={() => setCurrentTab('admin_dashboard')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                      currentTab === 'admin_dashboard'
                        ? 'bg-[#ccff00] text-black font-black shadow-[0_0_15px_rgba(204,255,0,0.25)]'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>⚙️ Admin Dashboard</span>
                  </button>
                )}

                {(user.role === 'MANAGER' || user.role === 'GYM_OWNER' || user.role === 'SUPER_ADMIN') && (
                  <>
                    <button
                      onClick={() => setCurrentTab('manager_dashboard')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                        currentTab === 'manager_dashboard'
                          ? 'bg-[#ccff00] text-black font-black shadow-[0_0_15px_rgba(204,255,0,0.25)]'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Live Attendance
                    </button>
                    <button
                      onClick={() => setCurrentTab('desk_billing')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                        currentTab === 'desk_billing'
                          ? 'bg-[#ccff00] text-black font-black shadow-[0_0_15px_rgba(204,255,0,0.25)]'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Desk Billing
                    </button>
                    <button
                      onClick={() => setCurrentTab('health_intelligence')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                        currentTab === 'health_intelligence'
                          ? 'bg-[#ccff00] text-black font-black shadow-[0_0_15px_rgba(204,255,0,0.25)]'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                      }`}
                    >
                      <HeartPulse className="w-3.5 h-3.5" />
                      Health &amp; Leads
                    </button>
                    <button
                      onClick={() => setCurrentTab('community_feed')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                        currentTab === 'community_feed'
                          ? 'bg-[#ccff00] text-black font-black shadow-[0_0_15px_rgba(204,255,0,0.25)]'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Community Feed
                    </button>
                    <button
                      onClick={() => setCurrentTab('facility_qr')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                        currentTab === 'facility_qr'
                          ? 'bg-[#ccff00] text-black font-black shadow-[0_0_15px_rgba(204,255,0,0.25)]'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      QR Poster
                    </button>
                  </>
                )}

                {user.role === 'MEMBER' && (
                  <>
                    <button
                      onClick={() => setCurrentTab('member_profile')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                        currentTab === 'member_profile'
                          ? 'bg-[#ccff00] text-black font-black shadow-[0_0_15px_rgba(204,255,0,0.25)]'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                      }`}
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      My Membership Card
                    </button>
                    <button
                      onClick={() => setCurrentTab('community_feed')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                        currentTab === 'community_feed'
                          ? 'bg-[#ccff00] text-black font-black shadow-[0_0_15px_rgba(204,255,0,0.25)]'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Community Feed
                    </button>
                  </>
                )}
              </nav>
            </div>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* View Public Website Button */}
            {onViewPublicSite && (
              <button
                onClick={onViewPublicSite}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#0e1015] hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-[#ccff00] transition active:scale-95 cursor-pointer"
                title="View Public Gym Landing Page"
              >
                <Globe className="w-3.5 h-3.5 text-[#ccff00]" />
                <span>Public Site</span>
              </button>
            )}

            {/* Interactive Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-[#0e1015] hover:bg-zinc-800 border border-white/10 text-zinc-300 transition active:scale-95 cursor-pointer"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#ccff00]" />
              ) : (
                <Moon className="w-4 h-4 text-[#ccff00]" />
              )}
            </button>

            {/* Zomato / Swiggy Style Real-Time Notification Bell */}
            <button
              onClick={() => setIsCenterOpen(true)}
              className="relative p-2.5 rounded-full bg-[#0e1015] hover:bg-zinc-800 border border-white/10 text-zinc-300 transition active:scale-95 cursor-pointer"
              title="Real-Time Notifications &amp; Live Activity"
            >
              <Bell className="w-4 h-4 text-[#ccff00]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black shadow-md shadow-rose-500/50 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Member Quick Check-In Button */}
            {user?.role === 'MEMBER' && onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="px-4 py-2 rounded-full bg-[#ccff00] hover:bg-[#b8e600] text-black text-xs font-black flex items-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.25)] transition active:scale-95 cursor-pointer select-none"
              >
                <QrCode className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Check In with QR</span>
                <span className="sm:hidden">Check In</span>
              </button>
            )}

            {/* User Profile Badge */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-white leading-tight">
                    {user.fullName}
                  </p>
                  <span className="text-[10px] font-semibold text-[#ccff00]">
                    {user.role === 'SUPER_ADMIN'
                      ? 'Super Admin'
                      : user.role === 'GYM_OWNER'
                      ? 'Gym Owner'
                      : user.role === 'MANAGER'
                      ? 'Desk Staff'
                      : 'Member'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-900 dark:hover:bg-red-950/40 dark:hover:text-red-400 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 transition active:scale-95"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
