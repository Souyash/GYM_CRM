import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest, resolveTenantGymId } from '../middleware/auth.middleware.js';
import {
  normalizeWhatsAppPhone,
  sendWhatsAppOtp,
  sendWelcomeAndBillWhatsApp,
  sendPaymentReceiptWhatsApp,
  generateInvoiceNumber
} from '../services/whatsapp.service.js';
import { runExpiryNotificationCheck } from '../services/whatsappScheduler.service.js';

/**
 * 1. Send OTP to Member's WhatsApp Phone Number
 */
export async function sendWhatsAppOtpController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { phone, fullName, gymId } = req.body;

    if (!phone) {
      res.status(400).json({ error: 'Phone number is required for WhatsApp OTP.' });
      return;
    }

    const normalizedPhone = normalizeWhatsAppPhone(phone);
    if (normalizedPhone.length < 10) {
      res.status(400).json({ error: 'Please provide a valid phone number with country code.' });
      return;
    }

    // Resolve gym name if gymId provided
    let gymName = 'FIDGIT Fitness';
    const targetGymId = resolveTenantGymId(req) || gymId;
    if (targetGymId) {
      const gym = await prisma.gym.findUnique({ where: { id: targetGymId } });
      if (gym) gymName = gym.name;
    }

    // Generate 6-digit numeric cryptographic OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Upsert into OtpVerification using normalized phone as key
    const recordKey = `wa_${normalizedPhone}`;
    await prisma.otpVerification.upsert({
      where: { email: recordKey },
      update: {
        otpCode,
        payload: JSON.stringify({ phone: normalizedPhone, fullName, gymId: targetGymId }),
        expiresAt,
        attempts: 0
      },
      create: {
        email: recordKey,
        otpCode,
        payload: JSON.stringify({ phone: normalizedPhone, fullName, gymId: targetGymId }),
        expiresAt,
        attempts: 0
      }
    });

    const result = await sendWhatsAppOtp({
      phone: normalizedPhone,
      otpCode,
      fullName,
      gymName,
      userId: req.user?.userId,
      gymId: targetGymId || undefined
    });

    res.json({
      success: true,
      message: result.status === 'DELIVERED'
        ? `A 6-digit verification code was sent to ${normalizedPhone} on WhatsApp.`
        : `WhatsApp verification code generated for ${normalizedPhone} (Sandbox/Simulated).`,
      phone: normalizedPhone,
      status: result.status,
      // For immediate dev sandbox preview convenience
      previewOtp: result.status === 'SIMULATED' ? otpCode : undefined
    });
  } catch (error: any) {
    console.error('sendWhatsAppOtpController error:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp verification code.' });
  }
}

/**
 * 2. Verify WhatsApp OTP
 */
export async function verifyWhatsAppOtpController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      res.status(400).json({ error: 'Phone number and 6-digit OTP code are required.' });
      return;
    }

    const normalizedPhone = normalizeWhatsAppPhone(phone);
    const cleanOtp = otp.toString().trim();
    const recordKey = `wa_${normalizedPhone}`;

    const record = await prisma.otpVerification.findUnique({
      where: { email: recordKey }
    });

    if (!record) {
      res.status(404).json({ error: 'No active WhatsApp verification code found. Please request a new code.' });
      return;
    }

    if (new Date() > new Date(record.expiresAt)) {
      await prisma.otpVerification.delete({ where: { email: recordKey } });
      res.status(410).json({ error: 'Verification code has expired. Please request a new one.' });
      return;
    }

    if (record.otpCode !== cleanOtp) {
      await prisma.otpVerification.update({
        where: { email: recordKey },
        data: { attempts: { increment: 1 } }
      });
      res.status(400).json({ error: 'Incorrect verification code. Please check your WhatsApp and try again.' });
      return;
    }

    // Success: Delete verification record
    await prisma.otpVerification.delete({ where: { email: recordKey } });

    // If user is currently logged in, update their profile with verified WhatsApp status
    if (req.user?.userId) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          whatsAppPhone: normalizedPhone,
          isWhatsAppVerified: true,
          whatsAppNotificationsEnabled: true
        }
      });
    }

    res.json({
      success: true,
      verified: true,
      message: 'WhatsApp phone number successfully verified!',
      phone: normalizedPhone
    });
  } catch (error: any) {
    console.error('verifyWhatsAppOtpController error:', error);
    res.status(500).json({ error: 'Failed to verify WhatsApp code.' });
  }
}

