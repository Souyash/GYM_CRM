import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  UserCheck,
  HeartPulse,
  Activity,
  Calendar,
  MapPin,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Share2,
  Phone,
  Mail,
  Scale,
  Ruler,
  AlertTriangle,
  Target,
  Clock,
  ShieldAlert,
  Dumbbell
} from 'lucide-react';
import { api } from '../services/api';
import { MemberOnboardingForm } from './MemberOnboardingForm';

interface MemberOnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  mode?: 'ADMIN' | 'SELF';
  initialValues?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
  isMandatory?: boolean;
}

const HEALTH_CONDITIONS_LIST = [
  'Thyroid',
  'Blood Pressure (BP)',
  'Diabetes',
  'Cholesterol',
  'Heart Condition',
  'Asthma / Respiratory',
  'PCOS / PCOD',
  'Arthritis / Joint Pain',
  'Chronic Back Pain',
  'Knee Pain / Issue',
  'Shoulder Problem',
  'Post-Surgery Recovery',
  'Obesity',
  'Other Condition'
];

const PRIMARY_GOALS = [
  { id: 'Weight Loss & Fat Burn', title: 'Weight Loss', desc: 'Reduce fat & slim down', icon: '🔥' },
  { id: 'Muscle Building & Hypertrophy', title: 'Muscle Gain', desc: 'Build size & strength', icon: '💪' },
  { id: 'Body Transformation', title: 'Transformation', desc: 'Recomp & tone body', icon: '⚡' },
  { id: 'Stamina & Endurance', title: 'Stamina & Cardio', desc: 'Cardiovascular fitness', icon: '🏃' },
  { id: 'Strength & Power', title: 'Strength Power', desc: 'Heavy lifts & power', icon: '🏋️' },
  { id: 'General Fitness & Health', title: 'General Fitness', desc: 'Active & healthy lifestyle', icon: '🌿' },
  { id: 'Rehab & Mobility', title: 'Rehab / Mobility', desc: 'Joint & posture health', icon: '🧘' }
];

const REFERRAL_SOURCES = [
  'Instagram / Social Media',
  'Friend / Member Referral',
  'Walk-in / Direct Visit',
  'Google Search / Maps',
  'Flyer / Outdoor Banner',
  'Corporate Partner',
  'Other'
];

