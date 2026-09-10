import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  QrCode,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'MEMBER_LOGIN' | 'STAFF_LOGIN' | 'SIGNUP'>('MEMBER_LOGIN');

  // Member Login Fields
  const [memberEmail, setMemberEmail] = useState('macbook.member@ironvaultgym.com');
  const [memberPassword, setMemberPassword] = useState('Member@12345');

  // Staff Login Fields
  const [staffEmail, setStaffEmail] = useState('admin@ironvaultgym.com');
  const [staffPassword, setStaffPassword] = useState('Admin@12345');

  // Sign Up Form Fields
  const [fullName, setFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Theme support
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gym_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return false;
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

  // Handle Member Login
  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await login({ email: memberEmail, password: memberPassword });
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Staff Login
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await login({ email: staffEmail, password: staffPassword });
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (!fullName || !newEmail || !newPassword) {
        throw new Error('Please fill in your full name, email, and password.');
      }
      await register({
        fullName,
        email: newEmail,
        phone: newPhone,
        password: newPassword,
        role: 'MEMBER'
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200 relative font-poppins">
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-200 shadow-sm transition active:scale-95"
          title={isDark ? 'Switch to White & Green Light Mode' : 'Switch to Black & Green Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-emerald-400" />
          ) : (
            <Moon className="w-5 h-5 text-emerald-600" />
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3.5 rounded-2xl bg-emerald-600 dark:bg-emerald-500 shadow-sm dark:shadow-glow-green mb-3 text-white dark:text-black">
          <Shield className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          IRON<span className="text-emerald-600 dark:text-emerald-400">VAULT</span>
        </h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          FITNESS & HEALTH CLUB
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        {/* Main Card */}
        <div className="app-card p-6 sm:p-8">
          {/* Tab Selection */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('MEMBER_LOGIN');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-black transition ${
                activeTab === 'MEMBER_LOGIN'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🏃 Member Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('STAFF_LOGIN');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-black transition ${
                activeTab === 'STAFF_LOGIN'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              👑 Staff & Admin
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('SIGNUP');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-black transition ${
                activeTab === 'SIGNUP'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🆕 Join Gym
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: MEMBER LOGIN */}
          {activeTab === 'MEMBER_LOGIN' && (
            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300">
                <p className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Member Dashboard Login
                </p>
                <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-1">
                  Sign into your account first. You will find the <b>Scan Entry</b> and <b>Scan Exit</b> options directly on your dashboard.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Member Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={memberPassword}
                    onChange={(e) => setMemberPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl btn-primary-green text-sm uppercase tracking-wide flex items-center justify-center gap-2 mt-2"
              >
                <span>{isLoading ? 'Signing In...' : 'Log In to Member Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* 1-Tap Quick Fill Demo Button */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-center">
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mb-1.5">
                  Real Testing Quick Fill:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMemberEmail('macbook.member@ironvaultgym.com');
                    setMemberPassword('Member@12345');
                  }}
                  className="py-1.5 px-3 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
                >
                  ⚡ Fill: Alex Rivera (Member)
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: STAFF & OWNER LOGIN */}
          {activeTab === 'STAFF_LOGIN' && (
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-xs text-slate-600 dark:text-zinc-300">
                <p className="font-bold text-slate-900 dark:text-white">Admin & Staff Portal</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Sign in from any device to manage floor occupancy, memberships, and billing.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Staff Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl btn-primary-green text-sm uppercase tracking-wide flex items-center justify-center gap-2 mt-2"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In as Staff / Admin'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Fill Pills for Testing */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-center space-y-1.5">
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Quick Fill Test Credentials:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStaffEmail('admin@ironvaultgym.com');
                      setStaffPassword('Admin@12345');
                    }}
                    className="py-1 px-2.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                  >
                    👑 Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffEmail('manager@ironvaultgym.com');
                      setStaffPassword('Manager@12345');
                    }}
                    className="py-1 px-2.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                  >
                    🧑‍💼 Front Desk
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: SIGN UP */}
          {activeTab === 'SIGNUP' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-xs text-slate-600 dark:text-zinc-300">
                <p className="font-bold text-slate-900 dark:text-white">New Member Registration</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Create your profile to access club facilities, group classes, and training logs.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Rivera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    placeholder="+1 555-019-2834"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl btn-primary-green text-sm uppercase tracking-wide flex items-center justify-center gap-2 mt-2"
              >
                <span>{isLoading ? 'Creating Account...' : 'Complete Sign Up'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
