import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest, resolveTenantGymId } from '../middleware/auth.middleware.js';

export async function getFailedLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { attemptType, facilityId, gymId, page = 1, limit = 20 } = req.query;
    const callerGymId = resolveTenantGymId(req) || (gymId ? String(gymId) : null);

    const whereClause: any = {};
    if (callerGymId) {
      whereClause.OR = [{ gymId: callerGymId }, { facilityId: callerGymId }];
    }
    if (attemptType) whereClause.attemptType = String(attemptType);
    if (facilityId && !callerGymId) whereClause.facilityId = String(facilityId);

    const skip = (Number(page) - 1) * Number(limit);

    const [total, logs] = await Promise.all([
      prisma.failedAccessLog.count({ where: whereClause }),
      prisma.failedAccessLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              boundDeviceId: true
            }
          },
          gym: {
            select: {
              id: true,
              name: true,
              address: true
            }
          },
          facility: {
            select: {
              id: true,
              name: true,
              address: true
            }
          },
          notificationLogs: true
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: Number(limit)
      })
    ]);

    res.json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      logs
    });
  } catch (error: any) {
    console.error('getFailedLogs error:', error);
    res.status(500).json({ error: 'Failed to fetch failed access logs.' });
  }
}

export async function getThreatStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const callerGymId = resolveTenantGymId(req);
    const whereClause: any = {};
    if (callerGymId) {
      whereClause.OR = [{ gymId: callerGymId }, { facilityId: callerGymId }];
    }

    const logs = await prisma.failedAccessLog.findMany({
      where: whereClause,
      select: {
        attemptType: true,
        isAlertDismissed: true,
        timestamp: true
      }
    });

    const stats = {
      totalThreats: logs.length,
      activeAlerts: logs.filter(l => !l.isAlertDismissed).length,
      byType: {
        GPS_GEOFENCE_BREACH: logs.filter(l => l.attemptType === 'GPS_GEOFENCE_BREACH').length,
        EXPIRED_MEMBERSHIP: logs.filter(l => l.attemptType === 'EXPIRED_MEMBERSHIP').length,
        MULTI_DEVICE_BLOCKED: logs.filter(l => l.attemptType === 'MULTI_DEVICE_BLOCKED').length,
        ANTI_PASSBACK_LOCKED: logs.filter(l => l.attemptType === 'ANTI_PASSBACK_LOCKED').length,
        UNVERIFIED_SCAN: logs.filter(l => l.attemptType === 'UNVERIFIED_SCAN').length
      }
    };

    res.json({ stats });
  } catch (error: any) {
    console.error('getThreatStats error:', error);
    res.status(500).json({ error: 'Failed to compute threat statistics.' });
  }
}

export async function dismissAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const callerGymId = resolveTenantGymId(req);

    const log = await prisma.failedAccessLog.findUnique({ where: { id } });
    if (!log) {
      res.status(404).json({ error: 'Log entry not found.' });
      return;
    }

    if (callerGymId && log.gymId && log.gymId !== callerGymId) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const updated = await prisma.failedAccessLog.update({
      where: { id },
      data: { isAlertDismissed: true }
    });

    res.json({
      message: 'Security alert dismissed successfully.',
      log: updated
    });
  } catch (error: any) {
    console.error('dismissAlert error:', error);
    res.status(500).json({ error: 'Failed to dismiss security alert.' });
  }
}
