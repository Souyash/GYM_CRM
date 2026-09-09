import { Response } from 'express';
import QRCode from 'qrcode';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export async function getFacilities(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const facilities = await prisma.facility.findMany({
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

