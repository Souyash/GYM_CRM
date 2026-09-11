import React, { useState } from 'react';
import { Dumbbell, Target, Flame, Sparkles, CheckCircle2, Trophy, Activity, Info } from 'lucide-react';

export type MuscleGroupId = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'quads' | 'hamstrings' | 'abs' | 'calves' | 'glutes';

export interface MuscleInfo {
  id: MuscleGroupId;
  name: string;
  category: 'Upper Body' | 'Lower Body' | 'Core';
  subMuscles: string[];
  keyExercises: string[];
  hypertrophyRepRange: string;
  intensityTips: string;
  activationScore: number;
  proAthleteNote: string;
}

export const MUSCLE_DATA: Record<MuscleGroupId, MuscleInfo> = {
  chest: {
    id: 'chest',
    name: 'Pectorals (Chest)',
    category: 'Upper Body',
    subMuscles: ['Clavicular Head (Upper)', 'Sternal Head (Mid-Lower)', 'Pectoralis Minor'],
    keyExercises: ['Incline Barbell Bench Press', 'Weighted Dips', 'Flat Dumbbell Press', 'Low-to-High Cable Flyes'],
    hypertrophyRepRange: '6 - 12 Reps • 4 Sets',
    intensityTips: 'Retract scapulae and pin shoulder blades into bench to isolate pec fibers without shoulder impingement.',
    activationScore: 96,
    proAthleteNote: 'Focus on maximum horizontal adduction and a deep 2-second stretch at the bottom of the movement.'
  },
  back: {
    id: 'back',
    name: 'Latissimus Dorsi & Traps (Back)',
    category: 'Upper Body',
    subMuscles: ['Latissimus Dorsi (Lats)', 'Rhomboids', 'Middle & Lower Trapezius', 'Erector Spinae'],
    keyExercises: ['Weighted Pull-Ups (Neutral Grip)', 'Meadows Rows', 'Chest-Supported T-Bar Row', 'Conventional Deadlifts'],
    hypertrophyRepRange: '6 - 10 Reps • 4-5 Sets',
    intensityTips: 'Pull with your elbows rather than biceps. Drive the elbows into your hip pockets for lat thickness.',
    activationScore: 98,
    proAthleteNote: 'Build the classic V-taper by combining wide-grip vertical pulling with heavy horizontal rowing.'
  },
  shoulders: {
    id: 'shoulders',
    name: 'Deltoids (Shoulders)',
    category: 'Upper Body',
    subMuscles: ['Anterior (Front)', 'Lateral (Side)', 'Posterior (Rear Delts)'],
    keyExercises: ['Seated Dumbbell Overhead Press', 'Cable Lateral Raises (Behind Back)', 'Face Pulls', 'Reverse Pec Deck'],
    hypertrophyRepRange: '10 - 15 Reps • 4 Sets',
    intensityTips: 'Keep pinkies slightly elevated on lateral raises to bias the lateral head for round, 3D capped shoulders.',
    activationScore: 94,
    proAthleteNote: 'Rear delts can take high frequency. Train them 3x per week to balance shoulder posture.'
  },
  biceps: {
    id: 'biceps',
    name: 'Biceps Brachii & Forearms',
    category: 'Upper Body',
    subMuscles: ['Long Head (Outer Peak)', 'Short Head (Inner Thickness)', 'Brachialis'],
    keyExercises: ['Incline Dumbbell Curls', 'Barbell Drag Curls', 'Bayesian Cable Curls', 'Hammer Curls'],
    hypertrophyRepRange: '8 - 12 Reps • 3-4 Sets',
    intensityTips: 'Supinate forcefully at the peak contraction and control a strict 3-second eccentric lower.',
    activationScore: 92,
    proAthleteNote: 'Train the brachialis with neutral-grip hammer curls to push the bicep peak upward.'
  },
  triceps: {
    id: 'triceps',
    name: 'Triceps Brachii',
    category: 'Upper Body',
    subMuscles: ['Long Head', 'Lateral Head (Horseshoe)', 'Medial Head'],
    keyExercises: ['Overhead Cable Triceps Extensions', 'Close-Grip Bench Press', 'Dual-Rope Cable Pushdowns', 'Weighted Dips'],
    hypertrophyRepRange: '8 - 15 Reps • 4 Sets',
    intensityTips: 'Overhead extensions fully lengthen the long head of the tricep which accounts for 60% of upper arm size.',
    activationScore: 95,
    proAthleteNote: 'Lock out fully with internal elbow rotation for maximum horseshoe definition.'
  },
  quads: {
    id: 'quads',
    name: 'Quadriceps (Front Thighs)',
    category: 'Lower Body',
    subMuscles: ['Rectus Femoris', 'Vastus Lateralis (Outer Sweep)', 'Vastus Medialis (Teardrop)', 'Vastus Intermedius'],
    keyExercises: ['High-Bar Barbell Squats', 'Hack Squats', 'Walking Barbell Lunges', 'Single-Leg Extensions'],
    hypertrophyRepRange: '8 - 15 Reps • 4-5 Sets',
    intensityTips: 'Elevate heels on wedges for deeper knee flexion and maximal vastus medialis teardrop development.',
    activationScore: 99,
    proAthleteNote: 'Controlled pauses at parallel eliminate rebound bounce and force mechanical tension on quad fibers.'
  },
  hamstrings: {
    id: 'hamstrings',
    name: 'Hamstrings & Posterior Chain',
    category: 'Lower Body',
    subMuscles: ['Biceps Femoris', 'Semitendinosus', 'Semimembranosus'],
    keyExercises: ['Romanian Deadlifts (RDLs)', 'Seated Hamstring Leg Curl', 'Nordic Hamstring Curls'],
    hypertrophyRepRange: '6 - 12 Reps • 4 Sets',
    intensityTips: 'Hinge back at the hips without rounding lumbar spine. Keep knees soft with shins nearly vertical.',
    activationScore: 97,
    proAthleteNote: 'Seated leg curls create greater hypertrophy than lying curls due to the lengthened hip posture.'
  },
  glutes: {
    id: 'glutes',
    name: 'Gluteus Maximus & Medius',
    category: 'Lower Body',
    subMuscles: ['Gluteus Maximus', 'Gluteus Medius', 'Gluteus Minimus'],
    keyExercises: ['Barbell Hip Thrusts', 'Bulgarian Split Squats', 'Cable Glute Kickbacks', 'Sumo Deadlifts'],
    hypertrophyRepRange: '8 - 12 Reps • 4 Sets',
    intensityTips: 'Full pelvic tuck at the top of the hip thrust with a 1-second isometric hold delivers maximal peak contraction.',
    activationScore: 96,
    proAthleteNote: 'Essential for hip power, athletic sprint acceleration, and heavy deadlift lockout.'
  },
  abs: {
    id: 'abs',
    name: 'Rectus Abdominis & Core',
    category: 'Core',
    subMuscles: ['Upper Abdominals', 'Lower Abdominals', 'Obliques', 'Transverse Abdominis'],
    keyExercises: ['Hanging Leg / Knee Raises', 'Cable Kneeling Crunches', 'Ab Wheel Rollouts', 'Vacuum Poses'],
    hypertrophyRepRange: '12 - 20 Reps • 3-4 Sets',
    intensityTips: 'Posteriorly tilt the pelvis as you curl your spine. Avoid pulling with hip flexors.',
    activationScore: 90,
    proAthleteNote: 'Practice transverse abdominis stomach vacuums every morning for a tight, aesthetic waistline.'
  },
  calves: {
    id: 'calves',
    name: 'Gastrocnemius & Soleus (Calves)',
    category: 'Lower Body',
    subMuscles: ['Gastrocnemius (Lateral & Medial)', 'Soleus'],
    keyExercises: ['Standing Machine Calf Raises', 'Seated Soleus Calf Raises', 'Donkey Calf Raises'],
    hypertrophyRepRange: '12 - 25 Reps • 4 Sets',
    intensityTips: 'Pause for 2 full seconds at the bottom stretch to eliminate Achilles tendon elasticity.',
    activationScore: 89,
    proAthleteNote: 'Calves require extreme mechanical stretch under load; stop bouncing and control the cadence.'
  }
};