export const MemberOnboardingModal: React.FC<MemberOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'ADMIN',
  initialValues,
  isMandatory = false
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form 1: Contact & Address
  const [fullName, setFullName] = useState(initialValues?.fullName || '');
  const [email, setEmail] = useState(initialValues?.email || '');
  const [phone, setPhone] = useState(initialValues?.phone || '');

  useEffect(() => {
    if (initialValues) {
      if (initialValues.fullName) setFullName(initialValues.fullName);
      if (initialValues.email) setEmail(initialValues.email);
      if (initialValues.phone) setPhone(initialValues.phone);
    }
  }, [initialValues]);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [houseFlatStreet, setHouseFlatStreet] = useState('');
  const [localityArea, setLocalityArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isPermanentSame, setIsPermanentSame] = useState(true);
  const [permanentAddress, setPermanentAddress] = useState('');
  const [referralSource, setReferralSource] = useState('Instagram / Social Media');
  const [referralDetails, setReferralDetails] = useState('');

  // Subscription plan selection
  const [planName, setPlanName] = useState('Monthly Pro Access');
  const [price, setPrice] = useState(65);
  const [durationDays, setDurationDays] = useState(30);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Form 2: Section A - Current Body Metrics
  const [currentWeightKg, setCurrentWeightKg] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [bodyFatPercentage, setBodyFatPercentage] = useState<string>('');
  const [muscleMassKg, setMuscleMassKg] = useState<string>('');
  const [waistCm, setWaistCm] = useState<string>('');
  const [chestCm, setChestCm] = useState<string>('');
  const [hipCm, setHipCm] = useState<string>('');

  // Form 2: Section B - Health Conditions & Medical History
  const [hasHealthCondition, setHasHealthCondition] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [otherConditionText, setOtherConditionText] = useState('');
  const [isTakingMedication, setIsTakingMedication] = useState(false);
  const [medicationDetails, setMedicationDetails] = useState('');
  const [advisedAvoidExercise, setAdvisedAvoidExercise] = useState(false);
  const [avoidExerciseDetails, setAvoidExerciseDetails] = useState('');
  const [hasMajorSurgery, setHasMajorSurgery] = useState(false);
  const [surgeryDetails, setSurgeryDetails] = useState('');
  const [hasGymInjury, setHasGymInjury] = useState(false);
  const [injuryDetails, setInjuryDetails] = useState('');

  // Form 2: Section C - Goals & Timeline
  const [primaryGoal, setPrimaryGoal] = useState('Weight Loss & Fat Burn');
  const [specificGoal, setSpecificGoal] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState<string>('');
  const [targetTimeline, setTargetTimeline] = useState('3 Months');

  // Success result
  const [createdResult, setCreatedResult] = useState<any | null>(null);

  // Computed Age
  const calculatedAge = useMemo(() => {
    if (!dateOfBirth) return null;
    const birth = new Date(dateOfBirth);
    if (isNaN(birth.getTime())) return null;
    const diffMs = Date.now() - birth.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  }, [dateOfBirth]);

  // Computed BMI
  const computedBmiData = useMemo(() => {
    const w = parseFloat(currentWeightKg);
    const h = parseFloat(heightCm);
    if (!w || !h || h <= 0) return null;
    const heightM = h / 100;
    const val = Math.round((w / (heightM * heightM)) * 10) / 10;
    let label = 'Normal';
    let colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (val < 18.5) {
      label = 'Underweight';
      colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    } else if (val >= 18.5 && val < 25) {
      label = 'Normal / Healthy';
      colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    } else if (val >= 25 && val < 30) {
      label = 'Overweight';
      colorClass = 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    } else {
      label = 'Obese';
      colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
    return { bmi: val, label, colorClass };
  }, [currentWeightKg, heightCm]);

  if (!isOpen) return null;

  const toggleConditionTag = (tag: string) => {
    setSelectedConditions((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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

  const handleNextToHealth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Full name and email are required to continue.');
      return;
    }
    setErrorMsg(null);
    setCurrentStep(2);
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        age: calculatedAge,
        gender,
        profilePhoto: profilePhoto.trim() || undefined,
        houseFlatStreet: houseFlatStreet.trim() || undefined,
        localityArea: localityArea.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pinCode: pinCode.trim() || undefined,
        isPermanentSame,
        permanentAddress: !isPermanentSame ? permanentAddress.trim() : undefined,
        referralSource,
        referralDetails: referralDetails.trim() || undefined,

        // Plan
        planName,
        price,
        durationDays,
        paymentMethod,

        // Body metrics
        currentWeightKg: currentWeightKg ? parseFloat(currentWeightKg) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : undefined,
        muscleMassKg: muscleMassKg ? parseFloat(muscleMassKg) : undefined,
        waistCm: waistCm ? parseFloat(waistCm) : undefined,
        chestCm: chestCm ? parseFloat(chestCm) : undefined,
        hipCm: hipCm ? parseFloat(hipCm) : undefined,

        // Health Conditions
        hasHealthCondition,
        healthConditions: selectedConditions,
        otherConditionText: otherConditionText.trim() || undefined,
        isTakingMedication,
        medicationDetails: isTakingMedication ? medicationDetails.trim() : undefined,
        advisedAvoidExercise,
        avoidExerciseDetails: advisedAvoidExercise ? avoidExerciseDetails.trim() : undefined,
        hasMajorSurgery,
        surgeryDetails: hasMajorSurgery ? surgeryDetails.trim() : undefined,
        hasGymInjury,
        injuryDetails: hasGymInjury ? injuryDetails.trim() : undefined,

        // Goals
        primaryGoal,
        specificGoal: specificGoal.trim() || undefined,
        targetWeightKg: targetWeightKg ? parseFloat(targetWeightKg) : undefined,
        targetTimeline
      };

      if (mode === 'SELF') {
        const res = await api.updateMyHealthProfile(payload);
        setCreatedResult({
          member: {
            fullName: fullName || initialValues?.fullName,
            email: email || initialValues?.email
          },
          healthProfile: res.profile
        });
      } else {
        const res = await api.onboardWithHealth(payload);
        setCreatedResult(res);
      }
      setCurrentStep(3);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit onboarding form. Please verify inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (mode === 'SELF') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-4xl my-auto">
          <MemberOnboardingForm
            initialValues={initialValues}
            isCollapsible={!isMandatory}
            onCancel={!isMandatory ? onClose : undefined}
            onSuccess={() => {
              if (onSuccess) onSuccess();
              if (onClose) onClose();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-zinc-900 to-black border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header with Stepper */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <HeartPulse className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                  <span>Member Onboarding & Fitness Assessment</span>
                  {isMandatory && (
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500 text-black">
                      Required
                    </span>
                  )}
                </h2>
                <p className="text-xs text-zinc-400">
                  Comprehensive 2-part admission sheet & marketing intelligence capture
                </p>
              </div>
            </div>
          </div>

          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Mandatory Notification Banner */}
        {isMandatory && (
          <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>First-Time Activation:</strong> Welcome! As a new athlete, please fill out Form 1 (Contact & Address) and Form 2 (Health & Fitness Sheet) below to activate your entrance pass.
            </span>
          </div>
        )}

        {/* Stepper Indicator */}
        <div className="grid grid-cols-3 border-b border-zinc-800 text-xs sm:text-sm font-medium bg-zinc-950/50">
          <div
            className={`py-3 px-4 flex items-center justify-center gap-2 border-r border-zinc-800 ${
              currentStep === 1
                ? 'text-amber-400 bg-amber-500/5 font-semibold border-b-2 border-b-amber-500'
                : 'text-zinc-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-zinc-800 text-zinc-200">
              1
            </span>
            <span>Contact & Address</span>
          </div>

          <div
            className={`py-3 px-4 flex items-center justify-center gap-2 border-r border-zinc-800 ${
              currentStep === 2
                ? 'text-amber-400 bg-amber-500/5 font-semibold border-b-2 border-b-amber-500'
                : 'text-zinc-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-zinc-800 text-zinc-200">
              2
            </span>
            <span>Fitness & Health Sheet</span>
          </div>

          <div
            className={`py-3 px-4 flex items-center justify-center gap-2 ${
              currentStep === 3
                ? 'text-emerald-400 bg-emerald-500/5 font-semibold border-b-2 border-b-emerald-500'
                : 'text-zinc-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-zinc-800 text-zinc-200">
              3
            </span>
            <span>Success & Confirmation</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: CONTACT & ADDRESS FORM */}
        {currentStep === 1 && (
          <form onSubmit={handleNextToHealth} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Section: Personal Info */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Personal & Demographic Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Subhaarth Biswas"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="member@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                    <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Phone Number (+91)</label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                    <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Date of Birth</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  {calculatedAge !== null && (
                    <span className="text-[11px] text-amber-400/90 mt-1 inline-block">
                      Computed Age: <strong>{calculatedAge} years</strong>
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Profile Photo URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Section: Address Details */}
            <div className="pt-2 border-t border-zinc-800/80">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Communication Address Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">House / Flat / Street Name</label>
                  <input
                    type="text"
                    placeholder="Flat 4B, Emerald Heights, Lake Road"
                    value={houseFlatStreet}
                    onChange={(e) => setHouseFlatStreet(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Locality / Area</label>
                  <input
                    type="text"
                    placeholder="Salt Lake Sector 5"
                    value={localityArea}
                    onChange={(e) => setLocalityArea(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Kolkata"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="West Bengal"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">PIN / Postal Code</label>
                  <input
                    type="text"
                    placeholder="700091"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Permanent Address Toggle */}
              <div className="mt-3">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isPermanentSame}
                    onChange={(e) => setIsPermanentSame(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900"
                  />
                  <span>Permanent address is same as communication address</span>
                </label>

                {!isPermanentSame && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Enter permanent address..."
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section: Marketing Attribution & Referral */}
            <div className="pt-2 border-t border-zinc-800/80">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Marketing & Lead Attribution Source
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    How did you hear about IronVault?
                  </label>
                  <select
                    value={referralSource}
                    onChange={(e) => setReferralSource(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    {REFERRAL_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Referral Details / Reference Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Referred by Rahul Sharma"
                    value={referralDetails}
                    onChange={(e) => setReferralDetails(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Section: Admission Plan & Billing (Admin Onboarding Only) */}
            <div className="pt-2 border-t border-zinc-800/80">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" /> Admission Membership Plan
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { name: 'Monthly Pro Access', price: 65, days: 30 },
                    { name: 'Quarterly Elite Pass', price: 165, days: 90 },
                    { name: 'Annual VIP Membership', price: 540, days: 365 },
                    { name: 'Day Pass', price: 15, days: 1 }
                  ].map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handlePlanChange(p.name)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        planName === p.name
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-semibold truncate">{p.name}</div>
                      <div className="text-base font-black text-amber-400 mt-1">${p.price}</div>
                      <div className="text-[10px] text-zinc-400">{p.days} days validity</div>
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <span className="text-xs text-zinc-400">Payment Mode:</span>
                  {['CASH', 'UPI', 'CARD'].map((m) => (
                    <label key={m} className="inline-flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={m}
                        checked={paymentMethod === m}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </div>

            {/* Next Button */}
            <div className="flex justify-end pt-4 border-t border-zinc-800">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
              >
                <span>Proceed to Health & Fitness Assessment</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: HEALTH & FITNESS ASSESSMENT (FORM 2) */}
        {currentStep === 2 && (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Form 2 Part A: Body Metrics with Auto BMI */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Scale className="w-4 h-4" /> A. Current Body Composition & Metrics
                </h3>
                {computedBmiData && (
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${computedBmiData.colorClass}`}
                  >
                    <span>BMI: {computedBmiData.bmi}</span>
                    <span>•</span>
                    <span>{computedBmiData.label}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Current Weight (KG) <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 74.5"
                      value={currentWeightKg}
                      onChange={(e) => setCurrentWeightKg(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs text-zinc-400 font-semibold">kg</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Height (CM) <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 175"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs text-zinc-400 font-semibold">cm</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Body Fat %</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 18.5"
                      value={bodyFatPercentage}
                      onChange={(e) => setBodyFatPercentage(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs text-zinc-400 font-semibold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Muscle Mass (KG)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 33.2"
                      value={muscleMassKg}
                      onChange={(e) => setMuscleMassKg(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs text-zinc-400 font-semibold">kg</span>
                  </div>
                </div>
              </div>

              {/* Body Circumferences */}
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Waist Circumference (CM)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 84"
                    value={waistCm}
                    onChange={(e) => setWaistCm(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Chest Circumference (CM)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 98"
                    value={chestCm}
                    onChange={(e) => setChestCm(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Hip Circumference (CM)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 96"
                    value={hipCm}
                    onChange={(e) => setHipCm(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Form 2 Part B: Health Conditions & Medical History */}
            <div className="pt-4 border-t border-zinc-800/80">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> B. Health Conditions & Medical History
                </h3>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={hasHealthCondition}
                    onChange={(e) => setHasHealthCondition(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-amber-500"
                  />
                  <span>Has diagnosed medical condition(s)?</span>
                </label>
              </div>

              {/* 14 Condition Tags */}
              {hasHealthCondition && (
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3 mb-4 animate-in fade-in duration-200">
                  <span className="text-xs text-zinc-400 font-medium block">
                    Select all that apply from the clinical list:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {HEALTH_CONDITIONS_LIST.map((tag) => {
                      const isSelected = selectedConditions.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleConditionTag(tag)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-black font-bold border-amber-400 shadow-sm'
                              : 'bg-zinc-800/70 text-zinc-300 border-zinc-700 hover:border-zinc-600'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  {selectedConditions.includes('Other Condition') && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Please specify other medical conditions..."
                        value={otherConditionText}
                        onChange={(e) => setOtherConditionText(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 4 Toggle Questions with Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Medication */}
                <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-medium">Currently taking regular medication?</span>
                    <input
                      type="checkbox"
                      checked={isTakingMedication}
                      onChange={(e) => setIsTakingMedication(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                  </div>
                  {isTakingMedication && (
                    <input
                      type="text"
                      placeholder="Medication name & dosage..."
                      value={medicationDetails}
                      onChange={(e) => setMedicationDetails(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                {/* 2. Doctor Exercise Advice */}
                <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-medium">Doctor advised against strenuous exercise?</span>
                    <input
                      type="checkbox"
                      checked={advisedAvoidExercise}
                      onChange={(e) => setAdvisedAvoidExercise(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                  </div>
                  {advisedAvoidExercise && (
                    <input
                      type="text"
                      placeholder="Specify restriction or reason..."
                      value={avoidExerciseDetails}
                      onChange={(e) => setAvoidExerciseDetails(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                {/* 3. Major Surgery */}
                <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-medium">Any major surgeries in the past?</span>
                    <input
                      type="checkbox"
                      checked={hasMajorSurgery}
                      onChange={(e) => setHasMajorSurgery(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                  </div>
                  {hasMajorSurgery && (
                    <input
                      type="text"
                      placeholder="Surgery name & approximate year..."
                      value={surgeryDetails}
                      onChange={(e) => setSurgeryDetails(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                {/* 4. Gym Injuries */}
                <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-medium">Any prior gym or sports injuries?</span>
                    <input
                      type="checkbox"
                      checked={hasGymInjury}
                      onChange={(e) => setHasGymInjury(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                  </div>
                  {hasGymInjury && (
                    <input
                      type="text"
                      placeholder="e.g. Lower back sprain, ACL tear..."
                      value={injuryDetails}
                      onChange={(e) => setInjuryDetails(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Form 2 Part C: Primary Fitness Goals & Target Timeline */}
            <div className="pt-4 border-t border-zinc-800/80">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" /> C. Fitness Goals & Target Timeline
              </h3>

              {/* Goal Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                {PRIMARY_GOALS.map((g) => {
                  const isSelected = primaryGoal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setPrimaryGoal(g.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-white shadow-md'
                          : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xl mb-1">{g.icon}</div>
                      <div className="text-xs font-bold truncate text-white">{g.title}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{g.desc}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Target Weight (KG)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 68"
                      value={targetWeightKg}
                      onChange={(e) => setTargetWeightKg(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs text-zinc-400 font-semibold">kg</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Target Timeline</label>
                  <select
                    value={targetTimeline}
                    onChange={(e) => setTargetTimeline(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="1 Month">1 Month (30 Days Quick Sprint)</option>
                    <option value="2 Months">2 Months (60 Days)</option>
                    <option value="3 Months">3 Months (90 Days Transformation)</option>
                    <option value="6 Months">6 Months (Comprehensive Recomp)</option>
                    <option value="12 Months">12 Months (Full Lifestyle Evolution)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Specific Fitness Focus</label>
                  <input
                    type="text"
                    placeholder="e.g. 6-pack abs, bench 100kg, marathon prep"
                    value={specificGoal}
                    onChange={(e) => setSpecificGoal(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Contact Info</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold rounded-xl shadow-lg flex items-center gap-2 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving Health Data...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Onboarding & Save Lead</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS & CREDENTIALS CONFIRMATION */}
        {currentStep === 3 && createdResult && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">
                Member Successfully Onboarded!
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                All demographic, contact, body metrics, and fitness goals have been securely saved for marketing intelligence.
              </p>
            </div>

            {/* Summary Card */}
            <div className="max-w-md mx-auto p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Member Name:</span>
                <span className="text-white font-bold">{createdResult.member?.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Email:</span>
                <span className="text-white font-mono">{createdResult.member?.email}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Primary Goal:</span>
                <span className="text-amber-400 font-semibold">{primaryGoal}</span>
              </div>
              {computedBmiData && (
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">BMI / Classification:</span>
                  <span className="text-white font-semibold">
                    {computedBmiData.bmi} ({computedBmiData.label})
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-400">Referral Channel:</span>
                <span className="text-zinc-300">{referralSource}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  if (onClose) onClose();
                }}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-sm transition"
              >
                Close & View Marketing Hub
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

