import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest, resolveFacilityId } from '../middleware/auth.middleware.js';
import { JwtPayload, UserRole } from '../types/index.js';
import {
  emitMultiDeviceAlert,
  emitFailedAccessAlert
} from '../services/socket.service.js';
import { dispatchThreatAlerts } from '../services/notification.service.js';
import {
  sendSignupOtpEmail,
  sendWelcomeEmail,
  sendMemberLoginOtpEmail,
  sendPasswordResetOtpEmail
} from '../services/email.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gym_super_secure_jwt_secret_key_2026_dev';

/**
 * Helper to generate a unique 6-digit numeric invite access code for a gym
 */
async function generateUniqueGymInviteCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomInt(100000, 999999).toString();
    const existing = await prisma.gym.findUnique({ where: { inviteCode: code } });
    if (!existing) return code;
  }
  return String(Date.now()).slice(-6);
}

/**
 * 0. Register Your Business: Onboarding flow for Gym Owners (Khatabook for Gyms)
 */
export async function registerBusiness(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      businessName,
      gymName,
      ownerName,
      email,
      password,
      phone,
      address,
      city,
      state,
      inviteCode: customInviteCode
    } = req.body;

    const targetBizName = (businessName || gymName || '').trim();

    if (!targetBizName || !ownerName || !email || !password) {
      res.status(400).json({ error: 'Gym name, owner name, email, and password are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email address already exists. Please log in or use another email.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    let inviteCode: string;
    if (customInviteCode && customInviteCode.toString().trim()) {
      inviteCode = customInviteCode.toString().trim().toUpperCase();
      const existingGymCode = await prisma.gym.findUnique({ where: { inviteCode } });
      if (existingGymCode) {
        res.status(400).json({ error: `Gym code '${inviteCode}' is already taken. Please choose another unique code.` });
        return;
      }
    } else {
      inviteCode = await generateUniqueGymInviteCode();
    }

    const cleanBizName = targetBizName;
    const slugBase = cleanBizName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${slugBase || 'gym'}-${crypto.randomInt(100, 999)}`;
    const staticQrCodeHash = `GYM_${cleanBizName.replace(/\s+/g, '_').toUpperCase()}_STATIC_${Date.now()}`;
    const exitQrCodeHash = `GYM_${cleanBizName.replace(/\s+/g, '_').toUpperCase()}_EXIT_${Date.now()}`;

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const gym = await tx.gym.create({
        data: {
          name: cleanBizName,
          slug,
          inviteCode,
          address: (address || 'Main Gym Facility').trim(),
          city: city?.trim() || null,
          state: state?.trim() || null,
          staticQrCodeHash,
          exitQrCodeHash,
          ownerContactEmail: cleanEmail,
          ownerContactPhone: phone?.trim() || null,
          geofenceRadiusMeters: 50.0
        }
      });

      await tx.facility.create({
        data: {
          id: gym.id,
          gymId: gym.id,
          name: gym.name,
          address: gym.address,
          latitude: 0,
          longitude: 0,
          geofenceRadiusMeters: 50.0,
          staticQrCodeHash: gym.staticQrCodeHash,
          exitQrCodeHash: gym.exitQrCodeHash,
          ownerContactEmail: cleanEmail,
          ownerContactPhone: phone?.trim() || ''
        }
      });

      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          fullName: ownerName.trim(),
          phone: phone?.trim() || null,
          role: 'GYM_OWNER',
          gymId: gym.id,
          facilityId: gym.id
        }
      });

      return { gym, user };
    });

    const tokenPayload: JwtPayload = {
      userId: result.user.id,
      email: result.user.email,
      role: 'GYM_OWNER',
      gymId: result.gym.id,
      facilityId: result.gym.id
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '3650d' });

    res.status(201).json({
      success: true,
      message: `Gym workspace '${result.gym.name}' created! Access code: ${result.gym.inviteCode}`,
      token,
      gym: result.gym,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
        phone: result.user.phone,
        gymId: result.gym.id,
        gym: result.gym
      }
    });
  } catch (error: any) {
    console.error('registerBusiness error:', error);
    res.status(500).json({ error: 'Failed to register gym business. Please try again.' });
  }
}

export async function register(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, password, fullName, phone, role, gymCode, gymId, facilityId } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Email, password, and full name are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      res.status(409).json({ error: 'A user with this email address already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole: UserRole = role || 'MEMBER';

    // Resolve tenant gym
    let targetGymId = gymId;
    if (gymCode) {
      const cleanCode = gymCode.toString().trim().toUpperCase();
      const matchedGym = await prisma.gym.findFirst({
        where: {
          OR: [
            { inviteCode: cleanCode },
            { slug: cleanCode.toLowerCase() },
            { id: cleanCode }
          ]
        }
      });
      if (matchedGym) {
        targetGymId = matchedGym.id;
      } else {
        res.status(400).json({ error: `Invalid gym access code '${cleanCode}'. Please verify with your gym.` });
        return;
      }
    }

    if (!targetGymId) {
      const defaultGym = await prisma.gym.findFirst();
      if (defaultGym) targetGymId = defaultGym.id;
    }

    const resolvedFacilityId = await resolveFacilityId(facilityId || targetGymId);

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        fullName: fullName.trim(),
        phone: phone || null,
        role: assignedRole,
        gymId: targetGymId || null,
        facilityId: resolvedFacilityId
      },
      include: {
        gym: true,
        facility: true
      }
    });

    // If registering as a member, automatically grant an active 30-day trial/membership
    if (assignedRole === 'MEMBER') {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      await prisma.subscription.create({
        data: {
          userId: user.id,
          gymId: targetGymId || null,
          planName: 'Monthly Unlimited Pro Pass',
          startDate,
          endDate,
          status: 'ACTIVE',
          price: 65,
          paymentMethod: 'ONLINE'
        }
      });
    }

    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      gymId: user.gymId,
      facilityId: user.facilityId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '3650d' });

    res.status(201).json({
      message: 'Account created successfully. Welcome to IronVault!',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        gymId: user.gymId,
        gym: user.gym,
        facilityId: user.facilityId,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register account. Please try again.' });
  }
}

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, password, device_id } = req.body;
    const incomingDeviceId = (req.deviceId || device_id || req.headers['x-device-id'] || '').toString().trim();

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const cleanIdentifier = email.toLowerCase().trim();
    const queryEmails = [cleanIdentifier];
    if (cleanIdentifier === 'superadmin') {
      queryEmails.push('superadmin@ironvault.com', 'admin@ironvaultgym.com');
    } else if (cleanIdentifier === 'superadmin@ironvault.com') {
      queryEmails.push('admin@ironvaultgym.com');
    }

    const user = await prisma.user.findFirst({
      where: { email: { in: queryEmails } },
      include: { gym: true, facility: true }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Check if user account has a daily visit notice
    if (user.deviceStatus === 'FLAGGED_MULTI_DEVICE') {
      res.status(403).json({
        error: 'Daily Limit Reached: Multiple visits were detected today. Please check with the front desk staff for extra entry clearance.',
        deviceStatus: 'FLAGGED_MULTI_DEVICE'
      });
      return;
    }

    // For Members: Ensure pass is active and payments/renewals are not expired
    if (user.role === 'MEMBER') {
      const activeSub = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          status: 'ACTIVE',
          endDate: { gt: new Date() }
        }
      });

      if (!activeSub) {
        res.status(403).json({
          error: 'Membership Expired: Your pass has expired or payment was not completed on time. Please visit the gym front desk to renew your pass.',
          code: 'MEMBERSHIP_EXPIRED'
        });
        return;
      }
    }

    const effectiveGymId = user.gymId || user.facilityId;

    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      gymId: effectiveGymId,
      facilityId: user.facilityId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '3650d' });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        gymId: user.gymId,
        gym: user.gym,
        facilityId: user.facilityId,
        facility: user.facility,
        deviceStatus: user.deviceStatus,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to process login.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        gym: true,
        facility: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        healthProfile: true
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        error: 'Access Revoked: Your account has been removed or deactivated from the gym database.',
        code: 'ACCOUNT_DEACTIVATED'
      });
      return;
    }

    // For Members: Check that membership repayment is up to date & pass has not expired
    if (user.role === 'MEMBER') {
      const activeSub = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          status: 'ACTIVE',
          endDate: { gt: new Date() }
        }
      });

      if (!activeSub) {
        res.status(403).json({
          error: 'Membership Expired: Your pass has expired or payment was not completed on time. You have been logged out. Please visit the gym front desk to renew your pass.',
          code: 'MEMBERSHIP_EXPIRED'
        });
        return;
      }
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        gymId: user.gymId,
        gym: user.gym,
        facilityId: user.facilityId,
        facility: user.facility,
        boundDeviceId: user.boundDeviceId,
        boundDeviceName: user.boundDeviceName,
        deviceStatus: user.deviceStatus,
        avatarUrl: user.avatarUrl,
        subscriptions: user.subscriptions,
        healthProfile: user.healthProfile
      }
    });
  } catch (error: any) {
    console.error('getMe error:', error);
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
}

/**
 * Step 1: Send OTP to user's real email address for registration verification
 */
export async function sendSignupOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, password, fullName, phone, role, gymCode, gymId, facilityId } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Email, password, and full name are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    // Check if account already exists
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
      return;
    }

    // Resolve tenant gym
    let targetGymId = gymId;
    if (gymCode) {
      const cleanCode = gymCode.toString().trim().toUpperCase();
      const matchedGym = await prisma.gym.findFirst({
        where: {
          OR: [
            { inviteCode: cleanCode },
            { slug: cleanCode.toLowerCase() },
            { id: cleanCode }
          ]
        }
      });
      if (matchedGym) {
        targetGymId = matchedGym.id;
      } else {
        res.status(400).json({ error: `Invalid gym access code '${cleanCode}'. Please verify with your gym.` });
        return;
      }
    }

    if (!targetGymId) {
      const defaultGym = await prisma.gym.findFirst();
      if (defaultGym) targetGymId = defaultGym.id;
    }

    // Generate 6-digit numeric OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole: UserRole = role || 'MEMBER';
    const resolvedFacilityId = await resolveFacilityId(facilityId || targetGymId);

    const payload = JSON.stringify({
      fullName: fullName.trim(),
      passwordHash,
      phone: phone?.trim() || null,
      role: assignedRole,
      gymId: targetGymId || null,
      facilityId: resolvedFacilityId
    });

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

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

    // Send email via Gmail / Nodemailer
    const emailResult = await sendSignupOtpEmail({
      toEmail: cleanEmail,
      fullName: fullName.trim(),
      otpCode
    });

    res.json({
      success: true,
      message: emailResult.deliveredVia === 'GMAIL'
        ? `A 6-digit verification code was sent to ${cleanEmail}. Please check your inbox or spam.`
        : `Verification code generated for ${cleanEmail}.`,
      email: cleanEmail,
      deliveredVia: emailResult.deliveredVia
    });
  } catch (error: any) {
    console.error('sendSignupOtp error:', error);
    res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
}

/**
 * Step 2: Verify 6-digit OTP code and create member account
 */
export async function verifySignupOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body;

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
      res.status(404).json({ error: 'No verification request found for this email. Please request a new code.' });
      return;
    }

    if (new Date() > record.expiresAt) {
      await prisma.otpVerification.delete({ where: { email: cleanEmail } });
      res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
      return;
    }

    if (record.attempts >= 5) {
      await prisma.otpVerification.delete({ where: { email: cleanEmail } });
      res.status(429).json({ error: 'Too many incorrect attempts. Please request a fresh code.' });
      return;
    }

    if (record.otpCode !== cleanOtp) {
      await prisma.otpVerification.update({
        where: { email: cleanEmail },
        data: { attempts: { increment: 1 } }
      });
      res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
      return;
    }

    // OTP is valid! Parse payload and create user
    const parsed = JSON.parse(record.payload);

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      await prisma.otpVerification.delete({ where: { email: cleanEmail } });
      res.status(409).json({ error: 'Account already created. Please sign in.' });
      return;
    }

    const targetGymId = parsed.gymId || null;
    const resolvedFacilityId = await resolveFacilityId(parsed.facilityId || targetGymId);

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash: parsed.passwordHash,
        fullName: parsed.fullName,
        phone: parsed.phone,
        role: parsed.role,
        gymId: targetGymId,
        facilityId: resolvedFacilityId
      },
      include: {
        gym: true,
        facility: true
      }
    });

    // Automatically grant active 30-day Pro membership pass
    const passName = 'Monthly Unlimited Pro Pass';
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (user.role === 'MEMBER') {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          gymId: targetGymId,
          planName: passName,
          startDate,
          endDate,
          status: 'ACTIVE',
          price: 65,
          paymentMethod: 'ONLINE'
        }
      });
    }

    // Delete verified OTP record
    await prisma.otpVerification.delete({ where: { email: cleanEmail } });

    // Send Welcome Email asynchronously
    setImmediate(async () => {
      try {
        await sendWelcomeEmail({
          toEmail: cleanEmail,
          fullName: user.fullName,
          planName: passName,
          endDate
        });
      } catch (e: any) {
        console.warn('Welcome email error:', e.message);
      }
    });

    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      gymId: user.gymId,
      facilityId: user.facilityId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '3650d' });

    res.status(201).json({
      message: 'Email verified successfully! Welcome to IronVault.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        gymId: user.gymId,
        gym: user.gym,
        facilityId: user.facilityId,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error: any) {
    console.error('verifySignupOtp error:', error);
    res.status(500).json({ error: 'Failed to verify code and activate account.' });
  }
}

/**
 * Resend OTP code with rate-limiting
 */
export async function resendSignupOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const record = await prisma.otpVerification.findUnique({
      where: { email: cleanEmail }
    });

    if (!record) {
      res.status(404).json({ error: 'No pending registration found for this email. Please sign up again.' });
      return;
    }

    const timeSinceLastUpdate = Date.now() - new Date(record.updatedAt).getTime();
    if (timeSinceLastUpdate < 30 * 1000) {
      const waitSec = Math.ceil((30 * 1000 - timeSinceLastUpdate) / 1000);
      res.status(429).json({ error: `Please wait ${waitSec}s before requesting another code.` });
      return;
    }

    const newOtp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpVerification.update({
      where: { email: cleanEmail },
      data: {
        otpCode: newOtp,
        expiresAt,
        attempts: 0
      }
    });

    const parsed = JSON.parse(record.payload);
    await sendSignupOtpEmail({
      toEmail: cleanEmail,
      fullName: parsed.fullName || 'Member',
      otpCode: newOtp
    });

    res.json({
      success: true,
      message: `A fresh verification code has been sent to ${cleanEmail}.`
    });
  } catch (error: any) {
    console.error('resendSignupOtp error:', error);
    res.status(500).json({ error: 'Failed to resend verification code.' });
  }
}

/**
 * Member Login Step 1: Send 6-digit OTP code to member's Gmail
 */
export async function sendMemberLoginOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email address is required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      res.status(404).json({ error: `No gym account found for ${cleanEmail}. Please register a membership or ask the front desk.` });
      return;
    }

    // Generate 6-digit numeric OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    const payload = JSON.stringify({
      userId: user.id,
      email: cleanEmail,
      fullName: user.fullName,
      action: 'MEMBER_LOGIN'
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

    const emailResult = await sendMemberLoginOtpEmail({
      toEmail: cleanEmail,
      fullName: user.fullName,
      otpCode
    });

    res.json({
      success: true,
      message: `A 6-digit login verification code was sent via Gmail to ${cleanEmail}.`,
      email: cleanEmail,
      deliveredVia: emailResult.deliveredVia
    });
  } catch (error: any) {
    console.error('sendMemberLoginOtp error:', error);
    res.status(500).json({ error: 'Failed to dispatch login verification code.' });
  }
}

/**
 * Member Login Step 2: Verify OTP and log member into their account
 */
export async function verifyMemberLoginOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ error: 'Email and 6-digit login passcode are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const record = await prisma.otpVerification.findUnique({
      where: { email: cleanEmail }
    });

    if (!record) {
      res.status(404).json({ error: 'No active login request found. Please request a new code.' });
      return;
    }

    if (new Date() > new Date(record.expiresAt)) {
      await prisma.otpVerification.delete({ where: { email: cleanEmail } });
      res.status(410).json({ error: 'Sign-in code has expired. Please request a new one.' });
      return;
    }

    if (record.otpCode !== cleanOtp) {
      const attempts = record.attempts + 1;
      if (attempts >= 5) {
        await prisma.otpVerification.delete({ where: { email: cleanEmail } });
        res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
        return;
      }
      await prisma.otpVerification.update({
        where: { email: cleanEmail },
        data: { attempts }
      });
      res.status(400).json({ error: `Invalid verification code. ${5 - attempts} attempts remaining.` });
      return;
    }

    // Success! Find user and log in
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { gym: true, facility: true }
    });

    if (!user) {
      await prisma.otpVerification.delete({ where: { email: cleanEmail } });
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    // Delete OTP record
    await prisma.otpVerification.delete({ where: { email: cleanEmail } });

    const effectiveGymId = user.gymId || user.facilityId;

    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      gymId: effectiveGymId,
      facilityId: user.facilityId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '3650d' });

    res.json({
      message: 'Login successful. Welcome back!',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        gymId: user.gymId,
        gym: user.gym,
        facilityId: user.facilityId,
        facility: user.facility,
        deviceStatus: user.deviceStatus,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error: any) {
    console.error('verifyMemberLoginOtp error:', error);
    res.status(500).json({ error: 'Failed to verify login code.' });
  }
}

/**
 * 10. Forgot Password (Dispatches 6-digit OTP code to registered Gmail ID)
 */
export async function forgotPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Please enter your registered Gmail or email address.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { gym: true }
    });

    if (!user) {
      res.status(404).json({ error: 'No account found with this email address. Please check your Gmail or contact your gym admin.' });
      return;
    }

    // Generate secure 6-digit numeric OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Upsert into OtpVerification
    await prisma.otpVerification.upsert({
      where: { email: cleanEmail },
      create: {
        email: cleanEmail,
        otpCode,
        payload: JSON.stringify({ purpose: 'PASSWORD_RESET', userId: user.id }),
        expiresAt
      },
      update: {
        otpCode,
        payload: JSON.stringify({ purpose: 'PASSWORD_RESET', userId: user.id }),
        expiresAt,
        attempts: 0
      }
    });

    await sendPasswordResetOtpEmail({
      toEmail: cleanEmail,
      fullName: user.fullName,
      otpCode
    });

    res.json({
      success: true,
      message: `A 6-digit password reset code has been sent to your Gmail (${cleanEmail}).`
    });
  } catch (error: any) {
    console.error('Failed forgotPassword request:', error);
    res.status(500).json({ error: 'Internal server error processing password reset request.' });
  }
}

/**
 * 11. Reset Password (Verifies 6-digit OTP and updates password)
 */
export async function resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ error: 'Email, 6-digit verification code, and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();

    const record = await prisma.otpVerification.findUnique({ where: { email: cleanEmail } });

    if (!record || record.otpCode !== cleanOtp) {
      res.status(400).json({ error: 'Invalid or incorrect verification code. Please check your Gmail.' });
      return;
    }

    if (new Date() > record.expiresAt) {
      res.status(400).json({ error: 'This verification code has expired. Please request a fresh code.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { email: cleanEmail },
      data: { passwordHash },
      include: { gym: true }
    });

    // Delete OTP record after successful reset
    await prisma.otpVerification.delete({ where: { email: cleanEmail } });

    res.json({
      success: true,
      message: 'Password successfully updated! You can now log in with your new password.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        gym: user.gym
      }
    });
  } catch (error: any) {
    console.error('Failed resetPassword request:', error);
    res.status(500).json({ error: 'Internal server error resetting password.' });
  }
}
