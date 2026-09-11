import React, { useState } from 'react';
import { Dumbbell, Shield, Sparkles, Flame, CheckCircle2, ChevronRight, Award, Zap } from 'lucide-react';

export interface EquipmentItem {
  id: string;
  name: string;
  category: 'Heavy Iron' | 'Machines' | 'Nutrition & Fuel' | 'Recovery';
  tag: string;
  specs: string;
  description: string;
  imageUrl: string;
  highlightFeatures: string[];
}

export const GYM_EQUIPMENT_ITEMS: EquipmentItem[] = [
  {
    id: 'calibrated-plates',
    name: 'Calibrated Competition Steel Plates & Power Bar',
    category: 'Heavy Iron',
    tag: 'IPF Certified • 0.25% Precision',
    specs: '50mm Olympic Bore • 29mm Aggressive Volcano Knurl Barbell',
    description: 'Precision thin-cut cast steel competition plates calibrated to within 10 grams of declared weight. Pairs with 200,000 PSI tensile strength competition powerlifting barbells.',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop',
    highlightFeatures: ['Zero wobble friction sleeve bushings', 'Chromed hardened steel finish', 'Tested to 1,200 KG load capacity']
  },
  {
    id: 'heavy-dumbbells',
    name: 'Pro Urethane Dumbbells (2.5 KG to 70 KG)',
    category: 'Heavy Iron',
    tag: 'Full 10-Tier Commercial Rack',
    specs: 'Solid Steel Core • Impact Polyurethane Finish',
    description: 'Commercial grade solid-steel dumbbells encased in German polyurethane. Perfectly balanced knurled handles designed for heavy dumbbell flat presses, incline rows, and farmers carries.',
    imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=1000&auto=format&fit=crop',
    highlightFeatures: ['Laser-etched KG and LB indices', 'Ergonomic contoured chrome handles', 'Impact-dampening dropped protection']
  },
  {
    id: 'hammer-strength',
    name: 'ISO-Lateral Plate-Loaded Chest & Row Rigs',
    category: 'Machines',
    tag: 'Biomechanic Arc Movement',
    specs: 'Dual Independent Converging Axis',
    description: 'Hammer Strength plate-loaded machinery that isolates left and right sides independently, eliminating muscular imbalances and enabling safe beyond-failure training.',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
    highlightFeatures: ['Natural converging pectoral arc', 'Multiple ergonomic grip angles', 'Counterbalanced movement arms']
  },
  {
    id: 'turf-rig',
    name: '30-Yard Sprint Turf & Steel Prowler Sleds',
    category: 'Machines',
    tag: 'Athletic Conditioning & Explosiveness',
    specs: 'Shock-Absorbing High-Density Turf • Dual-Skid Sleds',
    description: 'Dedicated functional speed track for high-intensity prowler pushes, sled drags, battle rope conditioning, and sprinting to forge unyielding endurance and quad power.',
    imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=1000&auto=format&fit=crop',
    highlightFeatures: ['Non-marking high-traction turf', 'Low & high push bar handles', 'Weighted resistance plate horn']
  },
  {
    id: 'fuel-bar',
    name: 'IronVault Athlete Fuel & Supplement Bar',
    category: 'Nutrition & Fuel',
    tag: 'Microfiltered Whey & Creapure',
    specs: '28g Protein Per Serving • Zero Added Sugar',
    description: 'Freshly mixed cold pre-workout cocktails, 100% microfiltered grass-fed whey isolate shakes, Creapure creatine monohydrate, and intra-workout Himalayan pink salt electrolytes.',
    imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=1000&auto=format&fit=crop',
    highlightFeatures: ['Fresh iced shaker service', 'Informed-Choice tested supplements', 'Custom macros tailored to your goal']
  },
  {
    id: 'recovery-suite',
    name: 'Nordic Sauna & Contrast Cold Plunge',
    category: 'Recovery',
    tag: 'Muscle Hyperemia & CNS Reset',
    specs: '90°C Dry Cedar Sauna • 4°C Filtered Ice Plunge',
    description: 'Accelerate systemic recovery, reduce delayed onset muscle soreness (DOMS), and trigger norepinephrine release with our dedicated hot/cold contrast therapy suites.',
    imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop',
    highlightFeatures: ['UV-filtered circulating cold plunge', 'Nordic cedarwood aromatic stones', 'Rapid systemic anti-inflammatory protocol']
  }
];

export const GymEquipmentShowcase: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeItem, setActiveItem] = useState<EquipmentItem>(GYM_EQUIPMENT_ITEMS[0]);

  const categories = ['ALL', 'Heavy Iron', 'Machines', 'Nutrition & Fuel', 'Recovery'];

  const filteredItems = selectedCategory === 'ALL'
    ? GYM_EQUIPMENT_ITEMS
    : GYM_EQUIPMENT_ITEMS.filter(item => item.category === selectedCategory);

  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-black via-zinc-950 to-black text-white relative overflow-hidden">
      {/* Background styling */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Heavy Iron & Pro Training Arsenal</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Olympic-Grade Equipment. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400">
              No Compromises on Your Gains.
            </span>
          </h2>
          <p className="mt-4 text-sm text-zinc-400">
            Engineered specifically for powerlifters, bodybuilders, and high-performance athletes. Every barbell, plate, and machine is calibrated for precision.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Interactive Equipment Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveItem(item)}
              className={`group cursor-pointer rounded-3xl bg-zinc-900/70 border overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                activeItem.id === item.id
                  ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Image with overlay badge */}
              <div className="relative h-56 w-full overflow-hidden bg-zinc-950">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                  {item.tag}
                </span>
              </div>

              {/* Content Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">
                    {item.specs}
                  </span>
                  <h3 className="text-lg font-black text-white mt-1 group-hover:text-emerald-400 transition">
                    {item.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Highlights */}
                <div className="space-y-1.5 pt-3 border-t border-zinc-800/80">
                  {item.highlightFeatures.map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-[11px] text-zinc-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

