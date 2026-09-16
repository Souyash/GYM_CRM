import React, { useState, useEffect } from 'react';
import {
  Shield,
  QrCode,
  Users,
  Smartphone,
  Check,
  Zap,
  ArrowRight,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Sparkles,
  Play,
  X,
  Menu,
  FileSpreadsheet,
  Activity,
  Award
} from 'lucide-react';
import { PrivacyPolicyModal } from '../components/PrivacyPolicyModal';

export interface LandingPageViewProps {
  onOpenAuth: (tab?: 'MEMBER_LOGIN' | 'STAFF_LOGIN' | 'SIGNUP' | 'REGISTER_BUSINESS', planName?: string) => void;
  isLoggedIn?: boolean;
  onGoToDashboard?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onOpenAuth,
  isLoggedIn = false,
  onGoToDashboard
}) => {
  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Gate Simulator Interactive State
  const [simState, setSimState] = useState<'IDLE' | 'SCANNING' | 'GRANTED'>('IDLE');
  const [simLatency, setSimLatency] = useState<number>(18);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [installTab, setInstallTab] = useState<'ios' | 'android' | 'desktop'>('android');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (window.location.hash === '#privacy' || window.location.pathname === '/privacy') {
      setIsPrivacyModalOpen(true);
    }
    const handleOpenPrivacy = () => setIsPrivacyModalOpen(true);
    window.addEventListener('open-privacy-policy', handleOpenPrivacy);
    return () => window.removeEventListener('open-privacy-policy', handleOpenPrivacy);
  }, []);

  useEffect(() => {
    // Detect if running in standalone mode (already installed as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsAppInstalled(true);
    }

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
      } catch {
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  const handleSimulateScan = () => {
    if (simState === 'SCANNING') return;
    setSimState('SCANNING');
    const randomLatency = Math.floor(Math.random() * 15) + 14;
    setSimLatency(randomLatency);
    setTimeout(() => {
      setSimState('GRANTED');
      setTimeout(() => {
        setSimState('IDLE');
      }, 4000);
    }, 1200);
  };

  const faqs = [
    {
      q: 'How does the hardware-free smart turnstile work?',
      a: 'Instead of expensive physical RFID turnstiles that cost thousands to purchase and maintain, FIDGIT provides a cryptographic QR code poster for your entrance. Members open their mobile web pass, scan the poster, and our backend verifies GPS geofencing, device hardware identity, and active subscription in under 30 milliseconds.'
    },
    {
      q: 'What prevents members from taking a screenshot of the QR code and sharing it?',
      a: 'The gate QR code is locked to the physical venue coordinates via GPS geofencing (50-meter radius). Furthermore, member accounts are permanently bound to their unique physical smartphone hardware ID. When a login attempt occurs on an unrecognized device, the account is quarantined and an alert triggers on the gym admin panel.'
    },
    {
      q: 'How does WhatsApp automated billing and invoicing work?',
      a: 'Whenever an onboarding payment or renewal occurs, FIDGIT automatically generates an authentic PDF invoice complete with your gym’s authorized stamp, tax breakdown, and dates. It then dispatches this directly to the member’s WhatsApp number with zero manual action required.'
    },
    {
      q: 'Can members check in more than once in a single day?',
      a: 'Yes, if authorized by your club rules. If a member exits and attempts a second check-in, the system logs the event and prompts your desk staff via the Daily Visit Review console to grant instant access with one click.'
    },
    {
      q: 'Do members need to download an app from the App Store or Google Play?',
      a: 'No! FIDGIT is built as an ultra-fast Progressive Web App (PWA). Members simply visit your gym’s link in Safari or Chrome and tap "Add to Home Screen". It installs immediately, takes less than 2MB of storage, and works offline for instant digital pass display.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050507] text-white font-['Outfit',sans-serif] selection:bg-[#ccff00] selection:text-black antialiased overflow-x-hidden">
      {/* ------------------------------------------------------------- */}
      {/* 1. STICKY NAVBAR                                              */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-[#050507]/90 backdrop-blur-xl border-b border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-2xl bg-[#0e1015] border border-[#ccff00]/40 flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.25)]">
              <Zap className="w-5 h-5 text-[#ccff00]" />
            </div>
            <div className="flex flex-col">
              <span className="font-['Unbounded',sans-serif] font-black text-xl tracking-tight text-white flex items-center gap-1.5">
                FIDGIT <span className="text-[#ccff00] text-xs px-1.5 py-0.5 rounded bg-[#ccff00]/10 border border-[#ccff00]/30 font-mono">CRM</span>
              </span>
              <span className="text-[10px] text-white/50 tracking-widest uppercase font-mono">
                Hardware-Free Gym OS
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/70">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#turnstile" className="hover:text-white transition-colors">
              Smart Turnstile
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 text-xs text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/30 px-3 py-1.5 rounded-full hover:bg-[#ccff00]/20 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAppInstalled ? 'App Ready' : 'Install PWA'}</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                className="bg-[#ccff00] text-black hover:bg-[#b8e600] font-black text-sm px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(204,255,0,0.25)] transition flex items-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('MEMBER_LOGIN')}
                  className="text-white/80 hover:text-white text-sm font-bold px-4 py-2 rounded-xl transition hover:bg-white/5"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Pro Fitness Hub')}
                  className="bg-[#ccff00] text-black hover:bg-[#b8e600] font-black text-sm px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(204,255,0,0.25)] transition flex items-center gap-1.5"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#0e1015] border border-white/10 text-white hover:text-[#ccff00] transition"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0e1015] border-b border-white/10 px-6 py-6 space-y-4">
            <nav className="flex flex-col space-y-3 font-semibold text-white/80">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white py-1"
              >
                Features
              </a>
              <a
                href="#turnstile"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white py-1"
              >
                Smart Turnstile
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white py-1"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white py-1"
              >
                FAQ
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleInstallClick();
                }}
                className="flex items-center gap-2 text-left text-sm text-[#ccff00] py-2"
              >
                <Download className="w-4 h-4" />
                <span>Install Member PWA</span>
              </button>
            </nav>
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGoToDashboard?.();
                  }}
                  className="w-full bg-[#ccff00] text-black font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('MEMBER_LOGIN');
                    }}
                    className="w-full bg-[#121418] border border-white/15 text-white font-bold py-3 rounded-xl text-center"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('REGISTER_BUSINESS', 'Pro Fitness Hub');
                    }}
                    className="w-full bg-[#ccff00] text-black font-black py-3 rounded-xl text-center shadow-[0_0_15px_rgba(204,255,0,0.25)]"
                  >
                    Start 14-Day Free Trial
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. HERO SECTION (50/50 DESKTOP SPLIT GRID)                   */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Subtle Ambient Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ccff00]/5 blur-[140px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column: Headline, Copy & CTAs */}
            <div>
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] text-xs font-bold tracking-wide mb-6 uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Hardware-Free Gym Operating System</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-['Unbounded',sans-serif] font-black text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-white tracking-tight uppercase leading-[1.1]">
                The Smart Turnstile & Access CRM Built for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] via-emerald-300 to-[#ccff00]">
                  Modern Gyms
                </span>
              </h1>

              {/* Supporting Copy */}
              <p className="font-['Outfit',sans-serif] text-white/70 text-base sm:text-lg leading-relaxed mt-6 max-w-xl">
                Eliminate expensive physical turnstile gates. Protect your revenue with 50-meter GPS geofencing, anti-clone device hardware binding, and automated WhatsApp membership billing.
              </p>

              {/* Dual Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Pro Fitness Hub')}
                  className="bg-[#ccff00] text-black hover:bg-[#b8e600] font-bold text-base px-8 py-4 rounded-2xl shadow-[0_0_25px_rgba(204,255,0,0.35)] transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
                >
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onOpenAuth('MEMBER_LOGIN')}
                  className="bg-[#121418] hover:bg-[#121418]/80 text-white hover:text-[#ccff00] border border-white/15 hover:border-[#ccff00]/40 font-bold text-base px-7 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-5 h-5 text-[#ccff00]" />
                  <span>Explore Demo Pass</span>
                </button>
              </div>

              {/* Quick Feature Badges Row */}
              <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Zero Hardware</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>50m Geofenced</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Anti-Passback</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>WhatsApp Invoicing</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Pass & Turnstile Simulator Card */}
            <div id="turnstile" className="relative">
              {/* Outer Glassmorphic Card Container */}
              <div className="bg-[#0e1015] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                {/* Header Strip inside Simulator */}
                <div className="flex items-center justify-between pb-5 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <div>
                      <h3 className="font-['Unbounded',sans-serif] text-xs font-bold uppercase tracking-wider text-white">
                        LIVE ENTRY RADAR SIMULATOR
                      </h3>
                      <p className="text-[11px] text-white/50 font-mono">GATE: MAIN ENTRANCE TURNSTILE #01</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/30 px-2.5 py-1 rounded-full font-bold uppercase">
                    ACTIVE 24/7
                  </span>
                </div>

                {/* Digital Pass Visual Mockup */}
                <div className="mt-6 bg-[#121418] border border-white/10 rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                        DIGITAL MEMBER PASS
                      </span>
                      <h4 className="font-['Unbounded',sans-serif] text-base font-bold text-white mt-0.5">
                        ALEXANDER CHEN
                      </h4>
                      <p className="text-xs text-white/60 font-mono">ID: #IV-9482 • PRO FITNESS HUB</p>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                      ACTIVE ACCESS
                    </div>
                  </div>

                  {/* QR Graphic and Verification Pipeline */}
                  <div className="my-6 flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-xl bg-[#0e1015] border border-white/5">
                    <div className="w-32 h-32 bg-[#050507] border-2 border-[#ccff00]/40 rounded-2xl p-2.5 flex flex-col items-center justify-center relative shadow-[0_0_15px_rgba(204,255,0,0.15)]">
                      <QrCode className="w-full h-full text-[#ccff00]" />
                      {simState === 'SCANNING' && (
                        <div className="absolute inset-0 bg-[#ccff00]/20 rounded-xl flex items-center justify-center backdrop-blur-xs">
                          <div className="w-full h-1 bg-[#ccff00] shadow-[0_0_10px_#ccff00] animate-bounce" />
                        </div>
                      )}
                    </div>

                    {/* Verification Checklist */}
                    <div className="flex-1 w-full space-y-2.5 text-xs font-mono">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#121418] border border-white/5">
                        <span className="text-white/60">GPS Geofence</span>
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" /> 14m (Within 50m)
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#121418] border border-white/5">
                        <span className="text-white/60">Device Binding</span>
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" /> Hardware Bound
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#121418] border border-white/5">
                        <span className="text-white/60">Anti-Passback</span>
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" /> Cooldown Clear
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Simulator Outcome Display */}
                  {simState === 'GRANTED' ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-center animate-in fade-in zoom-in duration-200">
                      <div className="flex items-center justify-center gap-2 text-emerald-400 font-['Unbounded',sans-serif] font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>ACCESS GRANTED • TURNSTILE OPEN</span>
                      </div>
                      <p className="text-[11px] text-emerald-300/80 font-mono mt-1">
                        Latency: {simLatency}ms • WebSocket Dispatched to Desk • WhatsApp Notified
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleSimulateScan}
                      disabled={simState === 'SCANNING'}
                      className="w-full bg-[#ccff00] text-black hover:bg-[#b8e600] disabled:opacity-50 font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(204,255,0,0.2)]"
                    >
                      {simState === 'SCANNING' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Verifying 4-Tier Security Protocol...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Test Turnstile Check-In Scan</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Micro Footnote */}
                <p className="text-center text-xs text-white/40 mt-4">
                  Interactive demo: Emulates member scanning facility QR with real-time biometric and location validation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. FEATURE BANNER (CONVERTED TEAL BLOCK TO SURFACE DARK + VOLT) */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
        <div className="bg-[#0e1015] border border-[#ccff00]/40 rounded-3xl p-8 sm:p-12 shadow-[0_0_25px_rgba(204,255,0,0.2)] relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] text-xs font-bold uppercase mb-4">
              <Shield className="w-3.5 h-3.5" />
              <span>Zero Leakage Infrastructure</span>
            </div>
            <h2 className="font-['Unbounded',sans-serif] font-black text-2xl sm:text-3xl lg:text-4xl text-white uppercase tracking-tight leading-snug">
              Built to Eliminate Card Sharing, Pass Clones & Unpaid Foot Traffic
            </h2>
            <p className="font-['Outfit',sans-serif] text-white/70 text-base sm:text-lg mt-4 leading-relaxed">
              Standard RFID badges and physical barcodes get passed between gym members every day. FIDGIT seals access leaks using four automated security checkpoints that guarantee only paying subscribers enter your club.
            </p>
          </div>

          {/* 3 Feature Highlights Inside Banner */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#121418] border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] flex items-center justify-center font-bold font-mono text-sm mb-4">
                01
              </div>
              <h3 className="font-['Unbounded',sans-serif] text-sm font-bold text-white uppercase">
                50-Meter GPS Geofence
              </h3>
              <p className="text-xs text-white/60 mt-2 leading-relaxed">
                Scan coordinates are verified directly via device GPS hardware. Scans attempted from outside your gym are blocked immediately.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#121418] border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] flex items-center justify-center font-bold font-mono text-sm mb-4">
                02
              </div>
              <h3 className="font-['Unbounded',sans-serif] text-sm font-bold text-white uppercase">
                Device Hardware Binding
              </h3>
              <p className="text-xs text-white/60 mt-2 leading-relaxed">
                Accounts are locked to a single physical smartphone signature. Multiple device logins are quarantined pending manager authorization.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#121418] border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] flex items-center justify-center font-bold font-mono text-sm mb-4">
                03
              </div>
              <h3 className="font-['Unbounded',sans-serif] text-sm font-bold text-white uppercase">
                WhatsApp Invoicing
              </h3>
              <p className="text-xs text-white/60 mt-2 leading-relaxed">
                Members automatically receive an official stamped PDF membership bill on WhatsApp right after desk onboarding or renewal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. MODULAR CORE FEATURES GRID                                  */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono text-[#ccff00] uppercase tracking-widest bg-[#ccff00]/10 px-3 py-1 rounded-full border border-[#ccff00]/20">
            COMPLETE FACILITY STACK
          </span>
          <h2 className="font-['Unbounded',sans-serif] font-black text-3xl sm:text-4xl text-white uppercase tracking-tight mt-4">
            Engineered for Front Desk Speed & Member Self-Service
          </h2>
          <p className="text-white/70 text-base sm:text-lg mt-3">
            Everything your gym owners, desk managers, and trainers need to manage memberships, track attendance, and prevent revenue fraud.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1: Hardware-Free Turnstile */}
          <div className="bg-[#0e1015] border border-white/10 hover:border-[#ccff00]/40 rounded-3xl p-8 transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.15)] group">
            <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00] mb-6 group-hover:scale-110 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-['Unbounded',sans-serif] text-lg font-bold text-white uppercase">
              Static Poster Turnstiles
            </h3>
            <p className="text-sm text-white/70 mt-3 leading-relaxed">
              Print our high-security gate QR poster once. Members scan upon arrival to verify payment, location, and device validity.
            </p>
          </div>

          {/* Card 2: 3-Minute Anti-Passback */}
          <div className="bg-[#0e1015] border border-white/10 hover:border-[#ccff00]/40 rounded-3xl p-8 transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.15)] group">
            <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00] mb-6 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-['Unbounded',sans-serif] text-lg font-bold text-white uppercase">
              Anti-Passback Timer
            </h3>
            <p className="text-sm text-white/70 mt-3 leading-relaxed">
              Enforces a strict 3-minute cooldown between scans to stop members from scanning and passing their phone back to an unregistered friend.
            </p>
          </div>

          {/* Card 3: WhatsApp Dispatch */}
          <div className="bg-[#0e1015] border border-white/10 hover:border-[#ccff00]/40 rounded-3xl p-8 transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.15)] group">
            <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00] mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-['Unbounded',sans-serif] text-lg font-bold text-white uppercase">
              Automated WhatsApp Bills
            </h3>
            <p className="text-sm text-white/70 mt-3 leading-relaxed">
              Dispatches authenticated PDF receipts with official gym stamps directly to member WhatsApp chats the instant desk payments are received.
            </p>
          </div>

          {/* Card 4: Desk Billing & Onboarding */}
          <div className="bg-[#0e1015] border border-white/10 hover:border-[#ccff00]/40 rounded-3xl p-8 transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.15)] group">
            <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00] mb-6 group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-['Unbounded',sans-serif] text-lg font-bold text-white uppercase">
              Instant Desk Billing
            </h3>
            <p className="text-sm text-white/70 mt-3 leading-relaxed">
              Front desk staff can register walk-in members, assign membership packages, log cash/UPI payments, and issue digital passes in under 30 seconds.
            </p>
          </div>

          {/* Card 5: Real-Time Floor Occupancy */}
          <div className="bg-[#0e1015] border border-white/10 hover:border-[#ccff00]/40 rounded-3xl p-8 transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.15)] group">
            <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00] mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-['Unbounded',sans-serif] text-lg font-bold text-white uppercase">
              Live Floor Occupancy
            </h3>
            <p className="text-sm text-white/70 mt-3 leading-relaxed">
              Live real-time floor occupancy with WebSocket updates, instant emergency manual checkout, and peak hour attendance analytics.
            </p>
          </div>

          {/* Card 6: Multi-Tenant Architecture */}
          <div className="bg-[#0e1015] border border-white/10 hover:border-[#ccff00]/40 rounded-3xl p-8 transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.15)] group">
            <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00] mb-6 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-['Unbounded',sans-serif] text-lg font-bold text-white uppercase">
              Multi-Branch Ready
            </h3>
            <p className="text-sm text-white/70 mt-3 leading-relaxed">
              Operate single boutique studios or multi-city fitness chains with isolated database tenants, custom gym codes, and cross-branch pass support.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. COMMERCIAL 3-TIER PRICING GRID                             */}
      {/* ------------------------------------------------------------- */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono text-[#ccff00] uppercase tracking-widest bg-[#ccff00]/10 px-3 py-1 rounded-full border border-[#ccff00]/20">
            TRANSPARENT PRICING
          </span>
          <h2 className="font-['Unbounded',sans-serif] font-black text-3xl sm:text-4xl text-white uppercase tracking-tight mt-4">
            Commercial Plans for Every Fitness Facility
          </h2>
          <p className="text-white/70 text-base sm:text-lg mt-3">
            Choose the operating tier that matches your gym’s size and member volume. All plans include 14 days free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* TIER 1: Starter Gym */}
          <div className="bg-[#0e1015] border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:border-white/20 transition">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono text-white/60 tracking-wider uppercase font-bold">
                  STUDIO / BOUTIQUE
                </span>
              </div>
              <h3 className="font-['Unbounded',sans-serif] text-xl font-bold text-white uppercase">
                Starter Gym
              </h3>
              <p className="text-sm text-white/60 mt-2">
                Ideal for personal training studios and independent gyms up to 150 active members.
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-['Unbounded',sans-serif] text-4xl font-black text-white">$49</span>
                  <span className="text-sm text-white/50 font-mono">/ month</span>
                </div>
                <span className="text-[11px] text-white/40 block mt-1">Billed monthly • Cancel anytime</span>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10 text-sm text-white/80">
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Up to 150 active members</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>1 Turnstile Gate QR Poster</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>50-Meter GPS Geofence Verification</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Anti-Clone Device Hardware Binding</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Desk Billing & Cash Management</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Member Mobile Web Pass</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Starter Gym')}
                className="w-full bg-[#121418] hover:bg-white/10 text-white hover:text-[#ccff00] border border-white/15 hover:border-[#ccff00] font-bold py-3.5 rounded-xl transition text-center cursor-pointer"
              >
                Choose Starter Plan
              </button>
            </div>
          </div>

          {/* TIER 2: Pro Fitness Hub (POPULAR / HIGHLIGHTED) */}
          <div className="bg-[#0e1015] border-2 border-[#ccff00] rounded-3xl p-8 flex flex-col justify-between shadow-[0_0_35px_rgba(204,255,0,0.18)] relative lg:-translate-y-2 z-10">
            {/* Highlight Ribbon */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#ccff00] text-black font-['Unbounded',sans-serif] font-black text-[10px] tracking-wider px-4 py-1 rounded-full uppercase shadow-md">
              MOST POPULAR
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono text-[#ccff00] tracking-wider uppercase font-bold">
                  COMMERCIAL CLUB
                </span>
              </div>
              <h3 className="font-['Unbounded',sans-serif] text-2xl font-black text-white uppercase">
                Pro Fitness Hub
              </h3>
              <p className="text-sm text-white/60 mt-2">
                Engineered for high-volume commercial gyms, crossfit boxes, and 24/7 fitness centers.
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-['Unbounded',sans-serif] text-5xl font-black text-[#ccff00]">$99</span>
                  <span className="text-sm text-white/50 font-mono">/ month</span>
                </div>
                <span className="text-[11px] text-[#ccff00]/70 block mt-1">14 days free trial included</span>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10 text-sm text-white/90">
                <div className="flex items-center gap-3 font-semibold text-white">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Unlimited active members</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Unlimited Entrance & Exit Gates</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>GPS Geofence + Dynamic Direction</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Hardware Device Lock & Fraud Quarantine</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>WhatsApp Automated PDF Invoicing</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Live Real-Time Floor Occupancy Radar</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Health Intelligence & Renewal Risk Matrix</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>24/7 Priority WhatsApp & Desk Support</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Pro Fitness Hub')}
                className="w-full bg-[#ccff00] text-black hover:bg-[#b8e600] font-black py-4 rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.3)] transition text-center cursor-pointer"
              >
                Start 14-Day Free Trial
              </button>
            </div>
          </div>

          {/* TIER 3: Enterprise Multi-Branch */}
          <div className="bg-[#0e1015] border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:border-white/20 transition">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono text-white/60 tracking-wider uppercase font-bold">
                  MULTI-LOCATION FRANCHISE
                </span>
              </div>
              <h3 className="font-['Unbounded',sans-serif] text-xl font-bold text-white uppercase">
                Enterprise
              </h3>
              <p className="text-sm text-white/60 mt-2">
                For gym franchises and multi-city facilities requiring centralized administration.
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-['Unbounded',sans-serif] text-4xl font-black text-white">$199</span>
                  <span className="text-sm text-white/50 font-mono">/ month</span>
                </div>
                <span className="text-[11px] text-white/40 block mt-1">Multi-tenant isolation • Custom SLAs</span>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10 text-sm text-white/80">
                <div className="flex items-center gap-3 font-semibold text-white">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Multi-Facility Tenant Management</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Cross-Gym Member Roaming Passports</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Centralized Super Admin & Financial Analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Custom WhatsApp Cloud API Gateway</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>White-Label Custom Subdomain</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Dedicated Onboarding Account Manager</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Enterprise Multi-Branch')}
                className="w-full bg-[#121418] hover:bg-white/10 text-white hover:text-[#ccff00] border border-white/15 hover:border-[#ccff00] font-bold py-3.5 rounded-xl transition text-center cursor-pointer"
              >
                Choose Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. INTERACTIVE FAQ ACCORDION SECTION                           */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="text-xs font-mono text-[#ccff00] uppercase tracking-widest bg-[#ccff00]/10 px-3 py-1 rounded-full border border-[#ccff00]/20">
            COMMON INQUIRIES
          </span>
          <h2 className="font-['Unbounded',sans-serif] font-black text-2xl sm:text-3xl text-white uppercase tracking-tight mt-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#0e1015] border border-white/10 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02]"
                >
                  <span className="font-['Unbounded',sans-serif] text-sm sm:text-base font-bold text-white">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-[#ccff00] shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/40 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-white/70 leading-relaxed border-t border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. PRE-FOOTER TRIAL CTA BANNER                                */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-b from-[#121418] to-[#0e1015] border border-[#ccff00]/30 rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden shadow-[0_0_30px_rgba(204,255,0,0.15)]">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-['Unbounded',sans-serif] font-black text-2xl sm:text-4xl text-white uppercase tracking-tight">
              Ready to Upgrade Your Gym Operating System?
            </h2>
            <p className="text-white/70 text-base sm:text-lg mt-4">
              Join hundreds of modern fitness facilities that replaced slow hardware turnstiles with FIDGIT smart entry. Setup takes less than 5 minutes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Pro Fitness Hub')}
                className="w-full sm:w-auto bg-[#ccff00] text-black hover:bg-[#b8e600] font-bold text-base px-8 py-4 rounded-2xl shadow-[0_0_25px_rgba(204,255,0,0.35)] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => onOpenAuth('MEMBER_LOGIN')}
                className="w-full sm:w-auto bg-[#050507] hover:bg-white/5 text-white border border-white/15 font-bold text-base px-7 py-4 rounded-2xl transition cursor-pointer"
              >
                Explore Member Pass
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. FOOTER                                                     */}
      {/* ------------------------------------------------------------- */}
      <footer className="bg-[#050507] border-t border-white/10 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand & Mission */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0e1015] border border-[#ccff00]/40 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#ccff00]" />
                </div>
                <span className="font-['Unbounded',sans-serif] font-black text-xl tracking-tight text-white">
                  FIDGIT OS
                </span>
              </div>
              <p className="text-sm text-white/60 mt-4 max-w-md leading-relaxed">
                The hardware-free turnstile and smart gym customer relationship management platform. Designed for modern athletic clubs, crossfit boxes, and bodybuilding gyms.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-mono text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ALL SYSTEMS OPERATIONAL • 99.99% UPTIME</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-['Unbounded',sans-serif] text-xs font-bold uppercase tracking-wider text-white mb-4">
                PLATFORM
              </h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li>
                  <a href="#turnstile" className="hover:text-white transition">
                    Smart Turnstile Radar
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition">
                    Anti-Passback Protocols
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition">
                    Commercial Pricing
                  </a>
                </li>
                <li>
                  <button onClick={handleInstallClick} className="hover:text-[#ccff00] transition text-left">
                    Install Progressive Web App
                  </button>
                </li>
              </ul>
            </div>

            {/* Access & Security */}
            <div>
              <h4 className="font-['Unbounded',sans-serif] text-xs font-bold uppercase tracking-wider text-white mb-4">
                DIRECT ACCESS
              </h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li>
                  <button onClick={() => onOpenAuth('MEMBER_LOGIN')} className="hover:text-white transition text-left">
                    Member Pass Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => onOpenAuth('STAFF_LOGIN')} className="hover:text-white transition text-left">
                    Manager Desk Login
                  </button>
                </li>
                <li>
                  <button onClick={() => onOpenAuth('REGISTER_BUSINESS')} className="hover:text-white transition text-left">
                    Register Facility
                  </button>
                </li>
                <li>
                  <span className="text-white/40 text-xs block pt-2 font-mono">
                    AES-256 Geofence Encrypted
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <p>© {new Date().getFullYear()} FIDGIT. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="hover:text-[#ccff00] transition cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="hover:text-white transition cursor-pointer">Terms of Service</span>
              <span className="hover:text-white transition cursor-pointer">Security Whitepaper</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* 9. PWA INSTALLATION MODAL                                     */}
      {/* ------------------------------------------------------------- */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0e1015] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsInstallModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#121418] text-white/60 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/30 flex items-center justify-center text-[#ccff00]">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-['Unbounded',sans-serif] text-base font-bold text-white uppercase">
                  Install FIDGIT Pass
                </h3>
                <p className="text-xs text-white/50">Instant 1-Tap Home Screen Access</p>
              </div>
            </div>

            {/* Device Tabs */}
            <div className="flex p-1 bg-[#121418] rounded-xl mb-6">
              <button
                onClick={() => setInstallTab('android')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  installTab === 'android' ? 'bg-[#ccff00] text-black font-black' : 'text-white/60 hover:text-white'
                }`}
              >
                Android
              </button>
              <button
                onClick={() => setInstallTab('ios')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  installTab === 'ios' ? 'bg-[#ccff00] text-black font-black' : 'text-white/60 hover:text-white'
                }`}
              >
                iOS (iPhone)
              </button>
              <button
                onClick={() => setInstallTab('desktop')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  installTab === 'desktop' ? 'bg-[#ccff00] text-black font-black' : 'text-white/60 hover:text-white'
                }`}
              >
                Desktop
              </button>
            </div>

            {/* Instructions per OS */}
            {installTab === 'ios' && (
              <div className="space-y-4 text-xs text-white/70 leading-relaxed bg-[#121418] p-4 rounded-2xl border border-white/5">
                <p className="font-semibold text-white">Follow these simple steps in Safari:</p>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center font-bold text-[10px] shrink-0">
                    1
                  </span>
                  <span>Tap the <strong>Share</strong> button (box with upward arrow) at the bottom of Safari.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center font-bold text-[10px] shrink-0">
                    2
                  </span>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center font-bold text-[10px] shrink-0">
                    3
                  </span>
                  <span>Tap <strong>Add</strong> in the top right. The app will appear on your phone screen!</span>
                </div>
              </div>
            )}

            {installTab === 'android' && (
              <div className="space-y-4 text-xs text-white/70 leading-relaxed bg-[#121418] p-4 rounded-2xl border border-white/5">
                <p className="font-semibold text-white">In Chrome or your Android browser:</p>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center font-bold text-[10px] shrink-0">
                    1
                  </span>
                  <span>Tap the <strong>three dots menu (⋮)</strong> in the top-right corner.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center font-bold text-[10px] shrink-0">
                    2
                  </span>
                  <span>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span>
                </div>
              </div>
            )}

            {installTab === 'desktop' && (
              <div className="space-y-4 text-xs text-white/70 leading-relaxed bg-[#121418] p-4 rounded-2xl border border-white/5">
                <p className="font-semibold text-white">On Google Chrome or Edge:</p>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center font-bold text-[10px] shrink-0">
                    1
                  </span>
                  <span>Look for the <strong>Install icon (computer with down arrow)</strong> in your browser address bar.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center font-bold text-[10px] shrink-0">
                    2
                  </span>
                  <span>Click <strong>Install</strong> to run FIDGIT in its own dedicated window.</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsInstallModalOpen(false)}
              className="mt-6 w-full bg-[#ccff00] text-black font-black py-3 rounded-xl transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* 10. FIDGIT LEGAL PRIVACY POLICY MODAL */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
};
