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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-['Poppins',sans-serif] font-poppins">
      <div className="bg-[#0e1015] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] flex items-center justify-center">
              <Dumbbell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-['Syne',sans-serif] uppercase text-white tracking-wide">
                Log Today's Workout
              </h3>
              <p className="text-xs text-white/50">
                Track your gains and build your consistency streak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSaved ? (
            <div className="text-center py-6 space-y-3 animate-scale-up">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-[#ccff00]/15 border-2 border-[#ccff00] text-[#ccff00] flex items-center justify-center shadow-[0_0_20px_rgba(204,255,0,0.3)]">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h4 className="text-lg font-black font-['Syne',sans-serif] uppercase text-white">
                Workout Logged! 🔥
              </h4>
              <p className="text-xs text-white/60">
                +50 Community XP added to your leaderboard score!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/70 block mb-1.5 uppercase tracking-wider">
                  Workout Category
                </label>
                <select
                  value={exerciseType}
                  onChange={(e) => setExerciseType(e.target.value)}
                  className="w-full px-4 py-3 bg-[#121418] border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-[#ccff00]"
                >
                  <option value="Strength & Hypertrophy">🏋️ Heavy Strength / Lifting</option>
                  <option value="Cardio & HIIT Sprints">🏃 Cardio / Treadmill / HIIT</option>
                  <option value="Powerlifting (Squat/Bench/Dead)">💥 Powerlifting PR Day</option>
                  <option value="Functional Fitness & Core">🧘 Functional Fitness & Mobility</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1.5 uppercase tracking-wider">
                    Duration (Minutes)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                    <input
                      type="number"
                      min={10}
                      max={240}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 bg-[#121418] border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1.5 uppercase tracking-wider">
                    Est. Calories
                  </label>
                  <div className="relative">
                    <Flame className="w-4 h-4 text-[#ccff00] absolute left-3.5 top-3.5" />
                    <input
                      type="number"
                      min={50}
                      max={2000}
                      value={caloriesBurned}
                      onChange={(e) => setCaloriesBurned(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 bg-[#121418] border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white/70 block mb-1.5 uppercase tracking-wider">
                  Workout Notes or New PR (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hit a new 225 lb bench press PR!"
                  value={highlightNote}
                  onChange={(e) => setHighlightNote(e.target.value)}
                  className="w-full px-4 py-3 bg-[#121418] border border-white/10 rounded-2xl text-xs font-medium text-white placeholder:text-white/40 focus:outline-none focus:border-[#ccff00]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-5 rounded-full border border-white/10 text-white/70 hover:bg-white/10 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-3 px-6 rounded-full bg-[#ccff00] hover:bg-[#b8e600] text-black font-black text-xs transition shadow-[0_0_20px_rgba(204,255,0,0.25)] flex items-center gap-1.5 active:scale-95"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Save Workout</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

