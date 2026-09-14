import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Download,
  AlertTriangle,
  User,
  Phone,
  Calendar,
  MapPin,
  HeartPulse,
  Heart,
  Target,
  Clock,
  Sparkles,
  Printer,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

interface FirstTimeMemberEnrollmentModalProps {
  isOpen: boolean;
  user: any;
  onCompleted: () => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const FITNESS_GOALS = [
  'Weight Loss & Fat Burn',
  'Muscle Building & Strength',
  'Body Recomposition',
  'Cardio & Athletic Stamina',
  'General Fitness & Lifestyle',
  'Rehab & Mobility'
];

export const FirstTimeMemberEnrollmentModal: React.FC<FirstTimeMemberEnrollmentModalProps> = ({
  isOpen,
  user,
  onCompleted
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.whatsAppPhone || user?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');

  // Emergency Contact
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Parent / Guardian');

  // Address
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(user?.gym?.city || '');
  const [state, setState] = useState(user?.gym?.state || '');
  const [pinCode, setPinCode] = useState('');

  // Fitness & Health
  const [primaryGoal, setPrimaryGoal] = useState('Weight Loss & Fat Burn');
  const [targetTimeline, setTargetTimeline] = useState('3 Months');
  const [medicalHistory, setMedicalHistory] = useState('None declared - medically fit for physical exercise.');
  const [consentAgreed, setConsentAgreed] = useState(true);

  if (!isOpen) return null;

  const latestSub = user?.subscriptions?.[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!emergencyContactName.trim() || !emergencyContactPhone.trim()) {
      setErrorMsg('Please provide emergency contact person and phone number.');
      return;
    }

    if (!consentAgreed) {
      setErrorMsg('Please accept the gym safety policy and declaration.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitEnrollmentForm({
        fullName: fullName.trim(),
        phone: phone.trim(),
        dateOfBirth: dateOfBirth || undefined,
        gender,
        bloodGroup,
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        emergencyRelation,
        address: address.trim() || 'Address on file',
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pinCode: pinCode.trim() || undefined,
        primaryGoal,
        targetTimeline,
        medicalHistory: medicalHistory.trim(),
        signatureConsent: true
      });

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit admission details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadBill = () => {
    if (latestSub?.id) {
      api.downloadInvoicePdf(latestSub.id, latestSub.invoiceNumber);
    }
  };

  const handleDownloadEnrollment = () => {
    api.downloadEnrollmentPdf(user.id, user.fullName);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0c0d12] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#12141a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/30 flex items-center justify-center text-[#ccff00]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white font-['Poppins',sans-serif]">
                  Member Admission &amp; KYC Verification
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#ccff00] text-black uppercase tracking-wider">
                  REQUIRED
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Complete your athlete profile to generate your official printable form &amp; stamped bill
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isSuccess ? (
            /* SUCCESS STATE */
            <div className="py-6 text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-black text-white font-['Poppins']">
                  Admission Form &amp; Bill Verified!
                </h4>
                <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                  Your personal particulars and emergency details have been saved to the gym database. An official <strong className="text-white">Authorised Stamped Bill (PDF)</strong> and your <strong className="text-white">Printable Admission Form (PDF)</strong> have been dispatched to your WhatsApp!
                </p>
              </div>

              {/* Action Buttons Cluster */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
                {latestSub?.id && (
                  <button
                    type="button"
                    onClick={handleDownloadBill}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#14161f] hover:bg-[#1a1d29] border border-white/10 text-white font-bold text-xs transition active:scale-95 group"
                  >
                    <Printer className="w-4 h-4 text-[#ccff00] group-hover:scale-110 transition-transform" />
                    <span>Download Stamped Bill</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadEnrollment}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#14161f] hover:bg-[#1a1d29] border border-white/10 text-white font-bold text-xs transition active:scale-95 group"
                >
                  <Download className="w-4 h-4 text-[#ccff00] group-hover:scale-110 transition-transform" />
                  <span>Download Admission Form</span>
                </button>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={onCompleted}
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#ccff00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider transition active:scale-95 shadow-[0_0_20px_rgba(204,255,0,0.25)]"
                >
                  Enter Member Dashboard &rarr;
                </button>
              </div>
            </div>
          ) : (
            /* FORM STATE */
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Identity & Contact */}
              <div className="p-4 rounded-2xl bg-[#12141a] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#ccff00] uppercase tracking-wider">
                  <User className="w-3.5 h-3.5" />
                  <span>1. Athlete Personal Particulars</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-neutral-400 block mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">WhatsApp Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-neutral-400 block mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-neutral-400 block mb-1">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                      >
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Emergency Contact */}
              <div className="p-4 rounded-2xl bg-[#12141a] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                  <Heart className="w-3.5 h-3.5" />
                  <span>2. Emergency Contact Information (Mandatory)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-neutral-400 block mb-1">Emergency Contact Person</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">Emergency Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">Relationship</label>
                    <input
                      type="text"
                      placeholder="e.g. Parent / Spouse"
                      value={emergencyRelation}
                      onChange={(e) => setEmergencyRelation(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Address */}
              <div className="p-4 rounded-2xl bg-[#12141a] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-[#ccff00]" />
                  <span>3. Residential Address</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-3">
                    <label className="text-neutral-400 block mb-1">Flat / Street / Apartment</label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 3B, Sunshine Apartments, MG Road"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">Postal PIN Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 700091"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Fitness Target & Health Check */}
              <div className="p-4 rounded-2xl bg-[#12141a] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  <Target className="w-3.5 h-3.5 text-[#ccff00]" />
                  <span>4. Fitness Goals &amp; Medical Clearance</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-neutral-400 block mb-1">Primary Fitness Goal</label>
                    <select
                      value={primaryGoal}
                      onChange={(e) => setPrimaryGoal(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                    >
                      {FITNESS_GOALS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">Target Timeline</label>
                    <select
                      value={targetTimeline}
                      onChange={(e) => setTargetTimeline(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                    >
                      <option value="1 Month">1 Month</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months">6 Months</option>
                      <option value="1 Year">1 Year</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-neutral-400 block mb-1">
                      Pre-existing Health / Injury Notes (if any)
                    </label>
                    <textarea
                      rows={2}
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      placeholder="e.g. Asthma, prior knee injury, or 'None declared - medically fit'"
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Legal Terms & Agreement */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={consentAgreed}
                    onChange={(e) => setConsentAgreed(e.target.checked)}
                    className="mt-0.5 accent-[#ccff00] w-4 h-4 rounded"
                  />
                  <span>
                    I confirm that the details provided are accurate and complete. I voluntarily participate in physical exercises and agree to follow all gym floor safety policies.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#ccff00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(204,255,0,0.25)]"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Generating Documents &amp; Dispatching to WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Complete KYC &amp; Receive Stamped Bill</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
