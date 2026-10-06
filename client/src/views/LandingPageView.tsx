import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Loader2,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  QrCode,
  Shield,
  Sparkles,
  Users,
  X,
  Zap,
  ChevronDown,
  ChevronUp,
  Footprints,
  Building2,
  Activity,
  Award
} from 'lucide-react';
import { PrivacyPolicyModal } from '../components/PrivacyPolicyModal';

export interface LandingPageViewProps {
  onOpenAuth: (tab?: 'MEMBER_LOGIN' | 'STAFF_LOGIN' | 'SIGNUP' | 'REGISTER_BUSINESS', planName?: string) => void;
  isLoggedIn?: boolean;
  onGoToDashboard?: () => void;
}

// ---------------------------------------------------------------------------
// Image Assets (Curated high-performance athletic and gym visual assets)
// ---------------------------------------------------------------------------
const HERO_IMAGE = 'https://images.hostinger.com/f1f71913-74ef-48ce-8a2b-48838b17f685.png';
const BAND_IMAGE = 'https://images.hostinger.com/85bffa96-903d-4e8b-984d-049472895e68.png';
const TESTIMONIALS_BG = 'https://images.hostinger.com/24806503-399f-4e4b-b2a1-68b6f596b1e6.png';

const INFINITY_PATH =
  'M100 50 C100 22 62 18 42 32 C22 46 22 60 42 70 C62 80 100 66 100 50 C100 34 138 20 158 32 C178 46 178 60 158 70 C138 80 100 66 100 50 Z';

// ---------------------------------------------------------------------------
// Pillars / Core Modules Data
// ---------------------------------------------------------------------------
const PILLARS = [
  {
    name: 'Power & Access',
    subtitle: 'Zero Hardware Turnstiles',
    tagline: 'Cryptographic QR check-ins. 50m GPS geofencing and zero gate queues.',
    image: 'https://images.hostinger.com/120572e0-0a0e-4868-b309-a4293d5c30aa.png',
    alt: 'Athlete performing explosive barbell lift in modern gym',
    badge: 'Hardware-Free',
  },
  {
    name: 'Strength & Billing',
    subtitle: 'Automated Invoicing Engine',
    tagline: 'Instant desk onboarding, UPI/cash collection, and automated WhatsApp stamped PDF receipts.',
    image: 'https://images.hostinger.com/f64a27c2-882c-45e4-9f81-1d8a769d0ea8.png',
    alt: 'Athlete lifting heavy deadlift with focus',
    badge: 'WhatsApp Verified',
  },
  {
    name: 'Endurance & Ops',
    subtitle: 'Live Floor Telemetry',
    tagline: 'Real-time WebSocket occupancy radar, 3-minute anti-passback cooldown, and multi-tenant branches.',
    image: 'https://images.hostinger.com/12afb4ec-041c-46c1-80ef-42f9ef7e0bed.png',
    alt: 'Athlete pushing sled across performance floor',
    badge: 'Sub-20ms Radar',
  },
  {
    name: 'Mobility & PWA',
    subtitle: '1-Tap Member Digital Pass',
    tagline: 'Zero App Store friction. Offline pass display, health metrics, and automated renewal reminders.',
    image: 'https://images.hostinger.com/27274134-1335-4e74-8a62-5c60ee6dcce3.png',
    alt: 'Athlete performing mobility restoration stretch',
    badge: 'PWA Web Pass',
  },
];

// ---------------------------------------------------------------------------
// Benefits Matrix ("Why FIDGIT")
// ---------------------------------------------------------------------------
const BENEFITS = [
  {
    title: 'Zero Hardware Turnstiles',
    body: 'Save $5,000+ per turnstile gate. Print our cryptographic QR entrance poster once and let members verify via smartphone.',
  },
  {
    title: '50-Meter GPS Geofencing',
    body: 'Scans are validated against verified venue coordinates. Remote check-ins and spoofed locations are blocked instantly.',
  },
  {
    title: 'Anti-Clone Device Lock',
    body: 'Member accounts are cryptographically bound to physical hardware signatures. Simultaneous logins are automatically quarantined.',
  },
  {
    title: 'Automated WhatsApp Bills',
    body: 'Members immediately receive an official stamped PDF tax invoice on WhatsApp right after desk onboarding or renewal.',
  },
  {
    title: 'Live Floor Occupancy Radar',
    body: 'Real-time WebSocket occupancy telemetry tracks active floor headcounts, hourly peak volume, and turnaround speed.',
  },
  {
    title: 'Multi-Tenant Branch Roaming',
    body: 'Operate single boutique studios or multi-city fitness chains with isolated database tenants, custom codes, and roaming passes.',
  },
];

// ---------------------------------------------------------------------------
// Coaches / Guides Data
// ---------------------------------------------------------------------------
const COACHES = [
  {
    name: 'Amara Osei',
    role: 'Head of Facility Operations',
    quote: 'Speed at the front desk is everything. We engineered check-ins to take under 18 milliseconds.',
    image: 'https://images.hostinger.com/d131976f-70ea-4cb8-910b-269b16dd62bb.png',
  },
  {
    name: 'Erik Lindqvist',
    role: 'Strength & Conditioning Lead',
    quote: 'Build the community, protect the revenue. A secure club is a profitable club.',
    image: 'https://images.hostinger.com/e7bb1570-1e8a-4e88-b986-0a23290c7689.png',
  },
  {
    name: 'Mei Tanaka',
    role: 'Member Experience Director',
    quote: 'Members love having their digital pass on their home screen without downloading a bloated app.',
    image: 'https://images.hostinger.com/b4297678-8367-4507-94bb-f1030aa8a714.png',
  },
  {
    name: 'Jonas Weber',
    role: 'Security & Access Architect',
    quote: 'Mechanical turnstiles break down constantly. Cryptographic geofenced gates never do.',
    image: 'https://images.hostinger.com/ab9a6914-e338-4226-bd25-2577312f543a.png',
  },
];

// ---------------------------------------------------------------------------
// Social Proof Quotes & Live Ticker Stats
// ---------------------------------------------------------------------------
const TESTIMONIAL_QUOTES = [
  {
    quote: 'We threw out our clunky $6,000 RFID turnstiles. FIDGIT paid for itself in week one with zero maintenance headaches.',
    name: 'Marcus Vance',
    detail: 'Owner, Apex Ironworks Berlin',
  },
  {
    quote: 'Members love the instant WhatsApp bill with the official gym stamp. Our front desk staff saves 2 hours every evening.',
    name: 'Elena Rostova',
    detail: 'General Manager, Pulse Conditioning',
  },
  {
    quote: 'Anti-passback completely stopped card sharing between friends. Unpaid traffic dropped to zero in our first month.',
    name: 'Devin Thorne',
    detail: 'Founder, Iron District CrossFit',
  },
];

const STATS = [
  { value: 500, suffix: '+', label: 'Facilities Powered' },
  { value: 18, suffix: 'ms', label: 'Turnstile Latency' },
  { value: 99, suffix: '.9%', label: 'Platform Uptime' },
  { value: 0, prefix: '$', suffix: '', label: 'Gate Hardware Cost' },
];

// ---------------------------------------------------------------------------
// Lightweight In-View Animation Helper (No heavy external deps)
// ---------------------------------------------------------------------------
const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: '700ms',
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`transition-all ${
        isVisible
          ? 'opacity-100 translate-y-0 filter-none'
          : 'opacity-0 translate-y-6 filter blur-[2px]'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Animated Count-Up Component
// ---------------------------------------------------------------------------
const CountUp: React.FC<{
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}> = ({ value, duration = 1600, prefix = '', suffix = '', className = '' }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame: number;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(value * eased));
          if (progress < 1) {
            frame = requestAnimationFrame(tick);
          }
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Animated Kinetic Word
// ---------------------------------------------------------------------------
const AnimatedWord: React.FC<{
  word: string;
  className?: string;
  delay?: number;
}> = ({ word, className = '', delay = 0 }) => {
  return (
    <span className={`inline-block ${className}`} aria-label={word}>
      {word.split('').map((letter, i) => (
        <span
          key={`${letter}-${i}`}
          style={{
            animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay + i * 0.045}s both`,
          }}
          className="inline-block"
        >
          {letter}
        </span>
      ))}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Rotating Circular SVG Pillar Dial Component
