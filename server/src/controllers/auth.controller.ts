import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { JwtPayload, UserRole } from '../types/index.js';
import {
  emitMultiDeviceAlert,
  emitFailedAccessAlert
} from '../services/socket.service.js';
import { dispatchThreatAlerts } from '../services/notification.service.js';
import { sendSignupOtpEmail, sendWelcomeEmail } from '../services/email.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gym_super_secure_jwt_secret_key_2026_dev';

export async function register(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, password, fullName, phone, role, facilityId } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Email, password, and full name are required.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      res.status(409).json({ error: 'A user with this email address already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole: UserRole = role || 'MEMBER';

    // Find default facility if not passed
    let targetFacilityId = facilityId;
    if (!targetFacilityId) {
      const defaultFac = await prisma.facility.findFirst();
      if (defaultFac) targetFacilityId = defaultFac.id;
    }

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        phone: phone || null,
        role: assignedRole,
        facilityId: targetFacilityId || null
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        facilityId: true,
        createdAt: true
      }
    });

    // If registering as a member, automatically grant an active 30-day trial/membership
    if (assignedRole === 'MEMBER') {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      await prisma.subscription.create({
        data: {
          userId: user.id,
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
      facilityId: user.facilityId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully. Welcome to IronVault!',
      user,
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
    const userAgent = req.headers['user-agent'] || 'Unknown Client';

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { facility: true }
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

    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      facilityId: user.facilityId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
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
        facility: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        facilityId: user.facilityId,
        facility: user.facility,
        boundDeviceId: user.boundDeviceId,
        boundDeviceName: user.boundDeviceName,
        deviceStatus: user.deviceStatus,
        avatarUrl: user.avatarUrl,
        subscriptions: user.subscriptions
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
    const { email, password, fullName, phone, role, facilityId } = req.body;

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

    // Generate 6-digit numeric OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole: UserRole = role || 'MEMBER';

    let targetFacilityId = facilityId;
    if (!targetFacilityId) {
      const defaultFac = await prisma.facility.findFirst();
      if (defaultFac) targetFacilityId = defaultFac.id;
    }

    const payload = JSON.stringify({
      fullName: fullName.trim(),
      passwordHash,
      phone: phone?.trim() || null,
      role: assignedRole,
      facilityId: targetFacilityId || null
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

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash: parsed.passwordHash,
        fullName: parsed.fullName,
        phone: parsed.phone,
        role: parsed.role,
        facilityId: parsed.facilityId
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        facilityId: true,
        createdAt: true
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
      facilityId: user.facilityId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Email verified successfully! Welcome to IronVault.',
      user,
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

