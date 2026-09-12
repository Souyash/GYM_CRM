import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { isWithinGeofence } from '../services/geo.service.js';
import {
  emitNewAttendance,
  emitMemberExited,
  emitFailedAccessAlert,
  emitMultiDeviceAlert
} from '../services/socket.service.js';
import { dispatchThreatAlerts } from '../services/notification.service.js';
import { sendTurnstileScanEmail } from '../services/email.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gym_super_secure_jwt_secret_key_2026_dev';
const ANTI_PASSBACK_COOLDOWN_MINUTES = 3; // 3 to 5 minutes mandatory cooldown

export async function processEntryScan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const timestamp = new Date();
  const userId = req.user?.userId;
  const { gym_id, latitude, longitude, device_id, action } = req.body;
  const incomingDeviceId = (req.deviceId || device_id || req.headers['x-device-id'] || '').toString().trim();

  // Retrieve member profile
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            orderBy: { endDate: 'desc' },
            take: 1
          }
        }
      })
    : null;

  const memberName = user ? user.fullName : 'Unregistered User';

  // ---------------------------------------------------------------------------------
  // 0. Static Facility QR Verification: Ensure gym_id points to a registered facility
  // ---------------------------------------------------------------------------------
  if (!gym_id) {
    const failedLog = await prisma.failedAccessLog.create({
      data: {
        userId: userId || null,
        attemptedDeviceId: incomingDeviceId || null,
        attemptType: 'UNVERIFIED_SCAN',
        failureReason: 'Missing facility QR token or gym_id in scan payload.',
        payloadDetails: JSON.stringify(req.body)
      }
    });

    emitFailedAccessAlert({
      id: failedLog.id,
      attemptType: 'UNVERIFIED_SCAN',
      memberName,
      reason: failedLog.failureReason,
      timestamp
    });

    res.status(400).json({ error: 'Invalid QR Code. No facility identified.' });
    return;
  }

  let facility = await prisma.facility.findFirst({
    where: {
      OR: [
        { id: gym_id },
        { staticQrCodeHash: gym_id },
        { exitQrCodeHash: gym_id },
        { name: { contains: gym_id } }
      ]
    }
  });

  // If not found in legacy Facility table, look up in modern Gym table!
  if (!facility) {
    const gym = await prisma.gym.findFirst({
      where: {
        OR: [
          { id: gym_id },
          { staticQrCodeHash: gym_id },
          { exitQrCodeHash: gym_id },
          { inviteCode: gym_id },
          { name: { contains: gym_id } }
        ]
      }
    });

    if (gym) {
      facility = await prisma.facility.upsert({
        where: { id: gym.id },
        update: {
          name: gym.name,
          address: gym.address,
          latitude: gym.latitude,
          longitude: gym.longitude,
          geofenceRadiusMeters: gym.geofenceRadiusMeters,
          staticQrCodeHash: gym.staticQrCodeHash,
          exitQrCodeHash: gym.exitQrCodeHash
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
      });
    }
  }

  if (!facility) {
    const failedLog = await prisma.failedAccessLog.create({
      data: {
        userId: userId || null,
        attemptedDeviceId: incomingDeviceId || null,
        attemptType: 'UNVERIFIED_SCAN',
        failureReason: `Unrecognized Turnstile QR Code. Scanned code does not belong to any authorized gate.`,
        payloadDetails: JSON.stringify(req.body)
      }
    });

    emitFailedAccessAlert({
      id: failedLog.id,
      attemptType: 'UNVERIFIED_SCAN',
      memberName,
      reason: failedLog.failureReason,
      timestamp
    });

    res.status(400).json({ error: 'Invalid Gate QR Code. Please scan the official Gym Entrance or Exit Turnstile poster.' });
    return;
  }

  // ---------------------------------------------------------------------------------
  // 0. Gate QR Identification & Direction Verification
  // ---------------------------------------------------------------------------------
  const isExitToken = gym_id === facility.exitQrCodeHash || (typeof gym_id === 'string' && gym_id.includes('EXIT'));

  // If scanning exit QR or action is explicitly EXIT:
  if (action === 'EXIT' || isExitToken) {
    // Check if user has an active in-gym workout session
    const activeEntry = user ? await prisma.attendanceEntry.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        exitedAt: null
      }
    }) : null;

    if (activeEntry) {
      // Member is inside the gym and scanned the Exit Gate poster: route to checkout
      return processExitScan(req, res);
    }

    // No active workout found: cannot exit
    if (isExitToken && action !== 'EXIT') {
      res.status(400).json({
        error: 'Gate Mismatch: You scanned the Exit Gate poster, but you are not currently checked into the gym. Please scan the Entrance Gate turnstile poster to check in.',
        gateMismatch: true,
        expectedGate: 'ENTRANCE',
        scannedGate: 'EXIT'
      });
      return;
    }

    return processExitScan(req, res);
  }

  // Determine client coordinates (falls back to facility coordinates on web/laptop testing)
  const clientLat = !isNaN(parseFloat(latitude)) ? parseFloat(latitude) : facility.latitude;
  const clientLng = !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : facility.longitude;

  // Check if gym has a valid configured physical location (not default 0,0)
  const isGymLocationConfigured = !(facility.latitude === 0 && facility.longitude === 0);

  let withinGeofence = true;
  let distanceMeters = 0;
  let geoValidation = { withinGeofence: true, distanceMeters: 0 };

  if (isGymLocationConfigured) {
    geoValidation = isWithinGeofence(
      { latitude: clientLat, longitude: clientLng },
      { latitude: facility.latitude, longitude: facility.longitude },
      facility.geofenceRadiusMeters || 100
    );
    withinGeofence = geoValidation.withinGeofence;
    distanceMeters = geoValidation.distanceMeters;
  } else {
    // Gym coordinates are not set yet (0,0).
    // Auto-anchor gym to this device's coordinates if valid, preventing spurious geofence breaches!
    if (clientLat !== 0 && clientLng !== 0 && !isNaN(clientLat) && !isNaN(clientLng)) {
      console.log(`[Auto-Anchor Location] Gym ${facility.name} coordinates were (0,0). Auto-anchoring to (${clientLat}, ${clientLng})`);
      await prisma.gym.update({
        where: { id: facility.id },
        data: { latitude: clientLat, longitude: clientLng }
      }).catch(() => {});
      await prisma.facility.update({
        where: { id: facility.id },
        data: { latitude: clientLat, longitude: clientLng }
      }).catch(() => {});
      facility.latitude = clientLat;
      facility.longitude = clientLng;
    }
    withinGeofence = true;
  }

  if (!withinGeofence) {
    const failureReason = `GPS Geofence Breach: Device is ${distanceMeters}m away from gym (Limit: ${facility.geofenceRadiusMeters}m). Access rejected.`;
    console.warn(`[Anti-Fraud Security] ${failureReason}`);

    const failedLog = await prisma.failedAccessLog.create({
      data: {
        userId: user?.id,
        facilityId: facility.id,
        attemptedDeviceId: incomingDeviceId,
        attemptType: 'GPS_GEOFENCE_BREACH',
        failureReason,
        gpsLat: clientLat,
        gpsLng: clientLng,
        distanceMeters: geoValidation.distanceMeters,
        payloadDetails: JSON.stringify({
          deviceCoords: { lat: clientLat, lng: clientLng },
          facilityCoords: { lat: facility.latitude, lng: facility.longitude }
        })
      }
    });

    // Drop down red alert banner on Super Admin dashboard
    emitFailedAccessAlert({
      id: failedLog.id,
      attemptType: 'GPS_GEOFENCE_BREACH',
      memberName,
      reason: failureReason,
      distanceMeters: geoValidation.distanceMeters,
      timestamp
    });

    // Fire asynchronous webhook + SMS & Email alert
    dispatchThreatAlerts({
      failedLogId: failedLog.id,
      facilityOwnerEmail: facility.ownerContactEmail,
      facilityOwnerPhone: facility.ownerContactPhone,
      memberName,
      failureReason,
      attemptType: 'GPS_GEOFENCE_BREACH',
      timestamp,
      details: {
        gpsLat: clientLat,
        gpsLng: clientLng,
        distanceMeters: geoValidation.distanceMeters
      }
    });

    res.status(403).json({
      error: `Access Denied: You must be physically at the gym entrance. Detected distance is ${geoValidation.distanceMeters}m (Allowed: ${facility.geofenceRadiusMeters}m).`,
      distanceMeters: geoValidation.distanceMeters,
      allowedRadiusMeters: facility.geofenceRadiusMeters
    });
    return;
  }

  // ---------------------------------------------------------------------------------
  // Phase 1: User Account & Security Verification
  // ---------------------------------------------------------------------------------
  if (!user) {
    res.status(401).json({ error: 'User profile not found.' });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: 'Account Suspended: Your member profile is inactive. Please speak with the front desk.' });
    return;
  }

  // Check if user is currently flagged
  if (user.deviceStatus === 'FLAGGED_MULTI_DEVICE') {
    res.status(403).json({
      error: 'Notice: Your account has a security hold (Daily entry limit or unauthorized device). Please speak with the front desk for clearance.',
      deviceStatus: 'FLAGGED_MULTI_DEVICE'
    });
    return;
  }

  // ---------------------------------------------------------------------------------
  // Phase 2: Hardware Device Binding & Anti-Account Sharing Verification
  // ---------------------------------------------------------------------------------
  if (user.role === 'MEMBER' && incomingDeviceId && incomingDeviceId !== 'MEMBER_APP') {
    if (!user.boundDeviceId) {
      // First scan: Auto-bind hardware device
      await prisma.user.update({
        where: { id: user.id },
        data: {
          boundDeviceId: incomingDeviceId,
          boundDeviceName: (req.headers['user-agent'] as string) || 'Authorized Mobile Device'
        }
      });
      user.boundDeviceId = incomingDeviceId;
      console.log(`[Device Security] Auto-bound primary device for ${user.fullName}: ${incomingDeviceId}`);
    } else if (user.boundDeviceId !== incomingDeviceId) {
      // Unauthorized secondary device detected!
      const deviceMismatchReason = `Multi-Device Security Alert: Attempted check-in from unauthorized device (${incomingDeviceId}). Account is bound to device (${user.boundDeviceId}).`;
      console.warn(`[Anti-Fraud Security] ${deviceMismatchReason}`);

      await prisma.user.update({
        where: { id: user.id },
        data: { deviceStatus: 'FLAGGED_MULTI_DEVICE' }
      });

      const changeReq = await prisma.deviceChangeRequest.create({
        data: {
          userId: user.id,
          attemptedDeviceId: incomingDeviceId,
          attemptedDeviceName: (req.headers['user-agent'] as string) || 'Secondary Device',
          ipAddress: req.ip || '127.0.0.1',
          userAgent: (req.headers['user-agent'] as string) || 'Client Browser',
          status: 'PENDING',
          adminNotes: `Turnstile scan attempted from an unauthorized secondary device.`
        }
      });

      const failedLog = await prisma.failedAccessLog.create({
        data: {
          userId: user.id,
          facilityId: facility.id,
          attemptedDeviceId: incomingDeviceId,
          attemptType: 'MULTI_DEVICE_BLOCKED',
          failureReason: deviceMismatchReason,
          gpsLat: clientLat,
          gpsLng: clientLng,
          distanceMeters: geoValidation.distanceMeters,
          payloadDetails: JSON.stringify({
            boundDeviceId: user.boundDeviceId,
            attemptedDeviceId: incomingDeviceId
          })
        }
      });

      emitFailedAccessAlert({
        id: failedLog.id,
        attemptType: 'MULTI_DEVICE_BLOCKED',
        memberName: user.fullName,
        reason: deviceMismatchReason,
        timestamp
      });

      emitMultiDeviceAlert({
        type: 'MULTI_DEVICE_BLOCKED',
        requestId: changeReq.id,
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        attemptedDeviceId: incomingDeviceId,
        timestamp
      });

      res.status(403).json({
        error: 'Device Security Alert: This account is bound to another phone/device. For security and anti-passback prevention, this device is not authorized. A verification request has been sent to the front desk.',
        deviceStatus: 'FLAGGED_MULTI_DEVICE',
        requestId: changeReq.id
      });
      return;
    }
  }

  // Check if member already checked in today
  const todayStart = new Date(timestamp);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(timestamp);
  todayEnd.setHours(23, 59, 59, 999);

  const todaysEntry = await prisma.attendanceEntry.findFirst({
    where: {
      userId: user.id,
      scannedAt: {
        gte: todayStart,
        lte: todayEnd
      }
    },
    orderBy: { scannedAt: 'desc' }
  });

  // Scenario A: Member is ALREADY INSIDE gym
  if (todaysEntry && (todaysEntry.status === 'ACTIVE' || !todaysEntry.exitedAt)) {
    const elapsedMinutes = Math.max(1, Math.round((timestamp.getTime() - new Date(todaysEntry.scannedAt).getTime()) / (60 * 1000)));
    const startTimeStr = new Date(todaysEntry.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    res.status(200).json({
      access: 'ALREADY_INSIDE',
      alreadyCheckedIn: true,
      message: `You are currently checked into ${facility.name} (Started at ${startTimeStr}, ${elapsedMinutes}m ago). When you finish your workout, scan the Exit Gate or tap Check Out.`,
      entry: {
        entryId: todaysEntry.id,
        userId: user.id,
        memberName: user.fullName,
        email: user.email,
        facilityName: facility.name,
        scannedAt: todaysEntry.scannedAt,
        status: 'ACTIVE',
        elapsedMinutes
      },
      token: (req as any).generatedToken || undefined,
      user: (req as any).generatedToken ? {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl
      } : undefined
    });
    return;
  }

  // Scenario B: Member already COMPLETED a session today (Attempting 2nd check-in)
  if (todaysEntry && todaysEntry.exitedAt) {
    const duration = todaysEntry.sessionDurationMinutes || Math.max(1, Math.round((new Date(todaysEntry.exitedAt).getTime() - new Date(todaysEntry.scannedAt).getTime()) / (60 * 1000)));
    const startTimeStr = new Date(todaysEntry.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const exitTimeStr = new Date(todaysEntry.exitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const failureReason = `Daily Entry Limit Exceeded: Member already completed a ${duration}-min session today (${startTimeStr} - ${exitTimeStr}). Multiple entries per day require front desk clearance.`;
    console.warn(`[Anti-Fraud Security] ${failureReason}`);

    // Flag account for Super Admin review
    await prisma.user.update({
      where: { id: user.id },
      data: { deviceStatus: 'FLAGGED_MULTI_DEVICE' }
    });

    // Create flag request for Super Admin resolution
    const changeReq = await prisma.deviceChangeRequest.create({
      data: {
        userId: user.id,
        attemptedDeviceId: 'DAILY_LIMIT_EXCEEDED',
        attemptedDeviceName: 'Attempted 2nd Check-in on Same Day',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Client',
        status: 'PENDING',
        adminNotes: `Attempted additional entry today after completing a ${duration}m workout (${startTimeStr} - ${exitTimeStr})`
      }
    });

    const failedLog = await prisma.failedAccessLog.create({
      data: {
        userId: user.id,
        facilityId: facility.id,
        attemptedDeviceId: incomingDeviceId || 'Any-Device',
        attemptType: 'MULTI_DEVICE_BLOCKED',
        failureReason,
        gpsLat: clientLat,
        gpsLng: clientLng,
        distanceMeters: geoValidation.distanceMeters,
        payloadDetails: JSON.stringify({
          existingEntryId: todaysEntry.id,
          firstCheckInTime: todaysEntry.scannedAt,
          exitedAt: todaysEntry.exitedAt,
          duration
        })
      }
    });

    // Drop down red alert banner on Super Admin dashboard
    emitFailedAccessAlert({
      id: failedLog.id,
      attemptType: 'MULTI_DEVICE_BLOCKED',
      memberName: user.fullName,
      reason: failureReason,
      timestamp
    });

    emitMultiDeviceAlert({
      type: 'MULTI_DEVICE_BLOCKED',
      requestId: changeReq.id,
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      attemptedDeviceId: '2nd Check-in Today',
      timestamp
    });

    dispatchThreatAlerts({
      failedLogId: failedLog.id,
      facilityOwnerEmail: facility.ownerContactEmail,
      facilityOwnerPhone: facility.ownerContactPhone,
      memberName: user.fullName,
      failureReason,
      attemptType: 'MULTI_DEVICE_BLOCKED',
      timestamp,
      details: {
        firstCheckInTime: todaysEntry.scannedAt,
        exitedAt: todaysEntry.exitedAt,
        durationMinutes: duration
      }
    });

    res.status(403).json({
      error: `Daily Limit Reached: You have already completed a ${duration}-minute workout session today (${startTimeStr} - ${exitTimeStr}). Your membership allows 1 session per day. Please see the front desk for additional access.`,
      deviceStatus: 'FLAGGED_MULTI_DEVICE',
      completedToday: {
        entryId: todaysEntry.id,
        scannedAt: todaysEntry.scannedAt,
        exitedAt: todaysEntry.exitedAt,
        sessionDurationMinutes: duration
      }
    });
    return;
  }

  // ---------------------------------------------------------------------------------
  // Phase 3 Check 4: Anti-Passback Cooldown Timer (Mandatory 3 to 5 minutes)
  // ---------------------------------------------------------------------------------
  const latestEntry = await prisma.attendanceEntry.findFirst({
    where: { userId: user.id },
    orderBy: { scannedAt: 'desc' }
  });

  if (latestEntry && latestEntry.cooldownExpiresAt > timestamp) {
    const remainingSeconds = Math.ceil(
      (latestEntry.cooldownExpiresAt.getTime() - timestamp.getTime()) / 1000
    );
    const failureReason = `Recent check-in detected. Cooldown active for another ${remainingSeconds}s.`;
    console.warn(`[Front Desk Notice] ${failureReason}`);

    const failedLog = await prisma.failedAccessLog.create({
      data: {
        userId: user.id,
        facilityId: facility.id,
        attemptedDeviceId: incomingDeviceId,
        attemptType: 'ANTI_PASSBACK_LOCKED',
        failureReason,
        gpsLat: clientLat,
        gpsLng: clientLng,
        distanceMeters: geoValidation.distanceMeters,
        payloadDetails: JSON.stringify({ remainingSeconds })
      }
    });

    emitFailedAccessAlert({
      id: failedLog.id,
      attemptType: 'ANTI_PASSBACK_LOCKED',
      memberName: user.fullName,
      reason: failureReason,
      timestamp
    });

    res.status(429).json({
      error: `Please wait ${remainingSeconds} seconds before scanning again.`,
      remainingSeconds,
      cooldownExpiresAt: latestEntry.cooldownExpiresAt
    });
    return;
  }

  // ---------------------------------------------------------------------------------
  // Phase 4 Check: Subscription Status Verification (Active vs Expired)
  // ---------------------------------------------------------------------------------
  const latestSub = user.subscriptions[0];
  const isSubActive =
    latestSub &&
    latestSub.status === 'ACTIVE' &&
    new Date(latestSub.endDate) > timestamp;

  if (!isSubActive) {
    const expiryReason = latestSub
      ? `Expired Membership: Plan '${latestSub.planName}' expired on ${new Date(latestSub.endDate).toLocaleDateString()}.`
      : 'No active membership plan found on record.';
    
    console.warn(`[Anti-Fraud Security] ${expiryReason}`);

    const failedLog = await prisma.failedAccessLog.create({
      data: {
        userId: user.id,
        facilityId: facility.id,
        attemptedDeviceId: incomingDeviceId,
        attemptType: 'EXPIRED_MEMBERSHIP',
        failureReason: expiryReason,
        gpsLat: clientLat,
        gpsLng: clientLng,
        distanceMeters: geoValidation.distanceMeters,
        payloadDetails: JSON.stringify({
          planName: latestSub?.planName || 'None',
          endDate: latestSub?.endDate || null
        })
      }
    });

    // Drop down red alert banner on Super Admin dashboard
    emitFailedAccessAlert({
      id: failedLog.id,
      attemptType: 'EXPIRED_MEMBERSHIP',
      memberName: user.fullName,
      reason: expiryReason,
      timestamp
    });

    // Fire immediate asynchronous webhook + SMS & Email alert to facility owner
    dispatchThreatAlerts({
      failedLogId: failedLog.id,
      facilityOwnerEmail: facility.ownerContactEmail,
      facilityOwnerPhone: facility.ownerContactPhone,
      memberName: user.fullName,
      failureReason: expiryReason,
      attemptType: 'EXPIRED_MEMBERSHIP',
      timestamp,
      details: {
        lastPlan: latestSub?.planName || 'None',
        expiredOn: latestSub?.endDate || 'Never'
      }
    });

    res.status(403).json({
      error: 'Access Denied: Your membership subscription has expired or is inactive. Please renew at the front desk.',
      subscriptionStatus: 'EXPIRED',
      lastPlan: latestSub?.planName || null,
      expiredAt: latestSub?.endDate || null
    });
    return;
  }

  // ---------------------------------------------------------------------------------
  // ALL 5 CHECKS PASSED: Authorize Entry & Push Real-Time WebSocket Update
  // ---------------------------------------------------------------------------------
  const cooldownExpiresAt = new Date(timestamp.getTime() + ANTI_PASSBACK_COOLDOWN_MINUTES * 60 * 1000);

  const entry = await prisma.attendanceEntry.create({
    data: {
      userId: user.id,
      gymId: user.gymId || facility.id,
      facilityId: facility.id,
      scannedAt: timestamp,
      status: 'ACTIVE',
      deviceId: incomingDeviceId || user.boundDeviceId || 'Unknown-Device',
      gpsLat: clientLat,
      gpsLng: clientLng,
      distanceFromFacility: geoValidation.distanceMeters,
      cooldownExpiresAt
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true
        }
      },
      gym: {
        select: {
          id: true,
          name: true
        }
      },
      facility: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  const liveAttendancePayload = {
    entryId: entry.id,
    userId: user.id,
    memberName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    facilityName: facility.name,
    planName: latestSub.planName,
    subscriptionExpiry: latestSub.endDate,
    scannedAt: entry.scannedAt,
    distanceMeters: entry.distanceFromFacility,
    cooldownExpiresAt: entry.cooldownExpiresAt
  };

  // Push real-time WebSocket update to Manager's live dashboard
  emitNewAttendance(liveAttendancePayload);

  console.log(`[Smart Entry] Verified check-in: ${user.fullName} (${facility.name}) at ${entry.scannedAt.toISOString()}`);

  // Send turnstile check-in email notification
  setImmediate(() => {
    sendTurnstileScanEmail({
      toEmail: user.email,
      fullName: user.fullName,
      type: 'ENTRANCE',
      timestamp: entry.scannedAt,
      facilityName: facility.name
    }).catch(e => console.warn('Turnstile check-in email error:', e.message));
  });

  const authToken = (req as any).generatedToken || null;

  res.status(200).json({
    access: 'GRANTED',
    message: `Welcome to ${facility.name}, ${user.fullName}!`,
    entry: liveAttendancePayload,
    token: authToken,
    user: authToken ? {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl
    } : undefined
  });
}

/**
 * Get current active in-gym workout session and completed session today for member
 */
export async function getActiveSession(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Look for currently active session
    const activeSession = await prisma.attendanceEntry.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        exitedAt: null
      },
      include: {
        facility: {
          select: { id: true, name: true, address: true }
        }
      },
      orderBy: { scannedAt: 'desc' }
    });

    // 2. Look for today's completed session
    const completedToday = await prisma.attendanceEntry.findFirst({
      where: {
        userId,
        scannedAt: { gte: todayStart, lte: todayEnd },
        exitedAt: { not: null }
      },
      include: {
        facility: {
          select: { id: true, name: true, address: true }
        }
      },
      orderBy: { scannedAt: 'desc' }
    });

    res.json({
      hasActiveSession: !!activeSession,
      activeSession: activeSession
        ? {
            ...activeSession,
            elapsedMinutes: Math.max(
              1,
              Math.round((Date.now() - new Date(activeSession.scannedAt).getTime()) / (60 * 1000))
            )
          }
        : null,
      completedToday: completedToday || null
    });
  } catch (error: any) {
    console.error('getActiveSession error:', error);
    res.status(500).json({ error: 'Failed to retrieve active session status.' });
  }
}

