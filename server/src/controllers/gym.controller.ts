import { Response } from 'express';
import QRCode from 'qrcode';
import crypto from 'crypto';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest, resolveTenantGymId } from '../middleware/auth.middleware.js';

/**
 * Public endpoint: Lookup a gym by its 6-digit invite access code or slug
 * Used by members during "Join Your Gym" registration.
 */
export async function lookupGymByCode(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { code } = req.params;
    if (!code || !code.trim()) {
      res.status(400).json({ error: 'Gym access code is required.' });
      return;
    }

    const cleanCode = code.trim().toUpperCase();

    const gym = await prisma.gym.findFirst({
      where: {
        OR: [
          { inviteCode: cleanCode },
          { slug: cleanCode.toLowerCase() },
          { id: cleanCode }
        ],
        isActive: true
      },
      select: {
        id: true,
        name: true,
        inviteCode: true,
        address: true,
        city: true,
        state: true,
        logoUrl: true,
        staticQrCodeHash: true
      }
    });

    if (!gym) {
      res.status(404).json({
        error: `No gym found with access code '${cleanCode}'. Please verify the 6-digit code with your gym front desk.`
      });
      return;
    }

    res.json({
      success: true,
      gym
    });
  } catch (error: any) {
    console.error('lookupGymByCode error:', error);
    res.status(500).json({ error: 'Failed to look up gym details.' });
  }
}

/**
 * Super Admin: Get all registered gyms on the SaaS platform
 */
export async function getAllGyms(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const gyms = await prisma.gym.findMany({
      include: {
        _count: {
          select: {
            users: true,
            subscriptions: true,
            attendanceEntries: true,
            failedAccessLogs: true,
            healthProfiles: true
          }
        },
        users: {
          where: {
            role: { in: ['GYM_OWNER', 'MANAGER', 'SUPER_ADMIN'] }
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true
          },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enriched SaaS stats
    const enriched = gyms.map(g => {
      const primaryOwner = g.users[0] || null;
      const ownerName = primaryOwner?.fullName || 'Gym Owner';
      const ownerEmail = primaryOwner?.email || g.ownerContactEmail || 'N/A';
      const ownerPhone = primaryOwner?.phone || g.ownerContactPhone || 'N/A';

      return {
        id: g.id,
        name: g.name,
        slug: g.slug,
        inviteCode: g.inviteCode,
        address: g.address,
        city: g.city || '',
        state: g.state || '',
        isActive: g.isActive,
        createdAt: g.createdAt,
        ownerName,
        ownerEmail,
        ownerPhone,
        owner: primaryOwner ? {
          ...primaryOwner,
          fullName: ownerName,
          email: ownerEmail,
          phone: ownerPhone
        } : {
          id: '',
          fullName: ownerName,
          email: ownerEmail,
          phone: ownerPhone,
          role: 'GYM_OWNER'
        },
        counts: {
          totalUsers: g._count.users,
          subscriptions: g._count.subscriptions,
          attendanceTotal: g._count.attendanceEntries,
          healthProfiles: g._count.healthProfiles
        }
      };
    });

    res.json({
      count: enriched.length,
      gyms: enriched
    });
  } catch (error: any) {
    console.error('getAllGyms error:', error);
    res.status(500).json({ error: 'Failed to fetch gyms list.' });
  }
}

/**
 * Get current user's gym details
 */
export async function getMyGym(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const gymId = resolveTenantGymId(req);
    if (!gymId) {
      res.status(404).json({ error: 'No gym assigned to this user.' });
      return;
    }

    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
      include: {
        _count: {
          select: {
            users: true,
            subscriptions: true,
            attendanceEntries: true,
            healthProfiles: true
          }
        }
      }
    });

    if (!gym) {
      res.status(404).json({ error: 'Gym workspace not found.' });
      return;
    }

    // Generate static entrance QR
    const qrPayload = JSON.stringify({
      type: 'GYM_FACILITY_ACCESS',
      gym_id: gym.id,
      hash: gym.staticQrCodeHash,
      facility_name: gym.name
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400
    });

    res.json({
      gym,
      qr: {
        payload: qrPayload,
        dataUrl: qrDataUrl,
        gym_id: gym.id,
        hash: gym.staticQrCodeHash
      }
    });
  } catch (error: any) {
    console.error('getMyGym error:', error);
    res.status(500).json({ error: 'Failed to retrieve gym details.' });
  }
}