// ---------------------------------------------------------------------------
const PillarDial: React.FC<{
  active: number;
  onSelect: (index: number) => void;
}> = ({ active, onSelect }) => {
  const rotation = -active * 90;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Outer SVG Orbit Ring */}
      <svg
        className="absolute w-full h-full text-[#ccff00]/30"
        viewBox="0 0 120 120"
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.5"
        />
      </svg>

      {/* Rotating Dial Nodes */}
      <div
        className="absolute w-full h-full transition-transform duration-700 ease-out"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {PILLARS.map((pillar, i) => {
          const isActive = active === i;
          return (
            <div
              key={pillar.name}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ transform: `rotate(${i * 90}deg) translateY(-86px)` }}
            >
              {/* Center Orbit Node Dot */}
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 -translate-x-1/2 -translate-y-1/2 ${
                  isActive
                    ? 'bg-[#ccff00] scale-125 shadow-[0_0_12px_#ccff00]'
                    : 'bg-white/40 hover:bg-white'
                }`}
              />
              {/* Counter-rotated Text Label */}
              <button
                onClick={() => onSelect(i)}
                className={`absolute left-1/2 text-[11px] uppercase tracking-wider whitespace-nowrap font-body font-medium transition-all duration-500 cursor-pointer ${
                  isActive
                    ? 'text-[#ccff00] font-bold drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]'
                    : 'text-white/50 hover:text-white'
                }`}
                style={{
                  transform: `translateX(-50%) translateY(-28px) rotate(${-i * 90 - rotation}deg)`,
                }}
              >
                {pillar.name}
              </button>
            </div>
          );
        })}
      </div>

      {/* Central Hub Core */}
      <div className="w-12 h-12 rounded-full bg-[#0e1015] border border-[#ccff00]/40 flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.2)]">
        <span className="font-heading text-xs font-bold text-[#ccff00]">
          0{active + 1}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Redesigned Landing Page View
// ---------------------------------------------------------------------------
export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onOpenAuth,
  isLoggedIn = false,
  onGoToDashboard,
}) => {
  // Navigation & Curtain Menu State
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // Pillars Active Index & Scroll Sync
  const [activePillar, setActivePillar] = useState<number>(0);
  const pillarRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Benefits 3D Carousel State
  const [activeBenefit, setActiveBenefit] = useState<number>(0);

  // Coaches Accordion State (Pair 1 & Pair 2)
  const [activeCoach1, setActiveCoach1] = useState<number>(0);
  const [activeCoach2, setActiveCoach2] = useState<number>(1);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Turnstile Radar Simulator Interactive State
  const [simState, setSimState] = useState<'IDLE' | 'SCANNING' | 'GRANTED'>('IDLE');
  const [simLatency, setSimLatency] = useState<number>(16);

  // Contact / Lead Form State
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    pillar: 'power',
    message: '',
  });
  const [leadStatus, setLeadStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // PWA Install State & Privacy Modal
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [installTab, setInstallTab] = useState<'ios' | 'android' | 'desktop'>('android');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);

  // Scroll listener for glassmorphic navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when curtain menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Privacy hash detection
  useEffect(() => {
    if (window.location.hash === '#privacy' || window.location.pathname === '/privacy') {
      setIsPrivacyModalOpen(true);
    }
    const handleOpenPrivacy = () => setIsPrivacyModalOpen(true);
    window.addEventListener('open-privacy-policy', handleOpenPrivacy);
    return () => window.removeEventListener('open-privacy-policy', handleOpenPrivacy);
  }, []);

  // PWA detection
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) setIsAppInstalled(true);

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

  // Pillar scroll sync via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-pillar-index'));
            if (!isNaN(index)) setActivePillar(index);
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );

    pillarRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToPillar = (index: number) => {
    setActivePillar(index);
    pillarRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') setIsAppInstalled(true);
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
    const randomLatency = Math.floor(Math.random() * 12) + 12;
    setSimLatency(randomLatency);
    setTimeout(() => {
      setSimState('GRANTED');
      setTimeout(() => {
        setSimState('IDLE');
      }, 4000);
    }, 1100);
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leadStatus === 'submitting') return;
    setLeadStatus('submitting');
    setTimeout(() => {
      setLeadStatus('success');
    }, 900);
  };

  const navLinks = [
    { label: 'The Pillars', href: '#pillars' },
    { label: 'Why FIDGIT', href: '#why-fidgit' },
    { label: 'Guides', href: '#coaches' },
    { label: 'Proof', href: '#proof' },
    { label: 'Radar', href: '#turnstile' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  const faqs = [
    {
      q: 'How does the hardware-free smart turnstile work?',
      a: 'Instead of expensive physical RFID turnstiles that cost thousands to purchase and maintain, FIDGIT provides a cryptographic QR code poster for your entrance. Members open their mobile web pass, scan the poster, and our backend verifies GPS geofencing, device hardware identity, and active subscription in under 18 milliseconds.',
    },
    {
      q: 'What prevents members from taking a screenshot of the QR code and sharing it?',
      a: 'The gate QR code is locked to physical venue coordinates via GPS geofencing (50-meter radius). Furthermore, member accounts are permanently bound to their unique smartphone hardware ID. When a login attempt occurs on an unrecognized device, the account is quarantined and an alert triggers on the gym admin panel.',
    },
    {
      q: 'How does WhatsApp automated billing and invoicing work?',
      a: 'Whenever an onboarding payment or renewal occurs, FIDGIT automatically generates an authentic PDF invoice complete with your gym’s authorized stamp, tax breakdown, and dates. It then dispatches this directly to the member’s WhatsApp number with zero manual action required.',
    },
    {
      q: 'Can members check in more than once in a single day?',
      a: 'Yes, if authorized by your club rules. If a member exits and attempts a second check-in within the anti-passback cooldown (3 minutes), the system logs the event and prompts your desk staff to grant instant access with one click.',
    },
    {
      q: 'Do members need to download an app from the App Store or Google Play?',
      a: 'No! FIDGIT is built as an ultra-fast Progressive Web App (PWA). Members simply visit your gym’s link in Safari or Chrome and tap "Add to Home Screen". It installs immediately, takes less than 2MB of storage, and works offline for instant digital pass display.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#050507] text-white font-body selection:bg-[#ccff00] selection:text-black antialiased overflow-x-clip">
      {/* ------------------------------------------------------------- */}
      {/* 1. ULTRA-SLEEK GLASSMORPHIC HEADER & CURTAIN MENU             */}
      {/* ------------------------------------------------------------- */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#050507]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl'
            : 'bg-transparent'
        }`}
      >
        <div className="flex items-center justify-between px-6 md:px-[8vw] h-16 md:h-20">
          {/* Brand Wordmark */}
          <a
            href="#top"
            className="group flex items-center gap-3 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#0e1015] border border-[#ccff00]/40 flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.25)] transition-transform group-hover:scale-105">
              <Zap className="w-4 h-4 text-[#ccff00]" />
            </div>
            <span className="font-heading text-xl md:text-2xl font-medium tracking-[0.35em] text-white">
              FIDGIT
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.slice(0, 5).map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs tracking-[0.2em] uppercase font-body text-white/70 hover:text-white transition-opacity hover:opacity-100"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Action Buttons & Hamburger */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleInstallClick}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs tracking-[0.1em] uppercase font-medium text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/30 px-3.5 py-1.5 rounded hover:bg-[#ccff00]/20 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAppInstalled ? 'Pass Ready' : 'Install Pass'}</span>
            </button>

            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                className="hidden md:inline-flex items-center gap-2 bg-[#ccff00] text-black px-5 py-2 text-xs tracking-[0.1em] uppercase font-medium rounded transition-all duration-300 hover:tracking-[0.2em] shadow-[0_0_15px_rgba(204,255,0,0.3)] cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('MEMBER_LOGIN')}
                  className="hidden md:inline-flex text-xs tracking-[0.15em] uppercase font-medium text-white/80 hover:text-white transition cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Pro Fitness Hub')}
                  className="hidden md:inline-flex items-center gap-2 bg-white text-black hover:bg-[#ccff00] hover:text-black px-5 py-2 text-xs tracking-[0.1em] uppercase font-medium rounded transition-all duration-300 hover:tracking-[0.2em] shadow-lg cursor-pointer"
                >
                  <span>Free Trial</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </>
            )}

            {/* 3-Bar Minimalist Hamburger Menu Trigger */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex flex-col justify-center gap-1.5 w-11 h-11 items-end text-white hover:text-[#ccff00] transition-colors cursor-pointer"
            >
              <span className="block h-px w-7 bg-current" />
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-7 bg-current" />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* FULLSCREEN CURTAIN MODAL NAVIGATION MENU                     */}
      {/* ------------------------------------------------------------- */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-[#050507] text-white flex flex-col justify-between animate-in fade-in duration-300">
          {/* Top Curtain Bar */}
          <div className="flex items-center justify-between px-6 md:px-[8vw] h-16 md:h-20 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#ccff00]" />
              <span className="font-heading text-2xl font-medium tracking-[0.35em] text-white">
                FIDGIT
              </span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="w-11 h-11 flex items-center justify-center text-white/80 hover:text-[#ccff00] transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Large Serif Numbered Links */}
          <nav className="flex-1 flex flex-col justify-center px-6 md:px-[8vw] gap-2 max-w-4xl">
            {navLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="group flex items-baseline gap-4 py-3 border-b border-white/10 hover:border-[#ccff00]/40 transition-colors"
              >
                <span className="text-xs tracking-[0.3em] text-[#ccff00] font-mono">
                  0{i + 1}
                </span>
                <span className="font-heading text-3xl md:text-5xl lg:text-6xl font-light tracking-tight transition-transform duration-300 group-hover:translate-x-3 group-hover:text-[#ccff00]">
                  {link.label}
                </span>
              </a>
            ))}
          </nav>

          {/* Curtain Footer Address & Hours */}
          <div className="px-6 md:px-[8vw] pb-10 flex flex-col md:flex-row justify-between gap-4 text-xs tracking-[0.2em] uppercase text-white/60 font-body border-t border-white/10 pt-6">
            <span className="text-[#ccff00]">Zero-Hardware Smart Turnstile CRM</span>
            <span>hello@fitgit.fit</span>
            <span>24/7 Geofence Verified Access</span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. CINEMATIC HERO SECTION                                      */}
      {/* ------------------------------------------------------------- */}
      <section
        id="top"
        className="relative min-h-[100dvh] flex items-end overflow-hidden rounded-b-[28px] pt-24"
      >
        {/* Background Image with Dark Cinematic Gradient Overlays */}
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="Athlete mid kettlebell swing in a moody high-performance gym"
            className="w-full h-full object-cover object-center scale-105 animate-in fade-in duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/60 to-[#050507]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(204,255,0,0.06)_0%,transparent_70%)] pointer-events-none" />
        </div>

        {/* Vertical Editorial Side Tag */}
        <span className="vertical-label hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[0.65rem] tracking-[0.35em] uppercase text-white/60 font-body z-10">
          Power · Precision · Access · Intelligence
        </span>

        {/* Left Giant Kinetic Wordmark */}
        <div className="absolute top-28 md:top-32 left-6 md:left-[8vw] z-10 pointer-events-none">
          <AnimatedWord
            word="OPERATE"
            delay={0.15}
            className="font-heading text-5xl md:text-[9vw] lg:text-[7.5vw] font-light text-white leading-none tracking-tight block"
          />
          <AnimatedWord
            word="SCALE"
            delay={0.45}
            className="font-heading text-5xl md:text-[9vw] lg:text-[7.5vw] font-light text-[#ccff00] leading-none tracking-tight md:hidden block mt-1"
          />
        </div>

        {/* Right Kinetic Wordmark (Desktop Offset) */}
        <div className="absolute hidden md:block right-[8vw] bottom-56 z-10 pointer-events-none">
          <AnimatedWord
            word="SCALE"
            delay={0.45}
            className="font-heading text-5xl md:text-[9vw] lg:text-[7.5vw] font-light text-[#ccff00] leading-none tracking-tight text-right block"
          />
        </div>

        {/* Manifesto Copy & Dual Action CTAs */}
        <div className="relative w-full px-6 md:px-[8vw] pb-16 md:pb-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] text-xs font-mono uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Zero-Hardware Gym OS</span>
            </div>
            <p className="font-body text-sm md:text-base leading-relaxed text-white/85">
              Eliminate expensive physical turnstile gates. Protect your revenue with 50-meter GPS
              geofencing, anti-clone device hardware binding, and automated WhatsApp membership
              billing.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Pro Fitness Hub')}
              className="group inline-flex items-center justify-center gap-2 bg-[#ccff00] text-black px-7 py-3.5 text-xs tracking-[0.1em] uppercase font-bold transition-all duration-300 hover:tracking-[0.2em] rounded active:scale-[0.98] shadow-[0_0_25px_rgba(204,255,0,0.35)] cursor-pointer"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <a
              href="#turnstile"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3.5 text-xs tracking-[0.1em] uppercase font-medium transition-all rounded cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#ccff00]" />
              <span>Test Gate Simulator</span>
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. FREE SESSION / DAY PASS PROMO CALLOUT                      */}
      {/* ------------------------------------------------------------- */}
      <section className="relative py-20 md:py-28 overflow-hidden rounded-b-[28px] bg-[#0e1015]">
        <div
          className="absolute pointer-events-none left-0 right-0 mx-auto w-full max-w-[800px] h-[520px] -bottom-[35%] rounded-t-full blur-[70px] opacity-25"
          style={{
            background: 'linear-gradient(to top, #ccff00, #10b981)',
          }}
        />
        <span className="vertical-label hidden md:block absolute left-6 top-1/2 -translate-y-1/2 text-[0.65rem] tracking-[0.35em] uppercase text-white/40 font-body">
          Zero commitment
        </span>

        <div className="relative max-w-4xl mx-auto px-6 md:px-[8vw] text-center">
          <Reveal className="flex flex-col items-center gap-6">
            <Footprints
              size={64}
              strokeWidth={1.2}
              className="text-[#ccff00]"
              aria-hidden="true"
            />
            <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight text-white">
              Your first 14 days on us
            </h2>
            <p className="font-body text-sm md:text-base max-w-xl leading-relaxed mx-auto text-white/70">
              Feel the front-desk speed, deploy your QR entrance posters, and test all four security
              checkpoints before you commit to anything. No hardware setup required — just 5 minutes.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Pro Fitness Hub')}
                className="group inline-flex items-center gap-2 bg-[#ccff00] text-black px-7 py-3 text-xs tracking-[0.1em] uppercase font-bold transition-all duration-300 hover:tracking-[0.2em] rounded active:scale-[0.98] shadow-[0_0_20px_rgba(204,255,0,0.3)] cursor-pointer"
              >
                <span>Claim Your Trial</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. THE FOUR PILLARS SECTION (WITH INTERACTIVE ROTATING DIAL)  */}
      {/* ------------------------------------------------------------- */}
      <section id="pillars" className="relative">
        <span className="vertical-label hidden md:block absolute left-6 top-32 text-[0.65rem] tracking-[0.35em] uppercase text-white/40 font-body">
          01 — The Four Pillars
        </span>

        <div className="w-full px-6 md:px-[8vw] py-24 md:py-32 grid grid-cols-1 md:grid-cols-3 gap-12 min-h-screen">
          {/* Left Column: Sticky Heading & Interactive SVG Rotating Dial */}
          <div className="md:sticky md:top-28 self-start h-fit">
            <Reveal>
              <p className="text-xs tracking-[0.3em] uppercase font-mono text-[#ccff00] mb-4">
                The Core Modules
              </p>
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-light leading-tight tracking-tight text-white max-w-sm">
                Find the system that scales you
              </h2>
              <p className="font-body text-sm text-white/60 mt-4 max-w-xs leading-relaxed">
                Click any pillar on the orbital dial or scroll through the module stack to inspect
                our four foundational pillars.
              </p>

              {/* Orbital Dial Widget */}
              <div className="mt-12 hidden md:block">
                <PillarDial active={activePillar} onSelect={scrollToPillar} />
              </div>
            </Reveal>
          </div>

          {/* Right Column: High-Impact Pillar Discipline Cards */}
          <div className="md:col-span-2 space-y-8">
            {PILLARS.map((pillar, i) => (
              <Reveal key={pillar.name} delay={i * 80}>
                <div
                  data-pillar-index={i}
                  ref={(el) => (pillarRefs.current[i] = el)}
                  className="group block"
                >
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl relative border border-white/10 group-hover:border-[#ccff00]/40 transition-colors shadow-2xl">
                    <img
                      src={pillar.image}
                      alt={pillar.alt}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Gradient Overlay & Metadata */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-between p-6 sm:p-8">
                      {/* Top Badge */}
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono tracking-widest uppercase bg-[#0e1015]/80 backdrop-blur-md border border-white/20 text-[#ccff00] px-3 py-1 rounded-full">
                          {pillar.badge}
                        </span>
                        <span className="text-xs font-mono text-white/50">0{i + 1}</span>
                      </div>

                      {/* Bottom Info & Action */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                        <div className="max-w-md">
                          <p className="text-xs font-mono uppercase text-[#ccff00]/80 tracking-wider">
                            {pillar.subtitle}
                          </p>
                          <h3 className="font-heading text-2xl sm:text-3xl font-light text-white mt-1">
                            {pillar.name}
                          </h3>
                          <p className="font-body text-xs sm:text-sm text-white/70 mt-2 leading-relaxed">
                            {pillar.tagline}
                          </p>
                        </div>
                        <button
                          onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Pro Fitness Hub')}
                          className="inline-flex items-center gap-1.5 bg-white text-black hover:bg-[#ccff00] px-4 py-2 text-xs tracking-[0.1em] uppercase font-bold transition-all duration-300 rounded cursor-pointer shrink-0"
                        >
                          <span>Explore</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}

            <div className="flex justify-end pt-8">
              <button
                onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Pro Fitness Hub')}
                className="group inline-flex items-center gap-2 bg-[#ccff00] text-black px-6 py-3 text-xs tracking-[0.1em] uppercase font-bold transition-all duration-300 hover:tracking-[0.2em] rounded cursor-pointer shadow-[0_0_20px_rgba(204,255,0,0.25)]"
              >
                <span>Deploy All Pillars</span>
                <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. CINEMATIC PARALLAX BREATHING BAND                           */}
      {/* ------------------------------------------------------------- */}
      <section className="relative w-full">
        <div className="relative w-full h-[480px] md:h-[620px] overflow-hidden rounded-b-[28px] px-6 md:px-[8vw]">
          <img
            src={BAND_IMAGE}
            alt="Empty moody gym interior at dusk with ambient glow"
            loading="lazy"
            className="w-full h-full object-cover absolute inset-0 scale-105"
          />
          <div className="absolute inset-0 bg-[#050507]/65" />

          {/* Infinity Loop + Breathe In / Out Animation */}
          <div className="absolute inset-0 flex items-center justify-center gap-6 md:gap-14">
            <h2 className="breathe-in font-heading text-3xl md:text-5xl font-light italic tracking-tight select-none text-white">
              Scan
            </h2>
            <svg
              viewBox="0 0 200 100"
              className="w-36 h-20 md:w-[280px] md:h-[120px] text-[#ccff00]"
              fill="none"
              aria-hidden="true"
            >
              <path
                d={INFINITY_PATH}
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <circle r="4.5" fill="currentColor">
                <animateMotion dur="5s" repeatCount="indefinite" path={INFINITY_PATH} />
              </circle>
            </svg>
            <h2 className="breathe-out font-heading text-3xl md:text-5xl font-light italic tracking-tight select-none text-white">
              Access
            </h2>
          </div>

          {/* Marquee Footnote */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-8 flex items-center justify-center">
            <p className="font-mono text-[0.65rem] md:text-xs tracking-[0.3em] uppercase text-white/80">
              Hardware-Free · Leak-Proof · Verified in Under 18ms
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. INTERACTIVE 3D CAROUSEL: "WHY FIDGIT"                      */}
      {/* ------------------------------------------------------------- */}
      <section
        id="why-fidgit"
        className="relative w-full px-6 md:px-[8vw] py-24 md:py-32 bg-gradient-to-b from-[#050507] to-[#0e1015] overflow-hidden"
      >
        <span className="vertical-label hidden md:block absolute left-6 top-32 text-[0.65rem] tracking-[0.35em] uppercase text-white/40 font-body">
          02 — Why FIDGIT
        </span>

        <Reveal className="mb-16">
          <p className="text-xs tracking-[0.3em] uppercase font-mono text-[#ccff00] mb-4">
            Why FIDGIT
          </p>
          <h2 className="font-heading text-3xl md:text-5xl font-light leading-tight tracking-tight text-white">
            Built different
          </h2>
          <p className="font-body text-sm md:text-base text-white/60 mt-3 max-w-lg leading-relaxed">
            Legacy gym software forces you into proprietary hardware contracts. FIDGIT replaces
            physical gates with zero-cost cryptographic turnstiles.
          </p>
        </Reveal>

        {/* 3D Depth Carousel (Desktop) */}
        <div className="flex flex-col items-center gap-12 relative w-full">
          <div
            className="hidden md:flex relative h-96 w-full items-center justify-center overflow-hidden"
            style={{
              maskImage:
                'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
            }}
          >
            {BENEFITS.map((benefit, i) => {
              const offset = i - activeBenefit;
              const abs = Math.abs(offset);
              return (
                <div
                  key={benefit.title}
                  className="absolute w-96 h-80 transition-all duration-500 ease-out"
                  style={{
                    left: '50%',
                    marginLeft: '-192px',
                    transform: `translateX(${offset * 340}px) scale(${1 - abs * 0.08})`,
                    opacity: abs > 2 ? 0 : 1,
                    zIndex: 10 - abs,
                    pointerEvents: abs > 2 ? 'none' : 'auto',
                  }}
                >
                  <div className="px-8 py-10 bg-[#121418] border border-white/10 rounded-2xl flex flex-col justify-between h-full shadow-[0_12px_24px_rgba(0,0,0,0.5)] hover:border-[#ccff00]/40 transition-colors">
                    <div>
                      <span className="text-xs tracking-[0.2em] text-[#ccff00] font-mono font-bold">
                        0{i + 1}
                      </span>
                      <h3 className="font-heading text-2xl font-light mt-4 text-white">
                        {benefit.title}
                      </h3>
                    </div>
                    <p className="font-body text-sm text-white/70 leading-relaxed mt-6">
                      {benefit.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Card Stack */}
          <div className="md:hidden flex flex-col gap-6 w-full">
            {BENEFITS.map((benefit, i) => (
              <Reveal key={benefit.title} delay={i * 60}>
                <div className="px-6 py-8 bg-[#121418] border border-white/10 rounded-2xl flex flex-col justify-between shadow-lg">
                  <div>
                    <span className="text-xs tracking-[0.2em] text-[#ccff00] font-mono font-bold">
                      0{i + 1}
                    </span>
                    <h3 className="font-heading text-xl font-light mt-3 text-white">
                      {benefit.title}
                    </h3>
                  </div>
                  <p className="font-body text-xs text-white/70 leading-relaxed mt-4">
                    {benefit.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Desktop Carousel Controls */}
          <div className="hidden md:flex items-center justify-between w-full max-w-xl gap-6">
            <button
              onClick={() =>
                setActiveBenefit((a) => (a - 1 + BENEFITS.length) % BENEFITS.length)
              }
              aria-label="Previous benefit"
              className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white hover:text-[#ccff00] hover:border-[#ccff00] transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              {BENEFITS.map((b, i) => (
                <button
                  key={b.title}
                  onClick={() => setActiveBenefit(i)}
                  aria-label={`Go to benefit ${i + 1}`}
                  className={`rounded-full transition-all cursor-pointer ${
                    i === activeBenefit
                      ? 'bg-[#ccff00] w-6 h-2'
                      : 'bg-white/30 hover:bg-white w-2 h-2'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setActiveBenefit((a) => (a + 1) % BENEFITS.length)}
              aria-label="Next benefit"
              className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white hover:text-[#ccff00] hover:border-[#ccff00] transition cursor-pointer"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. LIVE RADAR SIMULATOR SECTION                                */}
      {/* ------------------------------------------------------------- */}
      <section id="turnstile" className="relative py-24 md:py-32 px-6 md:px-[8vw]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] text-xs font-mono uppercase mb-4">
              <Activity className="w-3.5 h-3.5" />
              <span>Interactive Verification Demo</span>
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-light leading-tight tracking-tight text-white mb-6">
              Test the 4-Tier security radar live
            </h2>
            <p className="font-body text-sm md:text-base text-white/70 leading-relaxed mb-8">
              Experience the member check-in journey. When an athlete scans your entrance poster,
              our edge backend evaluates geofence coordinates, phone hardware ID, and active billing
              in under 18 milliseconds.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-[#0e1015] border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-[#ccff00] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-heading text-sm font-medium text-white">50m GPS Geofence</h4>
                  <p className="text-xs text-white/60 mt-1">
                    Ensures physical attendance on premises before authorizing gate unlock.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-[#0e1015] border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-[#ccff00] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-heading text-sm font-medium text-white">Device Fingerprint Lock</h4>
                  <p className="text-xs text-white/60 mt-1">
                    Binds the digital pass to the member’s physical smartphone to eliminate account sharing.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-[#0e1015] border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-[#ccff00] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-heading text-sm font-medium text-white">3-Min Anti-Passback</h4>
                  <p className="text-xs text-white/60 mt-1">
                    Prevents a member from scanning and passing their phone back to an unpaid friend.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Radar Simulator Card */}
          <div className="bg-[#0e1015] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <div>
                  <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                    LIVE ENTRY RADAR SIMULATOR
                  </h3>
                  <p className="text-[10px] text-white/50 font-mono">GATE: MAIN ENTRANCE POSTER #01</p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/30 px-2.5 py-1 rounded-full font-bold uppercase">
                ACTIVE 24/7
              </span>
            </div>

            {/* Pass Preview */}
            <div className="mt-6 bg-[#121418] border border-white/10 rounded-2xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                    DIGITAL MEMBER PASS
                  </span>
                  <h4 className="font-heading text-lg font-bold text-white mt-0.5">
                    ALEXANDER CHEN
                  </h4>
                  <p className="text-xs text-white/60 font-mono">ID: #IV-9482 • PRO FITNESS HUB</p>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                  ACTIVE ACCESS
                </div>
              </div>

              {/* QR Code and Checklist */}
              <div className="my-6 flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-xl bg-[#0e1015] border border-white/5">
                <div className="w-32 h-32 bg-[#050507] border-2 border-[#ccff00]/40 rounded-2xl p-2.5 flex flex-col items-center justify-center relative shadow-[0_0_15px_rgba(204,255,0,0.15)]">
                  <QrCode className="w-full h-full text-[#ccff00]" />
                  {simState === 'SCANNING' && (
                    <div className="absolute inset-0 bg-[#ccff00]/20 rounded-xl flex items-center justify-center backdrop-blur-xs">
                      <div className="w-full h-1 bg-[#ccff00] shadow-[0_0_10px_#ccff00] animate-bounce" />
                    </div>
                  )}
                </div>

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

              {/* Action Button or Outcome */}
              {simState === 'GRANTED' ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-center animate-in fade-in duration-200">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-heading font-bold text-sm">
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
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Verifying Security Protocol...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Simulate Gate Check-In Scan</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. COACHES & FACILITY GUIDES ACCORDION SHOWCASE               */}
      {/* ------------------------------------------------------------- */}
      <section id="coaches" className="relative py-24 md:py-32 rounded-b-[28px] bg-[#050507]">
        <span className="vertical-label hidden md:block absolute left-6 top-32 text-[0.65rem] tracking-[0.35em] uppercase text-white/40 font-body">
          03 — Your Guides
        </span>

        <div className="max-w-[1400px] mx-auto px-6 md:px-[8vw] mb-16">
          <Reveal className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase font-mono text-[#ccff00] mb-4">
                Your Guides
              </p>
              <h2 className="font-heading text-3xl md:text-5xl font-light leading-tight tracking-tight text-white">
                Meet the operations team
              </h2>
            </div>
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 bg-[#ccff00] text-black px-6 py-3 text-xs tracking-[0.1em] uppercase font-bold transition-all duration-300 hover:tracking-[0.2em] rounded cursor-pointer"
            >
              <span>Say Hello</span>
              <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Reveal>
        </div>

        {/* Coaches Split Rows (Desktop Accordion) */}
        <div className="max-w-[1400px] mx-auto px-6 md:px-[8vw]">
          {/* Row 1 */}
          <div className="hidden md:flex w-full mb-8 justify-between gap-7 h-[328px]">
            {/* Coach 0 */}
            <button
              onClick={() => setActiveCoach1(0)}
              className="focus:outline-none flex-shrink-0 overflow-hidden text-left cursor-pointer flex flex-row items-stretch rounded-2xl border border-white/10"
              style={{ height: 328 }}
            >
              <div className="w-[328px] min-w-[328px] h-[328px] bg-[#121418] overflow-hidden relative">
                <img
                  src={COACHES[0].image}
                  alt={COACHES[0].name}
                  loading="lazy"
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div
                className="overflow-hidden bg-[#121418] transition-all duration-500 ease-out"
                style={{
                  width: activeCoach1 === 0 ? 380 : 0,
                  opacity: activeCoach1 === 0 ? 1 : 0,
                }}
              >
                <div className="h-full p-6 flex flex-col justify-between min-w-[280px]">
                  <div>
                    <h3 className="font-heading text-2xl font-light text-white mb-1">
                      {COACHES[0].name}
                    </h3>
                    <p className="text-xs tracking-[0.1em] uppercase text-[#ccff00] mb-4 font-mono">
                      {COACHES[0].role}
                    </p>
                  </div>
                  <p className="font-body text-xs text-white/70 leading-relaxed italic">
                    “{COACHES[0].quote}”
                  </p>
                </div>
              </div>
            </button>

            {/* Coach 1 */}
            <button
              onClick={() => setActiveCoach1(1)}
              className="focus:outline-none flex-shrink-0 overflow-hidden text-left cursor-pointer flex flex-row-reverse items-stretch rounded-2xl border border-white/10"
              style={{ height: 328 }}
            >
              <div className="w-[328px] min-w-[328px] h-[328px] bg-[#121418] overflow-hidden relative">
                <img
                  src={COACHES[1].image}
                  alt={COACHES[1].name}
                  loading="lazy"
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div
                className="overflow-hidden bg-[#121418] transition-all duration-500 ease-out"
                style={{
                  width: activeCoach1 === 1 ? 380 : 0,
                  opacity: activeCoach1 === 1 ? 1 : 0,
                }}
              >
                <div className="h-full p-6 flex flex-col justify-between min-w-[280px]">
                  <div>
                    <h3 className="font-heading text-2xl font-light text-white mb-1">
                      {COACHES[1].name}
                    </h3>
                    <p className="text-xs tracking-[0.1em] uppercase text-[#ccff00] mb-4 font-mono">
                      {COACHES[1].role}
                    </p>
                  </div>
                  <p className="font-body text-xs text-white/70 leading-relaxed italic">
                    “{COACHES[1].quote}”
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Row 2 */}
          <div className="hidden md:flex w-full mb-8 justify-between gap-7 h-[328px]">
            {/* Coach 2 */}
            <button
              onClick={() => setActiveCoach2(0)}
              className="focus:outline-none flex-shrink-0 overflow-hidden text-left cursor-pointer flex flex-row items-stretch rounded-2xl border border-white/10"
              style={{ height: 328 }}
            >
              <div className="w-[328px] min-w-[328px] h-[328px] bg-[#121418] overflow-hidden relative">
                <img
                  src={COACHES[2].image}
                  alt={COACHES[2].name}
                  loading="lazy"
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div
                className="overflow-hidden bg-[#121418] transition-all duration-500 ease-out"
                style={{
                  width: activeCoach2 === 0 ? 380 : 0,
                  opacity: activeCoach2 === 0 ? 1 : 0,
                }}
              >
                <div className="h-full p-6 flex flex-col justify-between min-w-[280px]">
                  <div>
                    <h3 className="font-heading text-2xl font-light text-white mb-1">
                      {COACHES[2].name}
                    </h3>
                    <p className="text-xs tracking-[0.1em] uppercase text-[#ccff00] mb-4 font-mono">
                      {COACHES[2].role}
                    </p>
                  </div>
                  <p className="font-body text-xs text-white/70 leading-relaxed italic">
                    “{COACHES[2].quote}”
                  </p>
                </div>
              </div>
            </button>

            {/* Coach 3 */}
            <button
              onClick={() => setActiveCoach2(1)}
              className="focus:outline-none flex-shrink-0 overflow-hidden text-left cursor-pointer flex flex-row-reverse items-stretch rounded-2xl border border-white/10"
              style={{ height: 328 }}
            >
              <div className="w-[328px] min-w-[328px] h-[328px] bg-[#121418] overflow-hidden relative">
                <img
                  src={COACHES[3].image}
                  alt={COACHES[3].name}
                  loading="lazy"
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div
                className="overflow-hidden bg-[#121418] transition-all duration-500 ease-out"
                style={{
                  width: activeCoach2 === 1 ? 380 : 0,
                  opacity: activeCoach2 === 1 ? 1 : 0,
                }}
              >
                <div className="h-full p-6 flex flex-col justify-between min-w-[280px]">
                  <div>
                    <h3 className="font-heading text-2xl font-light text-white mb-1">
                      {COACHES[3].name}
                    </h3>
                    <p className="text-xs tracking-[0.1em] uppercase text-[#ccff00] mb-4 font-mono">
                      {COACHES[3].role}
                    </p>
                  </div>
                  <p className="font-body text-xs text-white/70 leading-relaxed italic">
                    “{COACHES[3].quote}”
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Mobile Coaches Stack */}
          <div className="md:hidden flex flex-col gap-6">
            {COACHES.map((coach, i) => (
              <Reveal key={coach.name} delay={i * 60}>
                <div className="rounded-2xl overflow-hidden bg-[#121418] border border-white/10">
                  <div className="w-full aspect-square overflow-hidden">
                    <img
                      src={coach.image}
                      alt={coach.name}
                      loading="lazy"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-xl font-light text-white mb-1">
                      {coach.name}
                    </h3>
                    <p className="text-xs tracking-[0.1em] uppercase text-[#ccff00] mb-3 font-mono">
                      {coach.role}
                    </p>
                    <p className="font-body text-xs text-white/70 italic">
                      “{coach.quote}”
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. TESTIMONIALS & ANIMATED COUNT-UP STATS TICKER               */}
      {/* ------------------------------------------------------------- */}
      <section id="proof" className="relative overflow-hidden rounded-b-[28px] py-24 md:py-32">
        <div className="absolute inset-0">
          <img
            src={TESTIMONIALS_BG}
            alt="Gym member training background"
            aria-hidden="true"
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#050507]/90" />
        </div>

        <div className="relative z-10 w-full px-6 md:px-[8vw]">
          <Reveal className="mb-16">
            <p className="text-xs tracking-[0.3em] uppercase font-mono text-[#ccff00] mb-4">
              Proof of Work
            </p>
            <h2 className="font-heading text-3xl md:text-5xl font-light leading-tight tracking-tight text-white">
              Gym operators on the record
            </h2>
          </Reveal>

          {/* Testimonial Quotes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 mb-20">
            {TESTIMONIAL_QUOTES.map((item, i) => (
              <Reveal key={item.name} delay={i * 80}>
                <figure className="border-t border-white/20 pt-6 flex flex-col justify-between h-full">
                  <blockquote className="font-heading text-lg md:text-xl font-light italic leading-relaxed text-white mb-6">
                    “{item.quote}”
                  </blockquote>
                  <figcaption>
                    <p className="font-body text-sm text-white font-medium">
                      {item.name}
                    </p>
                    <p className="font-mono text-xs tracking-[0.15em] uppercase text-[#ccff00]/80 mt-0.5">
                      {item.detail}
                    </p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>

          {/* Animated CountUp Stats Bar */}
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/20 pt-10">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-2">
                  <CountUp
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    className="font-heading text-4xl md:text-5xl font-light text-[#ccff00]"
                  />
                  <span className="font-mono text-xs tracking-[0.2em] uppercase text-white/60">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. COMMERCIAL 3-TIER PRICING GRID                             */}
      {/* ------------------------------------------------------------- */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 md:px-[8vw] py-24 md:py-32">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono text-[#ccff00] uppercase tracking-widest bg-[#ccff00]/10 px-3 py-1 rounded-full border border-[#ccff00]/20">
            COMMERCIAL PLANS
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-light text-white tracking-tight mt-4">
            Pricing for facilities of every scale
          </h2>
          <p className="text-white/70 text-sm md:text-base mt-3">
            Choose your operating tier. All plans include 14 days free trial and unlimited desk accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* TIER 1: Starter Gym */}
          <div className="bg-[#0e1015] border border-white/10 rounded-2xl p-8 flex flex-col justify-between hover:border-white/20 transition">
            <div>
              <span className="text-xs font-mono text-white/50 tracking-wider uppercase font-bold">
                STUDIO / BOUTIQUE
              </span>
              <h3 className="font-heading text-2xl font-light text-white mt-1">
                Starter Gym
              </h3>
              <p className="text-xs text-white/60 mt-2">
                Ideal for personal training studios and independent gyms up to 150 active members.
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-light text-white">$49</span>
                  <span className="text-xs text-white/50 font-mono">/ month</span>
                </div>
                <span className="text-[11px] text-white/40 block mt-1">Billed monthly • Cancel anytime</span>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10 text-xs text-white/80">
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
                  <span>50m GPS Geofence Verification</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Device Hardware Binding</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Desk Billing & Cash Management</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Starter Gym')}
                className="w-full bg-[#121418] hover:bg-white/10 text-white hover:text-[#ccff00] border border-white/15 hover:border-[#ccff00] font-bold py-3.5 rounded-xl transition text-center cursor-pointer text-xs uppercase tracking-wider"
              >
                Choose Starter
              </button>
            </div>
          </div>

          {/* TIER 2: Pro Fitness Hub (POPULAR / HIGHLIGHTED) */}
          <div className="bg-[#0e1015] border-2 border-[#ccff00] rounded-2xl p-8 flex flex-col justify-between shadow-[0_0_35px_rgba(204,255,0,0.18)] relative lg:-translate-y-2 z-10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#ccff00] text-black font-mono font-black text-[10px] tracking-wider px-4 py-1 rounded-full uppercase shadow-md">
              MOST POPULAR
            </div>

            <div>
              <span className="text-xs font-mono text-[#ccff00] tracking-wider uppercase font-bold">
                COMMERCIAL CLUB
              </span>
              <h3 className="font-heading text-2xl font-light text-white mt-1">
                Pro Fitness Hub
              </h3>
              <p className="text-xs text-white/60 mt-2">
                Engineered for high-volume commercial gyms, crossfit boxes, and 24/7 fitness centers.
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-5xl font-light text-[#ccff00]">$99</span>
                  <span className="text-xs text-white/50 font-mono">/ month</span>
                </div>
                <span className="text-[11px] text-[#ccff00]/70 block mt-1">14 days free trial included</span>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10 text-xs text-white/90">
                <div className="flex items-center gap-3 font-semibold text-white">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Unlimited active members</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Unlimited Entrance Gates</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>GPS Geofence + Dynamic Direction</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Device Lock & Fraud Quarantine</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>WhatsApp Automated PDF Invoicing</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Live Real-Time Floor Occupancy Radar</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Pro Fitness Hub')}
                className="w-full bg-[#ccff00] text-black hover:bg-[#b8e600] font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.3)] transition text-center cursor-pointer text-xs uppercase tracking-wider"
              >
                Start 14-Day Free Trial
              </button>
            </div>
          </div>

          {/* TIER 3: Enterprise Multi-Branch */}
          <div className="bg-[#0e1015] border border-white/10 rounded-2xl p-8 flex flex-col justify-between hover:border-white/20 transition">
            <div>
              <span className="text-xs font-mono text-white/50 tracking-wider uppercase font-bold">
                MULTI-LOCATION FRANCHISE
              </span>
              <h3 className="font-heading text-2xl font-light text-white mt-1">
                Enterprise
              </h3>
              <p className="text-xs text-white/60 mt-2">
                For gym franchises and multi-city facilities requiring centralized administration.
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-light text-white">$199</span>
                  <span className="text-xs text-white/50 font-mono">/ month</span>
                </div>
                <span className="text-[11px] text-white/40 block mt-1">Multi-tenant isolation • Custom SLAs</span>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10 text-xs text-white/80">
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
                  <span>Centralized Super Admin Analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Custom WhatsApp Cloud API Gateway</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ccff00] shrink-0" />
                  <span>Dedicated Onboarding Manager</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => onOpenAuth('REGISTER_BUSINESS', 'Enterprise Multi-Branch')}
                className="w-full bg-[#121418] hover:bg-white/10 text-white hover:text-[#ccff00] border border-white/15 hover:border-[#ccff00] font-bold py-3.5 rounded-xl transition text-center cursor-pointer text-xs uppercase tracking-wider"
              >
                Choose Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 11. LEAD CAPTURE & CONTACT SECTION                             */}
      {/* ------------------------------------------------------------- */}
      <section id="contact" className="relative py-24 md:py-32 px-6 md:px-[8vw] bg-[#0e1015]">
        <span className="vertical-label hidden md:block absolute left-6 top-32 text-[0.65rem] tracking-[0.35em] uppercase text-white/40 font-body">
          04 — Start Here
        </span>

        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <Reveal>
            <p className="text-xs tracking-[0.3em] uppercase font-mono text-[#ccff00] mb-4">
              Start Here
            </p>
            <h2 className="font-heading text-3xl md:text-5xl font-light leading-tight tracking-tight text-white mb-6">
              Book your facility onboarding
            </h2>
            <p className="font-body text-sm md:text-base text-white/70 leading-relaxed max-w-md mb-10">
              Tell us about your facility and current turnstile setup. A systems specialist will reply
              within one business day to demonstrate FIDGIT and dispatch your sample QR poster pack.
            </p>

            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-[#ccff00] shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="font-body text-sm font-medium text-white">Engineering HQ</p>
                  <p className="font-body text-xs text-white/60">
                    FIDGIT Technologies · Global Cloud Architecture
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-[#ccff00] shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="font-body text-sm font-medium text-white">Email</p>
                  <a
                    href="mailto:hello@fitgit.fit"
                    className="font-body text-xs text-white/60 hover:text-[#ccff00] transition-colors"
                  >
                    hello@fitgit.fit
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-[#ccff00] shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="font-body text-sm font-medium text-white">Support SLA</p>
                  <p className="font-body text-xs text-white/60">
                    24/7 Priority WhatsApp Desk & Automated Monitoring
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Interactive Form Card */}
          <Reveal delay={100}>
            <div className="bg-[#121418] border border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl">
              {leadStatus === 'success' ? (
                <div className="flex flex-col items-center text-center gap-6 py-12">
                  <span className="w-14 h-14 rounded-full bg-[#ccff00]/15 text-[#ccff00] flex items-center justify-center">
                    <Check className="w-7 h-7" />
                  </span>
                  <h3 className="font-heading text-2xl font-light text-white">
                    Enquiry Received
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-white/70 max-w-sm leading-relaxed">
                    Thanks, {leadForm.name || 'operator'}. An onboarding architect will contact you
                    within one business day with your entrance poster pack.
                  </p>
                  <button
                    onClick={() => {
                      setLeadForm({ name: '', email: '', pillar: 'power', message: '' });
                      setLeadStatus('idle');
                    }}
                    className="inline-flex items-center gap-2 bg-[#ccff00] text-black px-6 py-3 text-xs tracking-[0.1em] uppercase font-bold rounded transition-all cursor-pointer"
                  >
                    <span>Send Another</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-white/80 text-xs font-mono uppercase tracking-wider">
                      Your Name
                    </label>
                    <input
                      required
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      placeholder="Alex Turner"
                      className="bg-[#0e1015] border border-white/15 focus:border-[#ccff00] text-white placeholder:text-white/30 h-11 px-4 rounded-xl text-sm outline-none transition"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-white/80 text-xs font-mono uppercase tracking-wider">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      placeholder="alex@fitnessclub.com"
                      className="bg-[#0e1015] border border-white/15 focus:border-[#ccff00] text-white placeholder:text-white/30 h-11 px-4 rounded-xl text-sm outline-none transition"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-white/80 text-xs font-mono uppercase tracking-wider">
                      Primary Interest
                    </label>
                    <select
                      value={leadForm.pillar}
                      onChange={(e) => setLeadForm({ ...leadForm, pillar: e.target.value })}
                      className="bg-[#0e1015] border border-white/15 focus:border-[#ccff00] text-white h-11 px-4 rounded-xl text-sm outline-none transition"
                    >
                      <option value="power">Hardware-Free QR Turnstile</option>
                      <option value="strength">WhatsApp Invoicing & Desk Billing</option>
                      <option value="endurance">Live Occupancy Radar & Multi-Branch</option>
                      <option value="mobility">Progressive Web App Member Pass</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-white/80 text-xs font-mono uppercase tracking-wider">
                      Facility Details & Notes
                    </label>
                    <textarea
                      rows={3}
                      value={leadForm.message}
                      onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                      placeholder="Member volume, location, current software…"
                      className="bg-[#0e1015] border border-white/15 focus:border-[#ccff00] text-white placeholder:text-white/30 p-4 rounded-xl text-sm outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={leadStatus === 'submitting'}
                    className="group inline-flex items-center justify-center gap-2 bg-[#ccff00] text-black font-bold px-6 py-3.5 text-xs tracking-[0.1em] uppercase rounded-xl transition-all duration-300 hover:tracking-[0.2em] cursor-pointer shadow-[0_0_15px_rgba(204,255,0,0.25)] mt-2"
                  >
                    {leadStatus === 'submitting' ? (
                      <>
                        <span>Sending Request</span>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Request Demonstration</span>
                        <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 12. FAQ ACCORDION                                              */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="max-w-4xl mx-auto px-6 md:px-[8vw] py-24 md:py-32">
        <div className="text-center mb-16">
          <span className="text-xs font-mono text-[#ccff00] uppercase tracking-widest bg-[#ccff00]/10 px-3 py-1 rounded-full border border-[#ccff00]/20">
            COMMON INQUIRIES
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-light text-white tracking-tight mt-4">
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
                  <span className="font-heading text-base font-medium text-white">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-[#ccff00] shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/40 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-xs md:text-sm text-white/70 leading-relaxed border-t border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 13. MODERN WATERMARK FOOTER                                    */}
      {/* ------------------------------------------------------------- */}
      <footer className="bg-[#050507] text-white rounded-t-[28px] overflow-hidden border-t border-white/10">
        <div className="px-6 md:px-[8vw] pt-20 pb-10">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
            <div className="max-w-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-[#0e1015] border border-[#ccff00]/40 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#ccff00]" />
                </div>
                <p className="font-heading text-2xl font-medium tracking-[0.35em] text-white">
                  FIDGIT
                </p>
              </div>
              <p className="font-body text-xs sm:text-sm text-white/60 leading-relaxed">
                The hardware-free turnstile and smart gym customer relationship management platform.
                Engineered for athletic facilities, crossfit boxes, and bodybuilding gyms.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-mono text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ALL SYSTEMS OPERATIONAL • 99.99% UPTIME</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
              <div className="flex flex-col gap-3">
                <p className="text-xs tracking-[0.3em] uppercase text-white/40 font-mono mb-1">
                  Explore
                </p>
                <a href="#pillars" className="text-xs sm:text-sm text-white/70 hover:text-[#ccff00] transition-colors">The Pillars</a>
                <a href="#why-fidgit" className="text-xs sm:text-sm text-white/70 hover:text-[#ccff00] transition-colors">Why FIDGIT</a>
                <a href="#coaches" className="text-xs sm:text-sm text-white/70 hover:text-[#ccff00] transition-colors">Guides</a>
                <a href="#pricing" className="text-xs sm:text-sm text-white/70 hover:text-[#ccff00] transition-colors">Commercial Plans</a>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-xs tracking-[0.3em] uppercase text-white/40 font-mono mb-1">
                  Access
                </p>
                <button
                  onClick={() => onOpenAuth('MEMBER_LOGIN')}
                  className="text-xs sm:text-sm text-white/70 hover:text-[#ccff00] transition-colors text-left cursor-pointer"
                >
                  Member Pass Portal
                </button>
                <button
                  onClick={() => onOpenAuth('STAFF_LOGIN')}
                  className="text-xs sm:text-sm text-white/70 hover:text-[#ccff00] transition-colors text-left cursor-pointer"
                >
                  Desk Manager Login
                </button>
                <button
                  onClick={() => onOpenAuth('REGISTER_BUSINESS')}
                  className="text-xs sm:text-sm text-white/70 hover:text-[#ccff00] transition-colors text-left cursor-pointer"
                >
                  Register Facility
                </button>
                <button
                  onClick={handleInstallClick}
                  className="text-xs sm:text-sm text-[#ccff00] hover:underline transition-colors text-left cursor-pointer"
                >
                  Install Member PWA
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-xs tracking-[0.3em] uppercase text-white/40 font-mono mb-1">
                  Support
                </p>
                <a href="mailto:hello@fitgit.fit" className="text-xs sm:text-sm text-white/70 hover:text-[#ccff00] transition-colors">
                  hello@fitgit.fit
                </a>
                <span className="text-xs sm:text-sm text-white/60">24/7 Gate Verification</span>
                <span className="text-xs sm:text-sm text-white/60">AES-256 Geofenced</span>
              </div>
            </div>
          </div>

          {/* Gigantic Watermark Typography */}
          <p
            className="font-heading font-light leading-none text-white/[0.04] select-none text-center tracking-tighter"
            style={{ fontSize: 'clamp(5rem, 20vw, 18rem)' }}
            aria-hidden="true"
          >
            FIDGIT
          </p>

          <div className="border-t border-white/10 pt-6 mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs tracking-[0.15em] uppercase text-white/40 font-body">
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
              <span className="hover:text-white transition cursor-pointer">Security Protocol</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* 14. PWA INSTALLATION MODAL                                    */}
      {/* ------------------------------------------------------------- */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0e1015] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsInstallModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#121418] text-white/60 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/30 flex items-center justify-center text-[#ccff00]">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-white uppercase">
                  Install FIDGIT Pass
                </h3>
                <p className="text-xs text-white/50">Instant 1-Tap Home Screen Access</p>
              </div>
            </div>

            <div className="flex p-1 bg-[#121418] rounded-xl mb-6">
              <button
                onClick={() => setInstallTab('android')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  installTab === 'android' ? 'bg-[#ccff00] text-black font-black' : 'text-white/60 hover:text-white'
                }`}
              >
                Android
              </button>
              <button
                onClick={() => setInstallTab('ios')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  installTab === 'ios' ? 'bg-[#ccff00] text-black font-black' : 'text-white/60 hover:text-white'
                }`}
              >
                iOS (iPhone)
              </button>
              <button
                onClick={() => setInstallTab('desktop')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  installTab === 'desktop' ? 'bg-[#ccff00] text-black font-black' : 'text-white/60 hover:text-white'
                }`}
              >
                Desktop
              </button>
            </div>

            {installTab === 'ios' && (
              <div className="space-y-4 text-xs text-white/70 leading-relaxed bg-[#121418] p-4 rounded-xl border border-white/5">
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
                  <span>Tap <strong>Add</strong> in the top right. The pass icon appears on your home screen!</span>
                </div>
              </div>
            )}

            {installTab === 'android' && (
              <div className="space-y-4 text-xs text-white/70 leading-relaxed bg-[#121418] p-4 rounded-xl border border-white/5">
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
              <div className="space-y-4 text-xs text-white/70 leading-relaxed bg-[#121418] p-4 rounded-xl border border-white/5">
                <p className="font-semibold text-white">On Google Chrome or Edge:</p>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center font-bold text-[10px] shrink-0">
                    1
                  </span>
                  <span>Look for the <strong>Install icon (computer with down arrow)</strong> in your address bar.</span>
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
              className="mt-6 w-full bg-[#ccff00] text-black font-bold py-3 rounded-xl transition cursor-pointer text-xs uppercase tracking-wider"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* 15. FIDGIT LEGAL PRIVACY POLICY MODAL */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
};
