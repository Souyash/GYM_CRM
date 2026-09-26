import React, { useState } from 'react';
import { Flame, Settings, Sparkles, CheckCircle2 } from 'lucide-react';

interface StreakGoalCardProps {
  currentStreakDays?: number;
  goalDays?: number;
}

export const StreakGoalCard: React.FC<StreakGoalCardProps> = ({
  currentStreakDays = 3,
  goalDays = 7
}) => {
  const [goal, setGoal] = useState<number>(goalDays);
  const [current, setCurrent] = useState<number>(currentStreakDays);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const daysRemaining = Math.max(0, goal - current);
  const progressRatio = Math.min(100, Math.round((current / goal) * 100));

  return (
    <div className="snapset-card rounded-3xl p-5 relative overflow-hidden transition-all duration-300">
      {/* Background Ambient Glow */}
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#ccff00]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-base font-bold text-white font-['Outfit']">
            Streak Goal
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
          title="Adjust weekly streak goal"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {isEditing && (
        <div className="mb-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 text-xs">
          <span className="text-zinc-300">Target Days per week:</span>
          <div className="flex items-center gap-2">
            {[3, 4, 5, 6, 7].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setGoal(num);
                  setIsEditing(false);
                }}
                className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                  goal === num
                    ? 'bg-[#ccff00] text-black font-black'
                    : 'bg-black/50 text-zinc-400 hover:text-white'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="font-['Unbounded',sans-serif] font-black text-2xl text-white">
              {current}
            </span>
            <span className="text-xs font-bold text-zinc-400 font-mono">
              / {goal} days
            </span>
          </div>

          <span className="text-xs font-semibold text-[#ccff00] flex items-center gap-1 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            {progressRatio}% complete
          </span>
        </div>

        {/* Custom Progress Bar */}
        <div className="h-3 w-full bg-black/50 border border-white/10 rounded-full overflow-hidden p-0.5 relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-[#ccff00] to-emerald-400 shadow-[0_0_12px_rgba(204,255,0,0.5)] transition-all duration-700 ease-out"
            style={{ width: `${progressRatio}%` }}
          />
        </div>

        {/* Motivational Footnote */}
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-medium">
            {daysRemaining > 0
              ? `${daysRemaining} days until you reach your goal`
              : '🎉 Weekly goal achieved! Outstanding consistency.'}
          </span>

          <button
            type="button"
            onClick={() => setCurrent((prev) => Math.min(goal, prev + 1))}
            className="text-[11px] font-bold text-zinc-400 hover:text-[#ccff00] transition cursor-pointer"
          >
            + Check-in today
          </button>
        </div>
      </div>
    </div>
  );
};
