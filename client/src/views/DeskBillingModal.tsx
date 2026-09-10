import React, { useState, useEffect } from 'react';
import { X, UserPlus, CreditCard, CheckCircle2, DollarSign, Calendar, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface DeskBillingModalProps {
  isOpen: boolean;
  mode: 'ONBOARD' | 'BILL';
  onClose: () => void;
  onSuccess: () => void;
}

export const DeskBillingModal: React.FC<DeskBillingModalProps> = ({
  isOpen,
  mode,
  onClose,
  onSuccess
}) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('Monthly Pro Access');
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState(65);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // OTP Verification state for ONBOARD mode
  const [onboardStep, setOnboardStep] = useState<'FORM' | 'OTP'>('FORM');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sentToEmail, setSentToEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (isOpen) {
      setOnboardStep('FORM');
      setOtpCode('');
      setErrorMessage(null);

      api.getPlans().then((res) => {
        setPlans(res.plans || []);
        if (res.plans && res.plans.length > 0) {
          const defaultPlan = res.plans[1] || res.plans[0];
          setSelectedPlan(defaultPlan.name);
          setDurationDays(defaultPlan.durationDays);
          setPrice(defaultPlan.price);
        }
      }).catch(console.error);

      if (mode === 'BILL') {
        api.getMembers().then((res) => {
          setMembers(res.members || []);
          if (res.members && res.members.length > 0) {
            setSelectedUserId(res.members[0].id);
          }
        }).catch(console.error);
      }
    }
  }, [isOpen, mode]);

  const handlePlanChange = (planName: string) => {
    const found = plans.find((p) => p.name === planName);
    if (found) {
      setSelectedPlan(found.name);
      setDurationDays(found.durationDays);
      setPrice(found.price);
    }
  };

  const handleSendOtp = async (targetEmail: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await api.sendOnboardOtp({
        fullName: fullName.trim(),
        email: targetEmail,
        phone: phone.trim() || undefined,
        planName: selectedPlan,
        durationDays,
        price,
        paymentMethod
      });
      setSentToEmail(targetEmail);
      setOnboardStep('OTP');
      setResendCooldown(30);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await api.verifyOnboardOtp({
        email: sentToEmail,
        otp: otpCode.trim()
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (mode === 'ONBOARD') {
        if (!fullName.trim() || !email.trim()) {
          setErrorMessage('Full name and email are required.');
          setIsLoading(false);
          return;
        }
        await handleSendOtp(email.trim().toLowerCase());
        return;
      } else {
        await api.deskBilling({
          userId: selectedUserId,
          planName: selectedPlan,
          durationDays,
          price,
          paymentMethod
        });
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="app-card w-full max-w-lg overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              {mode === 'ONBOARD' ? <UserPlus className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
                {mode === 'ONBOARD' ? 'Register New Member' : 'Membership Renewal & Billing'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {mode === 'ONBOARD'
                  ? 'Register a new member and activate their gym pass'
                  : 'Renew an existing member pass at the front desk'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {mode === 'ONBOARD' && onboardStep === 'OTP' ? (
          <form onSubmit={handleVerifyOtp} className="p-6 space-y-5 animate-fade-in">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-300 font-semibold">
                {errorMessage}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-center space-y-1">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                <Mail className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Member Verification Code Sent
              </h4>
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
                Ask the member standing at the desk for the code sent to their Gmail.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setOnboardStep('FORM')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
              >
                ← Edit Details
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
                className="flex-1 py-3 px-6 rounded-xl btn-primary-green text-xs font-black shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Verify OTP & Activate Membership Pass
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-300 font-semibold">
                {errorMessage}
              </div>
            )}

            {mode === 'ONBOARD' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Adams"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rachel@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+1 (555) 019-2831"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Select Member
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Membership Plan Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                Membership Tier
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {plans.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => handlePlanChange(p.name)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      selectedPlan === p.name
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-extrabold text-xs text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                      ${p.price} • {p.durationDays} Days
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                >
                  <option value="CASH">Cash at Desk</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="ONLINE">Online Direct</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Amount
                </label>
                <div className="flex items-center bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold text-sm">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1" />
                  {price}.00
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl btn-primary-green text-sm flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {mode === 'ONBOARD' ? 'Sending Gmail OTP...' : 'Processing...'}
                  </>
                ) : mode === 'ONBOARD' ? (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Verification Code via Gmail
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Payment & Renew Pass
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

