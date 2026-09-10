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
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';

interface LandingPageViewProps {
  onOpenAuth: (tab?: 'MEMBER_LOGIN' | 'STAFF_LOGIN' | 'SIGNUP', planName?: string) => void;
  isLoggedIn?: boolean;
  onGoToDashboard?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onOpenAuth,
  isLoggedIn = false,
  onGoToDashboard
}) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  // Theme support
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

  // Load preview of upcoming group classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await api.getGroupClasses();
        setClasses((data.classes || []).slice(0, 4));
      } catch (err) {
        console.warn('Could not load public classes preview:', err);
      } finally {
        setIsLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white font-poppins selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* 1. PUBLIC BRAND NAVIGATION */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-slate-200/80 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-black shadow-md dark:shadow-glow-green">
              <Shield className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight block leading-none">
                IRON<span className="text-emerald-600 dark:text-emerald-400">VAULT</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                FITNESS & HEALTH CLUB
              </span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
            <a href="#plans" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">Membership</a>
            <a href="#tech" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">Smart Access</a>
            <a href="#classes" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">Classes</a>
            <a href="#amenities" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">Amenities</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-emerald-600" />}
            </button>

            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                className="btn-primary-green flex items-center gap-2 py-2.5 px-4 text-xs font-bold uppercase tracking-wider"
              >
                <UserCheck className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('MEMBER_LOGIN')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 hover:border-emerald-500 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Member Portal</span>
                </button>
                <button
                  onClick={() => onOpenAuth('SIGNUP')}
                  className="btn-primary-green flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold uppercase tracking-wider"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Join Club</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-6 animate-pulse">
            <Zap className="w-3.5 h-3.5" />
            <span>Hardware-Free Smart Access • 24/7 Facility</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-[1.08]">
            THE NEXT-GENERATION <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600">
              SMART HEALTH CLUB
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Ditch lost plastic keycards forever. IronVault equips you with smartphone biometric turnstile access, real-time community leaderboards, coach-led group classes, and Olympic-grade lifting platforms.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <button
              onClick={() => onOpenAuth('SIGNUP')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl btn-primary-green font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95"
            >
              <span>Get 30-Day Pro Pass</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenAuth('MEMBER_LOGIN')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white font-bold text-sm hover:border-emerald-500 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Member Sign In</span>
            </button>
          </div>

          {/* Trust Stat Counters */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 backdrop-blur-sm">
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">2,500+</p>
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Active Athletes</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 backdrop-blur-sm">
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">24/7/365</p>
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Facility Access</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 backdrop-blur-sm">
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">40+</p>
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Weekly Classes</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 backdrop-blur-sm">
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">50m</p>
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">GPS Geofenced</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SMART ACCESS SHOWCASE (Hardware-Free) */}
      <section id="tech" className="py-16 sm:py-24 bg-slate-100/60 dark:bg-zinc-950/60 border-y border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Lock className="w-3.5 h-3.5" />
              <span>Smart Physical Security</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Hardware-Free Access. <br />
              <span className="text-emerald-600 dark:text-emerald-400">Your Phone Is Your Gate Key.</span>
            </h2>
            <p className="mt-4 text-sm text-slate-600 dark:text-zinc-400">
              No expensive optical turnstile readers or lost plastic fobs. Our proprietary access protocol pairs dynamic smartphone camera scanning with GPS geofencing and anti-fraud hardware binding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 relative group hover:border-emerald-500 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg mb-6">
                01
              </div>
              <h3 className="text-lg font-bold mb-2">Scan Gate at Arrival</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Open IronVault on your phone or MacBook, tap "Scan Gate QR", and point your camera at the physical gym entrance poster.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Smartphone className="w-4 h-4" />
                <span>Instant Camera Viewfinder</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 relative group hover:border-emerald-500 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg mb-6">
                02
              </div>
              <h3 className="text-lg font-bold mb-2">4-Tier Anti-Fraud Verification</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                The server automatically checks 50-meter GPS proximity, device hardware binding, active membership status, and 3-minute anti-passback cooldown.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Shield className="w-4 h-4" />
                <span>Sub-Second Validation</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 relative group hover:border-emerald-500 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg mb-6">
                03
              </div>
              <h3 className="text-lg font-bold mb-2">Gate Unlocks & Session Logged</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                You receive an instant access chime and email receipt, while staff see your check-in and streak appear live on their floor monitor.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Activity className="w-4 h-4" />
                <span>Live Floor WebSocket Sync</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MEMBERSHIP PLANS & PRICING */}
      <section id="plans" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Award className="w-3.5 h-3.5" />
              <span>Transparent Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Invest in Your Strength. <br />
              <span className="text-emerald-600 dark:text-emerald-400">No Hidden Fees. Cancel Anytime.</span>
            </h2>
            <p className="mt-4 text-sm text-slate-600 dark:text-zinc-400">
              Every membership unlocks our digital turnstile pass, locker rooms, high-performance coaching, and 24/7 access.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* PLAN 1: DAY PASS */}
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between hover:border-slate-400 dark:hover:border-zinc-700 transition">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Single Session
                </span>
                <h3 className="text-2xl font-black mt-1">Day Pass</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
                  Perfect for travelers, drop-ins, and weekend trial lifters.
                </p>

                <div className="my-6">
                  <span className="text-4xl font-black">$15</span>
                  <span className="text-xs text-slate-400 dark:text-zinc-500 ml-1">/ single entry</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-600 dark:text-zinc-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Full facility & free weights access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Single-day digital QR turnstile pass</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Locker & recovery shower amenities</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth('SIGNUP', 'Day Pass')}
                className="w-full mt-8 py-3.5 rounded-xl border-2 border-slate-200 dark:border-zinc-700 font-bold text-xs uppercase tracking-wider hover:border-emerald-500 hover:text-emerald-500 transition"
              >
                Purchase Day Pass
              </button>
            </div>

            {/* PLAN 2: MONTHLY UNLIMITED PRO (FEATURED) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-emerald-950/40 via-zinc-900 to-zinc-900 border-2 border-emerald-500 flex flex-col justify-between relative shadow-xl shadow-emerald-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest shadow-md">
                ⚡ MOST POPULAR • 30-DAY PRO
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Unlimited Access
                </span>
                <h3 className="text-2xl font-black mt-1">Monthly Pro Pass</h3>
                <p className="text-xs text-zinc-400 mt-2">
                  Our core membership for committed lifters and fitness enthusiasts.
                </p>

                <div className="my-6">
                  <span className="text-5xl font-black text-emerald-400">$65</span>
                  <span className="text-xs text-zinc-400 ml-1">/ month</span>
                </div>

                <ul className="space-y-3 text-xs text-zinc-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>24/7/365 Unlimited</strong> Turnstile Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>All Group Fitness Classes</strong> included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Permanent bound smartphone digital key</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Live community leaderboard & streak rewards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Email workout receipts & arrival summaries</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth('SIGNUP', 'Monthly Unlimited Pro Pass')}
                className="w-full mt-8 py-3.5 rounded-xl btn-primary-green font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition active:scale-95"
              >
                Join with 30-Day Pro Pass →
              </button>
            </div>

            {/* PLAN 3: ANNUAL VIP */}
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between hover:border-slate-400 dark:hover:border-zinc-700 transition">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Best Value Plan
                </span>
                <h3 className="text-2xl font-black mt-1">Annual VIP Pass</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
                  Full 12-month commitment with exclusive athlete perks & guest passes.
                </p>

                <div className="my-6">
                  <span className="text-4xl font-black">$599</span>
                  <span className="text-xs text-slate-400 dark:text-zinc-500 ml-1">/ year ($49/mo eq.)</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-600 dark:text-zinc-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>All Monthly Pro benefits for 365 days</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span><strong>12 Free Guest Passes</strong> for friends</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Free monthly body composition scan (InBody)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>15% discount on supplements & gear</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth('SIGNUP', 'Annual VIP Pass')}
                className="w-full mt-8 py-3.5 rounded-xl border-2 border-slate-200 dark:border-zinc-700 font-bold text-xs uppercase tracking-wider hover:border-emerald-500 hover:text-emerald-500 transition"
              >
                Claim Annual VIP
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LIVE GROUP CLASSES PREVIEW */}
      <section id="classes" className="py-20 bg-slate-100/60 dark:bg-zinc-950/60 border-t border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Coach-Led Fitness</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Upcoming Group Classes
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Included with all active Pro and VIP memberships. Reserve your spot directly in the app.
              </p>
            </div>

            <button
              onClick={() => onOpenAuth('SIGNUP')}
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>Join to Reserve Spots</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {isLoadingClasses ? (
            <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
              Loading current group class schedule...
            </div>
          ) : classes.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center">
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">Daily classes scheduled regularly.</p>
              <p className="text-xs text-slate-400 mt-1">Log in to view the live studio schedule.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {classes.map((cls) => {
                const available = Math.max(0, cls.maxSeats - (cls._count?.bookings || cls.bookings?.length || 0));
                const classDate = new Date(cls.startTime);
                return (
                  <div
                    key={cls.id}
                    className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 transition flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          {cls.intensity || 'All Levels'}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-zinc-400">
                          {classDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{cls.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Coach {cls.coach}</p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1.5 line-clamp-1">📍 {cls.zone}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-zinc-400">
                        {available > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{available} spots left</span>
                        ) : (
                          <span className="text-rose-500 font-bold">Fully Booked</span>
                        )}
                      </span>

                      <button
                        onClick={() => onOpenAuth('SIGNUP')}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        Book →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 6. AMENITIES & EQUIPMENT SHOWCASE */}
      <section id="amenities" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Dumbbell className="w-3.5 h-3.5" />
              <span>World-Class Facility</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Engineered for Serious Training
            </h2>
            <p className="mt-4 text-sm text-slate-600 dark:text-zinc-400">
              From powerlifting competition racks to sprint turf and recovery saunas, IronVault is equipped for results.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Dumbbell className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-1">Olympic Platforms & Eleiko Plates</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                6 competition lifting platforms with certified calibrated bumper plates, Texas power bars, and chalk stations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-1">30-Yard Sprint & Sled Turf</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Heavy-duty sled pushes, prowlers, medicine balls, battle ropes, and agility sprint lanes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-1">24/7 Unrestricted Entry</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Train early morning or late night. Digital biometric turnstiles allow safe, automated access at all hours.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-1">Community Feed & Leaderboards</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Celebrate member PRs, log workouts, join monthly attendance challenges, and climb the gym rankings.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-1">Sauna & Cold Recovery Suite</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Finnish cedarwood dry saunas, private shower facilities, secure lockers, and hyperice massage guns.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-1">Strict Anti-Fraud & Safe Access</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Safe, verified facility: every check-in is authenticated, preventing unauthorized access and overcrowding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA SECTION */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to Elevate Your Training?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-emerald-100 max-w-xl mx-auto">
            Join IronVault today. Sign up with your real email, verify your instant OTP, and unlock turnstile access immediately.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth('SIGNUP')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black text-sm uppercase tracking-wider shadow-lg transition active:scale-95"
            >
              Get Started with 30-Day Pro Pass
            </button>
            <button
              onClick={() => onOpenAuth('MEMBER_LOGIN')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-black/30 hover:bg-black/40 text-white border border-white/20 font-bold text-sm transition active:scale-95"
            >
              Sign In to Member Portal
            </button>
          </div>
        </div>
      </section>

      {/* 8. PUBLIC FOOTER */}
      <footer className="bg-white dark:bg-black border-t border-slate-200 dark:border-zinc-800 py-12 text-xs text-slate-500 dark:text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-black">
              <Shield className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-bold text-slate-800 dark:text-zinc-300">
              IronVault Fitness Club • Smart Access Control
            </span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <button onClick={() => onOpenAuth('STAFF_LOGIN')} className="hover:text-emerald-500 transition">
              Staff & Admin Portal
            </button>
            <a href="#plans" className="hover:text-emerald-500 transition">
              Pricing Plans
            </a>
            <a href="#classes" className="hover:text-emerald-500 transition">
              Class Schedule
            </a>
          </div>

          <p className="text-center sm:text-right">
            © {new Date().getFullYear()} IronVault CRM. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

