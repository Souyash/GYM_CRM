import React, { useState } from 'react';
import { Trophy, Flame, Target, Sparkles, Dumbbell, Award, ArrowUpRight } from 'lucide-react';

export interface AthleteSpotlight {
  id: string;
  name: string;
  division: string;
  stageWeight: string;
  bodyFat: string;
  benchPr: string;
  squatPr: string;
  deadliftPr: string;
  quote: string;
  trainingSplit: string;
  imageUrl: string;
  badge: string;
}

export const ATHLETES_SPOTLIGHT: AthleteSpotlight[] = [
  {
    id: 'alex-rivera',
    name: 'Alex Rivera',
    division: 'Classic Physique Competitor',
    stageWeight: '88.5 KG',
    bodyFat: '7.4%',
    benchPr: '165 KG',
    squatPr: '220 KG',
    deadliftPr: '265 KG',
    quote: '"IronVault’s Olympic platforms and heavy dumbbells took my back thickness and quad separation to championship caliber."',
    trainingSplit: 'Upper / Lower / Rest / Push / Pull / Legs',
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1200&auto=format&fit=crop',
    badge: '🏆 Overall Regional Champion'
  },
  {
    id: 'marcus-vance',
    name: 'Marcus Vance',
    division: 'Men’s Open Heavyweight',
    stageWeight: '112.0 KG',
    bodyFat: '8.2%',
    benchPr: '190 KG',
    squatPr: '260 KG',
    deadliftPr: '310 KG',
    quote: '"When you are moving 60 KG dumbbells and 5-plate squats, you need serious steel, calibrated plates, and intense atmosphere. This gym has it all."',
    trainingSplit: 'Push (Chest/Delts) • Pull (Back/Traps) • Quad Focus • Hamstring/Arms Focus',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
    badge: '⚡ Pro Card Qualifier'
  },
  {
    id: 'elena-chen',
    name: 'Elena "Valkyrie" Chen',
    division: 'Figure & Wellness Champion',
    stageWeight: '64.5 KG',
    bodyFat: '11.8%',
    benchPr: '95 KG',
    squatPr: '160 KG',
    deadliftPr: '195 KG',
    quote: '"The combination of hip thrust rigs, hack squats, and infrared saunas gave me the glute-hamstring sweep needed for the national stage."',
    trainingSplit: 'Glute Specialization • Upper Hypertrophy • Posterior Chain • Delts & Abs',
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1200&auto=format&fit=crop',
    badge: '🥇 National Wellness Gold'
  },
  {
    id: 'david-sterling',
    name: 'David Sterling',
    division: 'Competitive Powerbuilder',
    stageWeight: '94.0 KG',
    bodyFat: '9.5%',
    benchPr: '180 KG',
    squatPr: '240 KG',
    deadliftPr: '280 KG',
    quote: '"No fancy useless machines. Just brutal progressive overload, chalk stations, and an iron community that screams when you hit a PR."',
    trainingSplit: 'Heavy Compound Conjugate • Linear Periodization',
    imageUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1200&auto=format&fit=crop',
    badge: '💥 700 KG Total Club'
  }
];

export const BodybuildingAthletesSpotlight: React.FC = () => {
  const [activeAthlete, setActiveAthlete] = useState<AthleteSpotlight>(ATHLETES_SPOTLIGHT[0]);

  return (
    <section className="py-20 sm:py-28 bg-black text-white relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute -top-32 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-3">
              <Trophy className="w-3.5 h-3.5" />
              <span>Athletes & Champions Hall of Fame</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Forged in Iron. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-emerald-400">
                Bodybuilding Excellence.
              </span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
            Meet the competitive bodybuilders and lifters setting the standard at IronVault. Real athletes, real PRs, unmatched dedication.
          </p>
        </div>

        {/* Featured Athlete Showcase Spotlight Card */}
        <div className="rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-zinc-800 shadow-2xl overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Athlete Photo with dramatic lighting */}
            <div className="lg:col-span-5 relative h-80 lg:h-auto min-h-[380px] overflow-hidden bg-zinc-950">
              <img
                src={activeAthlete.imageUrl}
                alt={activeAthlete.name}
                className="w-full h-full object-cover object-top filter contrast-110 saturate-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-zinc-900/90" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500 text-black shadow-lg inline-block">
                  {activeAthlete.badge}
                </span>
              </div>
            </div>

            {/* Athlete Stats & Bio */}
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-2xl sm:text-4xl font-black text-white">
                      {activeAthlete.name}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mt-0.5">
                      {activeAthlete.division}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Stage Weight</span>
                      <span className="text-sm font-black text-white font-mono">{activeAthlete.stageWeight}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Body Fat</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">{activeAthlete.bodyFat}</span>
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-sm sm:text-base italic text-zinc-300 font-medium my-6 leading-relaxed">
                  {activeAthlete.quote}
                </p>

                {/* Big 3 Power PRs */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">
                      Bench Press
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono mt-1 block">
                      {activeAthlete.benchPr}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">
                      Barbell Squat
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1 block">
                      {activeAthlete.squatPr}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">
                      Deadlift
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1 block">
                      {activeAthlete.deadliftPr}
                    </span>
                  </div>
                </div>
              </div>

              {/* Training Split */}
              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-500 uppercase font-black text-[10px] tracking-widest block">
                    Competition Training Split
                  </span>
                  <span className="text-zinc-300 font-semibold mt-0.5 block">
                    {activeAthlete.trainingSplit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Athlete Selection Roster Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {ATHLETES_SPOTLIGHT.map((athlete) => (
            <div
              key={athlete.id}
              onClick={() => setActiveAthlete(athlete)}
              className={`p-4 rounded-2xl bg-zinc-900/70 border cursor-pointer transition flex items-center gap-3 ${
                activeAthlete.id === athlete.id
                  ? 'border-amber-500 bg-zinc-800/90 shadow-lg shadow-amber-500/10'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <img
                src={athlete.imageUrl}
                alt={athlete.name}
                className="w-12 h-12 rounded-xl object-cover object-top border border-zinc-700 shrink-0"
              />
              <div className="overflow-hidden">
                <h4 className="font-bold text-xs text-white truncate">{athlete.name}</h4>
                <p className="text-[10px] text-zinc-400 truncate">{athlete.division.split(' ')[0]}</p>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  DL {athlete.deadliftPr}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