interface BodybuildingAnatomyMapProps {
  onSelectMuscle?: (muscle: MuscleInfo) => void;
  selectedMuscleId?: MuscleGroupId;
  variant?: 'compact' | 'full';
}

export const BodybuildingAnatomyMap: React.FC<BodybuildingAnatomyMapProps> = ({
  onSelectMuscle,
  selectedMuscleId = 'chest',
  variant = 'full'
}) => {
  const [activeMuscleId, setActiveMuscleId] = useState<MuscleGroupId>(selectedMuscleId);
  const [activeView, setActiveView] = useState<'FRONT' | 'BACK'>('FRONT');

  const currentMuscle = MUSCLE_DATA[activeMuscleId];

  const handleMuscleClick = (id: MuscleGroupId) => {
    setActiveMuscleId(id);
    if (onSelectMuscle) {
      onSelectMuscle(MUSCLE_DATA[id]);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 dark:bg-black/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Physique Architecture</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Targeted Muscle Group Anatomy & Biomechanics
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Click any muscle group on the athletic figure to view pro bodybuilding exercises and hypertrophy protocols.
          </p>
        </div>

        {/* Front / Back Perspective Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950/80 rounded-2xl border border-zinc-800 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveView('FRONT')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeView === 'FRONT'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Front View
          </button>
          <button
            type="button"
            onClick={() => setActiveView('BACK')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeView === 'BACK'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Back View
          </button>
        </div>
      </div>

      {/* Main Grid: Bodybuilding Figure + Detail Card */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Side: Interactive Anatomical Bodybuilder Figure */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-zinc-950/70 to-zinc-900/60 rounded-3xl border border-zinc-800/80 relative">
          <div className="absolute top-4 left-4 text-[10px] font-mono font-black uppercase text-zinc-500 tracking-wider">
            VIEW: {activeView} ANATOMY
          </div>

          <div className="relative w-full max-w-[340px] h-[460px] flex items-center justify-center select-none">
            {/* Athletic Silhouette & Muscle SVG Illustration */}
            <svg
              viewBox="0 0 320 520"
              className="w-full h-full drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="bodyBase" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="glowHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="muscleWarm" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>

              {/* Head & Neck Base */}
              <circle cx="160" cy="50" r="26" fill="#1e293b" stroke="#334155" strokeWidth="2" />
              <path d="M148,74 L142,100 L178,100 L172,74 Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />

              {activeView === 'FRONT' ? (
                /* ================= FRONT BODYBUILDER ANATOMY ================= */
                <g>
                  {/* CHEST (Pectorals) */}
                  <g
                    onClick={() => handleMuscleClick('chest')}
                    className="cursor-pointer transition hover:opacity-90 group"
                  >
                    <path
                      d="M125,115 C140,113 155,117 160,125 C165,117 180,113 195,115 C210,125 215,160 195,175 C180,185 165,180 160,182 C155,180 140,185 125,175 C105,160 110,125 125,115 Z"
                      fill={activeMuscleId === 'chest' ? 'url(#glowHighlight)' : '#1e293b'}
                      stroke={activeMuscleId === 'chest' ? '#34d399' : '#334155'}
                      strokeWidth={activeMuscleId === 'chest' ? '3' : '1.5'}
                      className="transition duration-200"
                    />
                    <text x="160" y="152" textAnchor="middle" fill={activeMuscleId === 'chest' ? '#000000' : '#94a3b8'} fontSize="11" fontWeight="bold">
                      CHEST
                    </text>
                  </g>

                  {/* SHOULDERS (Anterior & Lateral Deltoids) */}
                  <g
                    onClick={() => handleMuscleClick('shoulders')}
                    className="cursor-pointer transition hover:opacity-90"
                  >
                    {/* Left Deltoid */}
                    <path
                      d="M95,118 C85,130 82,152 92,168 C102,175 110,165 115,145 C115,130 110,118 95,118 Z"
                      fill={activeMuscleId === 'shoulders' ? 'url(#glowHighlight)' : '#1e293b'}
                      stroke={activeMuscleId === 'shoulders' ? '#34d399' : '#334155'}
                      strokeWidth={activeMuscleId === 'shoulders' ? '3' : '1.5'}
                    />
                    {/* Right Deltoid */}
                    <path
                      d="M225,118 C235,130 238,152 228,168 C218,175 210,165 205,145 C205,130 210,118 225,118 Z"
                      fill={activeMuscleId === 'shoulders' ? 'url(#glowHighlight)' : '#1e293b'}
                      stroke={activeMuscleId === 'shoulders' ? '#34d399' : '#334155'}
                      strokeWidth={activeMuscleId === 'shoulders' ? '3' : '1.5'}
                    />
                    <text x="96" y="148" textAnchor="middle" fill={activeMuscleId === 'shoulders' ? '#000' : '#94a3b8'} fontSize="9" fontWeight="bold">DELT</text>
                    <text x="224" y="148" textAnchor="middle" fill={activeMuscleId === 'shoulders' ? '#000' : '#94a3b8'} fontSize="9" fontWeight="bold">DELT</text>
                  </g>

                  {/* ARMS / BICEPS */}
                  <g
                    onClick={() => handleMuscleClick('biceps')}
                    className="cursor-pointer transition hover:opacity-90"
                  >
                    {/* Left Bicep & Forearm */}
                    <path
                      d="M86,170 C75,185 70,210 75,235 C85,245 92,235 96,215 C100,195 98,175 86,170 Z"
                      fill={activeMuscleId === 'biceps' ? 'url(#glowHighlight)' : '#1e293b'}
                      stroke={activeMuscleId === 'biceps' ? '#34d399' : '#334155'}
                      strokeWidth={activeMuscleId === 'biceps' ? '3' : '1.5'}
                    />
                    <path d="M72,238 C62,260 55,290 62,310 C70,312 78,300 84,275 C88,255 82,240 72,238 Z" fill="#1e293b" stroke="#334155" />

                    {/* Right Bicep & Forearm */}
                    <path
                      d="M234,170 C245,185 250,210 245,235 C235,245 228,235 224,215 C220,195 222,175 234,170 Z"
                      fill={activeMuscleId === 'biceps' ? 'url(#glowHighlight)' : '#1e293b'}
                      stroke={activeMuscleId === 'biceps' ? '#34d399' : '#334155'}
                      strokeWidth={activeMuscleId === 'biceps' ? '3' : '1.5'}
                    />
                    <path d="M248,238 C258,260 265,290 258,310 C250,312 242,300 236,275 C232,255 238,240 248,238 Z" fill="#1e293b" stroke="#334155" />

                    <text x="86" y="206" textAnchor="middle" fill={activeMuscleId === 'biceps' ? '#000' : '#94a3b8'} fontSize="9" fontWeight="bold">ARM</text>
                    <text x="234" y="206" textAnchor="middle" fill={activeMuscleId === 'biceps' ? '#000' : '#94a3b8'} fontSize="9" fontWeight="bold">ARM</text>
                  </g>

                  {/* ABS / CORE */}
                  <g
                    onClick={() => handleMuscleClick('abs')}
                    className="cursor-pointer transition hover:opacity-90"
                  >
                    <path
                      d="M136,188 L184,188 L180,265 C175,275 160,285 160,285 C160,285 145,275 140,265 Z"
                      fill={activeMuscleId === 'abs' ? 'url(#glowHighlight)' : '#1e293b'}
                      stroke={activeMuscleId === 'abs' ? '#34d399' : '#334155'}
                      strokeWidth={activeMuscleId === 'abs' ? '3' : '1.5'}
                    />
                    {/* Six pack lines */}
                    <line x1="160" y1="190" x2="160" y2="265" stroke="#334155" strokeWidth="1.5" />
                    <line x1="140" y1="212" x2="180" y2="212" stroke="#334155" strokeWidth="1.5" />
                    <line x1="142" y1="236" x2="178" y2="236" stroke="#334155" strokeWidth="1.5" />
                    <text x="160" y="245" textAnchor="middle" fill={activeMuscleId === 'abs' ? '#000' : '#94a3b8'} fontSize="10" fontWeight="bold">ABS</text>
                  </g>

                  {/* QUADS (Quadriceps) */}
                  <g
                    onClick={() => handleMuscleClick('quads')}
                    className="cursor-pointer transition hover:opacity-90"
                  >
                    {/* Left Quad */}
                    <path
                      d="M125,290 C110,310 105,360 120,410 C130,420 148,420 152,400 C155,360 152,320 145,290 Z"
                      fill={activeMuscleId === 'quads' ? 'url(#glowHighlight)' : '#1e293b'}
                      stroke={activeMuscleId === 'quads' ? '#34d399' : '#334155'}
                      strokeWidth={activeMuscleId === 'quads' ? '3' : '1.5'}
                    />
                    {/* Right Quad */}
                    <path
                      d="M195,290 C210,310 215,360 200,410 C190,420 172,420 168,400 C165,360 168,320 175,290 Z"
                      fill={activeMuscleId === 'quads' ? 'url(#glowHighlight)' : '#1e293b'}
                      stroke={activeMuscleId === 'quads' ? '#34d399' : '#334155'}
                      strokeWidth={activeMuscleId === 'quads' ? '3' : '1.5'}
                    />
                    <text x="135" y="355" textAnchor="middle" fill={activeMuscleId === 'quads' ? '#000' : '#94a3b8'} fontSize="10" fontWeight="bold">QUADS</text>
                    <text x="185" y="355" textAnchor="middle" fill={activeMuscleId === 'quads' ? '#000' : '#94a3b8'} fontSize="10" fontWeight="bold">QUADS</text>
                  </g>

                  {/* CALVES */}
                  <g
                    onClick={() => handleMuscleClick('calves')}
                    className="cursor-pointer transition hover:opacity-90"
                  >
                    <path d="M122,425 C115,445 118,485 125,505 L142,505 C146,485 145,445 138,425 Z" fill={activeMuscleId === 'calves' ? 'url(#glowHighlight)' : '#1e293b'} stroke="#334155" />
                    <path d="M198,425 C205,445 202,485 195,505 L178,505 C174,485 175,445 182,425 Z" fill={activeMuscleId === 'calves' ? 'url(#glowHighlight)' : '#1e293b'} stroke="#334155" />
                    <text x="132" y="470" textAnchor="middle" fill={activeMuscleId === 'calves' ? '#000' : '#94a3b8'} fontSize="8" fontWeight="bold">CALF</text>
                    <text x="188" y="470" textAnchor="middle" fill={activeMuscleId === 'calves' ? '#000' : '#94a3b8'} fontSize="8" fontWeight="bold">CALF</text>
                  </g>
                </g>
              ) : (
                /* ================= BACK BODYBUILDER ANATOMY ================= */
                <g>
                  {/* TRAPEZIUS & UPPER BACK */}
                  <path d="M142,98 L178,98 L200,120 L160,155 L120,120 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />

                  {/* LATS / FULL BACK */}
                  <g
                    onClick={() => handleMuscleClick('back')}
                    className="cursor-pointer transition hover:opacity-90"
                  >
                    <path
                      d="M120,120 L160,155 L200,120 C220,150 225,200 185,250 C175,260 160,265 160,265 C160,265 145,260 135,250 C95,200 100,150 120,120 Z"
                      fill={activeMuscleId === 'back' ? 'url(#glowHighlight)' : '#1e293b'}
                      stroke={activeMuscleId === 'back' ? '#34d399' : '#334155'}
                      strokeWidth={activeMuscleId === 'back' ? '3' : '1.5'}
                    />
                    <text x="160" y="195" textAnchor="middle" fill={activeMuscleId === 'back' ? '#000' : '#94a3b8'} fontSize="11" fontWeight="bold">
                      LATS / BACK
                    </text>
                  </g>

                  {/* TRICEPS (Back of arm) */}
                  <g
                    onClick={() => handleMuscleClick('triceps')}
                    className="cursor-pointer transition hover:opacity-90"
                  >
                    <path
                      d="M84,145 C75,165 72,210 82,230 C90,230 96,210 98,180 C98,160 92,145 84,145 Z"
                      fill={activeMuscleId === 'triceps' ? 'url(#glowHighlight)' : '#1e293b'}
                      stroke={activeMuscleId === 'triceps' ? '#34d399' : '#334155'}
                      strokeWidth={activeMuscleId === 'triceps' ? '3' : '1.5'}
                    />
                    <path
                      d="M236,145 C245,165 248,210 238,230 C230,230 224,210 222,180 C222,160 228,145 236,145 Z"
                      fill={activeMuscleId === 'triceps' ? 'url(#glowHighlight)' : '#1e293b'}
                      stroke={activeMuscleId === 'triceps' ? '#34d399' : '#334155'}
                      strokeWidth={activeMuscleId === 'triceps' ? '3' : '1.5'}
                    />
                    <text x="86" y="195" textAnchor="middle" fill={activeMuscleId === 'triceps' ? '#000' : '#94a3b8'} fontSize="8" fontWeight="bold">TRI</text>
                    <text x="234" y="195" textAnchor="middle" fill={activeMuscleId === 'triceps' ? '#000' : '#94a3b8'} fontSize="8" fontWeight="bold">TRI</text>
                  </g>

                  {/* GLUTES */}
                  <g
                    onClick={() => handleMuscleClick('glutes')}
                    className="cursor-pointer transition hover:opacity-90"
                  >
                    <path
                      d="M130,268 C115,280 118,325 140,340 C155,345 160,330 160,330 C160,330 165,345 180,340 C202,325 205,280 190,268 C175,260 145,260 130,268 Z"
                      fill={activeMuscleId === 'glutes' ? 'url(#glowHighlight)' : '#1e293b'}
                      stroke={activeMuscleId === 'glutes' ? '#34d399' : '#334155'}
                      strokeWidth={activeMuscleId === 'glutes' ? '3' : '1.5'}
                    />
                    <line x1="160" y1="270" x2="160" y2="335" stroke="#334155" strokeWidth="1.5" />
                    <text x="160" y="305" textAnchor="middle" fill={activeMuscleId === 'glutes' ? '#000' : '#94a3b8'} fontSize="10" fontWeight="bold">GLUTES</text>
                  </g>

                  {/* HAMSTRINGS (Posterior Thigh) */}
                  <g
                    onClick={() => handleMuscleClick('hamstrings')}
                    className="cursor-pointer transition hover:opacity-90"
                  >
                    <path
                      d="M125,345 C118,370 120,410 130,420 C140,422 152,410 150,370 C150,350 145,340 125,345 Z"
                      fill={activeMuscleId === 'hamstrings' ? 'url(#glowHighlight)' : '#1e293b'}
                      stroke={activeMuscleId === 'hamstrings' ? '#34d399' : '#334155'}
                      strokeWidth={activeMuscleId === 'hamstrings' ? '3' : '1.5'}
                    />
                    <path
                      d="M195,345 C202,370 200,410 190,420 C180,422 168,410 170,370 C170,350 175,340 195,345 Z"
                      fill={activeMuscleId === 'hamstrings' ? 'url(#glowHighlight)' : '#1e293b'}
                      stroke={activeMuscleId === 'hamstrings' ? '#34d399' : '#334155'}
                      strokeWidth={activeMuscleId === 'hamstrings' ? '3' : '1.5'}
                    />
                    <text x="136" y="380" textAnchor="middle" fill={activeMuscleId === 'hamstrings' ? '#000' : '#94a3b8'} fontSize="9" fontWeight="bold">HAMS</text>
                    <text x="184" y="380" textAnchor="middle" fill={activeMuscleId === 'hamstrings' ? '#000' : '#94a3b8'} fontSize="9" fontWeight="bold">HAMS</text>
                  </g>

                  {/* CALVES (Back View) */}
                  <g
                    onClick={() => handleMuscleClick('calves')}
                    className="cursor-pointer transition hover:opacity-90"
                  >
                    <path d="M122,430 C114,450 116,490 125,510 L144,510 C148,490 146,450 138,430 Z" fill={activeMuscleId === 'calves' ? 'url(#glowHighlight)' : '#1e293b'} stroke="#334155" />
                    <path d="M198,430 C206,450 204,490 195,510 L176,510 C172,490 174,450 182,430 Z" fill={activeMuscleId === 'calves' ? 'url(#glowHighlight)' : '#1e293b'} stroke="#334155" />
                    <text x="132" y="475" textAnchor="middle" fill={activeMuscleId === 'calves' ? '#000' : '#94a3b8'} fontSize="8" fontWeight="bold">CALF</text>
                    <text x="188" y="475" textAnchor="middle" fill={activeMuscleId === 'calves' ? '#000' : '#94a3b8'} fontSize="8" fontWeight="bold">CALF</text>
                  </g>
                </g>
              )}
            </svg>
          </div>

          {/* Quick Select Muscle Pills below Figure */}
          <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-sm">
            {Object.values(MUSCLE_DATA).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleMuscleClick(m.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                  activeMuscleId === m.id
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Detailed Hypertrophy Protocol & Exercises */}
        <div className="lg:col-span-6 space-y-5">
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-zinc-800 shadow-xl relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {currentMuscle.category}
                </span>
                <h4 className="text-2xl font-black text-white mt-1">
                  {currentMuscle.name}
                </h4>
              </div>

              {/* Activation Metric Gauge */}
              <div className="text-right">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                  Fiber Activation
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {currentMuscle.activationScore}%
                </span>
              </div>
            </div>

            {/* Sub-muscles tags */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {currentMuscle.subMuscles.map((sm) => (
                <span
                  key={sm}
                  className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-semibold"
                >
                  {sm}
                </span>
              ))}
            </div>

            {/* Rep Range & Intensity */}
            <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800/80">
              <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Hypertrophy Cadence
                </span>
                <span className="text-xs font-black text-white mt-0.5 block">
                  {currentMuscle.hypertrophyRepRange}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Progression Model
                </span>
                <span className="text-xs font-black text-amber-400 mt-0.5 block">
                  RPE 8-9.5 (1-2 RIR)
                </span>
              </div>
            </div>
          </div>

          {/* Key Recommended Exercises */}
          <div className="p-6 rounded-3xl bg-zinc-950/60 border border-zinc-800 space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Olympic & Heavy Hypertrophy Movements</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentMuscle.keyExercises.map((ex, idx) => (
                <div
                  key={ex}
                  className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center gap-2.5 text-xs text-white hover:border-emerald-500/50 transition"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-semibold truncate">{ex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Athlete Coaching Tip */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-black block uppercase tracking-wider text-[10px] text-amber-400">
                Coach / Bodybuilder Cue:
              </span>
              <p className="mt-0.5 leading-relaxed text-zinc-300">
                {currentMuscle.intensityTips}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

