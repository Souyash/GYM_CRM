import { Response } from 'express';
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

