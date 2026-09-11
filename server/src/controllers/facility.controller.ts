import { Response } from 'express';
import QRCode from 'qrcode';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export async function getFacilities(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    let facilities = await prisma.facility.findMany({
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

    // If no legacy facilities, check Gyms table
    if (facilities.length === 0) {
      const gyms = await prisma.gym.findMany();
      if (gyms.length > 0) {
        facilities = gyms.map((g) => ({
          id: g.id,
          gymId: g.id,
          name: g.name,
          address: g.address,
          latitude: g.latitude,
          longitude: g.longitude,
          geofenceRadiusMeters: g.geofenceRadiusMeters,
          staticQrCodeHash: g.staticQrCodeHash,
          exitQrCodeHash: g.exitQrCodeHash || 'FACILITY_IV_APEX_DOWNTOWN_EXIT_2026',
          ownerContactEmail: g.ownerContactEmail || 'support@ironvault.com',
          ownerContactPhone: g.ownerContactPhone || '+1-555-019-8800',
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
          _count: { users: 0, attendanceEntries: 0, failedAccessLogs: 0 }
        })) as any;
      } else {
        // Auto-provision the flagship gym & facility so platform always has working QR turnstiles
        const flagshipGym = await prisma.gym.create({
          data: {
            name: 'IronVault Flagship Performance Club',
            slug: 'ironvault-flagship',
            inviteCode: '100001',
            address: '100 IronVault Boulevard, Sector 4',
            city: 'Metropolis',
            state: 'NY',
            latitude: 28.5355,
            longitude: 77.3910,
            geofenceRadiusMeters: 100.0,
            staticQrCodeHash: 'FACILITY_IV_APEX_DOWNTOWN_STATIC_2026',
            exitQrCodeHash: 'FACILITY_IV_APEX_DOWNTOWN_EXIT_2026',
            ownerContactEmail: 'contact@ironvault.com',
            ownerContactPhone: '+1-555-019-8800'
          }
        });

        const flagshipFac = await prisma.facility.create({
          data: {
            id: flagshipGym.id,
            gymId: flagshipGym.id,
            name: flagshipGym.name,
            address: flagshipGym.address,
            latitude: flagshipGym.latitude,
            longitude: flagshipGym.longitude,
            geofenceRadiusMeters: flagshipGym.geofenceRadiusMeters,
            staticQrCodeHash: flagshipGym.staticQrCodeHash,
            exitQrCodeHash: flagshipGym.exitQrCodeHash,
            ownerContactEmail: flagshipGym.ownerContactEmail || 'contact@ironvault.com',
            ownerContactPhone: flagshipGym.ownerContactPhone || '+1-555-019-8800'
          }
        });

        facilities = [{
          ...flagshipFac,
          _count: { users: 0, attendanceEntries: 0, failedAccessLogs: 0 }
        }] as any;
      }
    }

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

