import React, { useEffect, useState } from 'react';
import { useNotifications, NotificationItem } from '../context/NotificationContext';
import {
  Flame,
  Zap,
  Coffee,
  CreditCard,
  Bell,
  X,
  ChevronRight,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';

interface ZomatoLiveBannerProps {
  onNavigateTab?: (tab: string) => void;
  onOpenScanner?: () => void;
}

export const ZomatoLiveBanner: React.FC<ZomatoLiveBannerProps> = ({
  onNavigateTab,
  onOpenScanner
}) => {
  const { activeBanner, dismissBanner, soundEnabled, toggleSound, setIsCenterOpen } = useNotifications();
  const [progress, setProgress] = useState<number>(100);

  // Animated progress bar countdown for 7.5 seconds
  useEffect(() => {
    if (!activeBanner) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const totalMs = 7500;
    const intervalMs = 50;
    const step = (intervalMs / totalMs) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return Math.max(0, prev - step);
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [activeBanner]);

  if (!activeBanner) return null;

  const renderIcon = (type: string, avatarIcon?: string) => {
    switch (avatarIcon || type) {
      case 'flame':
      case 'streak':
        return (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30 shrink-0 relative group">
            <span className="absolute -inset-1 rounded-2xl bg-rose-500/40 blur-sm animate-pulse" />
            <Flame className="w-5 h-5 relative z-10 fill-white" />
          </div>
        );
      case 'zap':
      case 'gate':
        return (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-black shadow-lg shadow-emerald-500/30 shrink-0 relative">
            <span className="absolute -inset-1 rounded-2xl bg-emerald-500/40 blur-sm animate-pulse" />
            <Zap className="w-5 h-5 relative z-10 fill-black stroke-black" />
          </div>
        );
      case 'cup':
      case 'perk':
        return (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 shrink-0 relative">
            <Coffee className="w-5 h-5 relative z-10" />
          </div>
        );
      case 'credit-card':
      case 'billing':
        return (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0 relative">
            <CreditCard className="w-5 h-5 relative z-10" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-zinc-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0 relative">
            <Bell className="w-5 h-5 relative z-10" />
          </div>
        );
    }
  };

  const getBorderGlow = (type: string) => {
    switch (type) {
      case 'streak':
        return 'border-rose-500/50 shadow-[0_12px_40px_rgba(244,63,94,0.25),0_0_25px_rgba(244,63,94,0.15)]';
      case 'gate':
        return 'border-emerald-500/50 shadow-[0_12px_40px_rgba(16,185,129,0.25),0_0_25px_rgba(16,185,129,0.15)]';
      case 'perk':
        return 'border-purple-500/50 shadow-[0_12px_40px_rgba(168,85,247,0.25),0_0_25px_rgba(168,85,247,0.15)]';
      case 'billing':
        return 'border-blue-500/50 shadow-[0_12px_40px_rgba(59,130,246,0.25),0_0_25px_rgba(59,130,246,0.15)]';
      default:
        return 'border-zinc-700 shadow-2xl';
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeBanner.actionTab && onNavigateTab) {
      onNavigateTab(activeBanner.actionTab);
    }
    if (activeBanner.type === 'streak' && onOpenScanner) {
      onOpenScanner();
    }
    dismissBanner();
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[70] w-[94%] max-w-lg transition-all duration-300 transform font-poppins animate-in fade-in slide-in-from-top-4"
    >
      <div
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-950/95 backdrop-blur-2xl border ${getBorderGlow(
          activeBanner.type
        )} p-3.5 sm:p-4 text-white cursor-pointer select-none transition-all duration-200 hover:scale-[1.01]`}
        onClick={() => setIsCenterOpen(true)}
      >
        {/* Top Zomato/Swiggy Live Status Bar */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  activeBanner.type === 'streak'
                    ? 'bg-rose-400'
                    : activeBanner.type === 'gate'
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  activeBanner.type === 'streak'
                    ? 'bg-rose-500'
                    : activeBanner.type === 'gate'
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1">
              {activeBanner.badgeLabel || 'LIVE ACTIVITY'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeBanner.liveTimer && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono">
                {activeBanner.liveTimer}
              </span>
            )}
            <span className="text-[10px] font-mono text-zinc-400">JUST NOW</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSound();
              }}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              title={soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissBanner();
              }}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex items-start gap-3">
          {renderIcon(activeBanner.type, activeBanner.avatarIcon)}

          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs sm:text-sm font-black text-white leading-tight truncate">
              {activeBanner.title}
            </h4>
            <p className="text-[11px] sm:text-xs text-zinc-300 mt-1 line-clamp-2 leading-relaxed">
              {activeBanner.message}
            </p>

            {/* Quick Action Button */}
            {activeBanner.actionText && (
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={handleActionClick}
                  className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-[11px] flex items-center gap-1 shadow-md transition"
                >
                  <span>{activeBanner.actionText}</span>
                  <ChevronRight className="w-3 h-3 stroke-[3]" />
                </button>
                <span className="text-[10px] text-zinc-400 italic">
                  Tap banner to open Notification Center
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Smooth Countdown Timer Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/80">
          <div
            className={`h-full transition-all duration-75 ease-linear ${
              activeBanner.type === 'streak'
                ? 'bg-rose-500'
                : activeBanner.type === 'gate'
                ? 'bg-emerald-400'
                : 'bg-amber-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
