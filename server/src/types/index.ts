export type UserRole = 'SUPER_ADMIN' | 'GYM_OWNER' | 'MANAGER' | 'MEMBER';

export type DeviceStatus = 'NORMAL' | 'FLAGGED_MULTI_DEVICE';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING_PAYMENT';

export type AttemptType =
  | 'UNVERIFIED_SCAN'
  | 'EXPIRED_MEMBERSHIP'
  | 'GPS_GEOFENCE_BREACH'
  | 'MULTI_DEVICE_BLOCKED'
  | 'ANTI_PASSBACK_LOCKED';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  gymId?: string | null;
  facilityId?: string | null;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface GymDetails {
  id: string;
  name: string;
  slug?: string | null;
  inviteCode: string;
  address: string;
  city?: string | null;
  state?: string | null;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  staticQrCodeHash: string;
  exitQrCodeHash?: string | null;
  ownerContactEmail?: string | null;
  ownerContactPhone?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
}
