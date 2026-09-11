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
  Building2,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export interface LoginViewProps {
  initialTab?: 'MEMBER_LOGIN' | 'STAFF_LOGIN' | 'SIGNUP' | 'REGISTER_BUSINESS';
  preselectedPlan?: string;
  onBackToWebsite?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  initialTab = 'MEMBER_LOGIN',
  preselectedPlan,
  onBackToWebsite
}) => {
  const { login, verifyOtpAndLogin, registerBusiness, sendMemberLoginOtp, loginWithOtp, logoutNotice, clearLogoutNotice } = useAuth();
  const [activeTab, setActiveTab] = useState<'MEMBER_LOGIN' | 'STAFF_LOGIN' | 'SIGNUP' | 'REGISTER_BUSINESS'>(initialTab);

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

  // Forgot Password via Gmail OTP State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotNotice, setForgotNotice] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotCooldown, setForgotCooldown] = useState<number>(0);

  // Sign Up Form Fields (Join Gym)
  const [gymCode, setGymCode] = useState('');
  const [verifiedGym, setVerifiedGym] = useState<any>(null);
  const [isVerifyingGym, setIsVerifyingGym] = useState(false);
  const [gymLookupError, setGymLookupError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // OTP Verification State (Sign Up)
  const [signupStep, setSignupStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [otpCode, setOtpCode] = useState('');
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Register Business Fields (Gym Owner Onboarding)
  const [bizGymName, setBizGymName] = useState('');
  const [bizOwnerName, setBizOwnerName] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizPassword, setBizPassword] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizCity, setBizCity] = useState('');
  const [bizState, setBizState] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedDemo, setCopiedDemo] = useState<string | null>(null);

  // Auto-detect invite code in URL (e.g. ?invite=100001 or ?gym=100001)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const invite = params.get('invite') || params.get('gym');
      if (invite && invite.trim()) {
        const clean = invite.trim();
        setGymCode(clean);
        setActiveTab('SIGNUP');
        checkGymCode(clean);
      }
      const adminParam = params.get('admin') || params.get('role');
      if (adminParam === 'super' || adminParam === 'true' || adminParam === 'admin') {
        setActiveTab('STAFF_LOGIN');
        setStaffEmail('superadmin@ironvault.com');
        setStaffPassword('superadmin123');
      }
    }
  }, []);

  const checkGymCode = async (code: string) => {
    if (!code || code.length < 4) {
      setVerifiedGym(null);
      setGymLookupError(null);
      return;
    }
    setIsVerifyingGym(true);
    setGymLookupError(null);
    try {
      const res = await api.lookupGymCode(code.trim());
      if (res.gym) {
        setVerifiedGym(res.gym);
        setGymLookupError(null);
      } else {
        setVerifiedGym(null);
        setGymLookupError('Gym code not found. Please verify with your gym owner.');
      }
    } catch (err: any) {
      setVerifiedGym(null);
      setGymLookupError(err.message || 'Invalid gym code. Please check and try again.');
    } finally {
      setIsVerifyingGym(false);
    }
  };

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

  // Cooldown timer
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

  useEffect(() => {
    let interval: any;
    if (forgotCooldown > 0) {
      interval = setInterval(() => {
        setForgotCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [forgotCooldown]);

  const handleOpenForgotPassword = (prefillEmail?: string) => {
    setIsForgotPassword(true);
    setForgotStep('EMAIL');
    setForgotEmail(prefillEmail || memberEmail || staffEmail || '');
    setForgotOtpCode('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotNotice(null);
    setForgotSuccess(null);
    setErrorMsg(null);
  };

  const handleRequestPasswordResetOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your registered Gmail or email address.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setForgotNotice(null);
    try {
      const res = await api.forgotPassword(cleanEmail);
      setForgotNotice(res.message || `A 6-digit recovery code has been sent to ${cleanEmail}`);
      setForgotStep('OTP');
      setForgotCooldown(60);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch recovery code. Please verify the email address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = forgotOtpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your Gmail.');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.resetPassword({
        email: forgotEmail.trim(),
        otp: cleanOtp,
        newPassword: forgotNewPassword
      });
      setForgotSuccess(res.message || 'Password reset successful! You can now log in.');
      if (activeTab === 'MEMBER_LOGIN') {
        setMemberEmail(forgotEmail.trim());
        setMemberPassword(forgotNewPassword);
        setMemberLoginMode('PASSWORD');
      } else {
        setStaffEmail(forgotEmail.trim());
        setStaffPassword(forgotNewPassword);
      }
      setTimeout(() => {
        setIsForgotPassword(false);
        setForgotSuccess(null);
      }, 2200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. Please check your verification code.');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Join Gym: Request Email OTP
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
      if (!gymCode.trim()) {
        throw new Error('Please enter the 6-digit Gym Access Code provided by your gym.');
      }

      const res = await api.sendSignupOtp({
        fullName: fullName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || undefined,
        password: newPassword,
        role: 'MEMBER',
        gymCode: gymCode.trim()
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

  // Join Gym: Verify OTP & Complete Member Registration
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
        otp: cleanOtp,
        gymCode: gymCode.trim()
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

  // Register Business Flow (Gym Owner)
  const handleRegisterBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (!bizGymName.trim() || !bizOwnerName.trim() || !bizEmail.trim() || !bizPassword.trim() || !bizAddress.trim()) {
        throw new Error('Please fill in all required fields (Gym Name, Owner Name, Email, Password, Address).');
      }
      if (bizPassword.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      await registerBusiness({
        gymName: bizGymName.trim(),
        ownerName: bizOwnerName.trim(),
        email: bizEmail.trim(),
        password: bizPassword,
        phone: bizPhone.trim() || undefined,
        address: bizAddress.trim(),
        city: bizCity.trim() || undefined,
        state: bizState.trim() || undefined
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register gym business. Please verify details.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoLogin = (email: string, pass = 'superadmin123') => {
    if (email.includes('admin')) {
      setActiveTab('STAFF_LOGIN');
      setStaffEmail(email);
      setStaffPassword(pass);
    } else if (email.includes('manager') || email.includes('owner')) {
      setActiveTab('STAFF_LOGIN');
      setStaffEmail(email);
      setStaffPassword(pass);
    } else {
      setActiveTab('MEMBER_LOGIN');
      setMemberLoginMode('PASSWORD');
      setMemberEmail(email);
      setMemberPassword(pass);
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
            <span>Back to Website</span>
          </button>
        )}
      </div>

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-200 shadow-sm transition active:scale-95"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-5 h-5 text-emerald-400" /> : <Moon className="w-5 h-5 text-emerald-600" />}
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
          MULTI-TENANT FITNESS CRM & SAAS
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg space-y-4">
        {/* Selected Plan Notification */}
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
          {isForgotPassword ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white">Forgot Password</h2>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {forgotStep === 'EMAIL' ? 'Step 1: Enter your registered Gmail ID' : 'Step 2: Enter 6-digit OTP & new password'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrorMsg(null);
                    setForgotNotice(null);
                    setForgotSuccess(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-semibold py-1 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </button>
              </div>

              {/* Success Banner */}
              {forgotSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {/* Error Banner */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Notice Banner */}
              {forgotNotice && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{forgotNotice}</span>
                </div>
              )}

              {forgotStep === 'EMAIL' ? (
                <form onSubmit={handleRequestPasswordResetOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Registered Gmail / Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="you@gmail.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5">
                      Enter the Gmail ID associated with your gym account. We will send a secure 6-digit recovery OTP passcode.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl btn-primary-green text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                  >
                    <span>{isLoading ? 'Sending Passcode...' : 'Send Recovery OTP to Gmail'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        6-Digit Verification Code (OTP) *
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRequestPasswordResetOtp()}
                        disabled={forgotCooldown > 0 || isLoading}
                        className={`text-xs font-semibold ${
                          forgotCooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-emerald-600 dark:text-emerald-400 hover:underline'
                        }`}
                      >
                        {forgotCooldown > 0 ? `Resend in ${forgotCooldown}s` : 'Resend Code'}
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={forgotOtpCode}
                        onChange={(e) => setForgotOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-mono tracking-widest text-slate-900 dark:text-white placeholder:tracking-normal focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                      New Password (Min 6 Characters) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotStep('EMAIL')}
                      className="w-1/3 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
                    >
                      Change Email
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3.5 rounded-xl btn-primary-green text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                      <span>{isLoading ? 'Resetting Password...' : 'Save New Password'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* 3-Tab Multi-Tenant Navigation */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('MEMBER_LOGIN');
                    setErrorMsg(null);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 ${
                    activeTab === 'MEMBER_LOGIN'
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>🏃</span>
                  <span>Member</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('STAFF_LOGIN');
                    setErrorMsg(null);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 ${
                    activeTab === 'STAFF_LOGIN'
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>👑</span>
                  <span>Staff / Owner</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('SIGNUP');
                    setErrorMsg(null);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 ${
                    activeTab === 'SIGNUP'
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>🤝</span>
                  <span>Join Gym</span>
                </button>
              </div>

              {/* Session / Membership Notice */}
              {logoutNotice && (
                <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start justify-between gap-3 animate-in fade-in duration-300">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-[11px] tracking-wide uppercase text-amber-700 dark:text-amber-400">Account Notice</span>
                      <p className="mt-0.5 leading-relaxed font-medium">{logoutNotice}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearLogoutNotice}
                    className="p-1 hover:bg-amber-500/20 rounded-lg text-amber-700 dark:text-amber-300 transition text-xs font-bold flex-shrink-0"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )}

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
                        Enter your registered email address to receive a 6-digit login passcode.
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
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenForgotPassword(memberEmail)}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                      >
                        Forgot Password?
                      </button>
                    </div>
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

          {/* TAB 2: STAFF & GYM OWNER LOGIN */}
          {activeTab === 'STAFF_LOGIN' && (
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-xs text-slate-600 dark:text-zinc-300">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 dark:text-white">Gym Owner, Staff & Admin Portal</p>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded">
                    👑 Super Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Sign in to manage your gym workspace, live turnstile attendance, or access the Super Admin control panel.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Staff / Owner Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="manager@ironvaultgym.com"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOpenForgotPassword(staffEmail)}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
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
                <span>{isLoading ? 'Authenticating...' : 'Sign In as Owner / Staff'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: JOIN GYM (MEMBER ONBOARDING WITH 6-DIGIT GYM CODE) */}
          {activeTab === 'SIGNUP' && signupStep === 'DETAILS' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-xs text-slate-600 dark:text-zinc-300">
                <p className="font-bold text-slate-900 dark:text-white">Join Your Gym Workspace</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Enter your gym's 6-digit access code (e.g. <strong>100001</strong>) to connect to your gym.
                </p>
              </div>

              {/* Gym 6-Digit Code Input & Live Lookup */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Gym Access Code (6-Digit Code)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Building2 className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 100001"
                      value={gymCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setGymCode(val);
                        if (val.length === 6) {
                          checkGymCode(val);
                        } else {
                          setVerifiedGym(null);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-mono tracking-wider font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => checkGymCode(gymCode)}
                    disabled={isVerifyingGym || gymCode.length < 4}
                    className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:bg-emerald-500 hover:text-black transition"
                  >
                    {isVerifyingGym ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Lookup'}
                  </button>
                </div>

                {/* Verified Gym Feedback Card */}
                {verifiedGym && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <span className="font-bold">{verifiedGym.name}</span>
                        {verifiedGym.city && (
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
                            📍 {verifiedGym.city}, {verifiedGym.state || ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-black bg-emerald-500 text-black px-2 py-0.5 rounded-md">
                      {verifiedGym.inviteCode}
                    </span>
                  </div>
                )}

                {gymLookupError && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">
                    {gymLookupError}
                  </p>
                )}
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

          {/* TAB 4: REGISTER BUSINESS (GYM OWNER ONBOARDING) */}
          {activeTab === 'REGISTER_BUSINESS' && (
            <form onSubmit={handleRegisterBusiness} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300">
                <p className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Register Your Gym Business (SaaS Workspace)
                </p>
                <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-1">
                  Create your own isolated gym workspace, automatic 6-digit member invite code, and QR poster.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Gym / Facility Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. IronVault Apex Downtown"
                    value={bizGymName}
                    onChange={(e) => setBizGymName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Owner Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Sarah Jenkins"
                      value={bizOwnerName}
                      onChange={(e) => setBizOwnerName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Owner Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      placeholder="+1 555-019-4422"
                      value={bizPhone}
                      onChange={(e) => setBizPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Owner Email Address (Login ID) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="owner@yourgym.com"
                    value={bizEmail}
                    onChange={(e) => setBizEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Password (Min 6 Characters) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={bizPassword}
                    onChange={(e) => setBizPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Street Address *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="500 Market Street, Suite 100"
                    value={bizAddress}
                    onChange={(e) => setBizAddress(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="San Francisco"
                    value={bizCity}
                    onChange={(e) => setBizCity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    State / Region
                  </label>
                  <input
                    type="text"
                    placeholder="CA"
                    value={bizState}
                    onChange={(e) => setBizState(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl btn-primary-green text-sm uppercase tracking-wide flex items-center justify-center gap-2 mt-2"
              >
                <span>{isLoading ? 'Creating Gym Workspace...' : 'Create Gym Workspace & Get Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </>
      )}
    </div>

        {/* Single Super Admin Master Credentials */}
        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Platform Super Admin</span>
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full">
              Root Level
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 dark:text-zinc-400">ID / Username:</span>
                <code className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">superadmin@ironvault.com</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 dark:text-zinc-400">Password:</span>
                <code className="font-mono font-bold text-slate-800 dark:text-zinc-200 bg-slate-200/60 dark:bg-zinc-900 px-1.5 py-0.5 rounded">superadmin123</code>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fillDemoLogin('superadmin@ironvault.com', 'superadmin123')}
              className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition shadow-sm flex items-center justify-center gap-1.5 active:scale-95 flex-shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Autofill Super Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
