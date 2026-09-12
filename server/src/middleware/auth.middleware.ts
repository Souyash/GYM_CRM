import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { JwtPayload, UserRole } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gym_super_secure_jwt_secret_key_2026_dev';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  deviceId?: string;
  targetGymId?: string;
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access denied. Missing or invalid Authorization token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function optionalAuthenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
  } catch (error) {
    // Ignore invalid token for optional auth
  }
  next();
}

/**
 * Role checking with compatibility aliases:
 * GYM_OWNER and MANAGER are treated interchangeably.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  const expandedRoles = new Set<UserRole>(allowedRoles);
  if (expandedRoles.has('GYM_OWNER')) expandedRoles.add('MANAGER');
  if (expandedRoles.has('MANAGER')) expandedRoles.add('GYM_OWNER');

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!expandedRoles.has(req.user.role)) {
      res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' is not authorized for this operation.`
      });
      return;
    }

    next();
  };
}

/**
 * Resolves the tenant gymId for the request:
 * - Super Admin can query a specific gym via query parameter or header, or view all (returns null for all).
 * - Gym Owner / Manager / Member is strictly constrained to their own gymId.
 */
export function resolveTenantGymId(req: AuthenticatedRequest): string | null {
  if (!req.user) return null;

  if (req.user.role === 'SUPER_ADMIN') {
    const override = (req.query.gymId as string) || (req.headers['x-gym-id'] as string);
    return override ? override.trim() : null;
  }

  return req.user.gymId || req.user.facilityId || null;
}

/**
 * Enforces that the non-super-admin user has an active gymId.
 */
export function requireTenantGym(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  const gymId = req.user.gymId || req.user.facilityId;
  if (!gymId) {
    res.status(403).json({ error: 'Tenant gym not found for this user account. Please contact support.' });
    return;
  }

  req.targetGymId = gymId;
  next();
}

/**
 * Safely resolves a valid Facility ID to prevent Foreign Key constraint violations.
 * If gymId is provided, looks up if a facility exists with that ID, or associated with that gymId.
 * If no facility exists, returns null (since facilityId is optional in the schema).
 */
export async function resolveFacilityId(gymIdOrFacilityId?: string | null): Promise<string | null> {
  if (!gymIdOrFacilityId) return null;
  const cleanId = gymIdOrFacilityId.trim();
  if (!cleanId) return null;

  try {
    const directFacility = await prisma.facility.findUnique({
      where: { id: cleanId },
      select: { id: true }
    });
    if (directFacility) return directFacility.id;

    const gymFacility = await prisma.facility.findFirst({
      where: { gymId: cleanId },
      select: { id: true }
    });
    if (gymFacility) return gymFacility.id;

    // Auto-mirror Gym to Facility if it exists in Gym table
    const gym = await prisma.gym.findUnique({ where: { id: cleanId } });
    if (gym) {
      const created = await prisma.facility.create({
        data: {
          id: gym.id,
          gymId: gym.id,
          name: gym.name,
          address: gym.address,
          latitude: gym.latitude,
          longitude: gym.longitude,
          geofenceRadiusMeters: gym.geofenceRadiusMeters,
          staticQrCodeHash: gym.staticQrCodeHash,
          exitQrCodeHash: gym.exitQrCodeHash,
          ownerContactEmail: gym.ownerContactEmail || 'owner@gym.com',
          ownerContactPhone: gym.ownerContactPhone || ''
        }
      });
      return created.id;
    }

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Safely validates deskBilledById to ensure foreign key constraint is satisfied.
 */
export async function resolveValidBilledById(userId?: string | null): Promise<string | null> {
  if (!userId) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId.trim() },
      select: { id: true }
    });
    return user ? user.id : null;
  } catch {
    return null;
  }
}
