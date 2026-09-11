import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest, resolveTenantGymId } from '../middleware/auth.middleware.js';
import { emitDeviceStatusChanged } from '../services/socket.service.js';

export async function getDeviceRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { status = 'PENDING' } = req.query;
    const callerGymId = resolveTenantGymId(req);

    const whereClause: any = status ? { status: String(status) } : {};
    if (callerGymId) {
      whereClause.OR = [
        { gymId: callerGymId },
        { user: { OR: [{ gymId: callerGymId }, { facilityId: callerGymId }] } }
      ];
    }

    const requests = await prisma.deviceChangeRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            boundDeviceId: true,
            deviceStatus: true,
            gymId: true
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
    const callerGymId = resolveTenantGymId(req);

    const request = await prisma.deviceChangeRequest.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!request) {
      res.status(404).json({ error: 'Device change request not found.' });
      return;
    }

    if (callerGymId && request.user.gymId && request.user.gymId !== callerGymId) {
      res.status(403).json({ error: 'Access denied to device request from another gym.' });
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
          adminNotes
        }
      })
    ]);

    emitDeviceStatusChanged(request.userId, {
      userId: request.userId,
      deviceStatus: 'NORMAL',
      message: 'Your account clearance has been restored by Front Desk. Enjoy your workout!'
    });

    res.json({
      message: 'Account visit limit cleared. Daily access granted.',
      requestId: id
    });
  } catch (error: any) {
    console.error('approveDeviceRequest error:', error);
    res.status(500).json({ error: 'Failed to approve request.' });
  }
}

export async function rejectDeviceRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user?.userId;
    const callerGymId = resolveTenantGymId(req);

    const request = await prisma.deviceChangeRequest.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!request) {
      res.status(404).json({ error: 'Device change request not found.' });
      return;
    }

    if (callerGymId && request.user.gymId && request.user.gymId !== callerGymId) {
      res.status(403).json({ error: 'Access denied to device request from another gym.' });
      return;
    }

    const updated = await prisma.deviceChangeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        adminNotes
      }
    });

    res.json({
      message: 'Clearance request rejected.',
      request: updated
    });
  } catch (error: any) {
    console.error('rejectDeviceRequest error:', error);
    res.status(500).json({ error: 'Failed to reject request.' });
  }
}
