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
  Timer,
  HeartPulse,
  Scale,
  Target,
  Ruler,
  Edit2,
  Dumbbell,
  Trophy,
  Award,
  Droplets
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MemberHealthProfile } from '../types';
import { getSocket } from '../services/socket';
import { QuickActionBar } from '../components/QuickActionBar';
import { CommunityFeed } from '../components/CommunityFeed';
import { WorkoutLogModal } from '../components/WorkoutLogModal';
import { WorkoutDepartureModal } from '../components/WorkoutDepartureModal';
import { MemberOnboardingModal } from '../components/MemberOnboardingModal';
import { MemberOnboardingForm } from '../components/MemberOnboardingForm';

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

  // Health Profile & Metrics
  const [healthProfile, setHealthProfile] = useState<MemberHealthProfile | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(false);
  const [isHealthEditOpen, setIsHealthEditOpen] = useState<boolean>(false);
  const [isFirstTimeOnboardOpen, setIsFirstTimeOnboardOpen] = useState<boolean>(false);
  const [isOnboardFormExpanded, setIsOnboardFormExpanded] = useState<boolean>(false);
  const [editWeight, setEditWeight] = useState('');
  const [editTargetWeight, setEditTargetWeight] = useState('');
  const [editGoal, setEditGoal] = useState('Weight Loss & Fat Burn');
  const [editTimeline, setEditTimeline] = useState('3 Months');
  const [isSavingHealth, setIsSavingHealth] = useState(false);

  // Daily Bodybuilding & Athletic Split Tracker
  const [dailyMuscleSplit, setDailyMuscleSplit] = useState<'Push Day' | 'Pull Day' | 'Leg Day' | 'Arms & Delts' | 'Rest Day'>('Push Day');
  const [proteinGrams, setProteinGrams] = useState<number>(165);
  const [creatineChecked, setCreatineChecked] = useState<boolean>(true);
  const [waterLiters, setWaterLiters] = useState<number>(3.2);

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

  const loadHealthProfile = async () => {
    try {
      setIsLoadingHealth(true);
      const data = await api.getMyHealthProfile();
      if (data && data.profile && (data.profile.primaryGoal || data.profile.currentWeightKg || data.profile.city)) {
        setHealthProfile(data.profile);
        setIsFirstTimeOnboardOpen(false);
        if (data.profile.currentWeightKg) setEditWeight(String(data.profile.currentWeightKg));
        if (data.profile.targetWeightKg) setEditTargetWeight(String(data.profile.targetWeightKg));
        if (data.profile.primaryGoal) setEditGoal(data.profile.primaryGoal);
        if (data.profile.targetTimeline) setEditTimeline(data.profile.targetTimeline);
      } else {
        // First-time member dashboard load without completed health sheet:
        setHealthProfile(null);
        setIsFirstTimeOnboardOpen(true);
      }
    } catch (e) {
      console.error('Failed to load health profile:', e);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  useEffect(() => {
    loadActiveSession();
    loadHistory();
    loadHealthProfile();

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

      {/* 2.5 MEMBER ONBOARDING WIZARD & FITNESS ASSESSMENT CARD */}
      {!healthProfile || isOnboardFormExpanded ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {!healthProfile
                    ? 'Member Admission & Health Assessment'
                    : 'Update Member Admission & Health Profile'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Required contact, body metrics, and medical clearance details
                </p>
              </div>
            </div>
            {healthProfile && (
              <button
                type="button"
                onClick={() => setIsOnboardFormExpanded(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
              >
                Close Editor
              </button>
            )}
          </div>

          <MemberOnboardingForm
            initialValues={{
              fullName: user?.fullName,
              email: user?.email,
              phone: user?.phone,
              profile: healthProfile
            }}
            isCollapsible={Boolean(healthProfile)}
            onCancel={() => setIsOnboardFormExpanded(false)}
            onSuccess={(savedProfile) => {
              setHealthProfile(savedProfile);
              setIsOnboardFormExpanded(false);
              setIsFirstTimeOnboardOpen(false);
              refreshProfile();
            }}
          />
        </div>
      ) : (
        <div className="community-card p-5 sm:p-6 bg-white dark:bg-[#0d0d10] border border-amber-500/20 rounded-3xl shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <HeartPulse className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  My Fitness Assessment & Target Goals
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Body composition, BMI, and personalized milestones
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOnboardFormExpanded(true)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Full Profile</span>
              </button>
              <button
                onClick={() => setIsHealthEditOpen(true)}
                className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold rounded-xl text-xs border border-amber-500/30 flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                <span>Quick Metrics</span>
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Current Weight */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/60 dark:border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">
                Current Weight
              </span>
              <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">
                {healthProfile?.currentWeightKg ? `${healthProfile.currentWeightKg} kg` : 'Not recorded'}
              </span>
              {healthProfile?.heightCm && (
                <span className="text-[10px] text-zinc-400">Height: {healthProfile.heightCm} cm</span>
              )}
            </div>

            {/* BMI */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/60 dark:border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">
                Calculated BMI
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {healthProfile?.bmi ? healthProfile.bmi : '—'}
                </span>
                {healthProfile?.bmi && (
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                      healthProfile.bmi < 18.5
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : healthProfile.bmi < 25
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : healthProfile.bmi < 30
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {healthProfile.bmi < 18.5
                      ? 'Underweight'
                      : healthProfile.bmi < 25
                      ? 'Normal'
                      : healthProfile.bmi < 30
                      ? 'Overweight'
                      : 'Obese'}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-400">Metric Index</span>
            </div>

            {/* Primary Goal */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/60 dark:border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">
                Primary Goal
              </span>
              <span className="text-sm font-bold text-amber-500 truncate mt-0.5 block">
                {healthProfile?.primaryGoal || 'General Fitness'}
              </span>
              <span className="text-[10px] text-zinc-400">
                Timeline: {healthProfile?.targetTimeline || '3 Months'}
              </span>
            </div>

            {/* Target Weight */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/60 dark:border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">
                Target Goal Weight
              </span>
              <span className="text-base font-black text-emerald-500 mt-0.5 block">
                {healthProfile?.targetWeightKg ? `${healthProfile.targetWeightKg} kg` : 'Not set'}
              </span>
              {healthProfile?.currentWeightKg && healthProfile?.targetWeightKg && (
                <span className="text-[10px] text-zinc-400 font-semibold">
                  Delta: {Math.round((healthProfile.targetWeightKg - healthProfile.currentWeightKg) * 10) / 10} kg
                </span>
              )}
            </div>
          </div>

          {/* Body Circumferences Strip if recorded */}
          {(healthProfile?.waistCm || healthProfile?.chestCm || healthProfile?.hipCm) && (
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap gap-4 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">Circumference Data:</span>
              {healthProfile.waistCm && <span>Waist: <strong>{healthProfile.waistCm} cm</strong></span>}
              {healthProfile.chestCm && <span>Chest: <strong>{healthProfile.chestCm} cm</strong></span>}
              {healthProfile.hipCm && <span>Hip: <strong>{healthProfile.hipCm} cm</strong></span>}
            </div>
          )}

          {/* Health Clearance status bar */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 dark:text-zinc-400">Health Clearance:</span>
            {healthProfile.hasHealthCondition ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                Medical Notes on File
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Full Physical Clearance ✓
              </span>
            )}
            {healthProfile.isTakingMedication && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                On Medication
              </span>
            )}
            {healthProfile.advisedAvoidExercise && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                Exercise Restrictions
              </span>
            )}
            {healthProfile.city && (
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 ml-auto">
                Location: {healthProfile.city}{healthProfile.state ? `, ${healthProfile.state}` : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🦾 PRO PHYSIQUE ARCHITECTURE & DAILY FUEL TRACKER                          */}
      {/* ========================================================================= */}
      {healthProfile && (
        <div className="community-card p-5 sm:p-7 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-2 border-emerald-500/30 rounded-3xl shadow-2xl relative overflow-hidden space-y-6">
          {/* Subtle Ambient Lighting */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Dumbbell className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Pro Physique Architecture
                  </span>
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    Gold Tier Lifter
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                  Bodybuilding Targets & Daily Gym Fuel
                </h3>
              </div>
            </div>

            {/* Split Day Badge */}
            <div className="px-3.5 py-1.5 rounded-xl bg-black/60 border border-zinc-800 flex items-center gap-2 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Today: {dailyMuscleSplit}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            {/* Left: Anatomical Physique Silhouette with Callouts */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-black/50 border border-zinc-800/80 flex flex-col items-center justify-center relative">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest absolute top-3 left-3">
                Physique Map
              </span>

              <div className="relative w-full max-w-[260px] h-[320px] flex items-center justify-center my-2">
                <svg viewBox="0 0 240 380" className="w-full h-full drop-shadow-[0_4px_20px_rgba(16,185,129,0.2)]">
                  <defs>
                    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#047857" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>

                  {/* Muscular Head & Neck */}
                  <circle cx="120" cy="40" r="18" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                  <path d="M112,56 L108,76 L132,76 L128,56 Z" fill="#1e293b" />

                  {/* Shoulders & Arms */}
                  <path d="M75,90 C68,100 65,135 75,160 C80,165 88,155 88,135 C88,110 82,90 75,90 Z" fill="#1e293b" stroke="#334155" />
                  <path d="M165,90 C172,100 175,135 165,160 C160,165 152,155 152,135 C152,110 158,90 165,90 Z" fill="#1e293b" stroke="#334155" />

                  {/* Chest */}
                  <path d="M96,88 C108,86 120,90 120,95 C120,90 132,86 144,88 C154,96 156,122 142,134 C132,142 122,138 120,140 C118,138 108,142 98,134 C84,122 86,96 96,88 Z" fill="url(#bodyGrad)" stroke="#34d399" strokeWidth="1.5" />

                  {/* Core / Waist */}
                  <path d="M104,142 L136,142 L132,198 C128,206 120,212 120,212 C120,212 112,206 108,198 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                  <line x1="120" y1="144" x2="120" y2="198" stroke="#334155" strokeWidth="1" />
                  <line x1="108" y1="162" x2="132" y2="162" stroke="#334155" strokeWidth="1" />
                  <line x1="110" y1="180" x2="130" y2="180" stroke="#334155" strokeWidth="1" />

                  {/* Hips & Quads */}
                  <path d="M96,215 C85,230 82,270 92,310 C100,318 114,318 116,302 C118,270 116,240 110,215 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                  <path d="M144,215 C155,230 158,270 148,310 C140,318 126,318 124,302 C122,270 124,240 130,215 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />

                  {/* Calves */}
                  <path d="M94,320 L108,320 L104,370 L96,370 Z" fill="#1e293b" stroke="#334155" />
                  <path d="M146,320 L132,320 L136,370 L144,370 Z" fill="#1e293b" stroke="#334155" />

                  {/* Chest Callout Pin */}
                  <line x1="142" y1="110" x2="200" y2="110" stroke="#34d399" strokeWidth="1.5" strokeDasharray="2,2" />
                  <circle cx="142" cy="110" r="3" fill="#34d399" />

                  {/* Waist Callout Pin */}
                  <line x1="106" y1="170" x2="40" y2="170" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2,2" />
                  <circle cx="106" cy="170" r="3" fill="#f59e0b" />

                  {/* Hip Callout Pin */}
                  <line x1="144" y1="225" x2="200" y2="225" stroke="#34d399" strokeWidth="1.5" strokeDasharray="2,2" />
                  <circle cx="144" cy="225" r="3" fill="#34d399" />
                </svg>

                {/* Floating Measurement Callout Badges */}
                <div className="absolute top-[80px] -right-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-md">
                  Chest: {healthProfile.chestCm ? `${healthProfile.chestCm} cm` : '104 cm'}
                </div>

                <div className="absolute top-[138px] -left-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-md">
                  Waist: {healthProfile.waistCm ? `${healthProfile.waistCm} cm` : '82 cm'}
                </div>

                <div className="absolute top-[186px] -right-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-md">
                  Hips: {healthProfile.hipCm ? `${healthProfile.hipCm} cm` : '96 cm'}
                </div>
              </div>

              <span className="text-[11px] text-zinc-400 text-center font-medium mt-1">
                Calibrated to IPF & Classic Bodybuilding Proportions
              </span>
            </div>

            {/* Right: Muscle Split Selector & Daily Fuel Tracker */}
            <div className="lg:col-span-7 space-y-5">
              {/* Muscle Split Selector */}
              <div>
                <span className="text-xs font-black uppercase text-zinc-400 tracking-wider block mb-2">
                  Select Today's Training Split
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['Push Day', 'Pull Day', 'Leg Day', 'Arms & Delts', 'Rest Day'] as const).map((split) => (
                    <button
                      key={split}
                      type="button"
                      onClick={() => setDailyMuscleSplit(split)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left transition border ${
                        dailyMuscleSplit === split
                          ? 'bg-emerald-500 text-black border-emerald-500 shadow-md font-black'
                          : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {split}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Fuel & Supplement Tracker Grid */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <span className="text-xs font-black uppercase text-zinc-400 tracking-wider block">
                  Daily Athlete Fuel & Supplements
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Protein */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Protein Intake</span>
                        <span className="text-xs font-mono font-black text-emerald-400">{proteinGrams}g / 200g</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (proteinGrams / 200) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                      <button
                        type="button"
                        onClick={() => setProteinGrams((p) => Math.max(0, p - 10))}
                        className="flex-1 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300"
                      >
                        -10g
                      </button>
                      <button
                        type="button"
                        onClick={() => setProteinGrams((p) => p + 25)}
                        className="flex-1 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-black"
                      >
                        +25g Shake
                      </button>
                    </div>
                  </div>

                  {/* Water Hydration */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Hydration</span>
                        <span className="text-xs font-mono font-black text-cyan-400">{waterLiters}L / 4.0L</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (waterLiters / 4) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                      <button
                        type="button"
                        onClick={() => setWaterLiters((w) => parseFloat(Math.min(6, w + 0.5).toFixed(1)))}
                        className="w-full py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-black flex items-center justify-center gap-1"
                      >
                        <Droplets className="w-3 h-3" />
                        <span>+500 ml</span>
                      </button>
                    </div>
                  </div>

                  {/* Creatine & Multivitamin */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-zinc-400 block">Supplements</span>
                      <div className="mt-2 space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300">
                          <input
                            type="checkbox"
                            checked={creatineChecked}
                            onChange={(e) => setCreatineChecked(e.target.checked)}
                            className="rounded text-amber-500 focus:ring-amber-500"
                          />
                          <span>5g Creapure Creatine</span>
                        </label>
                        <span className="text-[10px] text-zinc-500 block">
                          Phosphocreatine saturation active
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold mt-2">
                      {creatineChecked ? '✓ Saturation On Track' : '⚠️ Take with carb meal'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Health Profile Edit Modal */}
      {isHealthEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-amber-400" />
                Update Fitness Metrics & Goals
              </h3>
              <button
                onClick={() => setIsHealthEditOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSavingHealth(true);
                try {
                  const res = await api.updateMyHealthProfile({
                    currentWeightKg: editWeight ? parseFloat(editWeight) : undefined,
                    targetWeightKg: editTargetWeight ? parseFloat(editTargetWeight) : undefined,
                    primaryGoal: editGoal,
                    targetTimeline: editTimeline
                  });
                  setHealthProfile(res.profile);
                  setIsHealthEditOpen(false);
                } catch (err: any) {
                  alert(err.message || 'Failed to update metrics');
                } finally {
                  setIsSavingHealth(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-zinc-400 mb-1">Current Weight (KG)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 74.5"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Target Weight (KG)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 68.0"
                  value={editTargetWeight}
                  onChange={(e) => setEditTargetWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Primary Fitness Goal</label>
                <select
                  value={editGoal}
                  onChange={(e) => setEditGoal(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="Weight Loss & Fat Burn">Weight Loss & Fat Burn</option>
                  <option value="Muscle Building & Hypertrophy">Muscle Building & Hypertrophy</option>
                  <option value="Body Transformation">Body Transformation</option>
                  <option value="Stamina & Endurance">Stamina & Endurance</option>
                  <option value="Strength & Power">Strength & Power</option>
                  <option value="General Fitness & Health">General Fitness & Health</option>
                  <option value="Rehab & Mobility">Rehab & Mobility</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Target Timeline</label>
                <select
                  value={editTimeline}
                  onChange={(e) => setEditTimeline(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="1 Month">1 Month</option>
                  <option value="2 Months">2 Months</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="12 Months">12 Months</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsHealthEditOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingHealth}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl disabled:opacity-50"
                >
                  {isSavingHealth ? 'Saving...' : 'Save Metrics'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Mandatory First-Time Member Admission & Health Profile Onboarding Modal */}
      <MemberOnboardingModal
        isOpen={isFirstTimeOnboardOpen}
        mode="SELF"
        isMandatory={true}
        initialValues={{
          fullName: user?.fullName,
          email: user?.email,
          phone: user?.phone
        }}
        onClose={() => {
          setIsFirstTimeOnboardOpen(false);
          loadHealthProfile();
          refreshProfile();
        }}
        onSuccess={() => {
          setIsFirstTimeOnboardOpen(false);
          loadHealthProfile();
          refreshProfile();
        }}
      />
    </div>
  );
};
