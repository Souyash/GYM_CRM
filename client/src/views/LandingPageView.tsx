import React, { useState, useEffect } from 'react';
import {
  Play,
  X,
  ChevronRight,
  Sparkles,
  Check,
  Shield,
  QrCode,
  Users,
  Dumbbell,
  ArrowRight,
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle2,
  Zap,
  Monitor
} from 'lucide-react';

interface LandingPageViewProps {
  onOpenAuth: (tab?: 'MEMBER_LOGIN' | 'STAFF_LOGIN' | 'SIGNUP' | 'REGISTER_BUSINESS', planName?: string) => void;
  isLoggedIn?: boolean;
  onGoToDashboard?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onOpenAuth,
  isLoggedIn = false,
  onGoToDashboard
}) => {
  // Active component of body fitness tab
  const [activeComponent, setActiveComponent] = useState<string>('Strength & Endurance');
  
  // Video Modal State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);

  // Functional training strip toggle
  const [isFunctionalStripOpen, setIsFunctionalStripOpen] = useState<boolean>(true);

  // Contact / Inquire Modal State
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [installTab, setInstallTab] = useState<'ios' | 'android' | 'desktop'>('android');

  useEffect(() => {
    // Detect if running in standalone mode (already installed as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsAppInstalled(true);
    }

    // Auto-detect Operating System
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setInstallTab('ios');
    } else if (/android/.test(ua)) {
      setInstallTab('android');
    } else {
      setInstallTab('desktop');
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsAppInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  const fitnessComponentsData: Record<string, string> = {
    'Body Composition':
      'Optimize fat-to-muscle ratio through targeted resistance training, metabolic circuits, and balanced macro-nutrition coaching engineered to sculpt athletic definition.',
    'Flexibility':
      'Dynamic stretching protocols and joint decompression drills that expand range of motion, relieve muscular tightness, and prepare you for peak performance.',
    'Mobility':
      'Functional joint stabilization and kinetic alignment drills designed to unlock fluid athletic movement, posture correction, and full-depth squat mechanics.',
    'Strength & Endurance':
      'Strength exercises to build power, while endurance ensures you can maintain front force over time. Nutritional motivation trusts it all before building strong recovery and preventing fatigue.',
    'Personal training':
      'One-on-one elite guidance from certified master coaches who tailor every repetition, progressive overload phase, and recovery routine to your personal biology.'
  };

  const fitnessPills = [
    'Body Composition',
    'Flexibility',
    'Mobility',
    'Strength & Endurance',
    'Personal training'
  ];

  const trainers = [
    {
      name: 'Saket Sharma',
      title: 'Fitness Mr India',
      image: 'https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?auto=format&fit=crop&w=600&q=80',
      borderColor: 'border-cyan-400/50'
    },
    {
      name: 'Alex Cooper',
      title: 'National level Trainer',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
      borderColor: 'border-white/10'
    },
    {
      name: 'Julie Marie',
      title: 'Tennis Champion',
      image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=600&q=80',
      borderColor: 'border-cyan-400/50'
    },
    {
      name: 'Rachel Joe',
      title: 'Olympic Champion',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
      borderColor: 'border-white/10'
    }
  ];

  const pricingPlans = [
    {
      name: 'Day Pass',
      price: '$12',
      period: 'per visit',
      description: 'Instant full facility access for drop-in athletes and travelers.',
      features: ['Zero contract, 100% digital QR pass', 'Locker room & sauna access', 'Strength & cardio floors'],
      highlight: false,
      btnLabel: 'Get Day Pass',
      tab: 'SIGNUP' as const
    },
    {
      name: 'All-Access Pro',
      price: '$49',
      period: 'per month',
      description: 'Our most popular membership with unlimited club access and perks.',
      features: ['Unlimited entry with auto-refresh QR pass', 'All group fitness classes included', 'Live floor headcount in member app', 'Free monthly guest passes'],
      highlight: true,
      btnLabel: 'Start Free Trial',
      tab: 'SIGNUP' as const
    },
    {
      name: 'Gym Owner OS',
      price: '$99',
      period: 'per month',
      description: 'Complete zero-hardware CRM, turnstile camera scanner, & billing.',
      features: ['Hardware-free camera gate access', 'GPS geofence check-in verification', 'Live manager attendance radar', 'Full member CRM & billing'],
      highlight: false,
      btnLabel: 'Register Gym',
      tab: 'REGISTER_BUSINESS' as const
    }
  ];

  return (
    <div className="min-h-screen bg-[#050507] text-white font-['Poppins',sans-serif] font-poppins selection:bg-[#ccff00] selection:text-black antialiased overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. BRAND HEADER                                                           */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#050507]/90 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none group shrink-0"
          >
            <span className="font-['Poppins',sans-serif] font-black text-lg sm:text-2xl lg:text-3xl tracking-wider text-white group-hover:text-[#ccff00] transition-colors">
              PROFITNESS
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-semibold text-zinc-300">
            <a href="#home" className="hover:text-[#ccff00] transition-colors">
              Home
            </a>
            <a href="#features" className="hover:text-[#ccff00] transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-[#ccff00] transition-colors">
              Pricing
            </a>
            <a href="#components" className="hover:text-[#ccff00] transition-colors">
              Blog
            </a>
            <a href="#team" className="hover:text-[#ccff00] transition-colors">
              About us
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Install App Button in Header */}
            <button
              onClick={handleInstallClick}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#121418] hover:bg-[#1a1e26] border border-[#ccff00]/40 hover:border-[#ccff00] text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-all shadow-[0_0_15px_rgba(204,255,0,0.15)] cursor-pointer active:scale-95 shrink-0"
              title="Install PROFITNESS App to your device"
            >
              <Download className="w-3.5 h-3.5 text-[#ccff00]" />
              <span className="hidden sm:inline">Install App</span>
              <span className="sm:hidden">Install</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse" />
            </button>

            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#ccff00] text-black font-extrabold text-[11px] sm:text-xs tracking-tight shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('MEMBER_LOGIN')}
                  className="hidden sm:inline-flex px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="hidden xs:inline-flex px-2.5 sm:px-5 py-1.5 sm:py-2 rounded-full border border-white/40 hover:border-white text-white hover:bg-white hover:text-black font-semibold text-[11px] sm:text-xs tracking-tight transition-all cursor-pointer shrink-0"
                >
                  Contact
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main id="home" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-14 pb-20 flex flex-col space-y-12 sm:space-y-24">
        {/* ========================================================================= */}
        {/* 2. HERO SECTION                                                           */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Typography & Primary Action */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <h1 className="font-['Poppins',sans-serif] font-black text-[28px] xs:text-[34px] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] uppercase tracking-tight text-white leading-[1.08] sm:leading-[0.98] break-normal max-w-full">
              UNLEASH YOUR<br />POTENTIAL
            </h1>
            <p className="text-zinc-400 text-xs sm:text-base max-w-md mt-4 sm:mt-7 leading-relaxed font-normal">
              See real progress with expert guidance and proven training methods. Get started now and unlock a stronger, healthier you!
            </p>
            <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={() => onOpenAuth('SIGNUP')}
                className="w-full sm:w-auto justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-[#ccff00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-base tracking-tight shadow-[0_0_35px_rgba(204,255,0,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
              >
                Start your Free Trial Today
              </button>

              {/* Install Mobile App Button in Hero */}
              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto justify-center px-6 py-4 rounded-full bg-[#121418] hover:bg-[#1a1e26] text-white font-bold text-sm tracking-tight border border-white/15 hover:border-[#ccff00]/60 transition-all flex items-center gap-2.5 shadow-xl cursor-pointer group active:scale-95"
              >
                <div className="w-6 h-6 rounded-full bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center">
                  <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                </div>
                <span>Install Mobile App</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 hidden sm:inline">
                  iOS &amp; Android
                </span>
              </button>

              {isLoggedIn && (
                <button
                  onClick={onGoToDashboard}
                  className="w-full sm:w-auto justify-center px-6 py-4 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm tracking-tight border border-white/10 transition-all cursor-pointer"
                >
                  Enter App ›
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Rounded Hero Athlete Frame */}
          <div className="lg:col-span-6">
            <div className="relative rounded-[36px] overflow-hidden border border-white/10 shadow-2xl aspect-[4/3] sm:aspect-[16/11] bg-zinc-900 group">
              <img
                src="https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80"
                alt="Female Athlete Barbell Squat Training"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. BENTO GRID (ROW 2)                                                     */}
        {/* ========================================================================= */}
        <section id="features" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Card 1 (Left - Bicep Curls Frame) */}
          <div className="lg:col-span-5 rounded-[32px] overflow-hidden border border-white/10 bg-[#0d0f14] shadow-xl relative min-h-[300px] sm:min-h-[360px] group">
            <img
              src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=80"
              alt="Athlete Barbell Curls"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Card 2 (Right - Full Electric Lime Feature Card) */}
          <div className="lg:col-span-7 rounded-[32px] bg-[#ccff00] text-black p-8 sm:p-12 relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[340px]">
            {/* Background Texture Accents */}
            <div className="relative z-10 max-w-sm sm:max-w-md text-left">
              <h2 className="font-['Poppins',sans-serif] font-black text-xl sm:text-3xl lg:text-4xl uppercase leading-[1.15] tracking-tight text-black">
                BUILD MUSCLE,<br />
                BURN CALORIES,<br />
                BOOST ENDURANCE
              </h2>

              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="mt-6 sm:mt-8 px-5 py-2.5 rounded-full bg-black/90 hover:bg-black text-white text-xs sm:text-sm font-bold tracking-tight inline-flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <span>WATCH VIDEO</span>
                <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px]">
                  ▶
                </span>
              </button>
            </div>

            {/* Inset Floating Card (Jumping Workout Frame) */}
            <div className="hidden sm:block absolute right-6 bottom-6 w-52 sm:w-64 aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-black/20 bg-black">
              <img
                src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80"
                alt="Agility and plyometrics workout"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. FUNCTIONAL TRAINING STRIP CARD (ROW 3)                                */}
        {/* ========================================================================= */}
        {isFunctionalStripOpen && (
          <section className="w-full rounded-[28px] bg-[#0e1015] border border-white/10 p-3.5 sm:p-4 flex flex-col lg:flex-row items-center justify-between gap-5 shadow-2xl transition-all">
            {/* Left: Barbell Plate Rack Thumbnail */}
            <div className="w-full lg:w-96 h-28 sm:h-24 rounded-2xl overflow-hidden relative flex-shrink-0 group">
              <img
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80"
                alt="Functional Training Rack"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center px-5">
                <span className="font-['Poppins',sans-serif] font-black text-lg sm:text-2xl text-white tracking-tight">
                  Functional Training
                </span>
              </div>
            </div>

            {/* Middle: Info and Toggle */}
            <div className="flex items-center gap-4 text-left flex-1 px-2">
              <button
                onClick={() => setIsFunctionalStripOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs shrink-0 transition-colors"
                title="Dismiss banner"
              >
                ✕
              </button>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-md leading-relaxed">
                See real progress with expert guidance and proven training methods.
              </p>
            </div>

            {/* Right: Join Today Pill Button */}
            <button
              onClick={() => onOpenAuth('SIGNUP')}
              className="w-full lg:w-auto px-7 py-3 rounded-full border border-white/40 hover:border-white text-white hover:bg-white hover:text-black text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer shrink-0"
            >
              Join today
            </button>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 5. COMPONENTS OF BODY FITNESS (ROW 4)                                     */}
        {/* ========================================================================= */}
        <section id="components" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-4">
          {/* Left Column: Interactive Pillars */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <h2 className="font-['Poppins',sans-serif] font-black text-3xl sm:text-5xl lg:text-6xl uppercase tracking-tight text-white leading-tight">
              COMPONENTS<br />OF BODY FITNESS
            </h2>

            {/* Interactive Pills Grid */}
            <div className="flex flex-wrap gap-2.5 sm:gap-3 mt-7">
              {fitnessPills.map((pill) => {
                const isActive = activeComponent === pill;
                return (
                  <button
                    key={pill}
                    onClick={() => setActiveComponent(pill)}
                    className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#ccff00] text-black shadow-[0_0_20px_rgba(204,255,0,0.3)]'
                        : 'bg-zinc-900/90 text-zinc-300 border border-white/10 hover:border-[#ccff00]/60 hover:text-white'
                    }`}
                  >
                    <span>{pill}</span>
                    <span className="text-[11px] opacity-70">›</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Explanatory Text */}
            <div className="mt-8 p-6 rounded-2xl bg-zinc-900/60 border border-white/10 max-w-lg">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#ccff00] block mb-2">
                {activeComponent} Protocol
              </span>
              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                {fitnessComponentsData[activeComponent]}
              </p>
            </div>
          </div>

          {/* Right Column: Hammer Curl Muscular Athlete Frame */}
          <div className="lg:col-span-6">
            <div className="relative rounded-[36px] overflow-hidden border-2 border-[#ccff00] shadow-[0_0_40px_rgba(204,255,0,0.18)] aspect-[4/5] sm:aspect-square bg-zinc-900 group">
              <img
                src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1000&q=80"
                alt="Athlete Dumbbell Hammer Curls"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. OUR INCREDIBLE TEAM (ROW 5)                                            */}
        {/* ========================================================================= */}
        <section id="team" className="flex flex-col text-left pt-6">
          <h2 className="font-['Poppins',sans-serif] font-black text-3xl sm:text-5xl lg:text-6xl uppercase tracking-tight text-white leading-tight mb-8 sm:mb-10">
            OUR<br />INCREDIBLE TEAM
          </h2>

          {/* 4 Trainers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trainers.map((trainer, idx) => (
              <div key={idx} className="flex flex-col items-center group">
                {/* Photo Container */}
                <div
                  className={`w-full aspect-[4/5] rounded-[24px] overflow-hidden border ${trainer.borderColor} bg-zinc-900 relative shadow-lg`}
                >
                  <img
                    src={trainer.image}
                    alt={trainer.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>

                {/* Name & Title */}
                <h3 className="text-base sm:text-lg font-bold text-white mt-4 tracking-tight text-center">
                  {trainer.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 text-center">
                  {trainer.title}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6.5 NATIVE MOBILE APP EXPERIENCE & 1-CLICK INSTALL                       */}
        {/* ========================================================================= */}
        <section id="app" className="p-6 sm:p-10 rounded-[36px] bg-[#0e1015] border border-white/10 relative overflow-hidden shadow-2xl">
          {/* Subtle Ambient Lighting */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#ccff00]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Column: Mobile App Feature Highlights & Install CTA */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-[#ccff00]" />
                  Zero App Store Download Needed
                </span>
                <span className="text-[11px] font-bold text-zinc-400 hidden sm:inline">
                  PWA Certified • iOS &amp; Android Ready
                </span>
              </div>

              <h2 className="font-['Poppins',sans-serif] font-black text-2xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-white leading-[1.08]">
                GET THE PROFITNESS APP<br />ON YOUR PHONE
              </h2>

              <p className="text-zinc-400 text-xs sm:text-sm max-w-lg leading-relaxed">
                Experience instant turnstile access, offline QR passes, live gym floor headcount radar, and personal workout tracking directly from your phone’s home screen with zero clutter.
              </p>

              {/* 4 Feature Pills Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg pt-1">
                <div className="p-3.5 rounded-2xl bg-[#121418] border border-white/5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#ccff00]/15 text-[#ccff00] flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">1-Tap QR Check-In</h4>
                    <p className="text-[10px] text-zinc-400">Offline-ready digital pass</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#121418] border border-white/5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Live Floor Headcount</h4>
                    <p className="text-[10px] text-zinc-400">Real-time gym radar</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#121418] border border-white/5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Daily Workout Splits</h4>
                    <p className="text-[10px] text-zinc-400">Fuel &amp; hydration tracker</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#121418] border border-white/5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Permanent Sign-In</h4>
                    <p className="text-[10px] text-zinc-400">Never retype passwords</p>
                  </div>
                </div>
              </div>

              {/* Install Buttons Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 w-full sm:w-auto">
                <button
                  onClick={handleInstallClick}
                  className="w-full sm:w-auto justify-center px-7 py-3.5 rounded-full bg-[#ccff00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm tracking-tight shadow-[0_0_25px_rgba(204,255,0,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAppInstalled ? 'App Already Installed ✓' : 'Install App to Device'}</span>
                </button>

                <button
                  onClick={() => setIsInstallModalOpen(true)}
                  className="w-full sm:w-auto justify-center px-5 py-3.5 rounded-full bg-[#121418] hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#ccff00]" />
                  <span>Installation Steps (iOS &amp; Android)</span>
                </button>
              </div>
            </div>

            {/* Right Column: Visual Smartphone Pass Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[280px] p-4 rounded-[32px] bg-[#050507] border-2 border-white/15 shadow-2xl space-y-3 relative">
                {/* Simulated Phone Speaker / Dynamic Island */}
                <div className="w-24 h-3.5 bg-zinc-900 rounded-full mx-auto" />

                {/* Simulated Pass Screen */}
                <div className="p-4 rounded-2xl bg-[#0e1015] border border-white/10 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-['Poppins',sans-serif] font-black text-sm text-white">PROFITNESS</span>
                    <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-ping" />
                  </div>
                  <div className="w-full aspect-square rounded-xl bg-white p-3 flex items-center justify-center">
                    <QrCode className="w-full h-full text-black" />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-zinc-400">MEMBER ID: #PF-9042</span>
                    <span className="text-[#ccff00] font-black">ACCESS GRANTED</span>
                  </div>
                </div>

                <div className="py-1 px-2 text-center">
                  <span className="text-[10px] font-mono text-zinc-400">
                    Works offline • 1-tap launch
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. TRANSPARENT MEMBERSHIP PRICING                                         */}
        {/* ========================================================================= */}
        <section id="pricing" className="flex flex-col text-left pt-10 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#ccff00]">
                Access Tiers
              </span>
              <h2 className="font-['Poppins',sans-serif] font-black text-3xl sm:text-5xl uppercase tracking-tight text-white leading-tight mt-1">
                MEMBERSHIP PLANS
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm">
              All plans include seamless digital QR entrance access, mobile streak tracker, and locker hub access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-[30px] p-8 flex flex-col justify-between transition-all ${
                  plan.highlight
                    ? 'bg-[#ccff00] text-black shadow-[0_0_40px_rgba(204,255,0,0.22)] scale-[1.02]'
                    : 'bg-[#0e1015] text-white border border-white/10 hover:border-white/25'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold uppercase tracking-wider ${plan.highlight ? 'text-black' : 'text-[#ccff00]'}`}>
                      {plan.name}
                    </span>
                    {plan.highlight && (
                      <span className="px-3 py-1 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-wider">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight">
                      {plan.price}
                    </span>
                    <span className={`text-xs font-medium ${plan.highlight ? 'text-black/80' : 'text-zinc-400'}`}>
                      {plan.period}
                    </span>
                  </div>
                  <p className={`text-xs mt-2 leading-relaxed ${plan.highlight ? 'text-black/80' : 'text-zinc-400'}`}>
                    {plan.description}
                  </p>

                  <div className="my-6 space-y-2.5 pt-6 border-t border-black/10 dark:border-white/10">
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2.5 text-xs font-semibold">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${plan.highlight ? 'bg-black text-white' : 'bg-[#ccff00] text-black'}`}>
                          ✓
                        </span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onOpenAuth(plan.tab)}
                  className={`w-full py-3.5 rounded-full font-bold text-xs sm:text-sm tracking-tight transition-all cursor-pointer select-none ${
                    plan.highlight
                      ? 'bg-black text-white hover:bg-zinc-800'
                      : 'bg-[#ccff00] hover:bg-[#b8e600] text-black'
                  }`}
                >
                  {plan.btnLabel}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="w-full border-t border-white/10 bg-[#050507] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-medium">
          <p>© 2026 PROFITNESS Inc. All rights reserved</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#support" className="hover:text-white transition-colors">
              Support
            </a>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 9. MODALS: WATCH VIDEO DEMO & CONTACT US                                 */}
      {/* ========================================================================= */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e1015] border border-white/10 max-w-2xl w-full rounded-3xl p-6 shadow-2xl relative flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-['Poppins',sans-serif] font-black text-lg text-white">
                  PROFITNESS Tour
                </span>
                <span className="text-[10px] bg-[#ccff00] text-black px-2 py-0.5 rounded-full font-bold">
                  LIVE DEMO
                </span>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden mt-4 bg-zinc-950 relative flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80"
                alt="Gym Tour Preview"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[#ccff00] text-black flex items-center justify-center shadow-2xl animate-pulse">
                  <Play className="w-7 h-7 fill-current ml-1" />
                </div>
                <h4 className="font-bold text-white text-base mt-4">
                  Zero-Hardware Smart Gym Operating Experience
                </h4>
                <p className="text-xs text-zinc-300 max-w-sm mt-1">
                  Fast QR check-ins, automated floor headcount, and live mobile workouts.
                </p>
              </div>
            </div>
            <div className="pt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsVideoModalOpen(false);
                  onOpenAuth('SIGNUP');
                }}
                className="px-6 py-2.5 rounded-full bg-[#ccff00] text-black font-extrabold text-xs tracking-tight shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      )}

      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e1015] border border-white/10 max-w-md w-full rounded-3xl p-6 shadow-2xl relative flex flex-col text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-['Poppins',sans-serif] font-black text-xl text-white">
                Contact PROFITNESS
              </h3>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
              Have questions about our training plans or gym franchise software? Connect with our team directly.
            </p>
            <div className="mt-5 space-y-3">
              <button
                onClick={() => {
                  setIsContactModalOpen(false);
                  onOpenAuth('MEMBER_LOGIN');
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 flex items-center justify-between text-xs font-bold text-white transition-all cursor-pointer"
              >
                <span>Member Portal Login</span>
                <span className="text-[#ccff00]">›</span>
              </button>
              <button
                onClick={() => {
                  setIsContactModalOpen(false);
                  onOpenAuth('STAFF_LOGIN');
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 flex items-center justify-between text-xs font-bold text-white transition-all cursor-pointer"
              >
                <span>Gym Owner &amp; Front Desk Console</span>
                <span className="text-[#ccff00]">›</span>
              </button>
              <button
                onClick={() => {
                  setIsContactModalOpen(false);
                  onOpenAuth('SIGNUP');
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#ccff00] text-black font-extrabold text-xs flex items-center justify-center shadow-lg hover:bg-[#b8e600] transition-all cursor-pointer"
              >
                Start Athlete Free Trial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9.5 INSTALL APP INSTRUCTIONS MODAL                                        */}
      {/* ========================================================================= */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e1015] border border-white/10 max-w-lg w-full rounded-3xl p-6 sm:p-7 shadow-2xl relative flex flex-col text-left space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Poppins',sans-serif] font-black text-lg text-white">
                    Install PROFITNESS App
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Takes under 10 seconds • No App Store needed
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInstallModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Operating System Switcher Tabs */}
            <div className="p-1 bg-[#121418] border border-white/10 rounded-full flex gap-1 text-xs">
              <button
                onClick={() => setInstallTab('android')}
                className={`flex-1 py-2 rounded-full font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  installTab === 'android'
                    ? 'bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.25)] font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                onClick={() => setInstallTab('ios')}
                className={`flex-1 py-2 rounded-full font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  installTab === 'ios'
                    ? 'bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.25)] font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
              <button
                onClick={() => setInstallTab('desktop')}
                className={`flex-1 py-2 rounded-full font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  installTab === 'desktop'
                    ? 'bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.25)] font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>PC / Mac</span>
              </button>
            </div>

            {/* Tab 1: Android Instructions */}
            {installTab === 'android' && (
              <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                {deferredPrompt ? (
                  <div className="p-4 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/30 space-y-3">
                    <span className="font-bold text-[#ccff00] block text-sm">
                      1-Click Instant Installation Ready!
                    </span>
                    <p className="text-zinc-300 text-xs leading-relaxed">
                      Your browser supports automatic installation. Click below to add PROFITNESS directly to your app launcher.
                    </p>
                    <button
                      onClick={handleInstallClick}
                      className="w-full py-3 rounded-full bg-[#ccff00] hover:bg-[#b8e600] text-black font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.3)] transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Install App Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-[#121418] border border-white/5 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#ccff00] text-black font-black flex items-center justify-center shrink-0 text-xs">
                        1
                      </span>
                      <div>
                        <strong className="text-white block">Open in Google Chrome</strong>
                        <span className="text-zinc-400">Make sure you are browsing in Chrome on your Android phone.</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#121418] border border-white/5 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#ccff00] text-black font-black flex items-center justify-center shrink-0 text-xs">
                        2
                      </span>
                      <div>
                        <strong className="text-white block">Tap Chrome Menu (⋮)</strong>
                        <span className="text-zinc-400">Tap the three vertical dots at the top-right corner of Chrome.</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#121418] border border-white/5 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#ccff00] text-black font-black flex items-center justify-center shrink-0 text-xs">
                        3
                      </span>
                      <div>
                        <strong className="text-white block">Tap "Install app" or "Add to Home Screen"</strong>
                        <span className="text-zinc-400">Confirm the prompt. The PROFITNESS app icon will be pinned to your home screen!</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Apple iOS (Safari) Instructions */}
            {installTab === 'ios' && (
              <div className="space-y-3 animate-in fade-in duration-150 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#121418] border border-white/5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">1. Tap the Share button in Safari</strong>
                    <span className="text-zinc-400">At the bottom toolbar of Safari on your iPhone, tap the square icon with an arrow pointing up.</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#121418] border border-white/5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">2. Scroll down &amp; tap "Add to Home Screen"</strong>
                    <span className="text-zinc-400">Find the "Add to Home Screen" button in the share sheet.</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#121418] border border-white/5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">3. Tap "Add" in top-right corner</strong>
                    <span className="text-zinc-400">PROFITNESS is now installed as a full-screen app on your iPhone home screen!</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Desktop (PC / Mac) Instructions */}
            {installTab === 'desktop' && (
              <div className="space-y-3 animate-in fade-in duration-150 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#121418] border border-white/5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center shrink-0">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">Look for the Install icon in the URL bar</strong>
                    <span className="text-zinc-400">In Google Chrome, Brave, or Microsoft Edge, look at the right side of the address bar for the "Install" computer icon.</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#121418] border border-white/5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">Or click Browser Menu (⋮) &rarr; "Install PROFITNESS"</strong>
                    <span className="text-zinc-400">Runs as a dedicated desktop window without browser tabs or toolbars.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#ccff00]" />
                Zero storage overhead (&lt; 2MB)
              </span>
              <button
                onClick={() => setIsInstallModalOpen(false)}
                className="px-5 py-2 rounded-full bg-[#121418] hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
