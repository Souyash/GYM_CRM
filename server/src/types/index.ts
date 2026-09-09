export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'MEMBER';

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
  facilityId?: string | null;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

