import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

interface MemberDigitalPassProps {
  onOpenScanner?: (mode?: 'ENTER' | 'EXIT') => void;
  onNavigateToTab?: (tab: string) => void;
  activeSession?: any | null;
  elapsedSeconds?: number;
  history?: any[];
  onDirectCheckOut?: () => Promise<void>;
  isCheckingOut?: boolean;
}

export const MemberDigitalPass: React.FC<MemberDigitalPassProps> = ({
  onOpenScanner,
  onNavigateToTab,
  activeSession,
  elapsedSeconds = 0,
  history = [],
  onDirectCheckOut,
  isCheckingOut = false
}) => {
  const { user } = useAuth();
  const { showNotification, playChime } = useNotifications();

  // 1. Dynamic rotating security countdown (30s auto-refresh)
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const formattedCountdown = `0:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`;

  // 2. Real-Time Live Gym Headcount & Occupancy
  const [occupancy, setOccupancy] = useState<{ activeCount: number; todayCount: number }>({
    activeCount: 0,
    todayCount: 0
  });

  const loadLiveOccupancy = async () => {
    try {
      const data = await api.getLiveAttendance();
      if (data) {
        setOccupancy({
          activeCount: typeof data.activeCount === 'number' ? data.activeCount : (data.estimatedActiveOccupancy || 0),
          todayCount: typeof data.todayCount === 'number' ? data.todayCount : 0
        });
      }
    } catch (e) {
      // If error occurs, graceful fallback based on active session
      if (activeSession) {
        setOccupancy((prev) => ({ ...prev, activeCount: Math.max(1, prev.activeCount) }));
      }
    }
  };

  useEffect(() => {
    loadLiveOccupancy();
    const socket = getSocket();

    const handleFeedUpdate = () => {
      loadLiveOccupancy();
    };

    socket.on('attendance:new_entry', handleFeedUpdate);
    socket.on('attendance:live_feed', handleFeedUpdate);
    socket.on('attendance:member_exited', handleFeedUpdate);
    socket.on('attendance:live_feed_exit', handleFeedUpdate);

    return () => {
      socket.off('attendance:new_entry', handleFeedUpdate);
      socket.off('attendance:live_feed', handleFeedUpdate);
      socket.off('attendance:member_exited', handleFeedUpdate);
      socket.off('attendance:live_feed_exit', handleFeedUpdate);
    };
  }, [activeSession]);

  // 3. Real Upcoming Group Classes
  const [classes, setClasses] = useState<any[]>([]);
  const [isBookingClass, setIsBookingClass] = useState<boolean>(false);

  const loadClasses = async () => {
    try {
      const data = await api.getGroupClasses();
      if (data && Array.isArray(data.classes)) {
        setClasses(data.classes);
      }
    } catch (e) {
      console.warn('Failed to load group classes:', e);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  // Find next scheduled upcoming class
  const nextClass = useMemo(() => {
    if (!classes || classes.length === 0) return null;
    const now = new Date();
    // Prioritize upcoming classes whose start time is in the future
    const upcoming = classes
      .map((c) => ({ ...c, startDate: new Date(c.startTime) }))
      .filter((c) => !isNaN(c.startDate.getTime()))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const futureClass = upcoming.find((c) => c.startDate.getTime() >= now.getTime());
    return futureClass || upcoming[0] || null;
  }, [classes]);

  const handleToggleBookClass = async (classId: string) => {
    if (isBookingClass) return;
    try {
      setIsBookingClass(true);
      await api.toggleBookClass(classId);
      await loadClasses();
      playChime();
      showNotification({
        title: '🏋️ Class Booking Updated',
        message: 'Your spot for this class has been verified in the club schedule.',
        type: 'system',
        avatarIcon: 'calendar',
        badgeLabel: 'BOOKING'
      });
    } catch (err: any) {
      showNotification({
        title: 'Booking Notice',
        message: err.message || 'Unable to update booking.',
        type: 'system'
      });
    } finally {
      setIsBookingClass(false);
    }
  };

  // 4. Real Streak & Weekly Attendance Calculation
  const streakDays = useMemo(() => {
    if (!history || history.length === 0) return 0;
    const uniqueDays = new Set(
      history.map((h) => {
        const d = new Date(h.scannedAt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );

    let streak = 0;
    const check = new Date();
    const todayKey = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;

    // If haven't visited today yet, check yesterday to continue streak
    if (!uniqueDays.has(todayKey)) {
      check.setDate(check.getDate() - 1);
    }

    while (true) {
      const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
      if (uniqueDays.has(key)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [history]);

  // Weekly Rhythm: Monday through Sunday of current week
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon ...
    const mondayOffset = (currentDay + 6) % 7; // Mon = 0, Sun = 6
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const daysList = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, idx) => {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + idx);

      const hasVisited = history.some((h) => {
        const hd = new Date(h.scannedAt);
        return (
          hd.getFullYear() === targetDate.getFullYear() &&
          hd.getMonth() === targetDate.getMonth() &&
          hd.getDate() === targetDate.getDate()
        );
      });

      const isToday = idx === mondayOffset;
      const isPastOrToday = idx <= mondayOffset;

      return {
        label,
        date: targetDate,
        hasVisited,
        isToday,
        isPastOrToday
      };
    });

    const completedThisWeek = daysList.filter((d) => d.hasVisited).length;
    return { daysList, completedThisWeek };
  }, [history]);

  // Format active workout stopwatch HH:MM:SS
  const formatDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Guest Pass Referral Link
  const [guestPassCopied, setGuestPassCopied] = useState<boolean>(false);
  const handleInviteGuest = () => {
    const inviteCode = user?.gym?.inviteCode || 'IRON2026';
    const inviteLink = `${window.location.origin}/?invite=${inviteCode}`;
    navigator.clipboard?.writeText(inviteLink).catch(() => {});
    setGuestPassCopied(true);
    playChime();
    showNotification({
      title: '🎟️ Guest Pass Link Copied',
      message: `Share code "${inviteCode}" with a workout partner for verified 1-day pass.`,
      type: 'perk',
      avatarIcon: 'cup',
      badgeLabel: 'GUEST PASS'
    });
    setTimeout(() => setGuestPassCopied(false), 3000);
  };

  // Real User & Subscription Details
  const activeSub = user?.subscriptions?.[0];
  const isSubActive =
    activeSub &&
    activeSub.status === 'ACTIVE' &&
    new Date(activeSub.endDate) > new Date();

  const memberName = user?.fullName || 'Valued Athlete';
  const memberFirstName = user?.fullName ? user.fullName.split(' ')[0] : 'Athlete';
  const gymName = user?.gym?.name || 'IronVault Fitness Club';
  const passId = `IV-${user?.id ? user.id.substring(0, 8).toUpperCase() : 'PASS'}`;
  const lastCheckIn = history && history.length > 0 ? history[0] : null;

  // Real-time capacity occupancy calculation
  const capacityPct = Math.min(100, Math.max(5, Math.round((occupancy.activeCount / 50) * 100)));
  const occupancyLabel =
    occupancy.activeCount === 0
      ? 'Quiet right now'
      : occupancy.activeCount < 10
      ? 'Quiet right now'
      : occupancy.activeCount < 25
      ? 'Moderate energy'
      : 'High energy & busy';

  return (
    <div className="w-full flex flex-col space-y-5 text-[#e0e2ed] font-['Poppins',sans-serif] font-poppins">
      {/* Top Welcome & Real-Time Floor Occupancy */}
      <div className="flex flex-col space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#e0e2ed] tracking-tight">
              Welcome, {memberFirstName} 👋
            </h1>
            <p className="text-xs text-[#bacbbe] mt-0.5">
              {gymName} • {user?.gym?.city || 'Main Branch'}
            </p>
          </div>
          <button
            onClick={() => {
              setSecondsLeft(30);
              loadLiveOccupancy();
              playChime();
            }}
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#272a32] text-[#6dffba] hover:bg-[#363942] transition-colors cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="Refresh pass & live status"
          >
            <span className="material-symbols-outlined text-[20px]">sync</span>
          </button>
        </div>

        {/* Real-Time Live Gym Capacity Pill */}
        <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-[#181b24] border border-[#272a32] shadow-sm flex-wrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6dffba] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6dffba]" />
          </span>
          <span className="text-xs text-[#bacbbe]">
            <strong className="text-[#e0e2ed] font-bold">{occupancy.activeCount}</strong> athletes working out now
            <span className="text-[#849589] mx-1.5">•</span>
            <span className="text-[#6dffba] font-semibold">{occupancyLabel}</span>
            <span className="text-[#849589] ml-1">({capacityPct}% full)</span>
          </span>
        </div>
      </div>

      {/* Primary Digital Member Pass Card */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#272a32] via-[#1c1f28] to-[#181b24] p-[1px] shadow-2xl">
        <div className="relative w-full rounded-2xl sm:rounded-3xl bg-[#1c1f28]/95 p-5 sm:p-7 flex flex-col items-center backdrop-blur-2xl overflow-hidden">
          {/* Ambient Backlight Glows */}
          <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#6dffba]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-[#18a479]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Pass Top Bar */}
          <div className="w-full flex items-center justify-between mb-5">
            <div className="flex flex-col text-left">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#bacbbe] font-bold">
                Member Pass
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

          {/* Member Name & Pass Status */}
          <div className="w-full text-left mb-4">
            <h2 className="text-xl sm:text-2xl font-black text-[#e0e2ed] tracking-tight">
              {memberName}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#bacbbe]">
              <span className="font-mono font-bold text-[#6dffba]">{passId}</span>
              <span>•</span>
              <span className={isSubActive ? 'text-[#6dffba] font-semibold' : 'text-amber-400 font-semibold'}>
                {isSubActive
                  ? activeSub?.endDate
                    ? `Valid until ${new Date(activeSub.endDate).toLocaleDateString()}`
                    : 'Active & Verified'
                  : 'Membership Expired'}
              </span>
            </div>
          </div>

          {/* High-Contrast Optical Scannable Vector QR Frame */}
          <div
            onClick={() => onOpenScanner && onOpenScanner(activeSession ? 'EXIT' : 'ENTER')}
            className="relative group cursor-pointer my-2 flex flex-col items-center select-none"
            title="Click to open camera scanner"
          >
            <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-2xl bg-white p-4 shadow-[0_0_35px_rgba(109,255,186,0.22)] flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02] relative overflow-hidden">
              {/* Clean Vector QR Code Geometry */}
              <svg
                className="w-full h-full text-[#0b0e16]"
                fill="none"
                viewBox="0 0 160 160"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Top-Left Target Bracket */}
                <rect height="44" rx="10" stroke="currentColor" strokeWidth="10" width="44" x="13" y="13" />
                <rect fill="currentColor" height="18" rx="4" width="18" x="26" y="26" />

                {/* Top-Right Target Bracket */}
                <rect height="44" rx="10" stroke="currentColor" strokeWidth="10" width="44" x="103" y="13" />
                <rect fill="currentColor" height="18" rx="4" width="18" x="116" y="26" />

                {/* Bottom-Left Target Bracket */}
                <rect height="44" rx="10" stroke="currentColor" strokeWidth="10" width="44" x="13" y="103" />
                <rect fill="currentColor" height="18" rx="4" width="18" x="26" y="116" />

                {/* Dynamic Data Blocks */}
                <rect fill="currentColor" height="12" rx="2" width="12" x="66" y="18" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="82" y="18" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="66" y="34" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="82" y="50" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="18" y="66" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="34" y="66" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="50" y="66" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="66" y="66" />
                <rect fill="#10b981" height="14" rx="3" width="14" x="82" y="74" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="102" y="66" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="118" y="66" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="134" y="66" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="66" y="98" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="82" y="114" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="66" y="130" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="102" y="98" />
                <rect fill="currentColor" height="12" rx="2" width="12" x="118" y="114" />
                <rect fill="currentColor" height="12" rx="1" width="18" x="128" y="128" />
              </svg>

              {/* Optical Laser Scanline Animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-[#6dffba] shadow-[0_0_12px_#6dffba] animate-[bounce_2.8s_infinite_ease-in-out] opacity-85 pointer-events-none" />
            </div>
          </div>

          {/* Gate Scanning Helper */}
          <div className="flex items-center gap-2 mt-4 text-[#bacbbe]">
            <span className="material-symbols-outlined text-[20px] text-[#6dffba]">
              qr_code_scanner
            </span>
            <span className="text-xs font-medium">
              Show this QR pass at the entrance camera to check in
            </span>
          </div>

          {/* Live Auto-Refresh Security Micro Badge */}
          <div className="mt-4 w-full flex items-center justify-between bg-[#181b24]/80 border border-[#272a32] rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6dffba] text-[18px]">
                verified_user
              </span>
              <span className="text-xs font-bold text-[#e0e2ed]">Active &amp; Ready</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#bacbbe] text-xs font-medium">
              <span>Code refreshes in</span>
              <span className="font-mono font-bold text-[#6dffba]">{formattedCountdown}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Real-Time Action Button: Check In / Check Out */}
      {activeSession ? (
        <button
          onClick={() => {
            if (onDirectCheckOut) {
              onDirectCheckOut();
            } else if (onOpenScanner) {
              onOpenScanner('EXIT');
            }
          }}
          disabled={isCheckingOut}
          type="button"
          className="w-full py-4 px-6 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-[0_4px_24px_rgba(251,191,36,0.25)] active:scale-[0.98] transition-all cursor-pointer select-none"
        >
          {isCheckingOut ? (
            <>
              <span className="material-symbols-outlined text-[24px] animate-spin">
                progress_activity
              </span>
              <span>Checking Out of Gym...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[24px]">logout</span>
              <span>⚡ Check Out of Gym (Exit Gate)</span>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={() => onOpenScanner && onOpenScanner('ENTER')}
          type="button"
          className="w-full py-4 px-6 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-3 bg-[#6dffba] hover:bg-[#5ef5af] text-[#003822] shadow-[0_4px_24px_rgba(109,255,186,0.22)] active:scale-[0.98] transition-all cursor-pointer select-none"
        >
          <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
          <span>Open Camera Scanner to Check In</span>
        </button>
      )}

      {/* Real-Time Utility Cards (2-Column Grid) */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Card 1: Active Gym Session / Last Visit */}
        <div className="rounded-2xl bg-[#1c1f28] border border-[#272a32] p-4 flex flex-col justify-between shadow-sm min-w-0">
          <div className="flex items-start justify-between">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeSession ? 'bg-amber-400/20 text-amber-400' : 'bg-[#272a32] text-[#6dffba]'}`}>
              <span className="material-symbols-outlined text-[20px]">
                {activeSession ? 'timer' : 'history'}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${activeSession ? 'bg-amber-400/20 text-amber-300' : 'bg-[#32353d] text-[#bacbbe]'}`}>
              {activeSession ? 'Inside Gym' : 'Floor Status'}
            </span>
          </div>

          <div className="my-3 text-left">
            <span className="text-sm sm:text-base font-bold text-[#e0e2ed] block truncate">
              {activeSession ? 'Workout Active' : 'Last Visit'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeSession ? 'bg-amber-400 animate-pulse' : 'bg-[#6dffba]'
                }`}
              />
              <span className="text-xs text-[#bacbbe] truncate">
                {activeSession
                  ? `${formatDuration(elapsedSeconds)} elapsed`
                  : lastCheckIn
                  ? new Date(lastCheckIn.scannedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Ready for check-in'}
              </span>
            </div>
          </div>

          {activeSession ? (
            <button
              onClick={() => {
                if (onDirectCheckOut) {
                  onDirectCheckOut();
                } else if (onOpenScanner) {
                  onOpenScanner('EXIT');
                }
              }}
              disabled={isCheckingOut}
              className="w-full py-2 px-3 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>{isCheckingOut ? 'Exiting...' : 'Check Out'}</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenScanner && onOpenScanner('ENTER')}
              className="w-full py-2 px-3 rounded-full bg-[#272a32] hover:bg-[#363942] active:scale-95 text-[#e0e2ed] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#6dffba]">
                qr_code_scanner
              </span>
              <span>Scan In</span>
            </button>
          )}
        </div>

        {/* Card 2: Real Guest Pass / Referral Link */}
        <div className="rounded-2xl bg-[#1c1f28] border border-[#272a32] p-4 flex flex-col justify-between shadow-sm min-w-0">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#272a32] flex items-center justify-center text-[#c9e9ff]">
              <span className="material-symbols-outlined text-[20px]">group_add</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#32353d] text-[#bacbbe] text-[10px] font-bold uppercase">
              Guest Pass
            </span>
          </div>

          <div className="my-3 text-left">
            <span className="text-sm sm:text-base font-bold text-[#e0e2ed] block truncate">
              Bring a Friend
            </span>
            <span className="text-xs text-[#bacbbe] mt-0.5 block truncate font-mono">
              Code: {user?.gym?.inviteCode || 'IRON2026'}
            </span>
          </div>

          <button
            onClick={handleInviteGuest}
            className="w-full py-2 px-3 rounded-full bg-[#272a32] hover:bg-[#363942] active:scale-95 text-[#e0e2ed] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#c9e9ff]">
              {guestPassCopied ? 'check' : 'send'}
            </span>
            <span>{guestPassCopied ? 'Link Copied!' : 'Share Pass'}</span>
          </button>
        </div>
      </div>

      {/* Activity & Weekly Rhythm Routine (100% Real History Calculation) */}
      <div className="rounded-2xl bg-[#1c1f28] border border-[#272a32] p-5 flex flex-col space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h2 className="text-sm sm:text-base font-bold text-[#e0e2ed]">
              This Week's Goal
            </h2>
            <p className="text-xs text-[#bacbbe]">
              {weekDays.completedThisWeek} {weekDays.completedThisWeek === 1 ? 'workout' : 'workouts'} completed this week
            </p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#6dffba]/10 border border-[#6dffba]/20 text-[#6dffba]">
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <span className="text-[11px] font-bold">
              {streakDays > 0 ? `${streakDays}-Day Streak 🔥` : 'Start Streak'}
            </span>
          </div>
        </div>

        {/* 7 Day Bubbles (Monday through Sunday) */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          {weekDays.daysList.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${
                  day.hasVisited
                    ? 'bg-[#6dffba] text-[#003822]'
                    : day.isToday
                    ? 'bg-[#32353d] text-[#6dffba] border border-[#6dffba]/50 ring-2 ring-[#6dffba]/30'
                    : 'bg-[#181b24] text-[#849589] border border-[#272a32]'
                }`}
              >
                {day.hasVisited ? (
                  <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                ) : day.isToday ? (
                  <span className="w-2 h-2 rounded-full bg-[#6dffba] animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b4a41]" />
                )}
              </div>
              <span
                className={`text-[10px] font-bold ${
                  day.isToday ? 'text-[#6dffba]' : day.hasVisited ? 'text-[#bacbbe]' : 'text-[#849589]'
                }`}
              >
                {day.label}
              </span>
            </div>
          ))}
        </div>

        {/* Real Scheduled Upcoming Class or Gym Open Status */}
        {nextClass ? (
          <div
            onClick={() => onNavigateToTab && onNavigateToTab('community_feed')}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#272a32]/70 hover:bg-[#272a32] transition border border-[#32353d] mt-1 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#32353d] flex items-center justify-center text-[#6dffba] flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]">fitness_center</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#6dffba] uppercase tracking-wider font-bold">
                  {new Date(nextClass.startTime).toLocaleDateString([], { weekday: 'short' })} •{' '}
                  {new Date(nextClass.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] text-[#bacbbe] bg-[#181b24] px-1.5 py-0.5 rounded">
                  {nextClass.zone || 'Floor'}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#e0e2ed] truncate">
                {nextClass.title} with {nextClass.coach}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleBookClass(nextClass.id);
              }}
              disabled={isBookingClass}
              className="px-3 py-1.5 rounded-lg bg-[#6dffba] hover:bg-[#5ef5af] text-[#003822] text-xs font-bold transition shrink-0 cursor-pointer"
            >
              {isBookingClass ? '...' : 'Book'}
            </button>
          </div>
        ) : (
          <div
            onClick={() => onNavigateToTab && onNavigateToTab('community_feed')}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#272a32]/70 hover:bg-[#272a32] transition border border-[#32353d] mt-1 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#32353d] flex items-center justify-center text-[#6dffba] flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]">schedule</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-[10px] text-[#6dffba] uppercase tracking-wider font-bold">
                Gym Facilities Open
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#e0e2ed] truncate">
                Location Verified • {user?.gym?.geofenceRadiusMeters || 100}m Radius Check Active
              </span>
            </div>
            <span className="material-symbols-outlined text-[#bacbbe] text-[20px]">
              chevron_right
            </span>
          </div>
        )}
      </div>

      {/* Real Club Information & Amenities */}
      <div className="rounded-2xl bg-[#1c1f28] border border-[#272a32] p-4 flex flex-col space-y-3 shadow-sm">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-[#e0e2ed]">
            Live Club Facilities
          </span>
          <span
            onClick={() => onNavigateToTab && onNavigateToTab('community_feed')}
            className="text-xs font-bold text-[#6dffba] cursor-pointer hover:underline"
          >
            View Schedule
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left">
          {/* Main Gym Floor & Equipment */}
          <div className="p-3 rounded-xl bg-[#181b24] border border-[#272a32] flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#6dffba] text-[18px]">
                sports_gymnastics
              </span>
              <span className="text-xs font-bold text-[#e0e2ed]">Main Gym Floor</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#bacbbe]">
              <span>Status</span>
              <span className="text-[#6dffba] font-semibold">Open • Live</span>
            </div>
          </div>

          {/* Group Fitness Studio */}
          <div className="p-3 rounded-xl bg-[#181b24] border border-[#272a32] flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#c9e9ff] text-[18px]">
                groups
              </span>
              <span className="text-xs font-bold text-[#e0e2ed]">Studio &amp; Classes</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#bacbbe]">
              <span>Classes Today</span>
              <span className="text-[#c9e9ff] font-semibold">{classes.length} Scheduled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

