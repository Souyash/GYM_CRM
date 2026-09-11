import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UserCheck,
  HeartPulse,
  Activity,
  Calendar,
  MapPin,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Phone,
  Mail,
  Scale,
  Ruler,
  AlertTriangle,
  Target,
  Clock,
  ShieldCheck,
  Camera,
  Upload,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { MemberHealthProfile } from '../types';

export interface MemberOnboardingFormProps {
  initialValues?: {
    fullName?: string;
    email?: string;
    phone?: string;
    profile?: MemberHealthProfile | null;
  };
  onSuccess?: (profile: MemberHealthProfile) => void;
  onCancel?: () => void;
  isCollapsible?: boolean;
}

const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

const COMMON_CONDITIONS = [
  'Thyroid',
  'Hypertension / High Blood Pressure',
  'Diabetes',
  'High Cholesterol',
  'Heart Condition',
  'Asthma',
  'PCOS / PCOD',
  'Arthritis',
  'Back Pain',
  'Knee Problem',
  'Shoulder Injury',
  'Previous Surgery',
  'Obesity',
  'Other'
];

const REFERRAL_OPTIONS = [
  'Friend / Existing Member',
  'Trainer',
  'Social Media',
  'Google Search',
  'Advertisement',
  'Walk-in',
  'Family Member',
  'Corporate Referral',
  'Other'
];

