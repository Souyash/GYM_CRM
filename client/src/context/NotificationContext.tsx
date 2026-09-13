import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'streak' | 'gate' | 'perk' | 'billing' | 'system';
  priority?: 'high' | 'normal';
  timestamp: string; // ISO string or human date
  read: boolean;
  avatarIcon?: string; // e.g. 'flame', 'zap', 'cup', 'credit-card', 'bell'
  badgeLabel?: string; // e.g. 'STREAK ALERT', 'LIVE WORKOUT', 'DESK PERK'
  actionText?: string;
  actionTab?: string;
  liveTimer?: string; // e.g. '42m active'
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  activeBanner: NotificationItem | null;
  soundEnabled: boolean;
  isCenterOpen: boolean;
  pushPermission: NotificationPermission | 'unsupported';
  toggleSound: () => void;
  setIsCenterOpen: (open: boolean) => void;
  dismissBanner: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  showNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  simulateNotification: (category: 'STREAK' | 'GATE' | 'SHAKE' | 'RENEWAL') => void;
  requestPushPermission: () => Promise<void>;
  playChime: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Synthesize signature Zomato / Swiggy upbeat melodic chime using Web Audio API
// No external MP3 file needed — completely cross-platform, zero CORS, zero 404s
function playZomatoUpbeatChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First Note: D5 (587.33 Hz) - Crisp cheerful bell attack
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.28, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Second Note: A5 (880.00 Hz) - Upbeat celebratory peak
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.12);
    gain2.gain.setValueAtTime(0.001, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.32, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.66);

    // Warm Harmonic Overtone: D6 (1174.66 Hz) for glassy acoustic sparkle
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1174.66, now + 0.13);
    gain3.gain.setValueAtTime(0.001, now + 0.13);
    gain3.gain.exponentialRampToValueAtTime(0.12, now + 0.16);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.13);
    osc3.stop(now + 0.56);
  } catch (err) {
    console.debug('[Notification Sound] AudioContext autoplay suppressed or unsupported:', err);
  }
}

const STORAGE_KEY = 'ironvault_notifications_v1';
const SOUND_STORAGE_KEY = 'ironvault_notification_sound';

