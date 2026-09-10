import React, { useState, useEffect } from 'react';
import {
  QrCode,
  ShieldCheck,
  Calendar,
  Clock,
  AlertTriangle,
  History,
  CheckCircle2,
  Sparkles,
  Flame,
  User,
  Zap,
  CreditCard,
  ChevronRight,
  TrendingUp,
  MapPin,
  LogOut,
  LogIn,
  Activity,
  Timer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { QuickActionBar } from '../components/QuickActionBar';
import { CommunityFeed } from '../components/CommunityFeed';
import { WorkoutLogModal } from '../components/WorkoutLogModal';
import { WorkoutDepartureModal } from '../components/WorkoutDepartureModal';

interface MemberProfileProps {
  onOpenScanner: (mode?: 'ENTER' | 'EXIT') => void;
}

export const MemberProfile: React.FC<MemberProfileProps> = ({ onOpenScanner }) => {
  const { user, refreshProfile } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState<boolean>(false);
  const [loggedWorkoutsCount, setLoggedWorkoutsCount] = useState<number>(14);

  // Active in-gym session & today's completion states
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [completedToday, setCompletedToday] = useState<any | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

  // Departure Celebration Modal
  const [departureSessionData, setDepartureSessionData] = useState<any | null>(null);
  const [isDepartureModalOpen, setIsDepartureModalOpen] = useState<boolean>(false);

  const activeSub = user?.subscriptions?.[0];
  const isSubActive =
    activeSub &&
    activeSub.status === 'ACTIVE' &&
    new Date(activeSub.endDate) > new Date();

  // Days remaining calculation
  const getDaysRemaining = () => {
    if (!activeSub || !isSubActive) return 0;
    const diffTime = new Date(activeSub.endDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining();

  const loadActiveSession = async () => {
    try {
      const data = await api.getActiveSession();
      if (data.hasActiveSession && data.activeSession) {
        setActiveSession(data.activeSession);
        const initialSeconds = Math.max(
          0,
          Math.floor((Date.now() - new Date(data.activeSession.scannedAt).getTime()) / 1000)
        );
        setElapsedSeconds(initialSeconds);
      } else {
        setActiveSession(null);
      }
      if (data.completedToday) {
        setCompletedToday(data.completedToday);
      }
    } catch (e) {
      console.error('Failed to load active session:', e);
    }
  };

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const data = await api.getMyAttendanceHistory();
      setHistory(data.history || []);
    } catch (e) {
      console.error('Failed to load personal history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadActiveSession();
    loadHistory();

    const socket = getSocket();
    const handleDeviceChangeApproved = (payload: any) => {
      setNotice(payload.message || 'Account unflagged by Front Desk!');
      refreshProfile();
      loadActiveSession();
      loadHistory();
    };

    const handleNewAttendance = (payload: any) => {
      if (payload.userId === user?.id) {
        loadActiveSession();
        loadHistory();
      }
    };

    const handleMemberExited = (payload: any) => {
      if (payload.userId === user?.id) {
        setActiveSession(null);
        loadActiveSession();
        loadHistory();
      }
    };

    socket.on('member:device_status_changed', handleDeviceChangeApproved);
    socket.on('attendance:new_entry', handleNewAttendance);
    socket.on('attendance:member_exited', handleMemberExited);

    return () => {
      socket.off('member:device_status_changed', handleDeviceChangeApproved);
      socket.off('attendance:new_entry', handleNewAttendance);
      socket.off('attendance:member_exited', handleMemberExited);
    };
  }, []);

  // Live stopwatch timer ticking when member is inside the gym
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Format seconds to HH:MM:SS
  const formatStopwatch = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Estimated calories burned based on current elapsed duration (~7.5 kcal/min)
  const estimatedBurnedCalories = Math.round((elapsedSeconds / 60) * 7.5);

  // In-app 1-click Exit / Checkout
  const handleDirectCheckOut = async () => {
    try {
      setIsCheckingOut(true);
      const res = await api.exitGymSession();
      setActiveSession(null);
      setDepartureSessionData(res.session);
      setIsDepartureModalOpen(true);
      await loadActiveSession();
      await loadHistory();
      refreshProfile();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setNotice(err.message || 'Unable to check out. Please ask front desk.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const hasCheckedInToday = !!activeSession || !!completedToday || history.some((h) => {
    const d = new Date(h.scannedAt);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 px-2 sm:px-4 font-poppins">
      {/* Notice Banner */}
      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="hover:underline font-black">
            Dismiss
          </button>
        </div>
      )}

      {/* Flagged Status Notice */}
      {user?.deviceStatus === 'FLAGGED_MULTI_DEVICE' && (
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs font-medium space-y-1 animate-fade-in">
          <div className="flex items-center gap-2 font-black text-amber-700 dark:text-amber-400 text-sm">
            <AlertTriangle className="w-5 h-5" />
            Notice: Daily Check-In Limit Reached
          </div>
          <p>
            You have already visited the gym today. Your membership includes 1 check-in per day. If you need additional access, the front desk staff has been notified and can approve your visit with 1 click.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 🌟 IN-GYM ACTIVE WORKOUT MODE: LIVE STOPWATCH & EXIT ACTION */}
      {/* ------------------------------------------------------------- */}
      {activeSession && (
        <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 text-white shadow-xl shadow-emerald-700/20 animate-fade-in border-2 border-emerald-400/40">
          {/* Subtle background glow circle */}
          <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Live indicator & gym status */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-black/25 text-emerald-200 backdrop-blur-sm border border-emerald-300/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                  Currently Inside Gym
                </span>
                <span className="text-xs text-emerald-100 font-medium">
                  {activeSession.facility?.name || 'IronVault Apex'}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Workout Session in Progress</span>
                <Flame className="w-6 h-6 text-amber-300 animate-pulse fill-current" />
              </h3>

              <p className="text-xs text-emerald-100/80">
                Checked in at {new Date(activeSession.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Tap finish when you leave to log your workout.
              </p>
            </div>

            {/* Live Ticking Stopwatch Card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 text-center sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
              <div className="flex items-center gap-1.5 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                <Timer className="w-4 h-4 text-emerald-300 animate-spin-slow" />
                <span>Elapsed Time</span>
              </div>

              <div className="font-mono text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow">
                {formatStopwatch(elapsedSeconds)}
              </div>

              <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>~{estimatedBurnedCalories} kcal burned</span>
              </div>
            </div>
          </div>

          {/* Quick 1-Click Checkout & Turnstile Exit Buttons */}
          <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-emerald-100/90 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Dual exit supported: 1-click checkout or scan the physical exit poster
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => onOpenScanner('EXIT')}
                className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black text-xs transition flex items-center justify-center gap-2 active:scale-95 border border-white/20"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan Exit Gate</span>
              </button>

              <button
                onClick={handleDirectCheckOut}
                disabled={isCheckingOut}
                className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs transition shadow-lg shadow-black/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <LogOut className="w-4 h-4 text-emerald-700" />
                <span>{isCheckingOut ? 'Checking Out...' : '🏁 Check Out & Exit Gym'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO GREETING & PERSONAL STATUS CARD */}
      <div className="community-card relative overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50/40 dark:from-[#0d0d10] dark:via-[#09090b] dark:to-emerald-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Member Greeting & Streak */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="badge-active-green text-[10px]">
                <Sparkles className="w-3 h-3" />
                Athlete Member
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
                4-Day Streak 🔥
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.fullName || 'Alex'}!
            </h2>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {activeSession
                ? 'Your session is actively being timed above. Stay hydrated and crush it!'
                : completedToday
                ? `Great job today! Completed a ${completedToday.sessionDurationMinutes || 45}m workout session.`
                : 'Ready to crush today’s session? Check in at the entrance or connect with the community below.'}
            </p>
          </div>

          {/* Today's Access Status Pill */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-800">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Today's Entrance Status
            </span>
            {activeSession ? (
              <span className="badge-active-green text-xs font-black py-1 px-3 animate-pulse">
                <Activity className="w-3.5 h-3.5" />
                Inside Gym Now
              </span>
            ) : completedToday ? (
              <span className="badge-active-green text-xs font-black py-1 px-3">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Session Completed Today ✓
              </span>
            ) : (
              <button
                onClick={() => onOpenScanner('ENTER')}
                className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black font-black text-xs transition shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <QrCode className="w-3.5 h-3.5 stroke-[2.5]" />
                Check In Now
              </button>
            )}
          </div>
        </div>

        {/* Membership Pass Details Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">
              Active Pass
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white truncate block">
              {activeSub?.planName || 'Monthly Pro Access'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">
              Pass Status
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isSubActive ? 'Active & Valid' : 'Renewal Needed'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">
              Time Remaining
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white block">
              {daysRemaining} Days Left
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">
              Workouts Logged
            </span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">
              {loggedWorkoutsCount} Sessions
            </span>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED GYM ACCESS PORTAL: SCAN ENTRY & SCAN EXIT */}
      <div className="community-card p-5 sm:p-6 bg-white dark:bg-[#0d0d10] border-2 border-emerald-500/30 rounded-3xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Gym Access: Entry & Exit Turnstiles
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Scan the physical QR poster at the entrance to begin your session, and at the exit gate when departing.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
              Floor Status:
            </span>
            {activeSession ? (
              <span className="badge-active-green text-xs font-black py-0.5 px-2.5 animate-pulse">
                🟢 Inside Gym ({formatStopwatch(elapsedSeconds)})
              </span>
            ) : completedToday ? (
              <span className="badge-active-green text-xs font-black py-0.5 px-2.5">
                ✓ Completed Today ({completedToday.sessionDurationMinutes || 45}m)
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                ⚪ Outside Gym
              </span>
            )}
          </div>
        </div>

        {/* DUAL TURNSTILE BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* OPTION 1: SCAN ENTRY */}
          <button
            onClick={() => onOpenScanner('ENTER')}
            disabled={!!activeSession || !!completedToday}
            className={`p-4 rounded-2xl flex items-center gap-3.5 transition-all text-left ${
              activeSession
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 opacity-75 cursor-not-allowed'
                : completedToday
                ? 'bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 opacity-60 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black shadow-lg shadow-emerald-500/20 active:scale-98 ring-2 ring-emerald-400/50'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              activeSession || completedToday
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
            }`}>
              <LogIn className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight block">
                  {activeSession ? 'Checked In' : completedToday ? 'Entry Used Today' : 'Scan Entry (Check In)'}
                </span>
                {activeSession && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.2 rounded">INSIDE</span>}
              </div>
              <span className={`text-xs block mt-0.5 ${
                activeSession || completedToday ? 'text-slate-500 dark:text-zinc-400' : 'text-emerald-100 dark:text-zinc-900 font-medium'
              }`}>
                {activeSession
                  ? `Checked in at ${new Date(activeSession.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : completedToday
                  ? `Completed at ${new Date(completedToday.exitedAt || completedToday.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Scan Entrance Gate Turnstile QR'}
              </span>
            </div>
          </button>

          {/* OPTION 2: SCAN EXIT */}
          <button
            onClick={() => onOpenScanner('EXIT')}
            disabled={!activeSession}
            className={`p-4 rounded-2xl flex items-center gap-3.5 transition-all text-left ${
              activeSession
                ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black shadow-lg shadow-emerald-500/20 active:scale-98 ring-2 ring-emerald-400/50 animate-pulse'
                : completedToday
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 opacity-90 cursor-not-allowed'
                : 'bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed opacity-60'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              activeSession
                ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
            }`}>
              <LogOut className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight block">
                  {completedToday ? 'Workout Completed ✓' : 'Scan Exit (Check Out)'}
                </span>
                {activeSession && <span className="text-[10px] font-bold text-white bg-black/30 px-1.5 py-0.2 rounded">READY</span>}
              </div>
              <span className={`text-xs block mt-0.5 ${
                activeSession ? 'text-emerald-100 dark:text-zinc-900 font-medium' : 'text-slate-400 dark:text-zinc-500'
              }`}>
                {activeSession
                  ? 'Scan Exit Gate Turnstile to finish'
                  : completedToday
                  ? `Logged ${completedToday.sessionDurationMinutes || 45} mins session`
                  : 'Check in first to unlock exit scan'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. QUICK ACTIONS BAR */}
      <QuickActionBar
        onCheckIn={() => onOpenScanner('ENTER')}
        onCheckOut={handleDirectCheckOut}
        onBookClass={() => {
          const el = document.getElementById('community-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onLogWorkout={() => setIsWorkoutModalOpen(true)}
        hasCheckedInToday={hasCheckedInToday}
        isInGym={!!activeSession}
      />

      {/* 3. GYM COMMUNITY SOCIAL HUB */}
      <div id="community-section" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              👥 IronVault Community
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Live Feed
            </span>
          </div>
          <span className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:inline">
            Connect with trainers & find workout partners
          </span>
        </div>

        <CommunityFeed defaultTab="feed" />
      </div>

      {/* 4. RECENT VISITS LOG WITH SESSION DURATION */}
      <div className="community-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Your Recent Visits & Sessions
          </h3>
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            {history.length} Total Visits Logged
          </span>
        </div>

        {isLoadingHistory ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading visit history...</div>
        ) : history.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No check-in history yet. Scan the entrance QR when you arrive at the gym!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {history.slice(0, 6).map((entry) => {
              const isCurrentlyActive = entry.status === 'ACTIVE' || (!entry.exitedAt && !completedToday);
              const durationMinutes = entry.sessionDurationMinutes;

              return (
                <div key={entry.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${
                      isCurrentlyActive
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {isCurrentlyActive ? <Activity className="w-4 h-4 animate-spin-slow" /> : <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {new Date(entry.scannedAt).toLocaleDateString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        {isCurrentlyActive && (
                          <span className="badge-active-green text-[9px] py-0 px-1.5">
                            Active Inside
                          </span>
                        )}
                        {durationMinutes && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            {durationMinutes} mins
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 block mt-0.5">
                        {entry.facility?.name || 'IronVault Apex'} • {entry.exitedAt ? 'Turnstile Check-Out Logged' : 'Entrance Gate'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-zinc-200 block">
                      {new Date(entry.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {entry.exitedAt && (
                        <span> — {new Date(entry.exitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                      {isCurrentlyActive ? 'In-progress' : 'Completed'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Workout Logger Modal */}
      <WorkoutLogModal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        onLogSaved={() => setLoggedWorkoutsCount((prev) => prev + 1)}
      />

      {/* Post-Workout Departure Celebration Modal */}
      <WorkoutDepartureModal
        isOpen={isDepartureModalOpen}
        onClose={() => setIsDepartureModalOpen(false)}
        sessionData={departureSessionData}
      />
    </div>
  );
};
