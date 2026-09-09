import { GeoCoordinates } from '../types/index.js';

/**
 * Calculates great-circle distance between two geographic coordinates using the Haversine formula.
 * @returns Distance in meters
 */
export function calculateHaversineDistanceMeters(
  point1: GeoCoordinates,
  point2: GeoCoordinates
): number {
  const EARTH_RADIUS_METERS = 6371000; // 6,371 km in meters

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLng = toRadians(point2.longitude - point1.longitude);

  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c * 10) / 10; // Rounded to 1 decimal place
}

/**
 * Validates if the given coordinates fall within the facility's geofence boundary (default 50m).
 */
export function isWithinGeofence(
  deviceCoords: GeoCoordinates,
  facilityCoords: GeoCoordinates,
  geofenceRadiusMeters: number = 50.0
): { withinGeofence: boolean; distanceMeters: number } {
  const distanceMeters = calculateHaversineDistanceMeters(deviceCoords, facilityCoords);
  return {
    withinGeofence: distanceMeters <= geofenceRadiusMeters,
    distanceMeters
  };
}

