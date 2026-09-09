import React from 'react';
import { QrCode, Calendar, Dumbbell, Sparkles, LogOut, CheckCircle2 } from 'lucide-react';

interface QuickActionBarProps {
  onCheckIn: () => void;
  onCheckOut?: () => void;
  onBookClass: () => void;
  onLogWorkout: () => void;
  hasCheckedInToday?: boolean;
  isInGym?: boolean;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  onCheckIn,
  onCheckOut,
  onBookClass,
  onLogWorkout,
  hasCheckedInToday = false,
  isInGym = false
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          ⚡ Quick Actions
        </h3>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          1-Tap Access
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {/* Entrance / Exit Action */}
        {isInGym ? (
          <button
            onClick={onCheckOut || onCheckIn}
            className="btn-quick-action flex-col sm:flex-row text-center sm:text-left p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black/20 text-white flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs sm:text-sm font-black tracking-tight leading-tight">
                Finish & Exit
              </span>
              <span className="text-[10px] hidden sm:block font-medium truncate text-white/90">
                Check Out Turnstile
              </span>
            </div>
          </button>
        ) : hasCheckedInToday ? (
          <button
            onClick={onCheckIn}
            className="btn-quick-action flex-col sm:flex-row text-center sm:text-left p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 transition-all"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs sm:text-sm font-black tracking-tight leading-tight">
                Session Done ✓
              </span>
              <span className="text-[10px] hidden sm:block font-medium truncate text-emerald-700 dark:text-emerald-400">
                1 Daily Visit Used
              </span>
            </div>
          </button>
        ) : (
          <button
            onClick={onCheckIn}
            className="btn-quick-action flex-col sm:flex-row text-center sm:text-left p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 dark:bg-black/20 text-white dark:text-black flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs sm:text-sm font-black tracking-tight leading-tight">
                Gym Check-In
              </span>
              <span className="text-[10px] hidden sm:block font-medium truncate text-white/80 dark:text-black/80">
                Scan Turnstile QR
              </span>
            </div>
          </button>
        )}

        {/* Book Class Action */}
        <button
          onClick={onBookClass}
          className="btn-quick-action flex-col sm:flex-row text-center sm:text-left p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900/90 border border-slate-200/90 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 text-slate-800 dark:text-white shadow-sm hover:shadow-md transition-all group active:scale-95"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Calendar className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs sm:text-sm font-black tracking-tight leading-tight">
              Group Classes
            </span>
            <span className="text-[10px] hidden sm:block text-slate-400 dark:text-zinc-500 font-medium truncate">
              HIIT & Strength
            </span>
          </div>
        </button>

        {/* Log Workout Action */}
        <button
          onClick={onLogWorkout}
          className="btn-quick-action flex-col sm:flex-row text-center sm:text-left p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900/90 border border-slate-200/90 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 text-slate-800 dark:text-white shadow-sm hover:shadow-md transition-all group active:scale-95"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Dumbbell className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs sm:text-sm font-black tracking-tight leading-tight">
              Log Workout
            </span>
            <span className="text-[10px] hidden sm:block text-slate-400 dark:text-zinc-500 font-medium truncate">
              Track PRs & Sets
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
