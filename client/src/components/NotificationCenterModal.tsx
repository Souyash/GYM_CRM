import React, { useState } from 'react';
import { useNotifications, NotificationItem } from '../context/NotificationContext';
import {
  Bell,
  X,
  Flame,
  Zap,
  Coffee,
  CreditCard,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronRight,
  Send,
  Smartphone
} from 'lucide-react';

interface NotificationCenterModalProps {
  onNavigateTab?: (tab: string) => void;
  onOpenScanner?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  onNavigateTab,
  onOpenScanner
}) => {
  const {
    notifications,
    unreadCount,
    isCenterOpen,
    setIsCenterOpen,
    markAsRead,
    markAllAsRead,
    clearAll,
    soundEnabled,
    toggleSound,
    pushPermission,
    requestPushPermission,
    simulateNotification
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<'all' | 'streak' | 'gate' | 'perk' | 'billing'>('all');

  if (!isCenterOpen) return null;

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  const streakCount = notifications.filter((n) => n.type === 'streak').length;
  const gateCount = notifications.filter((n) => n.type === 'gate').length;
  const perkCount = notifications.filter((n) => n.type === 'perk').length;
  const billingCount = notifications.filter((n) => n.type === 'billing').length;

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const renderItemIcon = (type: string, avatarIcon?: string) => {
    switch (avatarIcon || type) {
      case 'flame':
      case 'streak':
        return (
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 fill-rose-500" />
          </div>
        );
      case 'zap':
      case 'gate':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 fill-emerald-400" />
          </div>
        );
      case 'cup':
      case 'perk':
        return (
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
        );
      case 'credit-card':
      case 'billing':
        return (
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.actionTab && onNavigateTab) {
      onNavigateTab(item.actionTab);
      setIsCenterOpen(false);
    }
    if (item.type === 'streak' && onOpenScanner) {
      onOpenScanner();
      setIsCenterOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden font-poppins text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Notification Center
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[11px] font-black">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Live Turnstile, Streaks & Gym Perks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'
              }`}
              title={soundEnabled ? 'Chime Sound Enabled (Click to Mute)' : 'Sound Muted (Click to Enable)'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Browser Push Permission Toggle */}
            {pushPermission !== 'granted' && pushPermission !== 'unsupported' && (
              <button
                onClick={requestPushPermission}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-300 transition"
                title="Enable browser system push notifications"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                <span>Enable Push</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={() => setIsCenterOpen(false)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Zomato / Swiggy Interactive Test Bar */}
        <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-rose-500/10 border-b border-slate-200 dark:border-zinc-800/80">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Simulate Real-Time Notification
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
              Plays audio chime & live activity pill
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              onClick={() => simulateNotification('STREAK')}
              className="px-2 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-black flex items-center justify-center gap-1 transition active:scale-95"
            >
              <Flame className="w-3.5 h-3.5 fill-rose-500" />
              <span>🔥 Streak Alert</span>
            </button>

            <button
              onClick={() => simulateNotification('GATE')}
              className="px-2 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-black flex items-center justify-center gap-1 transition active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-emerald-500" />
              <span>⚡ Gate 01 Entry</span>
            </button>

            <button
              onClick={() => simulateNotification('SHAKE')}
              className="px-2 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-[11px] font-black flex items-center justify-center gap-1 transition active:scale-95"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>🥤 Shake Offer</span>
            </button>

            <button
              onClick={() => simulateNotification('RENEWAL')}
              className="px-2 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[11px] font-black flex items-center justify-center gap-1 transition active:scale-95"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>💳 Pass Due</span>
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-5 py-2.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-black'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('streak')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                activeFilter === 'streak'
                  ? 'bg-rose-500 text-white font-black'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
              }`}
            >
              <span>🔥 Streaks</span>
              <span className="text-[10px] opacity-80">({streakCount})</span>
            </button>
            <button
              onClick={() => setActiveFilter('gate')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                activeFilter === 'gate'
                  ? 'bg-emerald-500 text-black font-black'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
              }`}
            >
              <span>⚡ Gate</span>
              <span className="text-[10px] opacity-80">({gateCount})</span>
            </button>
            <button
              onClick={() => setActiveFilter('perk')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                activeFilter === 'perk'
                  ? 'bg-purple-500 text-white font-black'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
              }`}
            >
              <span>🥤 Perks</span>
              <span className="text-[10px] opacity-80">({perkCount})</span>
            </button>
            <button
              onClick={() => setActiveFilter('billing')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                activeFilter === 'billing'
                  ? 'bg-blue-500 text-white font-black'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
              }`}
            >
              <span>💳 Passes</span>
              <span className="text-[10px] opacity-80">({billingCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Read all</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-500 transition"
                title="Clear notification history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-900 p-2 sm:p-3 space-y-1.5 max-h-[55vh]">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-600 mx-auto mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                No notifications in this category
              </h4>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
                Check-ins, streak preservation reminders, and exclusive desk perks will appear right here!
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-3.5 rounded-2xl transition cursor-pointer flex items-start gap-3.5 ${
                  !item.read
                    ? 'bg-slate-50 dark:bg-zinc-900/90 border border-emerald-500/20 shadow-sm'
                    : 'hover:bg-slate-50 dark:hover:bg-zinc-900/40 border border-transparent'
                }`}
              >
                {/* Icon */}
                {renderItemIcon(item.type, item.avatarIcon)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                      {item.badgeLabel || item.type.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>

                  <h5
                    className={`text-xs sm:text-sm font-bold mt-0.5 ${
                      !item.read
                        ? 'text-slate-900 dark:text-white font-black'
                        : 'text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {item.title}
                  </h5>

                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  {item.actionText && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 group">
                        {item.actionText}
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-time delivery & streak engine active</span>
          </div>
          <button
            onClick={() => setIsCenterOpen(false)}
            className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
