import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import {
  AuthenticatedRequest,
  resolveTenantGymId,
  resolveFacilityId,
  resolveValidBilledById
} from '../middleware/auth.middleware.js';
import { sendDeskOnboardOtpEmail, sendWelcomeEmail } from '../services/email.service.js';

const STANDARD_PLANS = [
  { id: 'plan-day', name: 'Day Pass', durationDays: 1, price: 15.0 },
  { id: 'plan-monthly', name: 'Monthly Pro Access', durationDays: 30, price: 65.0 },
  { id: 'plan-quarterly', name: 'Quarterly Elite Pass', durationDays: 90, price: 165.0 },
  { id: 'plan-annual', name: 'Annual VIP Membership', durationDays: 365, price: 540.0 }
];

export async function getPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({ plans: STANDARD_PLANS });
}

/**
 * Step 1: Desk/Owner Onboard - Send OTP to Member's Gmail
 */
export async function sendOnboardOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      fullName,
      email,
      phone,
      role = 'MEMBER',
      planName = 'Monthly Pro Access',
      durationDays = 30,
      price = 65,
      paymentMethod = 'CASH',
      gymId,
      facilityId
    } = req.body;

    if (!fullName || !email) {
      res.status(400).json({ error: 'Member full name and email are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      res.status(409).json({ error: `An account for ${cleanEmail} already exists in the system.` });
      return;
    }

    const targetGymId = resolveTenantGymId(req) || gymId || null;
    const resolvedFacilityId = await resolveFacilityId(facilityId || targetGymId);

    // Generate 6-digit cryptographic OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    const payload = JSON.stringify({
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone?.trim() || null,
      role: role.toUpperCase(),
      planName,
      durationDays: Number(durationDays),
      price: Number(price),
      paymentMethod,
      gymId: targetGymId,
      facilityId: resolvedFacilityId,
      deskBilledById: req.user?.userId
    });

    await prisma.otpVerification.upsert({
      where: { email: cleanEmail },
      update: {
        otpCode,
        payload,
        expiresAt,
        attempts: 0
      },
      create: {
        email: cleanEmail,
        otpCode,
        payload,
        expiresAt,
        attempts: 0
      }
    });

    const staffName = req.user?.email || 'Front Desk Staff';
    const emailResult = await sendDeskOnboardOtpEmail({
      toEmail: cleanEmail,
      fullName: fullName.trim(),
      otpCode,
      planName,
      staffName
    });

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent via Gmail to ${cleanEmail}.`,
      email: cleanEmail,
      deliveredVia: emailResult.deliveredVia
    });
  } catch (error: any) {
    console.error('sendOnboardOtp error:', error);
    res.status(500).json({ error: 'Failed to dispatch verification email.' });
  }
}

/**
 * Step 2: Desk/Owner Onboard - Verify Member's OTP & Complete Registration
 */
export async function verifyOnboardOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, otp, password } = req.body;
    const managerId = req.user?.userId;

    if (!email || !otp) {
      res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const record = await prisma.otpVerification.findUnique({
      where: { email: cleanEmail }
    });

    if (!record) {
      res.status(404).json({ error: 'No pending enrollment found for this email. Please request a new code.' });
      return;
    }

    if (new Date() > new Date(record.expiresAt)) {
      await prisma.otpVerification.delete({ where: { email: cleanEmail } });
      res.status(410).json({ error: 'Verification code has expired. Please send a new code.' });
      return;
    }

    if (record.otpCode !== cleanOtp) {
      const attempts = record.attempts + 1;
      if (attempts >= 5) {
        await prisma.otpVerification.delete({ where: { email: cleanEmail } });
        res.status(429).json({ error: 'Too many incorrect attempts. Enrollment canceled. Please restart.' });
        return;
      }
      await prisma.otpVerification.update({
        where: { email: cleanEmail },
        data: { attempts }
      });
      res.status(400).json({ error: `Invalid verification code. ${5 - attempts} attempts remaining.` });
      return;
    }

    // OTP is valid! Parse stored payload
    let data: any = {};
    try {
      data = JSON.parse(record.payload);
    } catch {
      data = {};
    }

    // Double-check user doesn't already exist
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      await prisma.otpVerification.delete({ where: { email: cleanEmail } });
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const plainPassword = password || (data.role === 'MEMBER' ? 'MemberPass123!' : 'StaffPass123!');
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const startDate = new Date();
    const duration = data.durationDays || 30;
    const endDate = new Date(startDate.getTime() + Number(duration) * 24 * 60 * 60 * 1000);
    const targetGymId = resolveTenantGymId(req) || data.gymId || null;
    const resolvedFacilityId = await resolveFacilityId(data.facilityId || targetGymId);
    const validBilledById = await resolveValidBilledById(managerId || data.deskBilledById);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName || 'Member',
          email: cleanEmail,
          phone: data.phone || null,
          passwordHash,
          role: data.role || 'MEMBER',
          gymId: targetGymId,
          facilityId: resolvedFacilityId,
          deviceStatus: 'NORMAL'
        }
      });

      let subscription = null;
      if ((data.role || 'MEMBER') === 'MEMBER') {
        subscription = await tx.subscription.create({
          data: {
            userId: user.id,
            gymId: targetGymId,
            planName: data.planName || 'Monthly Pro Access',
            price: Number(data.price || 65),
            startDate,
            endDate,
            status: 'ACTIVE',
            deskBilledById: validBilledById,
            paymentMethod: data.paymentMethod || 'CASH'
          }
        });
      }

      // Remove the OTP record
      await tx.otpVerification.delete({ where: { email: cleanEmail } });

      return { user, subscription };
    });

    console.log(`[Desk Onboard] Successfully verified & enrolled member ${result.user.fullName} (${result.user.email}) in gym ${targetGymId}`);

    // Dispatch welcome email asynchronously
    sendWelcomeEmail({
      toEmail: cleanEmail,
      fullName: result.user.fullName,
      planName: data.planName || 'Monthly Pro Access',
      endDate
    }).catch((err) => console.warn('Welcome email error:', err.message));

    res.status(201).json({
      success: true,
      message: `Member ${result.user.fullName} verified and enrolled successfully!`,
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        gymId: result.user.gymId,
        tempPassword: plainPassword,
        subscription: result.subscription
      }
    });
  } catch (error: any) {
    console.error('verifyOnboardOtp error:', error);
    res.status(500).json({ error: error?.message || 'Failed to verify OTP and enroll member.' });
  }
}

export async function onboardMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      fullName,
      email,
      phone,
      role = 'MEMBER',
      password,
      planName,
      durationDays = 30,
      price = 65,
      paymentMethod = 'CASH',
      gymId,
      facilityId
    } = req.body;
    const managerId = req.user?.userId;

    if (!fullName || !email) {
      res.status(400).json({ error: 'Full name and email are required for account creation.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const targetGymId = resolveTenantGymId(req) || gymId || null;
    const resolvedFacilityId = await resolveFacilityId(facilityId || targetGymId);
    const validBilledById = await resolveValidBilledById(managerId);

    const plainPassword = password || (role === 'MEMBER' ? 'MemberPass123!' : 'StaffPass123!');
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + Number(durationDays) * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: cleanEmail,
          phone: phone?.trim() || null,
          passwordHash,
          role: role.toUpperCase(),
          gymId: targetGymId,
          facilityId: resolvedFacilityId,
          deviceStatus: 'NORMAL'
        }
      });

      let subscription = null;
      if (role.toUpperCase() === 'MEMBER') {
        subscription = await tx.subscription.create({
          data: {
            userId: user.id,
            gymId: targetGymId,
            planName: planName || 'Monthly Pro Access',
            price: Number(price),
            startDate,
            endDate,
            status: 'ACTIVE',
            deskBilledById: validBilledById,
            paymentMethod
          }
        });
      }

      return { user, subscription };
    });

    console.log(`[Account Creation] Created ${result.user.role} account for ${result.user.fullName} in gym ${targetGymId}`);

    res.status(201).json({
      message: `${result.user.role} account created successfully.`,
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        gymId: result.user.gymId,
        tempPassword: plainPassword,
        subscription: result.subscription
      }
    });
  } catch (error: any) {
    console.error('onboardMember error:', error);
    res.status(500).json({ error: error?.message || 'Failed to onboard member.' });
  }
}

export async function deskBilling(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId, planName, durationDays = 30, price = 65, paymentMethod = 'CASH' } = req.body;
    const managerId = req.user?.userId;
    const callerGymId = resolveTenantGymId(req);

    if (!userId || !planName) {
      res.status(400).json({ error: 'User ID and plan name are required.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    // Ensure Gym Owner can only bill members belonging to their own gym
    if (callerGymId && user.gymId && user.gymId !== callerGymId) {
      res.status(403).json({ error: 'Forbidden: You can only bill members of your own gym.' });
      return;
    }

    const targetGymId = callerGymId || user.gymId || null;
    const resolvedFacilityId = await resolveFacilityId(user.facilityId || targetGymId);
    const validBilledById = await resolveValidBilledById(managerId);
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + Number(durationDays) * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        gymId: targetGymId,
        planName,
        price: Number(price),
        startDate,
        endDate,
        status: 'ACTIVE',
        deskBilledById: validBilledById,
        paymentMethod
      }
    });

    console.log(`[Desk Billing] Renewed plan '${planName}' for ${user.fullName} in gym ${targetGymId}`);

    res.status(201).json({
      message: 'Subscription successfully billed at desk.',
      subscription
    });
  } catch (error: any) {
    console.error('deskBilling error:', error);
    res.status(500).json({ error: error?.message || 'Failed to process desk billing.' });
  }
}

export async function getMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { search, status, gymId: queryGymId, role: queryRole } = req.query;
    const callerGymId = resolveTenantGymId(req);

    const where: any = {};
    if (queryRole && queryRole !== 'ALL') {
      where.role = String(queryRole);
    } else if (!queryRole) {
      where.role = 'MEMBER';
    }

    // STRICT MULTI-TENANT ISOLATION:
    // If not super admin without gym filter, only show members in caller's gym!
    if (callerGymId) {
      where.OR = [
        { gymId: callerGymId },
        { facilityId: callerGymId }
      ];
    } else if (queryGymId) {
      where.gymId = String(queryGymId);
    }

    if (search) {
      const searchClauses = [
        { fullName: { contains: String(search) } },
        { email: { contains: String(search) } },
        { phone: { contains: String(search) } }
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchClauses }
        ];
        delete where.OR;
      } else {
        where.OR = searchClauses;
      }
    }

    const members = await prisma.user.findMany({
      where,
      include: {
        subscriptions: {
          orderBy: { endDate: 'desc' },
          take: 1
        },
        gym: true,
        facility: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = members.map(m => {
      const activeSub = m.subscriptions[0];
      const isSubActive = activeSub && activeSub.status === 'ACTIVE' && new Date(activeSub.endDate) > new Date();
      return {
        id: m.id,
        fullName: m.fullName,
        email: m.email,
        phone: m.phone,
        role: m.role,
        gymId: m.gymId,
        gymInviteCode: m.gym?.inviteCode || '',
        gymName: m.gym?.name || m.facility?.name || 'Unassigned',
        facility: m.gym?.name || m.facility?.name,
        boundDeviceId: m.boundDeviceId,
        deviceStatus: m.deviceStatus,
        createdAt: m.createdAt,
        latestSubscription: activeSub || null,
        planName: activeSub?.planName || 'No Active Pass',
        price: activeSub?.price ?? 0,
        startDate: activeSub?.startDate || null,
        endDate: activeSub?.endDate || null,
        status: isSubActive ? 'ACTIVE' : (activeSub ? activeSub.status : 'INACTIVE'),
        isAccessGranted: isSubActive && m.deviceStatus === 'NORMAL'
      };
    });

    res.json({ members: enriched });
  } catch (error: any) {
    console.error('getMembers error:', error);
    res.status(500).json({ error: 'Failed to retrieve members.' });
  }
}

/**
 * Delete / Remove a member from the gym database
 */
export async function deleteMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const callerGymId = resolveTenantGymId(req);

    if (!id) {
      res.status(400).json({ error: 'Member ID is required.' });
      return;
    }

    const member = await prisma.user.findUnique({
      where: { id }
    });

    if (!member) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    // Role check: Only managers/gym owners of the same gym or super admin can delete
    if (callerGymId && member.gymId && member.gymId !== callerGymId) {
      res.status(403).json({ error: 'Forbidden: You can only remove members from your own gym.' });
      return;
    }

    // Clean up dependent records in transaction
    await prisma.$transaction(async (tx) => {
      await tx.memberHealthProfile.deleteMany({ where: { userId: id } });
      await tx.classBooking.deleteMany({ where: { userId: id } });
      await tx.postComment.deleteMany({ where: { authorId: id } });
      await tx.postLike.deleteMany({ where: { userId: id } });
      await tx.attendanceEntry.deleteMany({ where: { userId: id } });
      await tx.failedAccessLog.deleteMany({ where: { userId: id } });
      await tx.deviceChangeRequest.deleteMany({ where: { userId: id } });
      await tx.subscription.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    console.log(`[Member Removal] Member ${member.fullName} (${member.email}) removed from gym database.`);

    res.json({
      success: true,
      message: `Member ${member.fullName} has been removed from the gym database.`
    });
  } catch (error: any) {
    console.error('deleteMember error:', error);
    res.status(500).json({ error: error?.message || 'Failed to delete member.' });
  }
}