/**
 * Member Exit / Check-out scan processor
 */
export async function processExitScan(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const timestamp = new Date();
    const userId = req.user?.userId;
    const { gym_id, latitude, longitude, device_id } = req.body;
    const incomingDeviceId = (req.deviceId || device_id || req.headers['x-device-id'] || 'MEMBER_APP').toString().trim();

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized. Please log in to complete gym checkout.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          orderBy: { endDate: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    // Find currently active session (exitedAt is null)
    const activeEntry = await prisma.attendanceEntry.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        exitedAt: null
      },
      include: {
        facility: true
      },
      orderBy: { scannedAt: 'desc' }
    });

    // Gate Token Verification (if scanned at turnstile)
    if (gym_id) {
      const isEntranceGate =
        (activeEntry?.facility && (gym_id === activeEntry.facility.staticQrCodeHash || gym_id === activeEntry.facility.id)) ||
        (await prisma.facility.findFirst({
          where: {
            OR: [
              { staticQrCodeHash: gym_id },
              { id: gym_id }
            ]
          }
        }));

      if (isEntranceGate && !gym_id.includes('EXIT')) {
        res.status(400).json({
          error: 'Gate Mismatch: You scanned the Entrance Gate poster. Please scan the Exit Gate turnstile poster to complete your checkout.',
          gateMismatch: true,
          expectedGate: 'EXIT',
          scannedGate: 'ENTRANCE'
        });
        return;
      }

      const validExitGate = await prisma.facility.findFirst({
        where: {
          OR: [
            { id: gym_id },
            { exitQrCodeHash: gym_id }
          ]
        }
      });

      if (!validExitGate && !gym_id.includes('EXIT')) {
        res.status(400).json({
          error: 'Invalid Gate QR Code. Unrecognized turnstile identifier. Please scan the official Exit Gate poster.',
          invalidGate: true
        });
        return;
      }
    }

    if (!activeEntry) {
      // Check if user already exited earlier today
      const todayStart = new Date(timestamp);
      todayStart.setHours(0, 0, 0, 0);

      const recentExit = await prisma.attendanceEntry.findFirst({
        where: {
          userId,
          scannedAt: { gte: todayStart },
          exitedAt: { not: null }
        },
        orderBy: { exitedAt: 'desc' }
      });

      if (recentExit) {
        const exitTimeStr = new Date(recentExit.exitedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        res.status(400).json({
          error: `You already checked out today at ${exitTimeStr} (${recentExit.sessionDurationMinutes}m workout). No active workout session in progress.`,
          alreadyCheckedOut: true
        });
        return;
      }

      res.status(400).json({
        error: 'Cannot Check Out: No active gym session found. You are not currently checked into the gym. Please scan the Entrance Gate first.',
        notCheckedIn: true
      });
      return;
    }

    // Calculate exact duration
    const diffMs = timestamp.getTime() - new Date(activeEntry.scannedAt).getTime();
    const durationMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)));

    const updatedEntry = await prisma.attendanceEntry.update({
      where: { id: activeEntry.id },
      data: {
        exitedAt: timestamp,
        sessionDurationMinutes: durationMinutes,
        status: 'COMPLETED',
        exitDeviceId: incomingDeviceId
      },
      include: {
        facility: {
          select: { id: true, name: true, address: true }
        },
        user: {
          select: { id: true, fullName: true, email: true, avatarUrl: true }
        }
      }
    });

    // Compute total past sessions completed
    const totalSessions = await prisma.attendanceEntry.count({
      where: {
        userId,
        status: 'COMPLETED'
      }
    });

    const exitPayload = {
      entryId: updatedEntry.id,
      userId: user.id,
      memberName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      facilityName: updatedEntry.facility.name,
      scannedAt: updatedEntry.scannedAt,
      exitedAt: updatedEntry.exitedAt,
      durationMinutes,
      status: 'COMPLETED'
    };

    // Emit live exit notification to managers and admin
    emitMemberExited(exitPayload);

    console.log(`[Smart Exit] Member checked out: ${user.fullName} after ${durationMinutes} mins.`);

    // Send turnstile check-out email notification
    setImmediate(() => {
      sendTurnstileScanEmail({
        toEmail: user.email,
        fullName: user.fullName,
        type: 'EXIT',
        timestamp: updatedEntry.exitedAt || new Date(),
        facilityName: updatedEntry.facility.name
      }).catch(e => console.warn('Turnstile check-out email error:', e.message));
    });

    res.status(200).json({
      access: 'EXIT_CONFIRMED',
      message: `Workout complete! Fantastic effort today at ${updatedEntry.facility.name}.`,
      session: {
        entryId: updatedEntry.id,
        facilityName: updatedEntry.facility.name,
        scannedAt: updatedEntry.scannedAt,
        exitedAt: updatedEntry.exitedAt,
        durationMinutes,
        estimatedCalories: Math.round(durationMinutes * 7.5),
        totalCompletedSessions: totalSessions
      }
    });
  } catch (error: any) {
    console.error('processExitScan error:', error);
    res.status(500).json({ error: 'Failed to process gym departure.' });
  }
}

