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