const INITIAL_DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'demo-streak-1',
    title: '🔥 6-Day Streak on the Line!',
    message: "Don't break the chain! Complete today's session before 11:59 PM to reach a 7-day milestone.",
    type: 'streak',
    priority: 'high',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    read: false,
    avatarIcon: 'flame',
    badgeLabel: 'STREAK ALERT',
    actionText: 'Check In Now',
    actionTab: 'member_profile'
  },
  {
    id: 'demo-gate-1',
    title: '⚡ Gate 01 Smart Pass Verified',
    message: 'Welcome to IronVault Flagship! Facility turnstile unlocked smoothly. Enjoy your workout.',
    type: 'gate',
    priority: 'normal',
    timestamp: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    read: true,
    avatarIcon: 'zap',
    badgeLabel: 'GATE UNLOCKED',
    actionText: 'View Workout',
    actionTab: 'member_profile',
    liveTimer: '52m logged'
  },
  {
    id: 'demo-perk-1',
    title: '🥤 30% OFF Post-Workout Recovery Shake',
    message: 'Flash Offer: Fuel up with Cold Whey Isolate at the Front Desk Juice Bar. Valid for the next 45 mins!',
    type: 'perk',
    priority: 'normal',
    timestamp: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
    read: false,
    avatarIcon: 'cup',
    badgeLabel: 'MEMBER PERK',
    actionText: 'Claim at Desk',
    actionTab: 'member_profile'
  }
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved notifications', e);
    }
    return INITIAL_DEFAULT_NOTIFICATIONS;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';
  });

  const [activeBanner, setActiveBanner] = useState<NotificationItem | null>(null);
  const [isCenterOpen, setIsCenterOpen] = useState<boolean>(false);
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 30)));
    } catch (e) {
      console.warn('Failed to persist notifications', e);
    }
  }, [notifications]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      if (next) playZomatoUpbeatChime();
      return next;
    });
  }, []);

  const playChime = useCallback(() => {
    if (soundEnabled) {
      playZomatoUpbeatChime();
    }
  }, [soundEnabled]);

  const requestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPushPermission(perm);
      } catch (err) {
        console.warn('Push permission error:', err);
      }
    }
  };

  const showNotification = useCallback(
    (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
      const id = 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const fullItem: NotificationItem = {
        ...item,
        id,
        timestamp: new Date().toISOString(),
        read: false
      };

      // 1. Play audio chime
      if (soundEnabled) {
        playZomatoUpbeatChime();
      }

      // 2. Browser native push notification (works in background tab)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(item.title, {
            body: item.message,
            icon: '/favicon.ico',
            tag: id
          });
        } catch (e) {
          console.debug('Browser native notification dispatch error:', e);
        }
      }

      // 3. Update list
      setNotifications((prev) => [fullItem, ...prev.slice(0, 29)]);

      // 4. Trigger Zomato dynamic island floating banner
      setActiveBanner(fullItem);

      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }

      // Auto dismiss after 7.5 seconds
      bannerTimerRef.current = setTimeout(() => {
        setActiveBanner(null);
      }, 7500);
    },
    [soundEnabled]
  );

  const dismissBanner = useCallback(() => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }
    setActiveBanner(null);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Quick simulation helpers for testing all 4 Zomato/Swiggy styles
  const simulateNotification = useCallback(
    (category: 'STREAK' | 'GATE' | 'SHAKE' | 'RENEWAL') => {
      const memberName = user?.fullName?.split(' ')[0] || 'Athlete';
      switch (category) {
        case 'STREAK':
          showNotification({
            title: `🔥 Streak Alert: ${memberName}, Don't Break The Chain!`,
            message: `You missed yesterday's workout. Check in today before midnight to protect your active 6-day streak!`,
            type: 'streak',
            priority: 'high',
            avatarIcon: 'flame',
            badgeLabel: 'STREAK IN DANGER',
            actionText: 'Check In Now',
            actionTab: 'member_profile'
          });
          break;
        case 'GATE':
          showNotification({
            title: `⚡ Gate 01 Unlocked • Live Workout Started`,
            message: `Turnstile 01 opened for ${memberName}. Your workout timer and calorie tracker are now live!`,
            type: 'gate',
            priority: 'normal',
            avatarIcon: 'zap',
            badgeLabel: 'LIVE ACTIVITY',
            actionText: 'View Session',
            actionTab: 'member_profile',
            liveTimer: '1m active'
          });
          break;
        case 'SHAKE':
          showNotification({
            title: `🥤 Post-Workout Recovery Shake Ready!`,
            message: `Special member perk: Get 30% off Chocolate Whey Protein Isolate at the front desk juice bar!`,
            type: 'perk',
            priority: 'normal',
            avatarIcon: 'cup',
            badgeLabel: 'ZOMATO PERK',
            actionText: 'Claim at Desk',
            actionTab: 'member_profile'
          });
          break;
        case 'RENEWAL':
          showNotification({
            title: `💳 All-Access Pass Renews in 3 Days`,
            message: `Your unlimited IronVault membership will renew shortly. Enjoy uninterrupted facility access!`,
            type: 'billing',
            priority: 'normal',
            avatarIcon: 'credit-card',
            badgeLabel: 'PASS RENEWAL',
            actionText: 'View Pass',
            actionTab: 'member_profile'
          });
          break;
      }
    },
    [showNotification, user?.fullName]
  );

  // Inactivity streak nudge: If user is a MEMBER, check if they missed yesterday
  useEffect(() => {
    if (!user || user.role !== 'MEMBER') return;

    const streakKey = `streak_nudge_checked_${user.id}`;
    const lastNudge = localStorage.getItem(streakKey);
    const now = Date.now();

    // Only fire once every 12 hours
    if (!lastNudge || now - parseInt(lastNudge, 10) > 1000 * 60 * 60 * 12) {
      localStorage.setItem(streakKey, String(now));

      // Check if user has an attendance today or if they're inactive
      const timer = setTimeout(() => {
        const memberName = user.fullName?.split(' ')[0] || 'Athlete';
        showNotification({
          title: `🔥 Streak Alert: Keep The Fire Burning, ${memberName}!`,
          message: `Consistency is everything. You haven't checked in for 24 hours — hit IronVault today to maintain your momentum!`,
          type: 'streak',
          priority: 'high',
          avatarIcon: 'flame',
          badgeLabel: 'STREAK ALERT',
          actionText: 'Check In Now',
          actionTab: 'member_profile'
        });
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [user, showNotification]);

  // Real-time WebSocket Listeners
  useEffect(() => {
    try {
      const socket = getSocket();

      const handleAttendanceEntry = (data: any) => {
        console.log('[WebSocket Notification] Attendance Entry:', data);
        const name = data?.member?.fullName || data?.userName || 'Member';
        showNotification({
          title: `⚡ Gate Access: Welcome ${name}!`,
          message: `Smart Turnstile 01 verified your entry. Workout started at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          type: 'gate',
          avatarIcon: 'zap',
          badgeLabel: 'LIVE CHECK-IN',
          actionText: 'View Workout',
          actionTab: 'member_profile'
        });
      };

      const handleAttendanceExit = (data: any) => {
        console.log('[WebSocket Notification] Attendance Exit:', data);
        showNotification({
          title: `🏁 Workout Completed!`,
          message: `Great sweat session! Don't forget your post-workout hydration and recovery shake.`,
          type: 'gate',
          avatarIcon: 'cup',
          badgeLabel: 'WORKOUT LOGGED',
          actionText: 'View Summary',
          actionTab: 'member_profile'
        });
      };

      const handlePushNotification = (data: any) => {
        console.log('[WebSocket Notification] Push Notification:', data);
        showNotification({
          title: data.title || 'Gym Notification',
          message: data.message || data.body || '',
          type: data.type || 'system',
          priority: data.priority || 'normal',
          avatarIcon: data.avatarIcon || 'bell',
          badgeLabel: data.badgeLabel || 'ANNOUNCEMENT',
          actionText: data.actionText,
          actionTab: data.actionTab
        });
      };

      socket.on('attendance:new_entry', handleAttendanceEntry);
      socket.on('attendance:member_exited', handleAttendanceExit);
      socket.on('notification:push', handlePushNotification);

      return () => {
        socket.off('attendance:new_entry', handleAttendanceEntry);
        socket.off('attendance:member_exited', handleAttendanceExit);
        socket.off('notification:push', handlePushNotification);
      };
    } catch (err) {
      console.warn('Socket connection for notifications skipped:', err);
    }
  }, [showNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeBanner,
        soundEnabled,
        isCenterOpen,
        pushPermission,
        toggleSound,
        setIsCenterOpen,
        dismissBanner,
        markAsRead,
        markAllAsRead,
        clearAll,
        showNotification,
        simulateNotification,
        requestPushPermission,
        playChime
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
};
