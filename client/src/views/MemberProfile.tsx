import React, { useState, useEffect, useMemo } from 'react';
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
  Users,
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
  Droplets,
  FileText,
  Printer,
  Download
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
import { MemberDigitalPass } from '../components/MemberDigitalPass';
import { FirstTimeMemberEnrollmentModal } from '../components/FirstTimeMemberEnrollmentModal';

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

  // Segmented Subpart Tab State: 'PASS' | 'FITNESS' | 'HISTORY' | 'COMMUNITY'
  const [activeSubpart, setActiveSubpart] = useState<'PASS' | 'FITNESS' | 'HISTORY' | 'COMMUNITY'>('PASS');

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
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (user && user.role === 'MEMBER' && !user.hasCompletedEnrollment) {
      setIsEnrollmentModalOpen(true);
    }
  }, [user?.hasCompletedEnrollment, user?.role]);

  // Daily Bodybuilding & Athletic Split Tracker
  const [dailyMuscleSplit, setDailyMuscleSplit] = useState<'Push Day' | 'Pull Day' | 'Leg Day' | 'Arms & Delts' | 'Rest Day'>('Push Day');
  const [proteinGrams, setProteinGrams] = useState<number>(165);
  const [creatineChecked, setCreatineChecked] = useState<boolean>(true);
  const [waterLiters, setWaterLiters] = useState<number>(3.2);

  // Stitch Sync Timer (Countdown 30s)
  const [syncTimerSeconds, setSyncTimerSeconds] = useState<number>(24);
  useEffect(() => {
    const timer = setInterval(() => {
      setSyncTimerSeconds((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // 30 Days Activity Heatmap data
  const past30Days = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const visited = history.some((h) => {
        const hd = new Date(h.scannedAt);
        return hd.getDate() === d.getDate() && hd.getMonth() === d.getMonth() && hd.getFullYear() === d.getFullYear();
      });
      days.push({ dayNumber: 30 - i, visited, isToday: i === 0 });
    }
    return days;
  }, [history]);

  const lastCheckIn = history && history.length > 0 ? history[0] : null;

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

      {/* 1. ATHLETE STATUS & FACILITY CONTEXT CHIP */}
      <div className="flex items-center justify-between gap-3 bg-[#0e1015] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#ccff00]/15 border border-[#ccff00]/30 flex items-center justify-center text-[#ccff00] shrink-0">
            <span className="material-symbols-outlined text-[24px]">fitness_center</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-['Unbounded',sans-serif] font-black uppercase text-white tracking-tight truncate">
              {user?.gym?.name || 'FIDGIT Elite Club'}
            </span>
            <span className="text-xs text-zinc-400 truncate">
              Access Pass: #{user?.gym?.inviteCode || '100001'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#ccff00]/15 border border-[#ccff00]/30 px-3.5 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
          <span className="text-[11px] font-black text-[#ccff00] tracking-wide uppercase">Location Verified</span>
        </div>
      </div>

      {/* 2. SEGMENTED ATHLETE CONTROLS */}
      <div className="flex items-center gap-2 bg-[#0e1015] p-1.5 rounded-full border border-white/10 overflow-x-auto no-scrollbar" role="tablist">
        <button
          onClick={() => setActiveSubpart('PASS')}
          className={`flex-1 min-h-[44px] px-5 py-2.5 rounded-full font-['Poppins',sans-serif] font-black uppercase text-xs tracking-tight transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer select-none ${
            activeSubpart === 'PASS'
              ? 'bg-[#ccff00] text-black shadow-[0_0_20px_rgba(204,255,0,0.25)]'
              : 'text-zinc-400 hover:text-white'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          <span>Digital Pass</span>
        </button>
        <button
          onClick={() => setActiveSubpart('FITNESS')}
          className={`flex-1 min-h-[44px] px-5 py-2.5 rounded-full font-['Poppins',sans-serif] font-black uppercase text-xs tracking-tight transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer select-none ${
            activeSubpart === 'FITNESS'
              ? 'bg-[#ccff00] text-black shadow-[0_0_20px_rgba(204,255,0,0.25)]'
              : 'text-zinc-400 hover:text-white'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">monitor_heart</span>
          <span>Body &amp; Fuel</span>
        </button>
        <button
          onClick={() => setActiveSubpart('HISTORY')}
          className={`flex-1 min-h-[44px] px-5 py-2.5 rounded-full font-['Poppins',sans-serif] font-black uppercase text-xs tracking-tight transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer select-none ${
            activeSubpart === 'HISTORY'
              ? 'bg-[#ccff00] text-black shadow-[0_0_20px_rgba(204,255,0,0.25)]'
              : 'text-zinc-400 hover:text-white'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          <span>Visits</span>
        </button>
        <button
          onClick={() => setActiveSubpart('COMMUNITY')}
          className={`flex-1 min-h-[44px] px-5 py-2.5 rounded-full font-['Poppins',sans-serif] font-black uppercase text-xs tracking-tight transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer select-none ${
            activeSubpart === 'COMMUNITY'
              ? 'bg-[#ccff00] text-black shadow-[0_0_20px_rgba(204,255,0,0.25)]'
              : 'text-zinc-400 hover:text-white'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">forum</span>
          <span>Community</span>
        </button>
      </div>

      {/* 3. RENEWAL WARNING BANNER (if expiring soon or expired) */}
      {(!isSubActive || daysRemaining <= 7) && (
        <div className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 px-4 py-3 rounded-2xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-amber-400 text-[22px] shrink-0">info</span>
            <span className="text-xs text-amber-300 font-semibold truncate">
              {!isSubActive ? 'Membership Expired — Please renew to enter' : `Pass expires in ${daysRemaining} days`}
            </span>
          </div>
          <button
            onClick={() => setActiveSubpart('FITNESS')}
            className="shrink-0 text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-xl transition"
            type="button"
          >
            Renew Now
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBPART A: LIVE REAL-TIME MEMBER DIGITAL PASS                             */}
      {/* ========================================================================= */}
      {activeSubpart === 'PASS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <MemberDigitalPass
            onOpenScanner={onOpenScanner}
            onNavigateToTab={(tab) => setActiveSubpart(tab as any)}
            activeSession={activeSession}
            elapsedSeconds={elapsedSeconds}
            history={history}
            onDirectCheckOut={handleDirectCheckOut}
            isCheckingOut={isCheckingOut}
          />

          {/* Official Stamped Membership Documents Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0e1015] border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white font-['Poppins']">
                    Official Documents &amp; Invoices
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Certified with Official Authorised Seal &bull; Download or Print
                  </p>
                </div>
              </div>

              {!user?.hasCompletedEnrollment && (
                <button
                  type="button"
                  onClick={() => setIsEnrollmentModalOpen(true)}
                  className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider animate-pulse"
                >
                  KYC Pending
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {activeSub?.id && (
                <button
                  type="button"
                  onClick={() => api.downloadInvoicePdf(activeSub.id, activeSub.invoiceNumber)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#14161f] hover:bg-[#1a1d29] border border-white/5 hover:border-white/15 transition text-left group cursor-pointer active:scale-95"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        Stamped Tax Invoice (PDF)
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        #{activeSub.invoiceNumber || 'INV-ACTIVE'} &bull; Official Seal
                      </div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-zinc-400 group-hover:text-[#ccff00] transition-colors shrink-0" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (user?.hasCompletedEnrollment) {
                    api.downloadEnrollmentPdf(user.id, user.fullName);
                  } else {
                    setIsEnrollmentModalOpen(true);
                  }
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#14161f] hover:bg-[#1a1d29] border border-white/5 hover:border-white/15 transition text-left group cursor-pointer active:scale-95"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      Admission &amp; KYC Form (PDF)
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {user?.hasCompletedEnrollment ? 'Verified & Approved' : 'Click to complete form'}
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-zinc-400 group-hover:text-[#ccff00] transition-colors shrink-0" />
              </button>
            </div>
          </div>

          {/* Quick Shortcuts Bar */}
          <QuickActionBar
            onCheckIn={() => onOpenScanner('ENTER')}
            onCheckOut={handleDirectCheckOut}
            onBookClass={() => setActiveSubpart('COMMUNITY')}
            onLogWorkout={() => setIsWorkoutModalOpen(true)}
            hasCheckedInToday={hasCheckedInToday}
            isInGym={!!activeSession}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBPART B: BODY & DAILY FUEL (FITNESS, ASSESSMENTS, PHYSIQUE)             */}
      {/* ========================================================================= */}
      {activeSubpart === 'FITNESS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
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
        <div className="p-5 sm:p-6 bg-[#0e1015] border border-white/10 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30">
                <HeartPulse className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-['Poppins',sans-serif] font-black uppercase text-white tracking-tight flex items-center gap-2">
                  My Fitness Assessment &amp; Target Goals
                </h3>
                <p className="text-xs text-zinc-400">
                  Body composition, BMI, and personalized milestones
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOnboardFormExpanded(true)}
                className="px-4 py-2 bg-[#ccff00] hover:bg-[#b8e600] text-black font-black rounded-full text-xs flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(204,255,0,0.25)] cursor-pointer active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Full Profile</span>
              </button>
              <button
                onClick={() => setIsHealthEditOpen(true)}
                className="px-4 py-2 bg-[#121418] hover:bg-zinc-800 text-zinc-200 font-bold rounded-full text-xs border border-white/10 flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer active:scale-95"
              >
                <span>Quick Metrics</span>
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Current Weight */}
            <div className="p-4 bg-[#121418] rounded-2xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Current Weight
              </span>
              <span className="text-base sm:text-lg font-mono font-black text-white mt-0.5 block">
                {healthProfile?.currentWeightKg ? `${healthProfile.currentWeightKg} kg` : 'Not recorded'}
              </span>
              {healthProfile?.heightCm && (
                <span className="text-[10px] text-zinc-500">Height: {healthProfile.heightCm} cm</span>
              )}
            </div>

            {/* BMI */}
            <div className="p-4 bg-[#121418] rounded-2xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Calculated BMI
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base sm:text-lg font-mono font-black text-white">
                  {healthProfile?.bmi ? healthProfile.bmi : '—'}
                </span>
                {healthProfile?.bmi && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                      healthProfile.bmi < 18.5
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : healthProfile.bmi < 25
                        ? 'bg-[#ccff00]/15 text-[#ccff00] border-[#ccff00]/30'
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
              <span className="text-[10px] text-zinc-500">Metric Index</span>
            </div>

            {/* Primary Goal */}
            <div className="p-4 bg-[#121418] rounded-2xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Primary Goal
              </span>
              <span className="text-sm font-bold text-[#ccff00] truncate mt-0.5 block">
                {healthProfile?.primaryGoal || 'General Fitness'}
              </span>
              <span className="text-[10px] text-zinc-500">
                Timeline: {healthProfile?.targetTimeline || '3 Months'}
              </span>
            </div>

            {/* Target Weight */}
            <div className="p-4 bg-[#121418] rounded-2xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Target Goal Weight
              </span>
              <span className="text-base sm:text-lg font-mono font-black text-[#ccff00] mt-0.5 block">
                {healthProfile?.targetWeightKg ? `${healthProfile.targetWeightKg} kg` : 'Not set'}
              </span>
              {healthProfile?.currentWeightKg && healthProfile?.targetWeightKg && (
                <span className="text-[10px] text-zinc-500 font-semibold">
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
        <div className="p-5 sm:p-7 bg-[#0e1015] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden space-y-6">
          {/* Subtle Ambient Lighting */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#ccff00]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30">
                <Dumbbell className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30">
                    Pro Physique Architecture
                  </span>
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    Gold Tier Lifter
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-['Poppins',sans-serif] font-black text-white uppercase tracking-tight mt-0.5">
                  Bodybuilding Targets &amp; Daily Gym Fuel
                </h3>
              </div>
            </div>

            {/* Split Day Badge */}
            <div className="px-3.5 py-1.5 rounded-full bg-[#121418] border border-white/10 flex items-center gap-2 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-[#ccff00]">
                Today: {dailyMuscleSplit}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            {/* Left: Anatomical Physique Silhouette with Callouts */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-[#050507] border border-white/10 flex flex-col items-center justify-center relative">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest absolute top-3 left-3">
                Physique Map
              </span>

              <div className="relative w-full max-w-[260px] h-[320px] flex items-center justify-center my-2">
                <svg viewBox="0 0 240 380" className="w-full h-full drop-shadow-[0_4px_20px_rgba(204,255,0,0.15)]">
                  <defs>
                    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ccff00" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#84cc16" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>

                  {/* Muscular Head & Neck */}
                  <circle cx="120" cy="40" r="18" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                  <path d="M112,56 L108,76 L132,76 L128,56 Z" fill="#1e293b" />

                  {/* Shoulders & Arms */}
                  <path d="M75,90 C68,100 65,135 75,160 C80,165 88,155 88,135 C88,110 82,90 75,90 Z" fill="#1e293b" stroke="#334155" />
                  <path d="M165,90 C172,100 175,135 165,160 C160,165 152,155 152,135 C152,110 158,90 165,90 Z" fill="#1e293b" stroke="#334155" />

                  {/* Chest */}
                  <path d="M96,88 C108,86 120,90 120,95 C120,90 132,86 144,88 C154,96 156,122 142,134 C132,142 122,138 120,140 C118,138 108,142 98,134 C84,122 86,96 96,88 Z" fill="url(#bodyGrad)" stroke="#ccff00" strokeWidth="1.5" />

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
                  <line x1="142" y1="110" x2="200" y2="110" stroke="#ccff00" strokeWidth="1.5" strokeDasharray="2,2" />
                  <circle cx="142" cy="110" r="3" fill="#ccff00" />

                  {/* Waist Callout Pin */}
                  <line x1="106" y1="170" x2="40" y2="170" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2,2" />
                  <circle cx="106" cy="170" r="3" fill="#f59e0b" />

                  {/* Hip Callout Pin */}
                  <line x1="144" y1="225" x2="200" y2="225" stroke="#ccff00" strokeWidth="1.5" strokeDasharray="2,2" />
                  <circle cx="144" cy="225" r="3" fill="#ccff00" />
                </svg>

                {/* Floating Measurement Callout Badges */}
                <div className="absolute top-[80px] -right-2 bg-[#ccff00]/20 border border-[#ccff00]/40 text-[#ccff00] text-[10px] font-black px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  Chest: {healthProfile.chestCm ? `${healthProfile.chestCm} cm` : '104 cm'}
                </div>

                <div className="absolute top-[138px] -left-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  Waist: {healthProfile.waistCm ? `${healthProfile.waistCm} cm` : '82 cm'}
                </div>

                <div className="absolute top-[186px] -right-2 bg-[#ccff00]/20 border border-[#ccff00]/40 text-[#ccff00] text-[10px] font-black px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  Hips: {healthProfile.hipCm ? `${healthProfile.hipCm} cm` : '96 cm'}
                </div>
              </div>

              <span className="text-[11px] text-zinc-400 text-center font-medium mt-1">
                Calibrated to IPF &amp; Classic Bodybuilding Proportions
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
                      className={`p-2.5 rounded-full text-xs font-bold text-center transition border cursor-pointer active:scale-95 ${
                        dailyMuscleSplit === split
                          ? 'bg-[#ccff00] text-black border-[#ccff00] shadow-[0_0_15px_rgba(204,255,0,0.25)] font-black'
                          : 'bg-[#121418] text-zinc-300 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {split}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Fuel & Supplement Tracker Grid */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <span className="text-xs font-black uppercase text-zinc-400 tracking-wider block">
                  Daily Athlete Fuel &amp; Supplements
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Protein */}
                  <div className="p-4 rounded-2xl bg-[#121418] border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Protein Intake</span>
                        <span className="text-xs font-mono font-black text-[#ccff00]">{proteinGrams}g / 200g</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-[#ccff00] h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(204,255,0,0.4)]"
                          style={{ width: `${Math.min(100, (proteinGrams / 200) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                      <button
                        type="button"
                        onClick={() => setProteinGrams((p) => Math.max(0, p - 10))}
                        className="flex-1 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300 cursor-pointer"
                      >
                        -10g
                      </button>
                      <button
                        type="button"
                        onClick={() => setProteinGrams((p) => p + 25)}
                        className="flex-1 py-1 rounded-full bg-[#ccff00] hover:bg-[#b8e600] text-black text-[10px] font-black cursor-pointer shadow-[0_0_10px_rgba(204,255,0,0.2)]"
                      >
                        +25g Shake
                      </button>
                    </div>
                  </div>

                  {/* Water Hydration */}
                  <div className="p-4 rounded-2xl bg-[#121418] border border-white/10 flex flex-col justify-between">
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
                        className="w-full py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Droplets className="w-3 h-3" />
                        <span>+500 ml</span>
                      </button>
                    </div>
                  </div>

                  {/* Creatine & Multivitamin */}
                  <div className="p-4 rounded-2xl bg-[#121418] border border-white/10 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-zinc-400 block">Supplements</span>
                      <div className="mt-2 space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300">
                          <input
                            type="checkbox"
                            checked={creatineChecked}
                            onChange={(e) => setCreatineChecked(e.target.checked)}
                            className="rounded text-[#ccff00] focus:ring-[#ccff00]"
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

      {/* ========================================================================= */}
      {/* SUBPART C: RECENT VISITS & WORKOUT SESSIONS LOG                           */}
      {/* ========================================================================= */}
      {activeSubpart === 'HISTORY' && (
        <div className="p-5 sm:p-6 bg-[#0e1015] border border-white/10 rounded-3xl shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm sm:text-base font-['Poppins',sans-serif] font-black uppercase text-white tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-[#ccff00]" />
              Your Recent Visits &amp; Sessions
            </h3>
            <span className="text-xs font-semibold text-zinc-400">
              {history.length} Total Visits Logged
            </span>
          </div>

          {isLoadingHistory ? (
            <div className="py-6 text-center text-xs text-zinc-400">Loading visit history...</div>
          ) : history.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-400">
              No check-in history yet. Scan the entrance QR when you arrive at the gym!
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {history.slice(0, 10).map((entry) => {
                const isCurrentlyActive = entry.status === 'ACTIVE' || (!entry.exitedAt && !completedToday);
                const durationMinutes = entry.sessionDurationMinutes;

                return (
                  <div key={entry.id} className="py-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${
                        isCurrentlyActive
                          ? 'bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.25)]'
                          : 'bg-[#121418] text-[#ccff00] border border-white/10'
                      }`}>
                        {isCurrentlyActive ? <Activity className="w-4 h-4 animate-spin-slow" /> : <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white block">
                            {new Date(entry.scannedAt).toLocaleDateString([], {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          {isCurrentlyActive && (
                            <span className="px-2 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 text-[9px] font-black uppercase">
                              Active Inside
                            </span>
                          )}
                          {durationMinutes && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#121418] text-zinc-300 border border-white/5">
                              <Clock className="w-3 h-3 text-[#ccff00]" />
                              {durationMinutes} mins
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          {entry.facility?.name || 'FIDGIT Apex'} • {entry.exitedAt ? 'Turnstile Check-Out Logged' : 'Entrance Gate'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[11px] font-bold text-zinc-200 block">
                        {new Date(entry.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {entry.exitedAt && (
                          <span> — {new Date(entry.exitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </span>
                      <span className="text-[10px] text-[#ccff00] font-medium block">
                        {isCurrentlyActive ? 'In-progress' : 'Completed'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBPART D: GYM COMMUNITY SOCIAL HUB                                       */}
      {/* ========================================================================= */}
      {activeSubpart === 'COMMUNITY' && (
        <div id="community-section" className="space-y-3 pt-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-['Unbounded',sans-serif] font-black uppercase text-white tracking-tight">
                👥 FIDGIT Community
              </h3>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 uppercase">
                Live Feed
              </span>
            </div>
            <span className="text-xs text-zinc-400 hidden sm:inline">
              Connect with master coaches &amp; find workout partners
            </span>
          </div>

          <CommunityFeed defaultTab="feed" />
        </div>
      )}

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

      {/* First-Time Member Admission & KYC Enrollment Modal */}
      <FirstTimeMemberEnrollmentModal
        isOpen={isEnrollmentModalOpen}
        user={user}
        onCompleted={() => {
          setIsEnrollmentModalOpen(false);
          refreshProfile();
          loadHealthProfile();
        }}
      />
    </div>
  );
};
