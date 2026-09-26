import React, { useState } from 'react';
import {
  Flame,
  Clock,
  Zap,
  Dumbbell,
  LayoutGrid,
  CircleDot,
  QrCode,
  Sparkles
} from 'lucide-react';

interface ConcentricActivityRingsProps {
  workoutsDone?: number;
  workoutsGoal?: number;
  durationMinutes?: number;
  durationGoal?: number;
  volumeLbs?: number;
  volumeGoal?: number;
  setsDone?: number;
  setsGoal?: number;
  onCenterClick?: () => void;
  defaultView?: 'rings' | 'grid';
}

export const ConcentricActivityRings: React.FC<ConcentricActivityRingsProps> = ({
  workoutsDone = 4,
  workoutsGoal = 5,
  durationMinutes = 75,
  durationGoal = 89,
  volumeLbs = 2320,
  volumeGoal = 5052,
  setsDone = 2,
  setsGoal = 9,
  onCenterClick,
  defaultView = 'rings'
}) => {
  const [viewMode, setViewMode] = useState<'rings' | 'grid'>(defaultView);

  // SVG parameters
  // Radii for concentric circles: Red (64), Orange (50), Cyan (36), Green (22)
  const size = 180;
  const center = size / 2;

  const rings = [
    {
      id: 'workouts',
      label: 'Workouts',
      value: workoutsDone,
      goal: workoutsGoal,
      displayVal: `${workoutsDone}/${workoutsGoal < 10 ? '0' : ''}${workoutsGoal}`,
      color: '#FF453A', // Apple/SnapSets Red
      glowColor: 'rgba(255, 69, 58, 0.45)',
      radius: 68,
      strokeWidth: 8,
      icon: Flame,
      unit: ''
    },
    {
      id: 'duration',
      label: 'Duration',
      value: durationMinutes,
      goal: durationGoal,
      displayVal: `${durationMinutes}/${durationGoal} Min`,
      color: '#FF9F0A', // Amber/Orange
      glowColor: 'rgba(255, 159, 10, 0.45)',
      radius: 54,
      strokeWidth: 8,
      icon: Clock,
      unit: 'Min'
    },
    {
      id: 'volume',
      label: 'Volume',
      value: volumeLbs,
      goal: volumeGoal,
      displayVal: `${volumeLbs.toLocaleString()}/${volumeGoal.toLocaleString()} lbs`,
      color: '#00C7BE', // Cyan/Blue
      glowColor: 'rgba(0, 199, 190, 0.45)',
      radius: 40,
      strokeWidth: 8,
      icon: Zap,
      unit: 'lbs'
    },
    {
      id: 'sets',
      label: 'Sets',
      value: setsDone,
      goal: setsGoal,
      displayVal: `${setsDone}/${setsGoal < 10 ? '0' : ''}${setsGoal}`,
      color: '#32D74B', // Vibrant Green
      glowColor: 'rgba(50, 215, 75, 0.45)',
      radius: 26,
      strokeWidth: 8,
      icon: Dumbbell,
      unit: ''
    }
  ];

  return (
    <div className="snapset-card rounded-3xl p-5 relative overflow-hidden transition-all duration-300">
      {/* Top Ambient Glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with View Mode Switcher */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
            Daily Intensity
          </span>
        </div>

        {/* View Toggle Pill */}
        <div className="flex items-center p-1 rounded-full bg-black/40 border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('rings')}
            className={`p-1.5 rounded-full transition-all cursor-pointer ${
              viewMode === 'rings'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Concentric Activity Rings"
          >
            <CircleDot className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-full transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="2x2 Bento Metric Grid"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {viewMode === 'rings' ? (
        /* SCREEN 1 INSPO: Concentric Rings + Vertical Telemetry */
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          {/* Left SVG Concentric Rings */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-90"
            >
              {rings.map((ring) => {
                const circumference = 2 * Math.PI * ring.radius;
                const ratio = Math.min(1, ring.value / ring.goal);
                const strokeDashoffset = circumference - ratio * circumference;

                return (
                  <React.Fragment key={ring.id}>
                    {/* Background Track */}
                    <circle
                      cx={center}
                      cy={center}
                      r={ring.radius}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth={ring.strokeWidth}
                    />

                    {/* Progress Ring with Glow */}
                    <circle
                      cx={center}
                      cy={center}
                      r={ring.radius}
                      fill="none"
                      stroke={ring.color}
                      strokeWidth={ring.strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{
                        filter: `drop-shadow(0 0 6px ${ring.glowColor})`,
                        transition: 'stroke-dashoffset 0.8s ease-out'
                      }}
                    />
                  </React.Fragment>
                );
              })}
            </svg>

            {/* Central Viewfinder / Quick QR Trigger */}
            <button
              type="button"
              onClick={onCenterClick}
              className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#121622]/90 hover:bg-[#1a2030] border border-white/20 flex flex-col items-center justify-center group cursor-pointer transition active:scale-95 shadow-[0_0_15px_rgba(0,0,0,0.6)]"
              title="Quick Turnstile Check-In"
            >
              {/* Viewfinder corner brackets */}
              <div className="relative w-5 h-5 flex items-center justify-center">
                <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-white/70 group-hover:border-[#ccff00]" />
                <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-white/70 group-hover:border-[#ccff00]" />
                <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-white/70 group-hover:border-[#ccff00]" />
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-white/70 group-hover:border-[#ccff00]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse" />
              </div>
            </button>
          </div>

          {/* Right Side Telemetry Metrics List (Exactly like Screen 1) */}
          <div className="flex-1 w-full space-y-3.5">
            {rings.map((ring) => {
              const Icon = ring.icon;
              return (
                <div
                  key={ring.id}
                  className="flex items-center justify-between p-2 sm:p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${ring.color}15`,
                        color: ring.color,
                        boxShadow: `0 0 12px ${ring.glowColor}`
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-400">
                      {ring.label}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-bold text-white font-mono">
                      {ring.displayVal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* SCREEN 2 INSPO: 2x2 Bento Metric Grid */
        <div className="grid grid-cols-2 gap-3 relative z-10 animate-in fade-in duration-200">
          {rings.map((ring) => {
            const Icon = ring.icon;
            return (
              <div
                key={ring.id}
                className="snapset-inner-card rounded-2xl p-4 flex flex-col items-center justify-center text-center group hover:border-white/15 transition relative overflow-hidden"
              >
                {/* Subtle Radial Glow */}
                <div
                  className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-xl pointer-events-none opacity-30"
                  style={{ backgroundColor: ring.color }}
                />

                {/* Glowing Icon Circle */}
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2.5 transition group-hover:scale-105"
                  style={{
                    backgroundColor: `${ring.color}18`,
                    color: ring.color,
                    border: `1px solid ${ring.color}35`,
                    boxShadow: `0 0 16px ${ring.glowColor}`
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Metric Value */}
                <div className="font-['Unbounded',sans-serif] font-black text-lg sm:text-xl text-white tracking-tight leading-none mb-1">
                  {ring.value}
                  <span className="text-xs font-normal text-zinc-500 font-mono ml-0.5">
                    /{ring.goal < 10 && ring.id !== 'volume' && ring.id !== 'duration' ? `0${ring.goal}` : ring.goal}
                  </span>
                </div>

                {/* Metric Label */}
                <span className="text-[11px] font-semibold text-zinc-400">
                  {ring.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
