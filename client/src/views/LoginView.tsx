import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  QrCode,
  LogIn,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export interface LoginViewProps {
  initialTab?: 'MEMBER_LOGIN' | 'STAFF_LOGIN' | 'SIGNUP';
  preselectedPlan?: string;
  onBackToWebsite?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  initialTab = 'MEMBER_LOGIN',
  preselectedPlan,
  onBackToWebsite
}) => {
  const { login, verifyOtpAndLogin, sendMemberLoginOtp, loginWithOtp } = useAuth();
  const [activeTab, setActiveTab] = useState<'MEMBER_LOGIN' | 'STAFF_LOGIN' | 'SIGNUP'>(initialTab);

  // Member Login Fields
  const [memberLoginMode, setMemberLoginMode] = useState<'OTP' | 'PASSWORD'>('OTP');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberOtpStep, setMemberOtpStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [memberOtpCode, setMemberOtpCode] = useState('');
  const [memberOtpNotice, setMemberOtpNotice] = useState<string | null>(null);
  const [memberOtpCooldown, setMemberOtpCooldown] = useState<number>(0);

  // Staff Login Fields
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // Sign Up Form Fields
  const [fullName, setFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // OTP Verification State (Sign Up)
  const [signupStep, setSignupStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [otpCode, setOtpCode] = useState('');
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

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

  // Resend OTP Cooldown Timers
  useEffect(() => {
    let interval: any;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    let interval: any;
    if (memberOtpCooldown > 0) {
      interval = setInterval(() => {
        setMemberOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [memberOtpCooldown]);

  // Member Login via Gmail OTP Handlers
  const handleSendMemberOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) {
      setErrorMsg('Please enter your member email address.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setMemberOtpNotice(null);

    try {
      const res = await sendMemberLoginOtp(memberEmail.trim());
      setMemberOtpNotice(res.message || `A 6-digit passcode was sent to ${memberEmail.trim()} via Gmail.`);
      setMemberOtpStep('OTP');
      setMemberOtpCooldown(45);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch login passcode. Ensure this email is registered.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMemberOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = memberOtpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your Gmail.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await loginWithOtp({
        email: memberEmail.trim(),
        otp: cleanOtp
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired passcode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendMemberOtp = async () => {
    if (memberOtpCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await sendMemberLoginOtp(memberEmail.trim());
      setMemberOtpNotice(res.message || `A fresh passcode was sent to ${memberEmail.trim()}.`);
      setMemberOtpCooldown(45);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend passcode.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Submit Details & Request Email OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setOtpNotice(null);

    try {
      if (!fullName.trim() || !newEmail.trim() || !newPassword) {
        throw new Error('Please fill in your full name, email, and password.');
      }
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const res = await api.sendSignupOtp({
        fullName: fullName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || undefined,
        password: newPassword,
        role: 'MEMBER'
      });

      setOtpNotice(res.message || `A 6-digit verification code was sent to ${newEmail.trim()}.`);
      setSignupStep('OTP');
      setResendCooldown(45);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP & Complete Member Registration
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const cleanOtp = otpCode.trim();
      if (!cleanOtp || cleanOtp.length !== 6) {
        throw new Error('Please enter the 6-digit code sent to your email.');
      }

      await verifyOtpAndLogin({
        email: newEmail.trim(),
        otp: cleanOtp
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend fresh OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.resendSignupOtp({ email: newEmail.trim() });
      setOtpNotice(res.message || `A fresh verification code was sent to ${newEmail.trim()}.`);
      setResendCooldown(45);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200 relative font-poppins">
      {/* Top Bar Navigation */}
      <div className="absolute top-6 left-6 z-20">
        {onBackToWebsite && (
          <button
            onClick={onBackToWebsite}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Gym Website</span>
          </button>
        )}
      </div>

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
        {/* Selected Plan Notification if navigated from pricing card */}
        {preselectedPlan && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Selected Plan: <strong>{preselectedPlan}</strong></span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-500 text-black px-2 py-0.5 rounded-full">
              Ready
            </span>
          </div>
        )}

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
            <div className="space-y-4">
              {/* Login Method Toggle */}
              <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setMemberLoginMode('OTP');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    memberLoginMode === 'OTP'
                      ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Gmail Passcode (OTP)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMemberLoginMode('PASSWORD');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    memberLoginMode === 'PASSWORD'
                      ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Password</span>
                </button>
              </div>

              {/* OTP FLOW */}
              {memberLoginMode === 'OTP' ? (
                memberOtpStep === 'EMAIL' ? (
                  <form onSubmit={handleSendMemberOtp} className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300">
                      <p className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                        <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Direct Gmail OTP Authentication
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-1">
                        Enter your registered gym email. We will send a 6-digit login passcode straight to your Gmail inbox.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Member Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                        <input
                          type="email"
                          required
                          placeholder="member@ironvaultgym.com"
                          value={memberEmail}
                          onChange={(e) => setMemberEmail(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 rounded-xl btn-primary-green text-sm uppercase tracking-wide flex items-center justify-center gap-2 mt-2"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Code via Gmail</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyMemberOtp} className="space-y-4">
                    {memberOtpNotice && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{memberOtpNotice}</span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                          6-Digit Passcode
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setMemberOtpStep('EMAIL');
                            setMemberOtpCode('');
                            setErrorMsg(null);
                          }}
                          className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          Change Email
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          maxLength={6}
                          required
                          autoFocus
                          placeholder="••••••"
                          value={memberOtpCode}
                          onChange={(e) => setMemberOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-center font-mono text-lg tracking-[0.3em] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5 text-center">
                        Sent to <span className="font-semibold text-slate-800 dark:text-zinc-200">{memberEmail}</span>. Check Spam folder if not in primary inbox.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 rounded-xl btn-primary-green text-sm uppercase tracking-wide flex items-center justify-center gap-2 mt-2"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        disabled={memberOtpCooldown > 0 || isLoading}
                        onClick={handleResendMemberOtp}
                        className={`text-xs font-bold ${
                          memberOtpCooldown > 0
                            ? 'text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                            : 'text-emerald-600 dark:text-emerald-400 hover:underline'
                        }`}
                      >
                        {memberOtpCooldown > 0
                          ? `Resend Code in ${memberOtpCooldown}s`
                          : 'Did not receive code? Resend via Gmail'}
                      </button>
                    </div>
                  </form>
                )
              ) : (
                /* PASSWORD FLOW */
                <form onSubmit={handleMemberSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300">
                    <p className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                      <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Member Dashboard Login
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-1">
                      Sign in with your email and password.
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
                        placeholder="member@ironvaultgym.com"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
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
                        placeholder="••••••••"
                        value={memberPassword}
                        onChange={(e) => setMemberPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
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
                </form>
              )}
            </div>
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
                    placeholder="admin@ironvaultgym.com"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
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
                    placeholder="••••••••"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
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
            </form>
          )}

          {/* TAB 3: SIGN UP */}
          {activeTab === 'SIGNUP' && signupStep === 'DETAILS' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-xs text-slate-600 dark:text-zinc-300">
                <p className="font-bold text-slate-900 dark:text-white">New Member Registration</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Enter your real email address to receive your 6-digit OTP verification code.
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
                  Real Email Address (for OTP & Pass)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="your.email@gmail.com"
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
                  Create Password (Min 6 Characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
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
                <span>{isLoading ? 'Sending Verification Code...' : 'Send OTP Verification Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: STEP 2 - OTP VERIFICATION */}
          {activeTab === 'SIGNUP' && signupStep === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2 text-emerald-600 dark:text-emerald-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Verify Your Email Address</p>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                  We sent a 6-digit verification code to:
                </p>
                <div className="mt-1.5 inline-flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold text-slate-900 dark:text-emerald-400">
                  <span>{newEmail}</span>
                  <button
                    type="button"
                    onClick={() => setSignupStep('DETAILS')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-[11px] underline"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {otpNotice && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{otpNotice}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-center text-slate-700 dark:text-zinc-300 mb-2">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border-2 border-emerald-600/50 dark:border-emerald-500/50 focus:border-emerald-600 dark:focus:border-emerald-500 rounded-xl py-3.5 text-center font-mono text-2xl tracking-[0.5em] font-bold text-slate-900 dark:text-white focus:outline-none"
                />
                <p className="text-[11px] text-center text-slate-400 dark:text-zinc-500 mt-2">
                  Code expires in 10 minutes. Check inbox & spam.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSignupStep('DETAILS')}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to details</span>
                </button>

                {resendCooldown > 0 ? (
                  <span className="text-slate-400 dark:text-zinc-500 font-mono">
                    Resend code in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.trim().length !== 6}
                className="w-full py-3.5 rounded-xl btn-primary-green text-sm uppercase tracking-wide flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Verifying...' : 'Verify & Activate Membership'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
