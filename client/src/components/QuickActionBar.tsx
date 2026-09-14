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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-['Poppins',sans-serif] font-black uppercase tracking-wider text-zinc-400">
          ⚡ Quick Actions
        </h3>
        <span className="text-[10px] font-bold text-[#ccff00] flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          1-Tap Access
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Entrance / Exit Action */}
        {isInGym ? (
          <button
            onClick={onCheckOut || onCheckIn}
            className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-black/20 text-black flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] sm:text-sm font-black tracking-tight leading-tight">
                Finish &amp; Exit
              </span>
              <span className="text-[10px] hidden sm:block font-bold truncate opacity-80">
                Check Out Turnstile
              </span>
            </div>
          </button>
        ) : hasCheckedInToday ? (
          <button
            onClick={onCheckIn}
            className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-[#0e1015] border border-[#ccff00]/40 text-[#ccff00] transition-all cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] sm:text-sm font-black tracking-tight leading-tight">
                Session Done ✓
              </span>
              <span className="text-[10px] hidden sm:block font-semibold truncate text-zinc-400">
                1 Daily Visit Used
              </span>
            </div>
          </button>
        ) : (
          <button
            onClick={onCheckIn}
            className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-[#ccff00] hover:bg-[#b8e600] text-black shadow-[0_0_25px_rgba(204,255,0,0.25)] transition-all active:scale-95 cursor-pointer select-none"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-black/15 text-black flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] sm:text-sm font-['Poppins',sans-serif] font-black uppercase tracking-tight leading-tight">
                Gym Check-In
              </span>
              <span className="text-[10px] hidden sm:block font-bold truncate opacity-80">
                Scan Turnstile QR
              </span>
            </div>
          </button>
        )}

        {/* Book Class Action */}
        <button
          onClick={onBookClass}
          className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-[#0e1015] border border-white/10 hover:border-[#ccff00]/50 text-white shadow-sm hover:shadow-md transition-all group active:scale-95 cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] sm:text-sm font-bold tracking-tight leading-tight">
              Classes
            </span>
            <span className="text-[10px] hidden sm:block text-zinc-400 font-medium truncate">
              HIIT &amp; Strength
            </span>
          </div>
        </button>

        {/* Log Workout Action */}
        <button
          onClick={onLogWorkout}
          className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-[#0e1015] border border-white/10 hover:border-[#ccff00]/50 text-white shadow-sm hover:shadow-md transition-all group active:scale-95 cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#ccff00]/15 text-[#ccff00] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] sm:text-sm font-bold tracking-tight leading-tight">
              Log Workout
            </span>
            <span className="text-[10px] hidden sm:block text-zinc-400 font-medium truncate">
              Track PRs &amp; Sets
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
