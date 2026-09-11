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
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800 transition-colors duration-200 navbar-notch-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand */}
          {/* Brand & Gym Tenant Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-md dark:shadow-glow-green text-white dark:text-black">
              <Shield className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                IRON<span className="text-emerald-600 dark:text-emerald-400">VAULT</span>
              </span>
              <span className="text-[10px] block font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 -mt-1">
                FITNESS & HEALTH CLUB
              </span>
            </div>

            {/* Active Tenant Gym Badge */}
            {user?.gym && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs ml-2">
                <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800 dark:text-zinc-200 max-w-[160px] truncate">
                    {user.gym.name}
                  </span>
                  <span className="font-mono text-[10px] font-black bg-emerald-500 text-black px-1.5 py-0.5 rounded">
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
              <nav className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
                {user.role === 'SUPER_ADMIN' && (
                  <button
                    onClick={() => setCurrentTab('admin_dashboard')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      currentTab === 'admin_dashboard'
                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black font-black shadow-sm'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>👑 Super Admin Panel</span>
                  </button>
                )}

                {(user.role === 'MANAGER' || user.role === 'GYM_OWNER' || user.role === 'SUPER_ADMIN') && (
                  <>
                    <button
                      onClick={() => setCurrentTab('manager_dashboard')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        currentTab === 'manager_dashboard'
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black font-black shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Live Attendance
                    </button>
                    <button
                      onClick={() => setCurrentTab('desk_billing')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        currentTab === 'desk_billing'
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black font-black shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Desk Billing
                    </button>
                    <button
                      onClick={() => setCurrentTab('health_intelligence')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        currentTab === 'health_intelligence'
                          ? 'bg-amber-500 text-black font-black shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <HeartPulse className="w-3.5 h-3.5 text-amber-500" />
                      Health & Leads
                    </button>
                    <button
                      onClick={() => setCurrentTab('community_feed')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        currentTab === 'community_feed'
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black font-black shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Community Feed
                    </button>
                    <button
                      onClick={() => setCurrentTab('facility_qr')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        currentTab === 'facility_qr'
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black font-black shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800'
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
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        currentTab === 'member_profile'
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black font-black shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      My Membership Card
                    </button>
                    <button
                      onClick={() => setCurrentTab('community_feed')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        currentTab === 'community_feed'
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black font-black shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800'
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
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition active:scale-95"
                title="View Public Gym Landing Page"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>Public Site</span>
              </button>
            )}

            {/* Interactive Theme Switcher: White & Green vs Black & Green */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 transition active:scale-95"
              title={isDark ? 'Switch to Light Mode (White & Green)' : 'Switch to Dark Mode (Black & Green)'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-emerald-400" />
              ) : (
                <Moon className="w-4 h-4 text-emerald-600" />
              )}
            </button>

            {/* Member Quick Check-In Button */}
            {user?.role === 'MEMBER' && onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black text-xs font-black flex items-center gap-2 shadow-sm transition active:scale-95"
              >
                <QrCode className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Check In with QR</span>
                <span className="sm:hidden">Check In</span>
              </button>
            )}

            {/* User Profile Badge */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-zinc-800">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {user.fullName}
                  </p>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
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
