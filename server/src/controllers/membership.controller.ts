import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
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
      facilityId: facilityId || req.user?.facilityId || null,
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

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName || 'Member',
          email: cleanEmail,
          phone: data.phone || null,
          passwordHash,
          role: data.role || 'MEMBER',
          facilityId: data.facilityId || req.user?.facilityId || null,
          deviceStatus: 'NORMAL'
        }
      });

      let subscription = null;
      if ((data.role || 'MEMBER') === 'MEMBER') {
        subscription = await tx.subscription.create({
          data: {
            userId: user.id,
            planName: data.planName || 'Monthly Pro Access',
            price: Number(data.price || 65),
            startDate,
            endDate,
            status: 'ACTIVE',
            deskBilledById: managerId || data.deskBilledById,
            paymentMethod: data.paymentMethod || 'CASH'
          }
        });
      }

      // Remove the OTP record
      await tx.otpVerification.delete({ where: { email: cleanEmail } });

      return { user, subscription };
    });

    console.log(`[Desk Onboard] Successfully verified & enrolled member ${result.user.fullName} (${result.user.email})`);

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
        tempPassword: plainPassword,
        subscription: result.subscription
      }
    });
  } catch (error: any) {
    console.error('verifyOnboardOtp error:', error);
    res.status(500).json({ error: 'Failed to verify OTP and enroll member.' });
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
      facilityId
    } = req.body;
    const managerId = req.user?.userId;

    if (!fullName || !email) {
      res.status(400).json({ error: 'Full name and email are required for account creation.' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    // Default password or custom password
    const plainPassword = password || (role === 'MEMBER' ? 'MemberPass123!' : 'StaffPass123!');
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + Number(durationDays) * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName,
          email: email.toLowerCase(),
          phone,
          passwordHash,
          role: role.toUpperCase(),
          facilityId: facilityId || req.user?.facilityId || null,
          deviceStatus: 'NORMAL'
        }
      });

      let subscription = null;
      if (role.toUpperCase() === 'MEMBER') {
        subscription = await tx.subscription.create({
          data: {
            userId: user.id,
            planName: planName || 'Monthly Pro Access',
            price: Number(price),
            startDate,
            endDate,
            status: 'ACTIVE',
            deskBilledById: managerId,
            paymentMethod
          }
        });
      }

      return { user, subscription };
    });

    console.log(`[Account Creation] Created ${result.user.role} account for ${result.user.fullName} (${result.user.email})`);

    res.status(201).json({
      message: `${result.user.role} account created successfully.`,
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        tempPassword: plainPassword,
        subscription: result.subscription
      }
    });
  } catch (error: any) {
    console.error('onboardMember error:', error);
    res.status(500).json({ error: 'Failed to onboard member.' });
  }
}

export async function deskBilling(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId, planName, durationDays = 30, price = 65, paymentMethod = 'CASH' } = req.body;
    const managerId = req.user?.userId;

    if (!userId || !planName) {
      res.status(400).json({ error: 'User ID and plan name are required.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + Number(durationDays) * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planName,
        price: Number(price),
        startDate,
        endDate,
        status: 'ACTIVE',
        deskBilledById: managerId,
        paymentMethod
      }
    });

    console.log(`[Desk Billing] Renewed plan '${planName}' for ${user.fullName}`);

    res.status(201).json({
      message: 'Subscription successfully billed at desk.',
      subscription
    });
  } catch (error: any) {
    console.error('deskBilling error:', error);
    res.status(500).json({ error: 'Failed to process desk billing.' });
  }
}

export async function getMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { search, status } = req.query;

    const where: any = { role: 'MEMBER' };
    if (search) {
      where.OR = [
        { fullName: { contains: String(search) } },
        { email: { contains: String(search) } },
        { phone: { contains: String(search) } }
      ];
    }

    const members = await prisma.user.findMany({
      where,
      include: {
        subscriptions: {
          orderBy: { endDate: 'desc' },
          take: 1
        },
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
        boundDeviceId: m.boundDeviceId,
        deviceStatus: m.deviceStatus,
        facility: m.facility?.name,
        latestSubscription: activeSub || null,
        isAccessGranted: isSubActive && m.deviceStatus === 'NORMAL'
      };
    });

    res.json({ members: enriched });
  } catch (error: any) {
    console.error('getMembers error:', error);
    res.status(500).json({ error: 'Failed to retrieve members.' });
  }
}

