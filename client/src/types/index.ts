export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'MEMBER';
export type DeviceStatus = 'NORMAL' | 'FLAGGED_MULTI_DEVICE';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING_PAYMENT';
export type AttemptType =
  | 'UNVERIFIED_SCAN'
  | 'EXPIRED_MEMBERSHIP'
  | 'GPS_GEOFENCE_BREACH'
  | 'MULTI_DEVICE_BLOCKED'
  | 'ANTI_PASSBACK_LOCKED';

export interface Facility {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  staticQrCodeHash: string;
  exitQrCodeHash?: string;
  ownerContactEmail: string;
  ownerContactPhone: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planName: string;
  price: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  paymentMethod: string;
  deskBilledById?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  facilityId?: string;
  facility?: Facility;
  boundDeviceId?: string;
  boundDeviceName?: string;
  deviceStatus: DeviceStatus;
  avatarUrl?: string;
  subscriptions?: Subscription[];
  healthProfile?: MemberHealthProfile;
}

export interface LiveAttendanceEntry {
  entryId: string;
  userId: string;
  memberName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  facilityName: string;
  planName: string;
  subscriptionExpiry: string;
  scannedAt: string;
  distanceMeters: number;
  cooldownExpiresAt: string;
}

export interface FailedAccessLog {
  id: string;
  timestamp: string;
  userId?: string;
  user?: {
    fullName: string;
    email: string;
    boundDeviceId?: string;
  };
  facilityId?: string;
  facility?: {
    name: string;
  };
  attemptedDeviceId?: string;
  attemptType: AttemptType;
  failureReason: string;
  distanceMeters?: number;
  gpsLat?: number;
  gpsLng?: number;
  isAlertDismissed: boolean;
}

export interface DeviceChangeRequest {
  id: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    boundDeviceId?: string;
    deviceStatus: DeviceStatus;
  };
  currentDeviceId?: string;
  attemptedDeviceId: string;
  attemptedDeviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: {
    fullName: string;
  };
  reviewedAt?: string;
  adminNotes?: string;
  createdAt: string;
}

export interface ThreatStats {
  totalThreats: number;
  activeAlerts: number;
  byType: {
    GPS_GEOFENCE_BREACH: number;
    EXPIRED_MEMBERSHIP: number;
    MULTI_DEVICE_BLOCKED: number;
    ANTI_PASSBACK_LOCKED: number;
    UNVERIFIED_SCAN: number;
  };
}

export interface MemberHealthProfile {
  id: string;
  userId: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  profilePhoto?: string;
  houseFlatStreet?: string;
  localityArea?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  isPermanentSame: boolean;
  permanentAddress?: string;
  referralSource?: string;
  referralDetails?: string;
  currentWeightKg?: number;
  heightCm?: number;
  bmi?: number;
  bodyFatPercentage?: number;
  muscleMassKg?: number;
  waistCm?: number;
  chestCm?: number;
  hipCm?: number;
  hasHealthCondition: boolean;
  healthConditions?: string; // JSON string or comma-separated
  otherConditionText?: string;
  isTakingMedication: boolean;
  medicationDetails?: string;
  advisedAvoidExercise: boolean;
  avoidExerciseDetails?: string;
  hasMajorSurgery: boolean;
  surgeryDetails?: string;
  hasGymInjury: boolean;
  injuryDetails?: string;
  primaryGoal?: string;
  specificGoal?: string;
  targetWeightKg?: number;
  targetTimeline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthIntelligenceSummary {
  totalProfiles: number;
  totalMembers: number;
  onboardingCompletionRate: number;
  averageBmi: number | null;
  averageAge: number | null;
  medicalAlertCount: number;
  goalsBreakdown: { goal: string; count: number; percentage: number }[];
  referralBreakdown: { source: string; count: number; percentage: number }[];
  conditionsBreakdown: { condition: string; count: number; percentage: number }[];
  bmiBuckets: {
    underweight: number;
    normal: number;
    overweight: number;
    obese: number;
  };
  ageBuckets: {
    under20: number;
    '20-29': number;
    '30-39': number;
    '40-49': number;
    '50+': number;
  };
  genderMap: Record<string, number>;
}

export interface HealthMemberRecord {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  joinedAt: string;
  avatarUrl?: string;
  subscription?: Subscription;
  healthProfile?: MemberHealthProfile;
}