/**
 * Direct QR Scan-to-Login Endpoint for members.
 * Members scan the entrance or exit QR with email credentials and get logged in + processed instantly.
 */
export async function scanAndLogin(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { identifier, email, phone, password, gym_id, latitude, longitude, action } = req.body;
    const lookup = (identifier || email || phone || '').toString().trim().toLowerCase();

    if (!lookup) {
      res.status(400).json({ error: 'Please provide your member email or phone number.' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: lookup },
          { phone: lookup },
          { id: lookup }
        ]
      },
      include: { facility: true }
    });

    if (!user) {
      res.status(404).json({ error: 'Member profile not found with that email/phone. Please sign up or contact the front desk.' });
      return;
    }

    // Only staff and admin require passwords for authentication; members get access upon scanning the gym QR
    if (user.role !== 'MEMBER') {
      if (!password) {
        res.status(400).json({ error: 'Staff and Admin accounts must sign in using their password.' });
        return;
      }
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid password.' });
        return;
      }
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role as any,
        facilityId: user.facilityId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      facilityId: user.facilityId
    };
    (req as any).generatedToken = token;

    // Check if the scan is targeting exit gate or action is EXIT
    const facility = user.facility || (await prisma.facility.findFirst());
    if (facility && (action === 'EXIT' || gym_id === facility.exitQrCodeHash)) {
      return processExitScan(req, res);
    }

    // Delegate to processEntryScan for location check & daily limit check
    return processEntryScan(req, res);
  } catch (error: any) {
    console.error('scanAndLogin error:', error);
    res.status(500).json({ error: 'Failed to process entrance scan.' });
  }
}

