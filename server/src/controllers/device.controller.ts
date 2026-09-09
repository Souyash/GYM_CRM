import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { emitDeviceStatusChanged } from '../services/socket.service.js';

export async function getDeviceRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { status = 'PENDING' } = req.query;

    const requests = await prisma.deviceChangeRequest.findMany({
      where: status ? { status: String(status) } : undefined,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            boundDeviceId: true,
            deviceStatus: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ requests });
  } catch (error: any) {
    console.error('getDeviceRequests error:', error);
    res.status(500).json({ error: 'Failed to retrieve device requests.' });
  }
}

export async function approveDeviceRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user?.userId;

    const request = await prisma.deviceChangeRequest.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!request) {
      res.status(404).json({ error: 'Device change request not found.' });
      return;
    }

    // Update user profile with new bound device and reset status
    await prisma.$transaction([
      prisma.user.update({
        where: { id: request.userId },
        data: {
          boundDeviceId: request.attemptedDeviceId,
          boundDeviceName: request.attemptedDeviceName,
          deviceStatus: 'NORMAL'
        }
      }),
      prisma.deviceChangeRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedById: adminId,
          reviewedAt: new Date(),
          adminNotes: adminNotes || 'Approved by Super Admin'
        }
      })
    ]);

    // Push instant notification to member
    emitDeviceStatusChanged(request.userId, {
      status: 'APPROVED',
      newDeviceId: request.attemptedDeviceId,
      message: 'Your new device has been approved by the Super Admin! You may now access the gym.'
    });

    console.log(`[Device Security] Super Admin approved device change for user: ${request.user.email}`);

    res.json({
      message: 'Device change request approved successfully. User device binding updated.',
      userId: request.userId,
      newDeviceId: request.attemptedDeviceId
    });
  } catch (error: any) {
    console.error('approveDeviceRequest error:', error);
    res.status(500).json({ error: 'Failed to approve device request.' });
  }
}

export async function rejectDeviceRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user?.userId;

    const request = await prisma.deviceChangeRequest.findUnique({
      where: { id }
    });

    if (!request) {
      res.status(404).json({ error: 'Device change request not found.' });
      return;
    }

    const updated = await prisma.deviceChangeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        adminNotes: adminNotes || 'Rejected by Super Admin'
      }
    });

    emitDeviceStatusChanged(request.userId, {
      status: 'REJECTED',
      message: 'Your device change request was rejected. Access remains locked.'
    });

    res.json({
      message: 'Device change request rejected.',
      request: updated
    });
  } catch (error: any) {
    console.error('rejectDeviceRequest error:', error);
    res.status(500).json({ error: 'Failed to reject device request.' });
  }
}

