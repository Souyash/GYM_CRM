import React, { useState } from 'react';
import { Flame, Trophy, Plus, ChevronRight, Sparkles, Check } from 'lucide-react';

interface PRItem {
  id: string;
  name: string;
  duration: string;
  calories: string;
  date: string;
  weight: string;
  oneRepMax: string;
}

const DEFAULT_PRS: PRItem[] = [
  {
    id: 'pr-1',
    name: 'Barbell in Power Rack',
    duration: '5m 23s',
    calories: '12 kcal',
    date: '26 Nov',
    weight: '180 lbs',
    oneRepMax: '1RM 240 lbs'
  },
  {
    id: 'pr-2',
    name: 'Barbell Deadlift',
    duration: '8m 15s',
    calories: '45 kcal',
    date: 'Today',
    weight: '225 lbs',
    oneRepMax: '1RM 285 lbs'
  },
  {
    id: 'pr-3',
    name: 'Hammer Strength Plate-Loaded...',
    duration: '5m 23s',
    calories: '12 kcal',
    date: 'Yesterday',
    weight: '180 lbs',
    oneRepMax: '1RM 240 lbs'
  },
  {
    id: 'pr-4',
    name: 'Adjustable Squat Rack',
    duration: '11m 30s',
    calories: '55 kcal',
    date: '24 Nov',
    weight: '265 lbs',
    oneRepMax: '1RM 315 lbs'
  }
];

export const PersonalRecordsCard: React.FC = () => {
  const [prs, setPrs] = useState<PRItem[]>(DEFAULT_PRS);
  const [isAddingPr, setIsAddingPr] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [newExercise, setNewExercise] = useState('');
  const [newWeight, setNewWeight] = useState('');

  const handleAddPr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExercise.trim() || !newWeight.trim()) return;

    const numericWeight = parseInt(newWeight.replace(/[^0-9]/g, '')) || 150;
    const estimated1rm = Math.round(numericWeight * 1.33);

    const newItem: PRItem = {
      id: `pr-${Date.now()}`,
      name: newExercise.trim(),
      duration: '4m 30s',
      calories: '15 kcal',
      date: 'Today',
      weight: `${numericWeight} lbs`,
      oneRepMax: `1RM ${estimated1rm} lbs`
    };

    setPrs([newItem, ...prs]);
    setNewExercise('');
    setNewWeight('');
    setIsAddingPr(false);
  };

  const visiblePrs = showAll ? prs : prs.slice(0, 3);

  return (
    <div className="snapset-card rounded-3xl p-5 relative overflow-hidden transition-all duration-300">
      {/* Top Ambient Corner Glow */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#ccff00]" />
          <h3 className="text-base font-bold text-white font-['Outfit']">
            Your PRs
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddingPr((prev) => !prev)}
            className="text-xs font-semibold text-zinc-400 hover:text-[#ccff00] transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
          >
            {showAll ? 'Collapse' : 'All'}
          </button>
        </div>
      </div>

      {/* Add New PR Form Drawer */}
      {isAddingPr && (
        <form
          onSubmit={handleAddPr}
          className="mb-4 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5 animate-in fade-in"
        >
          <div className="text-xs font-bold text-zinc-300">Record New Personal Best</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Exercise (e.g. Incline Bench)"
              value={newExercise}
              onChange={(e) => setNewExercise(e.target.value)}
              className="px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00]"
            />
            <input
              type="number"
              placeholder="Weight in lbs (e.g. 200)"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingPr(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#ccff00] text-black font-black text-xs hover:bg-[#b8e600]"
            >
              Save PR
            </button>
          </div>
        </form>
      )}

      {/* PR List items matching Screen 1 & 2 */}
      <div className="divide-y divide-white/[0.06] relative z-10">
        {visiblePrs.map((pr) => (
          <div
            key={pr.id}
            className="py-3 flex items-center justify-between gap-3 group hover:bg-white/[0.02] px-1 rounded-xl transition"
          >
            {/* Left Side: Flame Icon in circle + Title & Subtitle */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(244,63,94,0.2)] group-hover:scale-105 transition">
                <Flame className="w-4 h-4 fill-rose-500/40" />
              </div>

              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#ccff00] transition">
                  {pr.name}
                </h4>
                <p className="text-[11px] text-zinc-500 truncate font-mono">
                  {pr.duration} &bull; {pr.calories} &bull; {pr.date}
                </p>
              </div>
            </div>

            {/* Right Side: Weight & 1RM */}
            <div className="text-right shrink-0">
              <div className="text-xs sm:text-sm font-bold text-white font-mono">
                {pr.weight}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {pr.oneRepMax}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
