import React, { useState, useEffect } from 'react';
import {
  Shield,
  Dumbbell,
  Zap,
  Clock,
  Users,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Star,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Award,
  Flame,
  Calendar,
  Activity,
  Smartphone,
  Lock,
  Sun,
  Moon,
  LogIn,
  UserCheck,
  Building2,
  Play,
  Download,
  QrCode,
  Laptop,
  RefreshCw,
  AlertTriangle,
  CreditCard,
  Check,
  ChevronDown,
  ExternalLink,
  Sliders,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import { BodybuildingAnatomyMap } from '../components/BodybuildingAnatomyMap';
import { GymEquipmentShowcase } from '../components/GymEquipmentShowcase';
import { BodybuildingAthletesSpotlight } from '../components/BodybuildingAthletesSpotlight';

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
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gym_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gym_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gym_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Interactive Hero Preview Tab: 'MEMBER_APP' | 'OWNER_RADAR' | 'ANTI_FRAUD'
  const [heroTab, setHeroTab] = useState<'MEMBER_APP' | 'OWNER_RADAR' | 'ANTI_FRAUD'>('MEMBER_APP');
  const [simulatedDoorOpen, setSimulatedDoorOpen] = useState(false);

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      // Check if iOS
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosInstallModal(true);
      } else {
        alert('To install IronVault:\n\n1. Tap your browser menu (3 dots or share button)\n2. Select "Install App" or "Add to Home Screen"');
      }
    }
  };

  // Interactive ROI Calculator State
  const [calcMembers, setCalcMembers] = useState<number>(350);
  const [calcFee, setCalcFee] = useState<number>(55);

  // Calculated values
  const passSharingLossPercent = 0.14; // ~14% industry average sharing/loss
  const monthlyLoss = Math.round(calcMembers * calcFee * passSharingLossPercent);
  const annualSaved = monthlyLoss * 12;
  const hardwareSaved = 4800; // Average cost of physical turnstiles & RFID readers

  // Interactive door simulator reset
  const handleTriggerSimulatedCheckIn = () => {
    setSimulatedDoorOpen(true);
    setTimeout(() => {
      setSimulatedDoorOpen(false);
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070709] text-slate-900 dark:text-white font-poppins selection:bg-emerald-500 selection:text-black transition-colors duration-200">
      
      {/* ========================================================================= */}
      {/* 1. PUBLIC BRAND NAVIGATION BAR                                            */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#070709]/80 border-b border-slate-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-wider text-slate-900 dark:text-white">
                  IRON<span className="text-emerald-500">VAULT</span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  CRM OS
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
                Zero-Hardware Smart Gym Platform
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Hidden on small mobile) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold text-slate-600 dark:text-zinc-300">
            <a href="#mobile-app" className="hover:text-emerald-500 transition flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              <span>Mobile App</span>
            </a>
            <a href="#how-it-works" className="hover:text-emerald-500 transition">
              How It Works
            </a>
            <a href="#turnstiles" className="hover:text-emerald-500 transition">
              Zero-Hardware Access
            </a>
            <a href="#roi-calculator" className="hover:text-emerald-500 transition">
              ROI Calculator
            </a>
            <a href="#pricing" className="hover:text-emerald-500 transition">
              Gym Pricing
            </a>
            <a
              href="/onboarding-presentation.html"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 text-amber-500 font-black transition flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Video & Demo Deck</span>
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark/Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 transition"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Install App CTA */}
            <button
              onClick={handleInstallClick}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>

            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                className="btn-primary-green px-4 py-2 text-xs rounded-xl shadow-lg shadow-emerald-500/20"
              >
                <span>Launch App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('MEMBER_LOGIN')}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-emerald-500 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('REGISTER_BUSINESS')}
                  className="btn-primary-green px-4 py-2 text-xs rounded-xl shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Start Gym Workspace</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION: SAAS PLATFORM & MOBILE APP OS                            */}
      {/* ========================================================================= */}
      <section className="relative pt-10 sm:pt-16 pb-20 overflow-hidden">
        {/* Background Ambient Radial Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headline, Value Proposition & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Top Announcement Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Zero-Hardware Turnstiles • 10-Year Permanent Mobile Login</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-slate-900 dark:text-white">
                The Smart Gym CRM & Mobile App That{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300">
                  Stops Stolen Access.
                </span>
              </h1>

              {/* Sub-Headline */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
                Transform any commercial gym in 60 seconds with <strong>zero turnstiles to buy</strong>.
                Athletes check in via phone camera with <strong>1-device biometric binding</strong>.
                Members stay permanently signed in, but are <strong>automatically logged out</strong> if repayments lapse.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={() => onOpenAuth('REGISTER_BUSINESS')}
                  className="btn-primary-green px-7 py-4 rounded-2xl text-sm font-black shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Start Free Gym Trial (14 Days)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onOpenAuth('SIGNUP')}
                  className="px-6 py-4 rounded-2xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-800 transition flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span>Join Your Gym (Enter 6-Digit Code)</span>
                </button>
              </div>

              {/* Onboarding Presentation & Demo Link */}
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="/onboarding-presentation.html"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                  </div>
                  <span>Watch 2-Minute Interactive Onboarding & Video Walkthrough ➔</span>
                </a>
              </div>

              {/* Social Proof & Metrics Strip */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 dark:border-zinc-800/80">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                    $0.00
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mt-0.5">
                    Hardware Equipment Cost
                  </p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-500 font-mono">
                    1-Device
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mt-0.5">
                    Strict Pass Sharing Lock
                  </p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-teal-400 font-mono">
                    10-Year
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mt-0.5">
                    Persistent Mobile Sessions
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Live App Mockup (Phone Frame) */}
            <div className="lg:col-span-5 relative flex justify-center">
              
              {/* App View Switcher Tabs */}
              <div className="w-full max-w-sm">
                <div className="flex bg-slate-200/70 dark:bg-zinc-900/90 p-1.5 rounded-2xl mb-4 text-xs font-bold border border-slate-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setHeroTab('MEMBER_APP')}
                    className={`flex-1 py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                      heroTab === 'MEMBER_APP'
                        ? 'bg-emerald-500 text-black shadow-md font-black'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Member App</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroTab('OWNER_RADAR')}
                    className={`flex-1 py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                      heroTab === 'OWNER_RADAR'
                        ? 'bg-emerald-500 text-black shadow-md font-black'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Owner Radar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroTab('ANTI_FRAUD')}
                    className={`flex-1 py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                      heroTab === 'ANTI_FRAUD'
                        ? 'bg-emerald-500 text-black shadow-md font-black'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Security</span>
                  </button>
                </div>

                {/* iPhone Frame Container */}
                <div className="relative mx-auto w-full max-w-[340px] rounded-[44px] bg-black p-3.5 shadow-2xl ring-1 ring-zinc-800 shadow-emerald-500/10 border-4 border-zinc-800">
                  {/* Dynamic Island / Notch */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center gap-2 border border-zinc-800/80">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
                  </div>

                  {/* Phone Screen Inner */}
                  <div className="relative rounded-[36px] bg-zinc-950 overflow-hidden text-white min-h-[500px] border border-zinc-900 flex flex-col justify-between p-5 pt-10">
                    
                    {/* TAB 1: MEMBER MOBILE APP VIEW */}
                    {heroTab === 'MEMBER_APP' && (
                      <div className="space-y-4">
                        {/* Member Header */}
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">
                              IronVault Athlete
                            </span>
                            <h3 className="text-base font-black text-white">Alex Vance</h3>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            PRO PASS ACTIVE
                          </span>
                        </div>

                        {/* Interactive Digital Access Pass Card */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-black border border-zinc-800 text-center space-y-3 relative overflow-hidden">
                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span>Facility QR Turnstile</span>
                            <span className="font-mono text-emerald-400">Code: 100001</span>
                          </div>

                          {/* Dynamic Pass Status Alert */}
                          {simulatedDoorOpen ? (
                            <div className="py-6 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-400 animate-in zoom-in-95 duration-200">
                              <CheckCircle2 className="w-10 h-10 mx-auto mb-1 text-emerald-400 animate-bounce" />
                              <span className="font-black text-xs uppercase tracking-wide block">
                                Access Granted • Door Unlocked
                              </span>
                              <span className="text-[10px] text-zinc-300">
                                1-Device Signature Verified
                              </span>
                            </div>
                          ) : (
                            <div className="py-4 px-2 flex flex-col items-center">
                              <div className="w-28 h-28 rounded-2xl bg-white p-2.5 shadow-lg flex items-center justify-center mb-2">
                                <QrCode className="w-full h-full text-black" />
                              </div>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                Valid for Next 28 Days
                              </span>
                            </div>
                          )}

                          {/* Trigger simulated scan */}
                          <button
                            type="button"
                            onClick={handleTriggerSimulatedCheckIn}
                            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>{simulatedDoorOpen ? 'Simulating Next Scan...' : 'Test Turnstile Scan'}</span>
                          </button>
                        </div>

                        {/* Member Stats */}
                        <div className="grid grid-cols-2 gap-2 text-left">
                          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Streak</span>
                            <span className="text-sm font-black text-emerald-400 font-mono">14 Days 🔥</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Status</span>
                            <span className="text-sm font-black text-white font-mono">Always Online</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: GYM OWNER LIVE RADAR */}
                    {heroTab === 'OWNER_RADAR' && (
                      <div className="space-y-3.5 text-left">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">
                              Titan Force Gym
                            </span>
                            <h3 className="text-base font-black text-white">Live Turnstile Radar</h3>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        </div>

                        {/* Live Counts Card */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] text-zinc-400 uppercase font-bold block">On Floor</span>
                            <span className="text-xl font-black text-emerald-400 font-mono">42 Athletes</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Desk Revenue</span>
                            <span className="text-xl font-black text-teal-400 font-mono">$1,840/day</span>
                          </div>
                        </div>

                        {/* Live stream rows */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                            Recent Entries (Real-Time)
                          </span>
                          <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span className="font-bold text-white">David K.</span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono">ENTER • 12s ago</span>
                          </div>
                          <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span className="font-bold text-white">Sarah M.</span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono">ENTER • 1m ago</span>
                          </div>
                        </div>

                        <button
                          onClick={() => onOpenAuth('STAFF_LOGIN')}
                          className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition"
                        >
                          Open Full Desk Radar
                        </button>
                      </div>
                    )}

                    {/* TAB 3: ANTI-FRAUD SECURITY */}
                    {heroTab === 'ANTI_FRAUD' && (
                      <div className="space-y-4 text-left">
                        <div>
                          <span className="text-[10px] uppercase font-black text-red-400 tracking-wider">
                            Anti-Pass Sharing Guard
                          </span>
                          <h3 className="text-base font-black text-white">1-Device Binding Engine</h3>
                        </div>

                        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-2">
                          <div className="flex items-center gap-2 text-red-400 text-xs font-black uppercase">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Simulated Fraud Blocked</span>
                          </div>
                          <p className="text-xs text-zinc-300">
                            Member tried to forward QR screenshot to a friend's phone:
                          </p>
                          <div className="p-2 rounded-lg bg-black/60 font-mono text-[10px] text-red-300 border border-red-500/30">
                            ERR_DEVICE_MISMATCH: Unauthorized phone hardware ID. Turnstile locked.
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                            Auto-Repayment Policy
                          </span>
                          <p className="text-xs text-zinc-400">
                            When pass expires, member is automatically logged out. Regains access the second desk renewal is paid.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Phone Bottom Home Bar */}
                    <div className="w-28 h-1 bg-zinc-800 rounded-full mx-auto mt-2" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. DEDICATED MOBILE APP INSTALLATION SHOWCASE                              */}
      {/* ========================================================================= */}
      <section id="mobile-app" className="py-20 bg-slate-100/70 dark:bg-zinc-950/70 border-y border-slate-200 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Native iOS, Android & Instant PWA</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              The App Your Members Will Never Want to Delete.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
              Install natively on any smartphone in 5 seconds with zero app store wait time.
              Built for speed, camera turnstile access, and 10-year persistent sessions.
            </p>
          </div>

          {/* 3 Installation Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            {/* CARD 1: iOS */}
            <div className="app-card p-6 sm:p-7 space-y-4 text-left relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl">
                🍏
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Apple iPhone (iOS)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Open in Safari ➔ Tap <strong>Share</strong> ➔ Tap <strong>"Add to Home Screen"</strong>. Launches full-screen as a standalone native app with camera turnstiles.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowIosInstallModal(true)}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>View iPhone Quick Guide</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CARD 2: Android */}
            <div className="app-card p-6 sm:p-7 space-y-4 text-left relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl">
                🤖
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Google Android
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Tap <strong>"Install App"</strong> in Chrome or Samsung Internet. Enjoy instant camera scanning, background sync, and offline biometric checks.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="btn-primary-green py-2 px-4 text-xs rounded-xl"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install on Android</span>
                </button>
              </div>
            </div>

            {/* CARD 3: 10-Year Sessions */}
            <div className="app-card p-6 sm:p-7 space-y-4 text-left relative overflow-hidden border-emerald-500/30">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl">
                ⚡
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                10-Year Permanent Sessions
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Members never get logged out mid-workout. If their subscription pass expires, the app auto-logs them out until desk payment is settled.
              </p>
              <div className="pt-2">
                <span className="badge-active-green text-[11px]">
                  ✓ Automated Repayment Lock
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. ZERO-HARDWARE ARCHITECTURE (HOW IT WORKS)                              */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>How It Works</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Zero Turnstiles to Buy. 4 Easy Steps.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400">
              Replaces \$5,000 turnstiles and RFID key fobs with smartphone cameras and cryptographically bound device access.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="app-card p-6 space-y-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 font-mono font-black text-lg flex items-center justify-center border border-emerald-500/30">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Print Facility Poster
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Gym owners print our high-res Facility QR Poster directly from the dashboard and mount it at the gym entrance.
              </p>
            </div>

            {/* Step 2 */}
            <div className="app-card p-6 space-y-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 font-mono font-black text-lg flex items-center justify-center border border-emerald-500/30">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                6-Digit Member Join
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Athletes enter your gym's unique 6-digit access code (e.g. 100001) in the app. Their hardware is cryptographically bound to that 1 phone.
              </p>
            </div>

            {/* Step 3 */}
            <div className="app-card p-6 space-y-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 font-mono font-black text-lg flex items-center justify-center border border-emerald-500/30">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                0.3s Camera Scan
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Athletes point their phone camera at the entrance poster. The system verifies active pass, GPS radius, and device ID in 300 milliseconds.
              </p>
            </div>

            {/* Step 4 */}
            <div className="app-card p-6 space-y-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 font-mono font-black text-lg flex items-center justify-center border border-emerald-500/30">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Auto-Repayment Gate
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                When a member's pass expires, their app automatically logs out. They settle payment at the desk, and their app unlocks instantly.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE ROI & PASS-SHARING RECOVERY CALCULATOR                      */}
      {/* ========================================================================= */}
      <section id="roi-calculator" className="py-20 bg-slate-100/70 dark:bg-zinc-950/70 border-y border-slate-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Revenue Calculator</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              How Much Revenue Is Your Gym Losing?
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              The fitness industry averages 12–18% lost revenue from barcode screenshot forwarding and stolen passes.
            </p>
          </div>

          <div className="app-card p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-xl">
            {/* Left: Interactive Sliders */}
            <div className="space-y-6 text-left">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2">
                  <span>Active Gym Members</span>
                  <span className="font-mono text-emerald-500 text-sm font-black">{calcMembers} Members</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={calcMembers}
                  onChange={(e) => setCalcMembers(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2">
                  <span>Average Monthly Membership Fee</span>
                  <span className="font-mono text-emerald-500 text-sm font-black">${calcFee}/month</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="5"
                  value={calcFee}
                  onChange={(e) => setCalcFee(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <span className="font-bold block uppercase tracking-wider text-[10px]">
                  💡 1-Device Fingerprint Enforcement
                </span>
                <p>
                  IronVault binds each member account to their phone hardware. Screenshots and forward passes are rejected automatically at the door.
                </p>
              </div>
            </div>

            {/* Right: Calculated Savings Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 text-center space-y-5 text-white">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 block">
                Estimated Annual Revenue Recovered
              </span>
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-mono">
                +${annualSaved.toLocaleString()}<span className="text-xs text-zinc-400">/year</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/80 text-left">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Monthly Recovery</span>
                  <span className="text-base font-bold text-white font-mono">+${monthlyLoss.toLocaleString()}/mo</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Turnstiles Saved</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">${hardwareSaved.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuth('REGISTER_BUSINESS')}
                className="w-full btn-primary-green py-3 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20"
              >
                <span>Recover My Gym's Revenue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BODYBUILDING ANATOMY, ARSENAL & SPOTLIGHTS                             */}
      {/* ========================================================================= */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          
          {/* Muscle Anatomy Map */}
          <div>
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest block">
                Pro Athlete Training
              </span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                Interactive Muscle Targeter & Biomechanics
              </h2>
            </div>
            <BodybuildingAnatomyMap />
          </div>

          {/* Heavy Arsenal Equipment */}
          <div>
            <GymEquipmentShowcase />
          </div>

          {/* Athletes Hall of Fame */}
          <div>
            <BodybuildingAthletesSpotlight />
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SAAS PRICING FOR GYM BUSINESSES                                        */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-20 bg-slate-100/70 dark:bg-zinc-950/70 border-t border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simple, Transparent Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Plans Built for Single Studios to 50-Location Chains.
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Always 100% free for athletes and gym members. 14-day risk-free trial for gym owners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* TIER 1: STARTER GYM */}
            <div className="app-card p-8 space-y-6 text-left flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Single Studio</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Starter Facility</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">$49</span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400">/month</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Ideal for independent crossfit boxes, boxing clubs, and local gyms up to 200 members.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-zinc-300 pt-3 border-t border-slate-200 dark:border-zinc-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Up to 200 Active Members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Zero-Hardware QR Turnstiles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>1-Device Anti-Pass Sharing Lock</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Desk Billing & Renewal Manager</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>iOS & Android Mobile App</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Starter Facility')}
                className="w-full btn-secondary-gym py-3 rounded-xl text-xs font-bold"
              >
                Start 14-Day Free Trial
              </button>
            </div>

            {/* TIER 2: PRO GYM (FEATURED) */}
            <div className="app-card p-8 space-y-6 text-left flex flex-col justify-between border-2 border-emerald-500 relative shadow-xl shadow-emerald-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest shadow-md">
                ⚡ MOST POPULAR
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Commercial Powerhouse</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Pro Fitness Arena</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-emerald-500 font-mono">$99</span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400">/month</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  For growing commercial gyms that need high-throughput turnstiles and retention automation.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-zinc-300 pt-3 border-t border-slate-200 dark:border-zinc-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Up to 1,000 Active Members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Unlimited Turnstiles & Posters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Automated Pass Repayment Lock</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>WhatsApp Inactive Retention Engine</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>AI Health Intelligence & CSV Export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Live Attendance Radar & Anti-Tailgating</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Pro Fitness Arena')}
                className="w-full btn-primary-green py-3.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/25"
              >
                Launch Pro Workspace
              </button>
            </div>

            {/* TIER 3: MULTI-LOCATION ENTERPRISE */}
            <div className="app-card p-8 space-y-6 text-left flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Multi-Location Franchise</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Enterprise Chain</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">$199</span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400">/month</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Multi-branch access, cross-city roaming passes, and dedicated Super Admin controls.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-zinc-300 pt-3 border-t border-slate-200 dark:border-zinc-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Unlimited Members & Locations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Cross-Branch Roaming Pass Network</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Custom Whitelabel Branding & Domain</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>24/7 Dedicated Account Director</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Custom Turnstile & Turnkey Hardware API</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Enterprise Chain')}
                className="w-full btn-secondary-gym py-3 rounded-xl text-xs font-bold"
              >
                Contact Enterprise Sales
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. PUBLIC FOOTER                                                          */}
      {/* ========================================================================= */}
      <footer className="py-14 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#070709] text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1 */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-black" />
                </div>
                <span className="font-black text-lg tracking-wider text-slate-900 dark:text-white">
                  IRON<span className="text-emerald-500">VAULT</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                The modern operating system for gyms and athletes. Zero-hardware turnstiles, 1-device biometric access security, and 10-year persistent mobile sessions.
              </p>
            </div>

            {/* Col 2 */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block">
                Platform
              </span>
              <ul className="space-y-1.5 text-slate-500 dark:text-zinc-400">
                <li><a href="#mobile-app" className="hover:text-emerald-500">Mobile App (iOS/Android)</a></li>
                <li><a href="#how-it-works" className="hover:text-emerald-500">Zero-Hardware Access</a></li>
                <li><a href="#roi-calculator" className="hover:text-emerald-500">ROI Calculator</a></li>
                <li><a href="/onboarding-presentation.html" target="_blank" rel="noreferrer" className="hover:text-emerald-500">Onboarding Slideshow</a></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block">
                Portals
              </span>
              <ul className="space-y-1.5 text-slate-500 dark:text-zinc-400">
                <li><button onClick={() => onOpenAuth('MEMBER_LOGIN')} className="hover:text-emerald-500">Member Sign-In</button></li>
                <li><button onClick={() => onOpenAuth('SIGNUP')} className="hover:text-emerald-500">Join Gym (6-Digit Code)</button></li>
                <li><button onClick={() => onOpenAuth('REGISTER_BUSINESS')} className="hover:text-emerald-500">Register Gym Business</button></li>
                <li><button onClick={() => onOpenAuth('STAFF_LOGIN')} className="hover:text-emerald-500">Staff / Super Admin Login</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-zinc-500 gap-3">
            <p>© {new Date().getFullYear()} IronVault Inc. All rights reserved. 256-Bit Hardware Encrypted.</p>
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational • Cloud Live</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 9. MOBILE STICKY FLOATING BOTTOM BAR (For Mobile Screens)                 */}
      {/* ========================================================================= */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-black/95 backdrop-blur-lg border-t border-zinc-800 flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex-1 py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-800"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Install App</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenAuth('REGISTER_BUSINESS')}
          className="flex-1 py-3 px-2 rounded-xl bg-emerald-500 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Gym Owner</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenAuth('MEMBER_LOGIN')}
          className="py-3 px-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center"
          title="Athlete Login"
        >
          <LogIn className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 10. IPHONE (iOS) QUICK INSTALL MODAL                                      */}
      {/* ========================================================================= */}
      {showIosInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="app-card max-w-sm w-full p-6 text-center space-y-4 relative border-emerald-500/40">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl">
              🍏
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Install on Apple iPhone
            </h3>
            <div className="text-xs text-slate-600 dark:text-zinc-300 space-y-3 text-left bg-slate-100 dark:bg-zinc-900/90 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-black font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>In Safari, tap the <strong>Share</strong> button (the box with an arrow at the bottom).</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-black font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong>.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-black font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>Tap <strong>"Add"</strong> in the top-right corner.</span>
              </p>
            </div>
            <p className="text-[11px] text-emerald-500 font-bold">
              ✓ IronVault will open full-screen just like an App Store app!
            </p>
            <button
              type="button"
              onClick={() => setShowIosInstallModal(false)}
              className="w-full btn-primary-green py-2.5 rounded-xl text-xs"
            >
              Got It
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
