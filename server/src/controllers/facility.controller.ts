import { Response } from 'express';
import QRCode from 'qrcode';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest, resolveTenantGymId } from '../middleware/auth.middleware.js';

export async function getFacilities(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const callerGymId = resolveTenantGymId(req);
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    // 1. Fetch all gyms in the system
    const gyms = await prisma.gym.findMany();

    // 2. Synchronize all Gyms into Facility table ensuring unique entrance and exit hashes
    for (const gym of gyms) {
      let needsGymUpdate = false;
      const cleanName = (gym.name || 'GYM').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      let staticQrCodeHash = gym.staticQrCodeHash;
      let exitQrCodeHash = gym.exitQrCodeHash;

      if (!staticQrCodeHash) {
        staticQrCodeHash = `GYM_${cleanName}_STATIC_${gym.id.replace(/-/g, '').slice(-8)}`;
        needsGymUpdate = true;
      }
      if (!exitQrCodeHash || exitQrCodeHash === 'FACILITY_IV_APEX_DOWNTOWN_EXIT_2026') {
        exitQrCodeHash = `GYM_${cleanName}_EXIT_${gym.id.replace(/-/g, '').slice(-8)}`;
        needsGymUpdate = true;
      }

      if (needsGymUpdate) {
        await prisma.gym.update({
          where: { id: gym.id },
          data: { staticQrCodeHash, exitQrCodeHash }
        }).catch(() => {});
        gym.staticQrCodeHash = staticQrCodeHash;
        gym.exitQrCodeHash = exitQrCodeHash;
      }

      await prisma.facility.upsert({
        where: { id: gym.id },
        update: {
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
        },
        create: {
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
      }).catch(() => {});
    }

    // 3. Query facilities, strictly scoped by tenant if user is not Super Admin
    const facilities = await prisma.facility.findMany({
      where: (!isSuperAdmin && callerGymId) ? {
        OR: [
          { id: callerGymId },
          { gymId: callerGymId }
        ]
      } : undefined,
      include: {
        _count: {
          select: {
            users: true,
            attendanceEntries: true,
            failedAccessLogs: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ facilities });
  } catch (error: any) {
    console.error('getFacilities error:', error);
    res.status(500).json({ error: 'Failed to fetch facilities.' });
  }
}

export async function getFacilityById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            attendanceEntries: true,
            failedAccessLogs: true
          }
        }
      }
    });

    if (!facility) {
      res.status(404).json({ error: 'Facility not found.' });
      return;
    }

    // Generate static QR code Data URL containing the unchanging gym_id
    const qrPayload = JSON.stringify({
      type: 'GYM_FACILITY_ACCESS',
      gym_id: facility.id,
      hash: facility.staticQrCodeHash,
      facility_name: facility.name
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400
    });

    res.json({
      facility,
      qr: {
        payload: qrPayload,
        dataUrl: qrDataUrl,
        gym_id: facility.id,
        hash: facility.staticQrCodeHash
      }
    });
  } catch (error: any) {
    console.error('getFacilityById error:', error);
    res.status(500).json({ error: 'Failed to fetch facility details.' });
  }
}

export async function updateGeofence(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { latitude, longitude, geofenceRadiusMeters } = req.body;

    const updated = await prisma.facility.update({
      where: { id },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        geofenceRadiusMeters: geofenceRadiusMeters ? parseFloat(geofenceRadiusMeters) : 50.0
      }
    });

    res.json({
      message: 'Facility geofence configuration updated successfully.',
      facility: updated
    });
  } catch (error: any) {
    console.error('updateGeofence error:', error);
    res.status(500).json({ error: 'Failed to update geofence.' });
  }
}