export const MemberOnboardingForm: React.FC<MemberOnboardingFormProps> = ({
  initialValues,
  onSuccess,
  onCancel,
  isCollapsible = false
}) => {
  // Step state: 1 = Part 1: Contact & Admission Profile, 2 = Part 2: Health & Physical Assessment, 3 = Review & Confirmation
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Validation errors map
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---------------- PART 1: BASIC INFORMATION ----------------
  const [fullName, setFullName] = useState(initialValues?.fullName || '');
  const [phone, setPhone] = useState(initialValues?.phone || '');
  const [email, setEmail] = useState(initialValues?.email || '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // OTP State for Mobile Number
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpDevHint, setOtpDevHint] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ---------------- PART 1: ADDRESS DETAILS ----------------
  const [houseFlatStreet, setHouseFlatStreet] = useState('');
  const [localityArea, setLocalityArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pinCode, setPinCode] = useState('');

  const [isPermanentSame, setIsPermanentSame] = useState(true);
  const [permHouseFlatStreet, setPermHouseFlatStreet] = useState('');
  const [permLocalityArea, setPermLocalityArea] = useState('');
  const [permCity, setPermCity] = useState('');
  const [permState, setPermState] = useState('Maharashtra');
  const [permPinCode, setPermPinCode] = useState('');

  // ---------------- PART 1: REFERENCE INFORMATION ----------------
  const [referralSource, setReferralSource] = useState('Social Media');
  const [referralDetails, setReferralDetails] = useState('');

  // ---------------- PART 2: CURRENT BODY DATA ----------------
  const [currentWeightKg, setCurrentWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [bodyFatPercentage, setBodyFatPercentage] = useState('');
  const [muscleMassKg, setMuscleMassKg] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [chestCm, setChestCm] = useState('');
  const [hipCm, setHipCm] = useState('');

  // ---------------- PART 2: HEALTH CONDITION SELECTOR ----------------
  const [hasHealthCondition, setHasHealthCondition] = useState<'No' | 'Yes'>('No');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [otherConditionText, setOtherConditionText] = useState('');

  // ---------------- PART 2: IMPORTANT MEDICAL QUESTIONS ----------------
  const [isTakingMedication, setIsTakingMedication] = useState<'No' | 'Yes'>('No');
  const [medicationDetails, setMedicationDetails] = useState('');

  const [advisedAvoidExercise, setAdvisedAvoidExercise] = useState<'No' | 'Yes'>('No');
  const [avoidExerciseDetails, setAvoidExerciseDetails] = useState('');

  const [hasMajorSurgery, setHasMajorSurgery] = useState<'No' | 'Yes'>('No');
  const [surgeryDetails, setSurgeryDetails] = useState('');

  // Optional Goals & Target Timeline
  const [primaryGoal, setPrimaryGoal] = useState('Weight Loss & Fat Burn');
  const [targetWeightKg, setTargetWeightKg] = useState('');
  const [targetTimeline, setTargetTimeline] = useState('3 Months');

  // Load existing profile values if available
  useEffect(() => {
    if (initialValues) {
      if (initialValues.fullName) setFullName(initialValues.fullName);
      if (initialValues.email) setEmail(initialValues.email);
      if (initialValues.phone) {
        setPhone(initialValues.phone);
        if (initialValues.phone.length >= 10) {
          setIsPhoneVerified(true);
        }
      }

      if (initialValues.profile) {
        const p = initialValues.profile;
        if (p.dateOfBirth) {
          const d = new Date(p.dateOfBirth);
          if (!isNaN(d.getTime())) {
            setDateOfBirth(d.toISOString().split('T')[0]);
          }
        }
        if (p.gender) setGender(p.gender);
        if (p.profilePhoto) setProfilePhoto(p.profilePhoto);
        if (p.houseFlatStreet) setHouseFlatStreet(p.houseFlatStreet);
        if (p.localityArea) setLocalityArea(p.localityArea);
        if (p.city) setCity(p.city);
        if (p.state) setState(p.state);
        if (p.pinCode) setPinCode(p.pinCode);

        if (p.isPermanentSame !== undefined) setIsPermanentSame(Boolean(p.isPermanentSame));
        if (p.permanentAddress) {
          setPermHouseFlatStreet(p.permanentAddress);
        }

        if (p.referralSource) setReferralSource(p.referralSource);
        if (p.referralDetails) setReferralDetails(p.referralDetails);

        if (p.currentWeightKg) setCurrentWeightKg(String(p.currentWeightKg));
        if (p.heightCm) setHeightCm(String(p.heightCm));
        if (p.bodyFatPercentage) setBodyFatPercentage(String(p.bodyFatPercentage));
        if (p.muscleMassKg) setMuscleMassKg(String(p.muscleMassKg));
        if (p.waistCm) setWaistCm(String(p.waistCm));
        if (p.chestCm) setChestCm(String(p.chestCm));
        if (p.hipCm) setHipCm(String(p.hipCm));

        if (p.hasHealthCondition) {
          setHasHealthCondition('Yes');
          if (p.healthConditions) {
            try {
              const parsed = JSON.parse(p.healthConditions);
              if (Array.isArray(parsed)) setSelectedConditions(parsed);
            } catch {
              // fallback
            }
          }
        }
        if (p.otherConditionText) setOtherConditionText(p.otherConditionText);

        if (p.isTakingMedication) {
          setIsTakingMedication('Yes');
          if (p.medicationDetails) setMedicationDetails(p.medicationDetails);
        }
        if (p.advisedAvoidExercise) {
          setAdvisedAvoidExercise('Yes');
          if (p.avoidExerciseDetails) setAvoidExerciseDetails(p.avoidExerciseDetails);
        }
        if (p.hasMajorSurgery) {
          setHasMajorSurgery('Yes');
          if (p.surgeryDetails) setSurgeryDetails(p.surgeryDetails);
        }

        if (p.primaryGoal) setPrimaryGoal(p.primaryGoal);
        if (p.targetWeightKg) setTargetWeightKg(String(p.targetWeightKg));
        if (p.targetTimeline) setTargetTimeline(p.targetTimeline);
      }
    }
  }, [initialValues]);

  // Timer countdown for OTP
  useEffect(() => {
    let interval: any = null;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Real-time Age Calculation
  const calculatedAge = useMemo(() => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [dateOfBirth]);

  // Real-time BMI Calculation: BMI = Weight (kg) / (Height (m))^2
  const bmiCalculation = useMemo(() => {
    const weight = parseFloat(currentWeightKg);
    const height = parseFloat(heightCm);
    if (!weight || !height || height <= 0 || weight <= 0) return null;
    const heightM = height / 100;
    const val = weight / (heightM * heightM);
    const rounded = Math.round(val * 10) / 10;

    let category = 'Normal';
    let color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    if (rounded < 18.5) {
      category = 'Underweight';
      color = 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    } else if (rounded < 25) {
      category = 'Normal / Healthy';
      color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    } else if (rounded < 30) {
      category = 'Overweight';
      color = 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    } else {
      category = 'Obese';
      color = 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    }
    return { val: rounded, category, color };
  }, [currentWeightKg, heightCm]);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB. Please upload a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setProfilePhoto(uploadEvent.target?.result as string);
      setErrors((prev) => ({ ...prev, profilePhoto: '' }));
    };
    reader.readAsDataURL(file);
  };

  // Handle OTP Send
  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrors((prev) => ({ ...prev, phone: 'Please enter a valid 10-digit mobile number' }));
      return;
    }

    setErrors((prev) => ({ ...prev, phone: '' }));
    setOtpError(null);
    setIsSendingOtp(true);
    try {
      const res = await api.sendPhoneOtp(cleanPhone);
      setIsOtpSent(true);
      setOtpTimer(60);
      if (res?.devOtp) {
        setOtpDevHint(`Testing OTP Code: ${res.devOtp}`);
      }
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle OTP Verify
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setOtpError(null);
    setIsVerifyingOtp(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const res = await api.verifyPhoneOtp(cleanPhone, otpCode);
      if (res?.verified) {
        setIsPhoneVerified(true);
        setIsOtpSent(false);
        setOtpDevHint(null);
        setErrors((prev) => ({ ...prev, phone: '' }));
      }
    } catch (err: any) {
      setOtpError(err.message || 'Incorrect verification code. Please check and retry.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Condition toggle helper
  const toggleCondition = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    );
  };

  // ---------------- VALIDATION ----------------
  const validatePart1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'Valid 10-digit mobile number is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please provide a valid email format (e.g. name@domain.com).';
    }

    if (pinCode.trim() && !/^\d{6}$/.test(pinCode.trim())) {
      newErrors.pinCode = 'PIN code must be a 6-digit number.';
    }

    if (!isPermanentSame) {
      if (permPinCode.trim() && !/^\d{6}$/.test(permPinCode.trim())) {
        newErrors.permPinCode = 'Permanent PIN code must be a 6-digit number.';
      }
    }

    if (referralSource === 'Friend / Existing Member' && !referralDetails.trim()) {
      newErrors.referralDetails = 'Please provide the referring member name or phone number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePart2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    const weight = parseFloat(currentWeightKg);
    if (!currentWeightKg || isNaN(weight) || weight <= 20 || weight > 300) {
      newErrors.currentWeightKg = 'Please enter a valid weight in kg (e.g. 70).';
    }

    const height = parseFloat(heightCm);
    if (!heightCm || isNaN(height) || height <= 80 || height > 260) {
      newErrors.heightCm = 'Please enter a valid height in cm (e.g. 175).';
    }

    if (hasHealthCondition === 'Yes') {
      if (selectedConditions.length === 0) {
        newErrors.healthConditions = 'Please select at least one health condition.';
      }
      if (selectedConditions.includes('Other') && !otherConditionText.trim()) {
        newErrors.otherConditionText = 'Please specify your other health condition.';
      }
    }

    if (isTakingMedication === 'Yes' && !medicationDetails.trim()) {
      newErrors.medicationDetails = 'Please specify what medication you are taking.';
    }

    if (advisedAvoidExercise === 'Yes' && !avoidExerciseDetails.trim()) {
      newErrors.avoidExerciseDetails = 'Please specify which exercises to avoid.';
    }

    if (hasMajorSurgery === 'Yes' && !surgeryDetails.trim()) {
      newErrors.surgeryDetails = 'Please specify your past surgical history.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 1) {
      if (validatePart1()) {
        setActiveStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (activeStep === 2) {
      if (validatePart2()) {
        setActiveStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBack = () => {
    if (activeStep === 3) setActiveStep(2);
    else if (activeStep === 2) setActiveStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---------------- FORM SUBMISSION ----------------
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validatePart1()) {
      setActiveStep(1);
      return;
    }
    if (!validatePart2()) {
      setActiveStep(2);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccessMsg(null);

    try {
      // Build Permanent Address representation if distinct
      const fullPermanentAddress = isPermanentSame
        ? null
        : [permHouseFlatStreet, permLocalityArea, permCity, permState, permPinCode]
            .filter(Boolean)
            .join(', ');

      const payload = {
        // Part 1: Member Contact & Admission Profile
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        dateOfBirth: dateOfBirth || null,
        age: calculatedAge,
        gender,
        profilePhoto: profilePhoto || null,

        // Current Address
        houseFlatStreet: houseFlatStreet.trim() || null,
        localityArea: localityArea.trim() || null,
        city: city.trim() || null,
        state,
        pinCode: pinCode.trim() || null,

        // Permanent Address
        isPermanentSame,
        permanentAddress: fullPermanentAddress,

        // Reference Information
        referralSource,
        referralDetails: referralDetails.trim() || null,

        // Part 2: Current Body Data
        currentWeightKg: parseFloat(currentWeightKg),
        heightCm: parseFloat(heightCm),
        bmi: bmiCalculation?.val || null,
        bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : null,
        muscleMassKg: muscleMassKg ? parseFloat(muscleMassKg) : null,
        waistCm: waistCm ? parseFloat(waistCm) : null,
        chestCm: chestCm ? parseFloat(chestCm) : null,
        hipCm: hipCm ? parseFloat(hipCm) : null,

        // Health Condition Selector
        hasHealthCondition: hasHealthCondition === 'Yes',
        healthConditions: selectedConditions,
        otherConditionText: otherConditionText.trim() || null,

        // Important Medical Questions
        isTakingMedication: isTakingMedication === 'Yes',
        medicationDetails: medicationDetails.trim() || null,
        advisedAvoidExercise: advisedAvoidExercise === 'Yes',
        avoidExerciseDetails: avoidExerciseDetails.trim() || null,
        hasMajorSurgery: hasMajorSurgery === 'Yes',
        surgeryDetails: surgeryDetails.trim() || null,

        // Goals & Target Timeline
        primaryGoal,
        targetWeightKg: targetWeightKg ? parseFloat(targetWeightKg) : null,
        targetTimeline
      };

      const res = await api.updateMyHealthProfile(payload);
      setSubmitSuccessMsg('Your admission and health profile has been successfully saved!');

      if (onSuccess && res?.profile) {
        setTimeout(() => {
          onSuccess(res.profile);
        }, 1200);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit onboarding form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-[#0e0e12] border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden transition-all">
      {/* Top Banner & Progress Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-200 dark:border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-amber-500 text-black font-black rounded-2xl shadow-md">
              <UserCheck className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  Athlete Onboarding
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  Step {activeStep} of 3
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                Member Admission & Fitness Assessment
              </h2>
            </div>
          </div>

          {isCollapsible && onCancel && (
            <button
              onClick={onCancel}
              className="self-end sm:self-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
            >
              Dismiss / Close
            </button>
          )}
        </div>

        {/* Modern Step Wizard Tabs */}
        <div className="grid grid-cols-3 gap-2 mt-6">
          <button
            onClick={() => setActiveStep(1)}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold transition border ${
              activeStep === 1
                ? 'bg-amber-500 text-black border-amber-500 shadow-md'
                : 'bg-slate-100 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-400 border-transparent hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-black">
              1
            </span>
            <span className="hidden sm:inline">Part 1: Contact & Admission</span>
            <span className="sm:hidden">Part 1</span>
          </button>

          <button
            onClick={() => {
              if (validatePart1()) setActiveStep(2);
            }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold transition border ${
              activeStep === 2
                ? 'bg-amber-500 text-black border-amber-500 shadow-md'
                : 'bg-slate-100 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-400 border-transparent hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-black">
              2
            </span>
            <span className="hidden sm:inline">Part 2: Health & Physical</span>
            <span className="sm:hidden">Part 2</span>
          </button>

          <button
            onClick={() => {
              if (validatePart1() && validatePart2()) setActiveStep(3);
            }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold transition border ${
              activeStep === 3
                ? 'bg-amber-500 text-black border-amber-500 shadow-md'
                : 'bg-slate-100 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-400 border-transparent hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-black">
              3
            </span>
            <span className="hidden sm:inline">Review & Submit</span>
            <span className="sm:hidden">Review</span>
          </button>
        </div>
      </div>

      {/* Form Content Body */}
      <div className="p-6 sm:p-8">
        {submitError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Submission Error</span>
              <span>{submitError}</span>
            </div>
          </div>
        )}

        {submitSuccessMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center gap-3 text-xs">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-bold">{submitSuccessMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: PART 1 - MEMBER CONTACT & ADMISSION PROFILE                       */}
        {/* ========================================================================= */}
        {activeStep === 1 && (
          <div className="space-y-8 animate-fadeIn">
            {/* 1. Basic Information */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-zinc-800 pb-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs">
                    1
                  </span>
                  Basic Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Identity and contact details for your official member pass
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter athlete's full legal name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none transition ${
                      errors.fullName
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-zinc-800 focus:border-amber-500'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Mobile Number with OTP Verification */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-3.5 text-xs font-bold text-slate-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="98765 43210"
                        value={phone}
                        disabled={isPhoneVerified}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, ''));
                          setIsPhoneVerified(false);
                          setIsOtpSent(false);
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none transition ${
                          errors.phone
                            ? 'border-rose-500 ring-2 ring-rose-500/20'
                            : isPhoneVerified
                            ? 'border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-500/5'
                            : 'border-slate-200 dark:border-zinc-800 focus:border-amber-500'
                        }`}
                      />
                    </div>

                    {!isPhoneVerified ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || (isOtpSent && otpTimer > 0)}
                        className="px-4 py-3 rounded-2xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition shrink-0 shadow-sm"
                      >
                        {isSendingOtp
                          ? 'Sending...'
                          : isOtpSent && otpTimer > 0
                          ? `Resend (${otpTimer}s)`
                          : isOtpSent
                          ? 'Resend OTP'
                          : 'Send OTP'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold rounded-2xl text-xs shrink-0">
                        <Check className="w-4 h-4" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>

                  {errors.phone && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.phone}</p>
                  )}

                  {/* OTP Input Card */}
                  {isOtpSent && !isPhoneVerified && (
                    <div className="mt-3 p-4 bg-slate-100 dark:bg-zinc-900/90 border border-amber-500/30 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                          Enter 6-digit OTP code:
                        </span>
                        {otpDevHint && (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                            {otpDevHint}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="••••••"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 px-4 py-2 bg-white dark:bg-black border border-slate-300 dark:border-zinc-700 rounded-xl text-center text-base tracking-widest font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || otpCode.length !== 6}
                          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs disabled:opacity-50 transition"
                        >
                          {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </div>

                      {otpError && (
                        <p className="text-[11px] font-bold text-rose-500">{otpError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="athlete@domain.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none transition ${
                      errors.email
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-zinc-800 focus:border-amber-500'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Date of Birth & Real-Time Age */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Age (Read-Only Auto Calculated) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Calculated Age (Years)
                  </label>
                  <div className="w-full px-4 py-3 bg-slate-100 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>{calculatedAge !== null ? `${calculatedAge} years old` : 'Select DOB above'}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                      Auto Computed
                    </span>
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Profile Photo Upload with Live Preview */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Profile Photo (Optional)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-amber-500/50 rounded-2xl transition bg-slate-50/50 dark:bg-zinc-900/30">
                    {profilePhoto ? (
                      <div className="relative group">
                        <img
                          src={profilePhoto}
                          alt="Athlete Preview"
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => setProfilePhoto(null)}
                          className="absolute -top-2 -right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}

                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-white hover:bg-amber-500 hover:text-black transition flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{profilePhoto ? 'Change Photo' : 'Upload Image'}</span>
                        </button>
                        {profilePhoto && (
                          <button
                            type="button"
                            onClick={() => setProfilePhoto(null)}
                            className="px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                        PNG, JPG, or WEBP up to 5MB. Used for gate pass identity verification.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Address Details */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-zinc-800 pb-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs">
                    2
                  </span>
                  Address Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Current communication residence and permanent address
                </p>
              </div>

              {/* Current Address Card */}
              <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
                <span className="text-xs font-black uppercase text-amber-500 tracking-wider block">
                  Current Residential Address
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                      House / Flat / Street
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 402, Marvel Heights, Link Road"
                      value={houseFlatStreet}
                      onChange={(e) => setHouseFlatStreet(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                      Area / Locality
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Andheri West"
                      value={localityArea}
                      onChange={(e) => setLocalityArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                      State
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 400053"
                      value={pinCode}
                      onChange={(e) => {
                        setPinCode(e.target.value.replace(/\D/g, ''));
                        if (errors.pinCode) setErrors((prev) => ({ ...prev, pinCode: '' }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none ${
                        errors.pinCode
                          ? 'border-rose-500 ring-1 ring-rose-500/20'
                          : 'border-slate-200 dark:border-zinc-800 focus:border-amber-500'
                      }`}
                    />
                    {errors.pinCode && (
                      <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.pinCode}</p>
                    )}
                  </div>
                </div>

                {/* Permanent Address Toggle Checkbox */}
                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-zinc-200 select-none">
                    <input
                      type="checkbox"
                      checked={isPermanentSame}
                      onChange={(e) => setIsPermanentSame(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Permanent address is same as current address</span>
                  </label>
                </div>

                {/* Conditional Permanent Address Fields */}
                {!isPermanentSame && (
                  <div className="p-4 bg-white dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3 animate-fadeIn">
                    <span className="text-xs font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider block">
                      Permanent Address
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                          House / Flat / Street
                        </label>
                        <input
                          type="text"
                          placeholder="Permanent house or street address"
                          value={permHouseFlatStreet}
                          onChange={(e) => setPermHouseFlatStreet(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                          Area / Locality
                        </label>
                        <input
                          type="text"
                          placeholder="Area or locality"
                          value={permLocalityArea}
                          onChange={(e) => setPermLocalityArea(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          placeholder="City"
                          value={permCity}
                          onChange={(e) => setPermCity(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                          State
                        </label>
                        <select
                          value={permState}
                          onChange={(e) => setPermState(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                          PIN Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="6-digit PIN"
                          value={permPinCode}
                          onChange={(e) => {
                            setPermPinCode(e.target.value.replace(/\D/g, ''));
                            if (errors.permPinCode) setErrors((prev) => ({ ...prev, permPinCode: '' }));
                          }}
                          className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none ${
                            errors.permPinCode
                              ? 'border-rose-500 ring-1 ring-rose-500/20'
                              : 'border-slate-200 dark:border-zinc-800 focus:border-amber-500'
                          }`}
                        />
                        {errors.permPinCode && (
                          <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.permPinCode}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Reference Information */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-zinc-800 pb-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs">
                    3
                  </span>
                  Reference Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Helps us reward referring members and optimize fitness community outreach
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    How did you hear about us?
                  </label>
                  <select
                    value={referralSource}
                    onChange={(e) => {
                      setReferralSource(e.target.value);
                      if (errors.referralDetails) setErrors((prev) => ({ ...prev, referralDetails: '' }));
                    }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    {REFERRAL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional Field if Friend / Existing Member is chosen */}
                {referralSource === 'Friend / Existing Member' && (
                  <div className="animate-fadeIn">
                    <label className="block text-xs font-bold text-amber-500 mb-1.5">
                      Enter Member Name or Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma or 9820011223"
                      value={referralDetails}
                      onChange={(e) => {
                        setReferralDetails(e.target.value);
                        if (errors.referralDetails) setErrors((prev) => ({ ...prev, referralDetails: '' }));
                      }}
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none transition ${
                        errors.referralDetails
                          ? 'border-rose-500 ring-2 ring-rose-500/20'
                          : 'border-amber-500/50 focus:border-amber-500'
                      }`}
                    />
                    {errors.referralDetails && (
                      <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.referralDetails}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Step Actions */}
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition"
              >
                <span>Continue to Part 2: Health & Physical</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PART 2 - HEALTH & PHYSICAL ASSESSMENT                             */}
        {/* ========================================================================= */}
        {activeStep === 2 && (
          <div className="space-y-8 animate-fadeIn">
            {/* 1. Current Body Data */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-zinc-800 pb-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs">
                    1
                  </span>
                  Current Body Data & Composition
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Body weight, height, auto-calculated BMI index, and optional circumferences
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Weight */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Current Weight (KG) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 74.5"
                    value={currentWeightKg}
                    onChange={(e) => {
                      setCurrentWeightKg(e.target.value);
                      if (errors.currentWeightKg) setErrors((prev) => ({ ...prev, currentWeightKg: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none transition ${
                      errors.currentWeightKg
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-zinc-800 focus:border-amber-500'
                    }`}
                  />
                  {errors.currentWeightKg && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.currentWeightKg}</p>
                  )}
                </div>

                {/* Height */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Height (CM) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 175"
                    value={heightCm}
                    onChange={(e) => {
                      setHeightCm(e.target.value);
                      if (errors.heightCm) setErrors((prev) => ({ ...prev, heightCm: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none transition ${
                      errors.heightCm
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-zinc-800 focus:border-amber-500'
                    }`}
                  />
                  {errors.heightCm && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.heightCm}</p>
                  )}
                </div>

                {/* Auto Calculated BMI Field */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    BMI (Auto-Calculated Read-Only)
                  </label>
                  <div className="w-full px-4 py-3 bg-slate-100 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        {bmiCalculation ? bmiCalculation.val : '—'}
                      </span>
                      {bmiCalculation && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${bmiCalculation.color}`}
                        >
                          {bmiCalculation.category}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                      Weight / Height²
                    </span>
                  </div>
                </div>

                {/* Body Fat % */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Body Fat % (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 18.5"
                    value={bodyFatPercentage}
                    onChange={(e) => setBodyFatPercentage(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Muscle Mass */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Muscle Mass (KG, Optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 34.0"
                    value={muscleMassKg}
                    onChange={(e) => setMuscleMassKg(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Waist */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Waist (CM)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 84"
                    value={waistCm}
                    onChange={(e) => setWaistCm(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Chest & Hip */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Chest / Hip (CM)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Chest"
                      value={chestCm}
                      onChange={(e) => setChestCm(e.target.value)}
                      className="w-full px-2.5 py-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Hip"
                      value={hipCm}
                      onChange={(e) => setHipCm(e.target.value)}
                      className="w-full px-2.5 py-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Health Condition Selector */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-zinc-800 pb-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs">
                    2
                  </span>
                  Health Condition Selector
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Helps our training staff adapt workout routines safely
                </p>
              </div>

              {/* Primary Question Radio */}
              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
                <label className="block text-sm font-black text-slate-900 dark:text-white">
                  Do you currently have any health condition we should know about?
                </label>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 dark:text-zinc-300">
                    <input
                      type="radio"
                      name="hasHealthCondition"
                      checked={hasHealthCondition === 'No'}
                      onChange={() => {
                        setHasHealthCondition('No');
                        setSelectedConditions([]);
                        setOtherConditionText('');
                      }}
                      className="w-4 h-4 text-amber-500 focus:ring-amber-500"
                    />
                    <span>No</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 dark:text-zinc-300">
                    <input
                      type="radio"
                      name="hasHealthCondition"
                      checked={hasHealthCondition === 'Yes'}
                      onChange={() => setHasHealthCondition('Yes')}
                      className="w-4 h-4 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Yes</span>
                  </label>
                </div>

                {/* Conditional Multi-Select Checkbox Group */}
                {hasHealthCondition === 'Yes' && (
                  <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-3 animate-fadeIn">
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                      Select all that apply:
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {COMMON_CONDITIONS.map((cond) => {
                        const isChecked = selectedConditions.includes(cond);
                        return (
                          <label
                            key={cond}
                            onClick={() => toggleCondition(cond)}
                            className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 cursor-pointer transition select-none ${
                              isChecked
                                ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                            />
                            <span>{cond}</span>
                          </label>
                        );
                      })}
                    </div>

                    {errors.healthConditions && (
                      <p className="text-[11px] font-bold text-rose-500">{errors.healthConditions}</p>
                    )}

                    {/* Nested Conditional for "Other" Description */}
                    {selectedConditions.includes('Other') && (
                      <div className="pt-2 animate-fadeIn">
                        <label className="block text-xs font-bold text-amber-500 mb-1">
                          Please describe other health condition: <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Provide details of your condition so our trainers can accommodate you..."
                          value={otherConditionText}
                          onChange={(e) => {
                            setOtherConditionText(e.target.value);
                            if (errors.otherConditionText) setErrors((prev) => ({ ...prev, otherConditionText: '' }));
                          }}
                          className={`w-full p-3 bg-white dark:bg-zinc-900 border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none ${
                            errors.otherConditionText
                              ? 'border-rose-500 ring-1 ring-rose-500/20'
                              : 'border-slate-200 dark:border-zinc-800 focus:border-amber-500'
                          }`}
                        />
                        {errors.otherConditionText && (
                          <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.otherConditionText}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Important Medical Questions */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-zinc-800 pb-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs">
                    3
                  </span>
                  Important Medical Questions
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Required safety clearance questions before strenuous lifting
                </p>
              </div>

              <div className="space-y-3">
                {/* Question 1: Medication */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      Are you currently taking any medication?
                    </span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                        <input
                          type="radio"
                          name="isTakingMedication"
                          checked={isTakingMedication === 'No'}
                          onChange={() => {
                            setIsTakingMedication('No');
                            setMedicationDetails('');
                          }}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span>No</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                        <input
                          type="radio"
                          name="isTakingMedication"
                          checked={isTakingMedication === 'Yes'}
                          onChange={() => setIsTakingMedication('Yes')}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span>Yes</span>
                      </label>
                    </div>
                  </div>

                  {isTakingMedication === 'Yes' && (
                    <div className="pt-2 animate-fadeIn">
                      <input
                        type="text"
                        placeholder="Please specify medication name and purpose..."
                        value={medicationDetails}
                        onChange={(e) => {
                          setMedicationDetails(e.target.value);
                          if (errors.medicationDetails) setErrors((prev) => ({ ...prev, medicationDetails: '' }));
                        }}
                        className={`w-full px-3.5 py-2 bg-white dark:bg-zinc-900 border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none ${
                          errors.medicationDetails
                            ? 'border-rose-500 ring-1 ring-rose-500/20'
                            : 'border-slate-200 dark:border-zinc-800 focus:border-amber-500'
                        }`}
                      />
                      {errors.medicationDetails && (
                        <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.medicationDetails}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Question 2: Advised Avoid Exercise */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      Has your doctor ever advised you to avoid specific exercises?
                    </span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                        <input
                          type="radio"
                          name="advisedAvoidExercise"
                          checked={advisedAvoidExercise === 'No'}
                          onChange={() => {
                            setAdvisedAvoidExercise('No');
                            setAvoidExerciseDetails('');
                          }}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span>No</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                        <input
                          type="radio"
                          name="advisedAvoidExercise"
                          checked={advisedAvoidExercise === 'Yes'}
                          onChange={() => setAdvisedAvoidExercise('Yes')}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span>Yes</span>
                      </label>
                    </div>
                  </div>

                  {advisedAvoidExercise === 'Yes' && (
                    <div className="pt-2 animate-fadeIn">
                      <input
                        type="text"
                        placeholder="Specify which exercises or movements to avoid (e.g. heavy spinal compression)..."
                        value={avoidExerciseDetails}
                        onChange={(e) => {
                          setAvoidExerciseDetails(e.target.value);
                          if (errors.avoidExerciseDetails) setErrors((prev) => ({ ...prev, avoidExerciseDetails: '' }));
                        }}
                        className={`w-full px-3.5 py-2 bg-white dark:bg-zinc-900 border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none ${
                          errors.avoidExerciseDetails
                            ? 'border-rose-500 ring-1 ring-rose-500/20'
                            : 'border-slate-200 dark:border-zinc-800 focus:border-amber-500'
                        }`}
                      />
                      {errors.avoidExerciseDetails && (
                        <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.avoidExerciseDetails}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Question 3: Major Surgery */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      Have you had any major surgeries?
                    </span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                        <input
                          type="radio"
                          name="hasMajorSurgery"
                          checked={hasMajorSurgery === 'No'}
                          onChange={() => {
                            setHasMajorSurgery('No');
                            setSurgeryDetails('');
                          }}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span>No</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                        <input
                          type="radio"
                          name="hasMajorSurgery"
                          checked={hasMajorSurgery === 'Yes'}
                          onChange={() => setHasMajorSurgery('Yes')}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span>Yes</span>
                      </label>
                    </div>
                  </div>

                  {hasMajorSurgery === 'Yes' && (
                    <div className="pt-2 animate-fadeIn">
                      <input
                        type="text"
                        placeholder="Specify surgery type and year (e.g. ACL reconstruction, 2023)..."
                        value={surgeryDetails}
                        onChange={(e) => {
                          setSurgeryDetails(e.target.value);
                          if (errors.surgeryDetails) setErrors((prev) => ({ ...prev, surgeryDetails: '' }));
                        }}
                        className={`w-full px-3.5 py-2 bg-white dark:bg-zinc-900 border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none ${
                          errors.surgeryDetails
                            ? 'border-rose-500 ring-1 ring-rose-500/20'
                            : 'border-slate-200 dark:border-zinc-800 focus:border-amber-500'
                        }`}
                      />
                      {errors.surgeryDetails && (
                        <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.surgeryDetails}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Fitness Goals & Target Timeline */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-zinc-800 pb-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs">
                    4
                  </span>
                  Fitness Goals & Target Milestones
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Set target weight and timeframe for personalized progress tracking
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Primary Goal
                  </label>
                  <select
                    value={primaryGoal}
                    onChange={(e) => setPrimaryGoal(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Weight Loss & Fat Burn">Weight Loss & Fat Burn</option>
                    <option value="Muscle Building & Hypertrophy">Muscle Building & Hypertrophy</option>
                    <option value="Body Transformation">Body Transformation</option>
                    <option value="Stamina & Endurance">Stamina & Endurance</option>
                    <option value="Strength & Power">Strength & Power</option>
                    <option value="General Fitness & Health">General Fitness & Health</option>
                    <option value="Rehab & Mobility">Rehab & Mobility</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Target Goal Weight (KG)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 68.0"
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-emerald-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Target Timeline
                  </label>
                  <select
                    value={targetTimeline}
                    onChange={(e) => setTargetTimeline(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="1 Month">1 Month</option>
                    <option value="2 Months">2 Months</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="12 Months">12 Months</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-3 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center gap-1.5 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Part 1</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition"
              >
                <span>Review & Finalize</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: REVIEW & FINAL SUBMISSION                                         */}
        {/* ========================================================================= */}
        {activeStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-200 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Review Your Admission & Health Details
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Please verify all information before saving your profile into the CRM
              </p>
            </div>

            {/* Overview Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Part 1 Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Part 1: Contact & Address
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="text-amber-500 hover:underline font-bold"
                  >
                    Edit
                  </button>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">Athlete Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">Mobile & Verification:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    +91 {phone} {isPhoneVerified && <span className="text-emerald-500">✓ Verified</span>}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">Email:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{email}</span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block">Gender:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block">Age:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {calculatedAge !== null ? `${calculatedAge} yrs` : '—'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">Current Address:</span>
                  <span className="font-medium text-slate-700 dark:text-zinc-300">
                    {[houseFlatStreet, localityArea, city, state, pinCode].filter(Boolean).join(', ') || 'Not specified'}
                  </span>
                </div>
                {!isPermanentSame && (
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block">Permanent Address:</span>
                    <span className="font-medium text-slate-700 dark:text-zinc-300">
                      {[permHouseFlatStreet, permLocalityArea, permCity, permState, permPinCode].filter(Boolean).join(', ') || 'Not specified'}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">Referral Channel:</span>
                  <span className="font-bold text-amber-500">
                    {referralSource} {referralDetails && `(${referralDetails})`}
                  </span>
                </div>
              </div>

              {/* Part 2 Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Part 2: Health & Metrics
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="text-amber-500 hover:underline font-bold"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block">Current Weight:</span>
                    <span className="font-black text-slate-900 dark:text-white">{currentWeightKg} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block">Height:</span>
                    <span className="font-black text-slate-900 dark:text-white">{heightCm} cm</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block">Calculated BMI:</span>
                    <span className="font-black text-amber-500">
                      {bmiCalculation ? `${bmiCalculation.val} (${bmiCalculation.category})` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block">Target Weight:</span>
                    <span className="font-black text-emerald-500">
                      {targetWeightKg ? `${targetWeightKg} kg` : 'General Maintenance'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">Primary Fitness Goal:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{primaryGoal}</span>
                </div>

                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">Known Health Conditions:</span>
                  {hasHealthCondition === 'Yes' && selectedConditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedConditions.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        >
                          {c === 'Other' && otherConditionText ? `Other: ${otherConditionText}` : c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-emerald-500 font-bold">None reported (Good health clearance)</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">Medical History:</span>
                  <ul className="list-disc pl-4 text-[11px] text-slate-600 dark:text-zinc-400 space-y-0.5 mt-0.5">
                    <li>
                      Medication: <strong>{isTakingMedication === 'Yes' ? medicationDetails : 'None'}</strong>
                    </li>
                    <li>
                      Exercise Restrictions:{' '}
                      <strong>{advisedAvoidExercise === 'Yes' ? avoidExerciseDetails : 'None'}</strong>
                    </li>
                    <li>
                      Past Surgeries: <strong>{hasMajorSurgery === 'Yes' ? surgeryDetails : 'None'}</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Final Submit Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-5 py-3 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center gap-1.5 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Saving Profile...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save & Complete Onboarding</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

