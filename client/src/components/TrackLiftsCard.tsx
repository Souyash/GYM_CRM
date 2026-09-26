import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Repeat,
  Layers,
  Clock,
  Sparkles,
  CheckCircle2,
  Dumbbell
} from 'lucide-react';

interface LiftItem {
  id: string;
  name: string;
  time: string;
  sets: number;
  reps: number;
  imageUrl: string;
}

const INITIAL_LIFTS: LiftItem[] = [
  {
    id: 'lift-1',
    name: 'Leg Extension',
    time: '12.00 pm',
    sets: 2,
    reps: 12,
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'lift-2',
    name: 'Adjustable Squat Rack',
    time: '12.00 pm',
    sets: 4,
    reps: 8,
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'lift-3',
    name: 'Dumbbell Incline Bench',
    time: '12.00 pm',
    sets: 3,
    reps: 10,
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'lift-4',
    name: 'Cable Tricep Pushdown',
    time: '12.00 pm',
    sets: 3,
    reps: 15,
    imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=200&auto=format&fit=crop&q=80'
  }
];

export const TrackLiftsCard: React.FC = () => {
  const [lifts, setLifts] = useState<LiftItem[]>(INITIAL_LIFTS);
  const [totalWorkoutsDays, setTotalWorkoutsDays] = useState<number>(10);
  const [thisWeekDays, setThisWeekDays] = useState<number>(10);
  const [uniqueWorkouts, setUniqueWorkouts] = useState<number>(6);
  const [setsToday, setSetsToday] = useState<number>(3);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const handleIncrementSet = (liftId: string) => {
    setLifts((prev) =>
      prev.map((l) => (l.id === liftId ? { ...l, sets: l.sets + 1 } : l))
    );
    setSetsToday((prev) => prev + 1);
    setJustAddedId(liftId);
    setTimeout(() => {
      setJustAddedId(null);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------- */}
      {/* 1. WEEKLY NUMBERS CARD (Screen 3 Top)                         */}
      {/* ------------------------------------------------------------- */}
      <div className="snapset-card rounded-3xl p-5 relative overflow-hidden transition-all duration-300">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Weekly numbers badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold mb-3">
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>Weekly numbers</span>
        </div>

        {/* Big headline */}
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="font-['Unbounded',sans-serif] font-black text-3xl sm:text-4xl text-white">
              {totalWorkoutsDays}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-zinc-400 font-mono">
              days Total Workouts
            </span>
          </div>
        </div>

        {/* 3-Column Numbers Strip (Screen 3) */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.08]">
          <div className="p-3 rounded-2xl bg-white/[0.03] text-center">
            <div className="font-['Unbounded',sans-serif] font-black text-xl text-white">
              {thisWeekDays}
            </div>
            <div className="text-[11px] font-semibold text-zinc-400 mt-0.5">
              This week
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] text-center">
            <div className="font-['Unbounded',sans-serif] font-black text-xl text-white">
              {uniqueWorkouts}
            </div>
            <div className="text-[11px] font-semibold text-zinc-400 mt-0.5">
              Unique Matches
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] text-center">
            <div className="font-['Unbounded',sans-serif] font-black text-xl text-[#ccff00]">
              {setsToday < 10 ? `0${setsToday}` : setsToday}
            </div>
            <div className="text-[11px] font-semibold text-zinc-400 mt-0.5">
              Sets today
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. TRACK YOUR LIFTS SECTION (Screen 3 Bottom)                  */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-white font-['Outfit']">
            Track Your Lifts
          </h3>
          <span className="text-xs text-zinc-500 font-mono">
            {lifts.length} machines calibrated
          </span>
        </div>

        <div className="space-y-2.5">
          {lifts.map((lift) => (
            <div
              key={lift.id}
              className="snapset-card snapset-card-hover rounded-2xl p-3.5 flex items-center justify-between gap-3 group"
            >
              {/* Left Machine Image Thumbnail */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/40 border border-white/10">
                <img
                  src={lift.imageUrl}
                  alt={lift.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Center Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#ccff00] transition">
                    {lift.name}
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    {lift.time}
                  </span>
                </div>

                {/* Pill indicators for sets and reps */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-zinc-300 text-[10px] font-mono">
                    <Layers className="w-3 h-3 text-[#ccff00]" />
                    <span>{lift.sets} Sets</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-zinc-300 text-[10px] font-mono">
                    <Repeat className="w-3 h-3 text-cyan-400" />
                    <span>{lift.reps} reps</span>
                  </span>
                </div>
              </div>

              {/* Right Action Button: Add + Pill Button */}
              <div className="shrink-0 pl-1">
                <button
                  type="button"
                  onClick={() => handleIncrementSet(lift.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                    justAddedId === lift.id
                      ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'bg-white/10 hover:bg-white/20 text-white hover:text-[#ccff00]'
                  }`}
                >
                  {justAddedId === lift.id ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <span>Add</span>
                      <Plus className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
