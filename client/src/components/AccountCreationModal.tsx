import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  User,
  Shield,
  Dumbbell,
  CheckCircle2,
  Copy,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Mail,
  Phone,
  Lock,
  CreditCard,
  HeartPulse
} from 'lucide-react';
import { api } from '../services/api';

interface AccountCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type RoleType = 'MEMBER' | 'TRAINER' | 'MANAGER' | 'SUPER_ADMIN';

export const AccountCreationModal: React.FC<AccountCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [creationStep, setCreationStep] = useState<'FORM' | 'OTP' | 'SUCCESS'>('FORM');
  const [role, setRole] = useState<RoleType>('MEMBER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('MemberPass123!');
  const [planName, setPlanName] = useState('Monthly Pro Access');
  const [price, setPrice] = useState(65);
  const [durationDays, setDurationDays] = useState(30);

  // OTP Verification state
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sentToEmail, setSentToEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Resend timer countdown
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: RoleType) => {
    setRole(newRole);
    if (newRole === 'MEMBER') {
      setPassword('MemberPass123!');
    } else if (newRole === 'TRAINER') {
      setPassword('TrainerPass123!');
    } else {
      setPassword('AdminPass123!');
    }
  };

  const handlePlanChange = (plan: string) => {
    setPlanName(plan);
    if (plan === 'Day Pass') {
      setPrice(15);
      setDurationDays(1);
    } else if (plan === 'Monthly Pro Access') {
      setPrice(65);
      setDurationDays(30);
    } else if (plan === 'Quarterly Elite Pass') {
      setPrice(165);
      setDurationDays(90);
    } else if (plan === 'Annual VIP Membership') {
      setPrice(540);
      setDurationDays(365);
    }
  };

  const handleSendOtp = async (targetEmail: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await api.sendOnboardOtp({
        fullName: fullName.trim(),
        email: targetEmail,
        phone: phone.trim() || undefined,
        role,
        planName,
        price,
        durationDays
      });
      setSentToEmail(targetEmail);
      setCreationStep('OTP');
      setResendCooldown(30);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Please provide a full name and email address.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // If adding a member, require Gmail OTP verification
    if (role === 'MEMBER') {
      await handleSendOtp(cleanEmail);
      return;
    }

    // If adding staff/trainer, direct creation
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.onboardMember({
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phone.trim() || undefined,
        role,
        password,
        planName,
        price,
        durationDays
      });

      setCreatedUser(res.user || res.member || { fullName, email: cleanEmail, role, tempPassword: password });
      setCreationStep('SUCCESS');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.verifyOnboardOtp({
        email: sentToEmail,
        otp: otpCode.trim(),
        password
      });

      setCreatedUser(res.user || { fullName, email: sentToEmail, role, tempPassword: password });
      setCreationStep('SUCCESS');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCreatedUser(null);
    setCreationStep('FORM');
    setFullName('');
    setEmail('');
    setPhone('');
    setOtpCode('');
    setPassword('MemberPass123!');
    setErrorMsg(null);
    setRole('MEMBER');
  };

  const handleCopyCredentials = () => {
    if (!createdUser) return;
    const text = `IronVault Gym Account:\nName: ${createdUser.fullName}\nEmail: ${createdUser.email}\nRole: ${createdUser.role}\nPassword: ${createdUser.tempPassword || password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2505);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {createdUser ? 'Account Confirmed' : 'Add New Gym Account'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {createdUser
                  ? 'Access details generated and ready for check-in'
                  : 'Onboard members, fitness coaches, or desk staff'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {creationStep === 'SUCCESS' && createdUser ? (
            /* SUCCESS CONFIRMATION STATE */
            <div className="text-center space-y-6 animate-scale-up">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div>
                <span className="badge-active-green text-xs mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Account Successfully Created!
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {createdUser.fullName}
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  Registered as <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">{createdUser.role}</span>
                </p>
              </div>

              {/* Access Credentials Box */}
              <div className="bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400 font-bold uppercase text-[10px]">
                  <span>Credentials & Check-in Info</span>
                  <button
                    onClick={handleCopyCredentials}
                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? 'Copied!' : 'Copy Info'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-medium text-slate-700 dark:text-zinc-300">
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block text-[10px]">Email / Login</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">{createdUser.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block text-[10px]">Temporary Password</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                      {createdUser.tempPassword || password}
                    </span>
                  </div>
                </div>

                {role === 'MEMBER' && (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800 space-y-2">
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl flex items-center gap-2">
                      <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        <strong>Instant Entrance:</strong> Member can walk up to the entrance turnstile, enter this email, and scan the QR code to enter right now!
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>
                        <strong>First-Time Login Onboarding:</strong> When this member logs into their dashboard for the first time, they will automatically be prompted to complete their Admission & Fitness Assessment form.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold text-xs transition"
                >
                  Create Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black font-black text-xs transition shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          ) : creationStep === 'OTP' ? (
            /* OTP VERIFICATION STEP */
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-center space-y-1">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                  <Mail className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Member Verification Code Sent
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-300">
                  A 6-digit OTP code was sent via Gmail to:
                </p>
                <p className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-900/30 py-1 px-2.5 rounded-lg inline-block">
                  {sentToEmail}
                </p>
              </div>

              <div className="space-y-2 text-center">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                  Enter 6-Digit Member OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="••••••"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center py-4 bg-slate-50 dark:bg-zinc-900 border-2 border-emerald-500/50 rounded-2xl text-3xl font-mono font-black tracking-[0.5em] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Ask the member for the verification code received on their phone or Gmail.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setCreationStep('FORM')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
                >
                  ← Edit Member Details
                </button>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={() => handleSendOtp(sentToEmail)}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="flex-1 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black font-black text-xs transition shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verifying OTP...
                    </>
                  ) : (
                    <>
                      Verify OTP & Enroll Member
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* CREATION FORM STATE */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Step 1: Role Selector Cards */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                  1. Select Account Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div
                    onClick={() => handleRoleChange('MEMBER')}
                    className={`role-selector-card ${
                      role === 'MEMBER'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-black text-xs text-slate-900 dark:text-white">Member</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">Gym Athlete</p>
                    </div>
                  </div>

                  <div
                    onClick={() => handleRoleChange('TRAINER')}
                    className={`role-selector-card ${
                      role === 'TRAINER'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <Dumbbell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-black text-xs text-slate-900 dark:text-white">Trainer</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">Fitness Coach</p>
                    </div>
                  </div>

                  <div
                    onClick={() => handleRoleChange('MANAGER')}
                    className={`role-selector-card ${
                      role === 'MANAGER'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-black text-xs text-slate-900 dark:text-white">Desk Staff</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">Billing & Review</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Personal Details */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                  2. User Details
                </label>

                <div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Full Name (e.g. Jordan Miller)"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      placeholder="Phone (Optional)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Pass or Password based on Role */}
              {role === 'MEMBER' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                    3. Membership Pass (Active Immediately)
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <select
                      value={planName}
                      onChange={(e) => handlePlanChange(e.target.value)}
                      className="w-full pl-10 pr-8 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                    >
                      <option value="Monthly Pro Access">Monthly Pro Pass — $65.00 (30 Days)</option>
                      <option value="Quarterly Elite Pass">Quarterly Elite Pass — $165.00 (90 Days)</option>
                      <option value="Annual VIP Membership">Annual VIP Membership — $540.00 (365 Days)</option>
                      <option value="Day Pass">Single Day Visitor Pass — $15.00 (1 Day)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                    3. Staff Access Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black font-black text-xs transition shadow-md shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {role === 'MEMBER' ? 'Sending Gmail OTP...' : 'Creating Account...'}
                    </>
                  ) : role === 'MEMBER' ? (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Verification Code via Gmail
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

