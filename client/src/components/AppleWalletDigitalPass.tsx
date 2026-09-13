import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface AppleWalletDigitalPassProps {
  onOpenScanner?: (mode?: 'ENTER' | 'EXIT') => void;
  onNavigateToTab?: (tab: string) => void;
}

export const AppleWalletDigitalPass: React.FC<AppleWalletDigitalPassProps> = ({
  onOpenScanner,
  onNavigateToTab
}) => {
  const { user } = useAuth();
  const { showNotification, playChime } = useNotifications();

  // 1. Dynamic rotating security countdown (30s anti-clone rotation)
  const [secondsLeft, setSecondsLeft] = useState<number>(42);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 45 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedCountdown = `0:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`;

  // 2. Interactive NFC Tap to Enter Simulation
  const [nfcState, setNfcState] = useState<'IDLE' | 'APPROACHING' | 'GRANTED'>('IDLE');

  const handleNfcTap = () => {
    if (nfcState !== 'IDLE') return;

    // Trigger haptic if available on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 60, 40]);
    }

    setNfcState('APPROACHING');

    setTimeout(() => {
      setNfcState('GRANTED');
      playChime();

      showNotification({
        title: '⚡ Gate 01 Unlocked via Smart Pass',
        message: 'NFC reader confirmed your entry. Turnstile 01 unlocked. Enjoy your session!',
        type: 'gate',
        avatarIcon: 'zap',
        badgeLabel: 'LIVE ACCESS',
        actionText: 'View Session'
      });

      // Reset back to idle after 3.5 seconds
      setTimeout(() => {
        setNfcState('IDLE');
      }, 3500);
    }, 1000);
  };

  // 3. Interactive Locker Unlock Simulation
  const [lockerStatus, setLockerStatus] = useState<'LOCKED' | 'UNLOCKING' | 'OPEN'>('LOCKED');

  const handleLockerToggle = () => {
    if (lockerStatus === 'LOCKED') {
      setLockerStatus('UNLOCKING');
      setTimeout(() => {
        setLockerStatus('OPEN');
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(60);
        }
        showNotification({
          title: '🔓 Smart Locker #42 Unlocked',
          message: 'Locker #42 in Zone B is now unlocked and ready for access.',
          type: 'system',
          avatarIcon: 'bell',
          badgeLabel: 'LOCKER HUB'
        });
      }, 900);
    } else if (lockerStatus === 'OPEN') {
      setLockerStatus('LOCKED');
      showNotification({
        title: '🔒 Locker #42 Secured',
        message: 'Locker has been electronically locked with your pass encryption.',
        type: 'system',
        avatarIcon: 'bell',
        badgeLabel: 'LOCKER HUB'
      });
    }
  };

  // 4. Guest Pass Invite State
  const [guestPassCopied, setGuestPassCopied] = useState<boolean>(false);

  const handleInviteGuest = () => {
    const inviteLink = `${window.location.origin}/?invite=${user?.gym?.inviteCode || 'IRON2026'}`;
    navigator.clipboard?.writeText(inviteLink).catch(() => {});
    setGuestPassCopied(true);
    showNotification({
      title: '🎟️ VIP Guest Pass Generated',
      message: 'Exclusive 1-day pass link copied to clipboard! Share it with your workout partner.',
      type: 'perk',
      avatarIcon: 'cup',
      badgeLabel: 'GUEST PERK'
    });
    setTimeout(() => setGuestPassCopied(false), 3000);
  };

  // Active subscription details
  const activeSub = user?.subscriptions?.[0];
  const isSubActive =
    activeSub &&
    activeSub.status === 'ACTIVE' &&
    new Date(activeSub.endDate) > new Date();

  const memberFirstName = user?.fullName ? user.fullName.split(' ')[0] : 'Alex';
  const gymName = user?.gym?.name || 'IronVault Downtown';

  return (
    <div className="w-full flex flex-col space-y-5 text-[#e0e2ed] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Welcome & Occupancy Status Header */}
      <div className="flex flex-col space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#e0e2ed] tracking-tight">
            Good morning, {memberFirstName} 👋
          </h1>
          <button
            onClick={() => {
              setSecondsLeft(45);
              playChime();
            }}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#272a32] text-[#6dffba] hover:bg-[#363942] transition-colors cursor-pointer shadow-sm active:scale-95"
            title="Refresh vitals & pass token"
          >
            <span className="material-symbols-outlined text-[20px]">sync</span>
          </button>
        </div>

        {/* Live Facility Capacity Pill */}
        <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-[#181b24] border border-[#272a32] shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6dffba] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6dffba]" />
          </span>
          <span className="text-xs text-[#bacbbe]">
            {gymName} <span className="text-[#849589] mx-1">•</span>{' '}
            <strong className="text-[#6dffba] font-semibold">Quiet right now</strong> (24% full)
          </span>
        </div>
      </div>

      {/* Primary Digital Pass (Apple Wallet Style Container) */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#272a32] via-[#1c1f28] to-[#181b24] p-[1px] shadow-2xl">
        <div className="relative w-full rounded-2xl sm:rounded-3xl bg-[#1c1f28]/95 p-5 sm:p-7 flex flex-col items-center backdrop-blur-2xl overflow-hidden">
          {/* Ambient Backlight Glows */}
          <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#6dffba]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-[#18a479]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Card Top Info */}
          <div className="w-full flex items-center justify-between mb-5">
            <div className="flex flex-col text-left">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#bacbbe] font-bold">
                Membership
              </span>
              <span className="text-base sm:text-lg font-bold text-[#e0e2ed] tracking-tight">
                {gymName}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6dffba]/10 border border-[#6dffba]/20 text-[#6dffba]">
              <span
                className="material-symbols-outlined text-[15px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </span>
              <span className="text-xs font-bold">
                {activeSub?.planName || 'All-Access Member'}
              </span>
            </div>
          </div>

          {/* Scannable High-Contrast Vector QR Code Box */}
          <div
            onClick={() => onOpenScanner && onOpenScanner('ENTER')}
            className="relative group cursor-pointer my-2 flex flex-col items-center"
            title="Click to expand full scanner"
          >
            <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-2xl bg-white p-4 shadow-[0_0_35px_rgba(109,255,186,0.22)] flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02] relative overflow-hidden">
              {/* Clean Crisp Vector QR Code Geometry */}
              <svg
                className="w-full h-full text-[#0b0e16]"
                fill="none"
                viewBox="0 0 160 160"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect fill="white" height="160" width="160" />
                {/* Outer Corner Targets */}
                <rect fill="currentColor" height="40" rx="4" width="40" x="12" y="12" />
                <rect fill="white" height="28" rx="2" width="28" x="18" y="18" />
                <rect fill="currentColor" height="16" rx="2" width="16" x="24" y="24" />
                <rect fill="currentColor" height="40" rx="4" width="40" x="108" y="12" />
                <rect fill="white" height="28" rx="2" width="28" x="114" y="18" />
                <rect fill="currentColor" height="16" rx="2" width="16" x="120" y="24" />
                <rect fill="currentColor" height="40" rx="4" width="40" x="12" y="108" />
                <rect fill="white" height="28" rx="2" width="28" x="18" y="114" />
                <rect fill="currentColor" height="16" rx="2" width="16" x="24" y="120" />
                {/* Pattern Blocks */}
                <rect fill="currentColor" height="10" rx="1" width="10" x="60" y="16" />
                <rect fill="currentColor" height="16" rx="1" width="8" x="76" y="16" />
                <rect fill="currentColor" height="8" rx="1" width="8" x="90" y="20" />
                <rect fill="currentColor" height="8" rx="1" width="16" x="64" y="34" />
                <rect fill="currentColor" height="12" rx="1" width="12" x="86" y="34" />
                <rect fill="currentColor" height="14" rx="1" width="8" x="16" y="60" />
                <rect fill="currentColor" height="8" rx="1" width="14" x="30" y="64" />
                <rect fill="currentColor" height="10" rx="1" width="10" x="50" y="60" />
                <rect fill="#00e599" height="18" rx="2" width="18" x="68" y="58" />
                <rect fill="currentColor" height="10" rx="1" width="10" x="94" y="58" />
                <rect fill="currentColor" height="8" rx="1" width="14" x="112" y="62" />
                <rect fill="currentColor" height="12" rx="1" width="12" x="134" y="60" />
                <rect fill="currentColor" height="10" rx="1" width="14" x="20" y="82" />
                <rect fill="currentColor" height="18" rx="1" width="8" x="42" y="78" />
                <rect fill="currentColor" height="8" rx="1" width="14" x="58" y="84" />
                <rect fill="currentColor" height="12" rx="1" width="12" x="80" y="84" />
                <rect fill="currentColor" height="16" rx="1" width="8" x="100" y="78" />
                <rect fill="currentColor" height="14" rx="1" width="14" x="116" y="80" />
                <rect fill="currentColor" height="10" rx="1" width="8" x="138" y="80" />
                <rect fill="currentColor" height="10" rx="1" width="10" x="60" y="104" />
                <rect fill="currentColor" height="8" rx="1" width="16" x="78" y="102" />
                <rect fill="currentColor" height="14" rx="1" width="10" x="102" y="102" />
                <rect fill="currentColor" height="8" rx="1" width="10" x="120" y="102" />
                <rect fill="currentColor" height="18" rx="1" width="8" x="138" y="102" />
                <rect fill="currentColor" height="14" rx="1" width="14" x="64" y="122" />
                <rect fill="currentColor" height="24" rx="1" width="8" x="86" y="120" />
                <rect fill="currentColor" height="10" rx="1" width="18" x="102" y="124" />
                <rect fill="currentColor" height="12" rx="1" width="18" x="128" y="128" />
              </svg>

              {/* Optical Laser Scanline Animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-[#6dffba] shadow-[0_0_12px_#6dffba] animate-[bounce_2.8s_infinite_ease-in-out] opacity-85 pointer-events-none" />
            </div>
          </div>

          {/* Turnstile Scanning Helper */}
          <div className="flex items-center gap-2 mt-4 text-[#bacbbe]">
            <span className="material-symbols-outlined text-[20px] text-[#6dffba]">
              contactless
            </span>
            <span className="text-xs font-medium">
              Hold near turnstile reader or tap below to enter
            </span>
          </div>

          {/* Live Auto-Refresh Micro Badge */}
          <div className="mt-4 w-full flex items-center justify-between bg-[#181b24]/80 border border-[#272a32] rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6dffba] text-[18px]">
                verified_user
              </span>
              <span className="text-xs font-bold text-[#e0e2ed]">Active &amp; verified</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#bacbbe] text-xs font-medium">
              <span>Refreshes in</span>
              <span className="font-mono font-bold text-[#6dffba]">{formattedCountdown}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Instant Haptic Action Button (NFC / Turnstile Tap) */}
      <button
        onClick={handleNfcTap}
        disabled={nfcState !== 'IDLE'}
        className={`w-full py-4 px-6 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-3 shadow-[0_4px_24px_rgba(109,255,186,0.22)] active:scale-[0.98] transition-all cursor-pointer select-none ${
          nfcState === 'GRANTED'
            ? 'bg-emerald-500 text-black ring-4 ring-emerald-400/40'
            : nfcState === 'APPROACHING'
            ? 'bg-[#6dffba]/80 text-[#003822] cursor-wait'
            : 'bg-[#6dffba] hover:bg-[#5ef5af] text-[#003822]'
        }`}
      >
        {nfcState === 'APPROACHING' ? (
          <>
            <span className="material-symbols-outlined text-[24px] animate-spin">
              autorenew
            </span>
            <span>Approaching Reader...</span>
          </>
        ) : nfcState === 'GRANTED' ? (
          <>
            <span className="material-symbols-outlined text-[24px]">check_circle</span>
            <span>Access Granted • Turnstile 01</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[24px]">contactless</span>
            <span>Tap to Enter with Phone (NFC)</span>
          </>
        )}
      </button>

      {/* Essential Quick Utility Cards (2-Column Grid) */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Locker Utility Card */}
        <div className="rounded-2xl bg-[#1c1f28] border border-[#272a32] p-4 flex flex-col justify-between shadow-sm min-w-0">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#272a32] flex items-center justify-center text-[#6dffba]">
              <span className="material-symbols-outlined text-[20px]">
                {lockerStatus === 'OPEN' ? 'lock_open' : 'lock'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#32353d] text-[#bacbbe] text-[10px] font-bold uppercase">
              Zone B
            </span>
          </div>

          <div className="my-3 text-left">
            <span className="text-sm sm:text-base font-bold text-[#e0e2ed] block truncate">
              Locker #42
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  lockerStatus === 'OPEN' ? 'bg-amber-400' : 'bg-[#6dffba]'
                }`}
              />
              <span className="text-xs text-[#bacbbe]">
                {lockerStatus === 'OPEN' ? 'Unlocked' : 'Locked & Secured'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLockerToggle}
            disabled={lockerStatus === 'UNLOCKING'}
            className="w-full py-2 px-3 rounded-full bg-[#272a32] hover:bg-[#363942] active:scale-95 text-[#e0e2ed] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {lockerStatus === 'UNLOCKING' ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">
                  progress_activity
                </span>
                <span>Opening...</span>
              </>
            ) : lockerStatus === 'OPEN' ? (
              <>
                <span className="material-symbols-outlined text-[16px] text-amber-400">
                  lock
                </span>
                <span>Lock Again</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px] text-[#6dffba]">
                  lock_open
                </span>
                <span>Unlock</span>
              </>
            )}
          </button>
        </div>

        {/* Guest Pass Utility Card */}
        <div className="rounded-2xl bg-[#1c1f28] border border-[#272a32] p-4 flex flex-col justify-between shadow-sm min-w-0">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#272a32] flex items-center justify-center text-[#c9e9ff]">
              <span className="material-symbols-outlined text-[20px]">group_add</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#32353d] text-[#bacbbe] text-[10px] font-bold uppercase">
              Monthly
            </span>
          </div>

          <div className="my-3 text-left">
            <span className="text-sm sm:text-base font-bold text-[#e0e2ed] block truncate">
              Guest Pass
            </span>
            <span className="text-xs text-[#bacbbe] mt-0.5 block truncate">
              2 passes left this month
            </span>
          </div>

          <button
            onClick={handleInviteGuest}
            className="w-full py-2 px-3 rounded-full bg-[#272a32] hover:bg-[#363942] active:scale-95 text-[#e0e2ed] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#c9e9ff]">
              {guestPassCopied ? 'check' : 'send'}
            </span>
            <span>{guestPassCopied ? 'Link Copied!' : 'Invite Friend'}</span>
          </button>
        </div>
      </div>

      {/* Activity & Weekly Rhythm Routine */}
      <div className="rounded-2xl bg-[#1c1f28] border border-[#272a32] p-5 flex flex-col space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h2 className="text-sm sm:text-base font-bold text-[#e0e2ed]">
              Weekly Rhythm
            </h2>
            <p className="text-xs text-[#bacbbe]">4 of 5 workouts completed</p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#6dffba]/10 border border-[#6dffba]/20 text-[#6dffba]">
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <span className="text-[11px] font-bold">On Streak</span>
          </div>
        </div>

        {/* 7 Day Bubbles (Mon - Sun) */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          {/* Mon: Done */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-8 h-8 rounded-full bg-[#6dffba] text-[#003822] flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[16px] font-bold">check</span>
            </div>
            <span className="text-[10px] font-bold text-[#bacbbe]">M</span>
          </div>
          {/* Tue: Done */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-8 h-8 rounded-full bg-[#6dffba] text-[#003822] flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[16px] font-bold">check</span>
            </div>
            <span className="text-[10px] font-bold text-[#bacbbe]">T</span>
          </div>
          {/* Wed: Done */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-8 h-8 rounded-full bg-[#6dffba] text-[#003822] flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[16px] font-bold">check</span>
            </div>
            <span className="text-[10px] font-bold text-[#bacbbe]">W</span>
          </div>
          {/* Thu: Done */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-8 h-8 rounded-full bg-[#6dffba] text-[#003822] flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[16px] font-bold">check</span>
            </div>
            <span className="text-[10px] font-bold text-[#bacbbe]">T</span>
          </div>
          {/* Fri: Active Target Today */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-8 h-8 rounded-full bg-[#32353d] text-[#6dffba] border border-[#6dffba]/40 flex items-center justify-center shadow-inner">
              <span className="w-2 h-2 rounded-full bg-[#6dffba] animate-pulse" />
            </div>
            <span className="text-[10px] font-bold text-[#6dffba]">F</span>
          </div>
          {/* Sat */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-8 h-8 rounded-full bg-[#181b24] text-[#849589] border border-[#272a32] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b4a41]" />
            </div>
            <span className="text-[10px] text-[#bacbbe] opacity-60">S</span>
          </div>
          {/* Sun */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-8 h-8 rounded-full bg-[#181b24] text-[#849589] border border-[#272a32] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b4a41]" />
            </div>
            <span className="text-[10px] text-[#bacbbe] opacity-60">S</span>
          </div>
        </div>

        {/* Next Scheduled Session Banner */}
        <div
          onClick={() => onNavigateToTab && onNavigateToTab('community_feed')}
          className="flex items-center gap-3 p-3 rounded-xl bg-[#272a32]/70 hover:bg-[#272a32] transition border border-[#32353d] mt-1 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#32353d] flex items-center justify-center text-[#6dffba] flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">fitness_center</span>
          </div>
          <div className="flex flex-col min-w-0 flex-1 text-left">
            <span className="text-[10px] text-[#6dffba] uppercase tracking-wider font-bold">
              Today • 5:30 PM
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#e0e2ed] truncate">
              Strength &amp; HIIT with Marcus
            </span>
          </div>
          <span className="material-symbols-outlined text-[#bacbbe] text-[20px]">
            chevron_right
          </span>
        </div>
      </div>

      {/* Club Ambient Highlights Right Now */}
      <div className="flex flex-col space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm sm:text-base font-bold text-[#e0e2ed]">
            Club Amenities Right Now
          </span>
          <span
            onClick={() => onNavigateToTab && onNavigateToTab('community_feed')}
            className="text-xs font-bold text-[#6dffba] cursor-pointer hover:underline"
          >
            View All
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Recovery Lounge & Cold Plunge */}
          <div className="relative h-28 rounded-2xl overflow-hidden bg-[#1c1f28] border border-[#272a32] shadow-sm group cursor-pointer">
            <div
              className="bg-cover bg-center absolute inset-0 transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=600&q=80')`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e16] via-[#0b0e16]/60 to-transparent p-3 flex flex-col justify-end text-left">
              <span className="text-xs font-bold text-[#e0e2ed] leading-tight">
                Cold Plunge &amp; Spa
              </span>
              <span className="text-[10px] font-semibold text-[#6dffba]">
                Open • Low wait
              </span>
            </div>
          </div>

          {/* Olympic Lap Pool */}
          <div className="relative h-28 rounded-2xl overflow-hidden bg-[#1c1f28] border border-[#272a32] shadow-sm group cursor-pointer">
            <div
              className="bg-cover bg-center absolute inset-0 transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=600&q=80')`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e16] via-[#0b0e16]/60 to-transparent p-3 flex flex-col justify-end text-left">
              <span className="text-xs font-bold text-[#e0e2ed] leading-tight">
                Olympic Lap Pool
              </span>
              <span className="text-[10px] font-semibold text-[#c9e9ff]">
                3 lanes open
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