/**
 * 3. Send Bill & Welcome Packet to Member's WhatsApp on demand
 */
export async function sendWhatsAppBillController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { subscriptionId } = req.params;

    if (!subscriptionId) {
      res.status(400).json({ error: 'Subscription ID is required.' });
      return;
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: {
          include: {
            gym: true,
            healthProfile: true
          }
        },
        gym: true
      }
    });

    if (!subscription || !subscription.user) {
      res.status(404).json({ error: 'Subscription or member not found.' });
      return;
    }

    const user = subscription.user;
    const targetPhone = user.whatsAppPhone || user.phone;

    if (!targetPhone) {
      res.status(400).json({ error: 'Member does not have a registered phone number.' });
      return;
    }

    const gymName = subscription.gym?.name || user.gym?.name || 'FIDGIT Fitness';
    const inviteCode = subscription.gym?.inviteCode || user.gym?.inviteCode || '100001';

    let invoiceNumber = subscription.invoiceNumber;
    if (!invoiceNumber) {
      invoiceNumber = generateInvoiceNumber();
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { invoiceNumber }
      });
    }

    const result = await sendWelcomeAndBillWhatsApp({
      phone: targetPhone,
      fullName: user.fullName,
      gymName,
      inviteCode,
      planName: subscription.planName,
      durationDays: Math.round((subscription.endDate.getTime() - subscription.startDate.getTime()) / (1000 * 60 * 60 * 24)) || 30,
      price: subscription.price,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      invoiceNumber,
      paymentMethod: subscription.paymentMethod || 'CASH',
      userId: user.id,
      gymId: subscription.gymId || undefined,
      healthGoals: user.healthProfile?.primaryGoal || undefined
    });

    res.json({
      success: true,
      message: `Bill and enrollment details dispatched to ${targetPhone} on WhatsApp.`,
      status: result.status,
      invoiceNumber,
      phone: targetPhone
    });
  } catch (error: any) {
    console.error('sendWhatsAppBillController error:', error);
    res.status(500).json({ error: 'Failed to dispatch WhatsApp bill.' });
  }
}

/**
 * 4. Get WhatsApp Delivery Logs
 */
export async function getWhatsAppLogsController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const callerGymId = resolveTenantGymId(req);
    const { phone, userId } = req.query;

    const where: any = {};
    if (callerGymId) where.gymId = callerGymId;
    if (phone) where.recipientPhone = normalizeWhatsAppPhone(String(phone));
    if (userId) where.userId = String(userId);

    const logs = await prisma.whatsAppMessageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    res.json({ logs });
  } catch (error: any) {
    console.error('getWhatsAppLogsController error:', error);
    res.status(500).json({ error: 'Failed to retrieve WhatsApp logs.' });
  }
}

/**
 * 5. Trigger Prior Expiry Reminder Check Manually
 */
export async function triggerExpiryCheckController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const stats = await runExpiryNotificationCheck();
    res.json({
      success: true,
      message: `Expiry notification check completed: ${stats.checkedCount} subscriptions checked, ${stats.stage3Sent + stats.stage1Sent + stats.expiredSent} WhatsApp notifications sent.`,
      stats
    });
  } catch (error: any) {
    console.error('triggerExpiryCheckController error:', error);
    res.status(500).json({ error: 'Failed to run expiry check.' });
  }
}
