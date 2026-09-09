import React from 'react';
import { Trophy, Flame, Clock, Sparkles, X, Activity } from 'lucide-react';

interface WorkoutDepartureModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    durationMinutes?: number;
    estimatedCalories?: number;
    scannedAt?: string;
    exitedAt?: string;
    facilityName?: string;
    totalCompletedSessions?: number;
  } | null;
}

export const WorkoutDepartureModal: React.FC<WorkoutDepartureModalProps> = ({
  isOpen,
  onClose,
  sessionData
}) => {
  if (!isOpen || !sessionData) return null;

  const duration = sessionData.durationMinutes || 45;
  const calories = sessionData.estimatedCalories || Math.round(duration * 7.5);
  const facility = sessionData.facilityName || 'IronVault Gym';
  const totalVisits = sessionData.totalCompletedSessions || 1;

  const startTimeStr = sessionData.scannedAt
    ? new Date(sessionData.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const exitTimeStr = sessionData.exitedAt
    ? new Date(sessionData.exitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0d0d10] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-emerald-500/10 text-center space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header Graphic */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 relative">
          <Trophy className="w-10 h-10 text-white" />
          <span className="absolute -top-2 -right-2 p-1.5 rounded-full bg-amber-400 text-black shadow-md">
            <Sparkles className="w-4 h-4" />
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Workout Session Completed
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Crushed It Today! 🔥
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Departed from {facility} at {exitTimeStr}.
          </p>
        </div>

        {/* Session Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 text-center space-y-1">
            <div className="flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white block">
              {duration}m
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase block">
              Duration
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/20 text-center space-y-1">
            <div className="flex items-center justify-center text-amber-500">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white block">
              ~{calories}
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase block">
              Est. Kcal
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 text-center space-y-1">
            <div className="flex items-center justify-center text-indigo-500">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white block">
              #{totalVisits}
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase block">
              Total Visits
            </span>
          </div>
        </div>

        {/* Session Timestamp Range Pill */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs px-4">
          <span className="text-slate-500 dark:text-zinc-400 font-medium">Session Window:</span>
          <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
            {startTimeStr} — {exitTimeStr}
          </span>
        </div>

        {/* Policy Notice */}
        <div className="text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
          ✓ Your visit has been verified and registered. Enjoy your post-workout recovery!
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black font-black text-sm transition shadow-lg shadow-emerald-600/20 active:scale-98"
        >
          Done & Return to Dashboard
        </button>
      </div>
    </div>
  );
};
