import React, { useState } from 'react';
import { X, Dumbbell, Flame, CheckCircle2, Trophy, Clock } from 'lucide-react';

interface WorkoutLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogSaved?: (workout: any) => void;
}

export const WorkoutLogModal: React.FC<WorkoutLogModalProps> = ({
  isOpen,
  onClose,
  onLogSaved
}) => {
  const [exerciseType, setExerciseType] = useState('Strength & Hypertrophy');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [highlightNote, setHighlightNote] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState(380);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const workout = {
      id: String(Date.now()),
      type: exerciseType,
      durationMinutes: Number(durationMinutes),
      caloriesBurned: Number(caloriesBurned),
      note: highlightNote.trim() || 'Crushed today’s workout session!',
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (onLogSaved) onLogSaved(workout);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Log Today's Workout
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Track your gains and build your consistency streak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSaved ? (
            <div className="text-center py-6 space-y-3 animate-scale-up">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-500/15 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                Workout Logged! 🔥
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                +50 Community XP added to your leaderboard score!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  Workout Category
                </label>
                <select
                  value={exerciseType}
                  onChange={(e) => setExerciseType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Strength & Hypertrophy">🏋️ Heavy Strength / Lifting</option>
                  <option value="Cardio & HIIT Sprints">🏃 Cardio / Treadmill / HIIT</option>
                  <option value="Powerlifting (Squat/Bench/Dead)">💥 Powerlifting PR Day</option>
                  <option value="Functional Fitness & Core">🧘 Functional Fitness & Mobility</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">
                    Duration (Minutes)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="number"
                      min={10}
                      max={240}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">
                    Est. Calories Burned
                  </label>
                  <div className="relative">
                    <Flame className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                    <input
                      type="number"
                      min={50}
                      max={2000}
                      value={caloriesBurned}
                      onChange={(e) => setCaloriesBurned(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  Workout Notes or New PR (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hit a new 225 lb bench press PR!"
                  value={highlightNote}
                  onChange={(e) => setHighlightNote(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Trophy className="w-4 h-4" />
                  Save Workout
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