/**
 * Get specific gym by ID
 */
export async function getGymById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const callerGymId = resolveTenantGymId(req);

    // If not super admin, must match caller's gymId
    if (req.user?.role !== 'SUPER_ADMIN' && callerGymId !== id) {
      res.status(403).json({ error: 'Access denied to this gym workspace.' });
      return;
    }

    const gym = await prisma.gym.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            attendanceEntries: true,
            healthProfiles: true
          }
        }
      }
    });

    if (!gym) {
      res.status(404).json({ error: 'Gym not found.' });
      return;
    }

    const qrPayload = JSON.stringify({
      type: 'GYM_FACILITY_ACCESS',
      gym_id: gym.id,
      hash: gym.staticQrCodeHash,
      facility_name: gym.name
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400
    });

    res.json({
      gym,
      qr: {
        payload: qrPayload,
        dataUrl: qrDataUrl,
        gym_id: gym.id,
        hash: gym.staticQrCodeHash
      }
    });
  } catch (error: any) {
    console.error('getGymById error:', error);
    res.status(500).json({ error: 'Failed to fetch gym details.' });
  }
}

/**
 * Update gym information or geofence
 */
export async function updateGym(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const callerGymId = resolveTenantGymId(req);
    const targetId = (id === 'me' && callerGymId) ? callerGymId : id;

    if (req.user?.role !== 'SUPER_ADMIN' && callerGymId !== targetId) {
      res.status(403).json({ error: 'Access denied. You can only update your own gym.' });
      return;
    }

    const {
      name,
      address,
      city,
      state,
      latitude,
      longitude,
      geofenceRadiusMeters,
      ownerContactEmail,
      ownerContactPhone
    } = req.body;

    const updated = await prisma.gym.update({
      where: { id: targetId },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(address ? { address: String(address).trim() } : {}),
        ...(city !== undefined ? { city: city ? String(city).trim() : null } : {}),
        ...(state !== undefined ? { state: state ? String(state).trim() : null } : {}),
        ...(latitude !== undefined ? { latitude: parseFloat(latitude) } : {}),
        ...(longitude !== undefined ? { longitude: parseFloat(longitude) } : {}),
        ...(geofenceRadiusMeters !== undefined ? { geofenceRadiusMeters: parseFloat(geofenceRadiusMeters) } : {}),
        ...(ownerContactEmail !== undefined ? { ownerContactEmail: String(ownerContactEmail).trim() } : {}),
        ...(ownerContactPhone !== undefined ? { ownerContactPhone: String(ownerContactPhone).trim() } : {})
      }
    });

    // Mirror updates to prisma.facility to guarantee turnstile scanning matches
    try {
      await prisma.facility.upsert({
        where: { id: updated.id },
        update: {
          name: updated.name,
          address: updated.address,
          latitude: updated.latitude,
          longitude: updated.longitude,
          geofenceRadiusMeters: updated.geofenceRadiusMeters,
          staticQrCodeHash: updated.staticQrCodeHash,
          exitQrCodeHash: updated.exitQrCodeHash
        },
        create: {
          id: updated.id,
          gymId: updated.id,
          name: updated.name,
          address: updated.address,
          latitude: updated.latitude,
          longitude: updated.longitude,
          geofenceRadiusMeters: updated.geofenceRadiusMeters,
          staticQrCodeHash: updated.staticQrCodeHash,
          exitQrCodeHash: updated.exitQrCodeHash,
          ownerContactEmail: updated.ownerContactEmail || 'owner@gym.com',
          ownerContactPhone: updated.ownerContactPhone || ''
        }
      });
    } catch (facilityErr) {
      console.warn('[Facility Mirror] Note updating facility table:', facilityErr);
    }

    res.json({
      success: true,
      message: 'Gym settings updated successfully.',
      gym: updated
    });
  } catch (error: any) {
    console.error('updateGym error:', error);
    res.status(500).json({ error: 'Failed to update gym details.' });
  }
}

