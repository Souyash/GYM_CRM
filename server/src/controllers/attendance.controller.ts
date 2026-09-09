import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { emitMemberExited } from '../services/socket.service.js';

export async function getLiveAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [entriesToday, totalAllTime] = await Promise.all([
      prisma.attendanceEntry.findMany({
        where: {
          scannedAt: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              subscriptions: {
                orderBy: { endDate: 'desc' },
                take: 1
              }
            }
          },
          facility: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { scannedAt: 'desc' }
      }),
      prisma.attendanceEntry.count()
    ]);

    const now = Date.now();

    // Auto-checkout safety: If an active session is > 4 hours old, mark it as AUTO_CLOSED
    for (const entry of entriesToday) {
      if ((entry.status === 'ACTIVE' || !entry.exitedAt) && (now - entry.scannedAt.getTime() > 4 * 60 * 60 * 1000)) {
        const autoExitTime = new Date(entry.scannedAt.getTime() + 120 * 60 * 1000); // capped at 120 mins
        await prisma.attendanceEntry.update({
          where: { id: entry.id },
          data: {
            exitedAt: autoExitTime,
            sessionDurationMinutes: 120,
            status: 'AUTO_CLOSED',
            exitDeviceId: 'SYSTEM_AUTO_TIMEOUT'
          }
        });
        entry.status = 'AUTO_CLOSED';
        entry.exitedAt = autoExitTime;
        entry.sessionDurationMinutes = 120;
      }
    }

    // Active members currently on gym floor
    const activeOnFloor = entriesToday
      .filter(e => e.status === 'ACTIVE' && !e.exitedAt)
      .map(e => {
        const elapsedMinutes = Math.max(1, Math.round((now - e.scannedAt.getTime()) / (60 * 1000)));
        return {
          ...e,
          elapsedMinutes
        };
      });

    // Members who finished and checked out today
    const departedToday = entriesToday.filter(e => e.exitedAt !== null);

    res.json({
      todayCount: entriesToday.length,
      estimatedActiveOccupancy: activeOnFloor.length,
      activeCount: activeOnFloor.length,
      departedCount: departedToday.length,
      totalAllTime,
      activeOnFloor,
      departedToday,
      entries: entriesToday
    });
  } catch (error: any) {
    console.error('getLiveAttendance error:', error);
    res.status(500).json({ error: 'Failed to fetch live attendance.' });
  }
}

/**
 * Front desk staff manual check-out for a member who forgot to scan out
 */
export async function manualDeskCheckout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const deskStaffName = req.user?.email || 'Front Desk Staff';

    const entry = await prisma.attendanceEntry.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        facility: { select: { id: true, name: true } }
      }
    });

    if (!entry) {
      res.status(404).json({ error: 'Attendance record not found.' });
      return;
    }

    if (entry.exitedAt || entry.status === 'COMPLETED') {
      res.status(400).json({ error: 'This member has already checked out.' });
      return;
    }

    const now = new Date();
    const durationMinutes = Math.max(1, Math.round((now.getTime() - entry.scannedAt.getTime()) / (60 * 1000)));

    const updated = await prisma.attendanceEntry.update({
      where: { id },
      data: {
        exitedAt: now,
        sessionDurationMinutes: durationMinutes,
        status: 'COMPLETED',
        exitDeviceId: `DESK_MANUAL:${deskStaffName}`
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        facility: { select: { id: true, name: true } }
      }
    });

    const exitPayload = {
      entryId: updated.id,
      userId: updated.userId,
      memberName: updated.user.fullName,
      email: updated.user.email,
      avatarUrl: updated.user.avatarUrl,
      facilityName: updated.facility.name,
      scannedAt: updated.scannedAt,
      exitedAt: updated.exitedAt,
      durationMinutes,
      status: 'COMPLETED',
      manualCheckoutBy: deskStaffName
    };

    emitMemberExited(exitPayload);

    console.log(`[Desk Checkout] ${deskStaffName} checked out ${updated.user.fullName} (${durationMinutes} mins)`);

    res.json({
      success: true,
      message: `${updated.user.fullName} successfully checked out from gym floor (${durationMinutes}m session).`,
      entry: updated
    });
  } catch (error: any) {
    console.error('manualDeskCheckout error:', error);
    res.status(500).json({ error: 'Failed to process desk check-out.' });
  }
}

export async function getMyAttendanceHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const history = await prisma.attendanceEntry.findMany({
      where: { userId },
      include: {
        facility: {
          select: {
            name: true,
            address: true
          }
        }
      },
      orderBy: { scannedAt: 'desc' },
      take: 25
    });

    res.json({ history });
  } catch (error: any) {
    console.error('getMyAttendanceHistory error:', error);
    res.status(500).json({ error: 'Failed to fetch personal attendance history.' });
  }
}

