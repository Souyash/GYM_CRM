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
      <div className="app-card dark:bg-carbon-900 w-full max-w-lg overflow-hidden shadow-2xl relative border border-slate-200/80 dark:border-carbon-800 rounded-3xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-carbon-800 flex items-center justify-between bg-slate-50/80 dark:bg-carbon-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-volt-500/10 text-volt-600 dark:text-volt-400 border border-volt-500/20">
              {mode === 'ONBOARD' ? <UserPlus className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
                {mode === 'ONBOARD' ? 'Register New Member' : 'Desk Renewal & Quick Billing'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-carbon-400">
                {mode === 'ONBOARD'
                  ? 'Register an athlete and dispatch gate access pass'
                  : 'Fast ≤3-tap desk renewal for active turnstile gate access'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-carbon-800 transition"
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

            <div className="p-4 rounded-2xl bg-volt-500/10 dark:bg-volt-500/5 border border-volt-500/20 text-center space-y-1">
              <div className="w-10 h-10 mx-auto rounded-full bg-volt-500/20 text-volt-600 dark:text-volt-400 flex items-center justify-center mb-2">
                <Mail className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Member Verification Code Sent
              </h4>
              <p className="text-xs text-slate-600 dark:text-carbon-300">
                A 6-digit OTP code was sent via Gmail to:
              </p>
              <p className="text-xs font-mono font-black text-volt-700 dark:text-volt-300 bg-volt-500/15 py-1 px-2.5 rounded-lg inline-block">
                {sentToEmail}
              </p>
            </div>

            <div className="space-y-2 text-center">
              <label className="text-xs font-bold text-slate-700 dark:text-carbon-300 uppercase tracking-wider block">
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
                className="w-full text-center py-4 bg-slate-50 dark:bg-carbon-800 border-2 border-volt-500/50 rounded-2xl text-3xl font-mono font-black tracking-[0.5em] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-volt-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-carbon-400">
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
                className="text-xs font-bold text-volt-600 dark:text-volt-400 hover:underline disabled:opacity-40 disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 rounded-xl border border-slate-200 dark:border-carbon-800 text-slate-600 dark:text-carbon-400 hover:bg-slate-100 dark:hover:bg-carbon-800 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="flex-1 py-3 px-6 rounded-xl bg-volt-500 hover:bg-volt-400 text-black text-xs font-black shadow-volt-glow flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95"
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-carbon-300 mb-1.5 uppercase tracking-wider">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Adams"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-carbon-800 border border-slate-200 dark:border-carbon-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-volt-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-carbon-300 mb-1.5 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rachel@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-carbon-800 border border-slate-200 dark:border-carbon-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-volt-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-carbon-300 mb-1.5 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+1 (555) 019-2831"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-carbon-800 border border-slate-200 dark:border-carbon-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-volt-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-carbon-300 mb-1.5 uppercase tracking-wider">
                  Select Athlete
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-carbon-800 border border-slate-200 dark:border-carbon-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-volt-500"
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
              <label className="block text-xs font-bold text-slate-700 dark:text-carbon-300 mb-1.5 uppercase tracking-wider">
                Select Pass Plan
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {plans.map((p) => {
                  const isSelected = selectedPlan === p.name;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => handlePlanChange(p.name)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        isSelected
                          ? 'bg-volt-500/10 dark:bg-volt-500/15 border-volt-500 shadow-sm ring-1 ring-volt-500'
                          : 'bg-slate-50 dark:bg-carbon-800 border-slate-200 dark:border-carbon-700 text-slate-600 dark:text-carbon-400 hover:border-slate-300 dark:hover:border-carbon-600'
                      }`}
                    >
                      <p className={`font-black text-xs ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-carbon-200'}`}>
                        {p.name}
                      </p>
                      <p className="text-[11px] text-volt-600 dark:text-volt-400 font-mono tabular-nums font-bold mt-1">
                        ${p.price}.00 • {p.durationDays} Days
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Fast-Tap Pills */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-carbon-300 uppercase tracking-wider">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CASH', label: '💵 Cash' },
                  { id: 'CARD', label: '💳 Card POS' },
                  { id: 'ONLINE', label: '⚡ Direct' }
                ].map((pm) => (
                  <button
                    type="button"
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center border ${
                      paymentMethod === pm.id
                        ? 'bg-slate-900 text-white dark:bg-volt-500 dark:text-black border-slate-900 dark:border-volt-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-carbon-800 text-slate-600 dark:text-carbon-300 border-slate-200 dark:border-carbon-700 hover:bg-slate-100 dark:hover:bg-carbon-700'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Amount Box */}
            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-carbon-950 border border-slate-200 dark:border-carbon-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-carbon-400">
                Amount to Collect
              </span>
              <div className="flex items-center text-slate-900 dark:text-white font-mono tabular-nums font-black text-lg">
                <DollarSign className="w-5 h-5 text-volt-500 mr-0.5" />
                {price}.00
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-volt-500 hover:bg-volt-400 text-black font-black text-sm shadow-volt-glow flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
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

