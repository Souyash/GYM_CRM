import { Router } from 'express';
import {
  sendWhatsAppOtpController,
  verifyWhatsAppOtpController,
  sendWhatsAppBillController,
  getWhatsAppLogsController,
  triggerExpiryCheckController,
  getWhatsAppDeviceStatusController,
  disconnectWhatsAppDeviceController,
  sendWhatsAppDeviceTestController
} from '../controllers/whatsapp.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public / Onboarding OTP routes
router.post('/send-otp', sendWhatsAppOtpController);
router.post('/verify-otp', verifyWhatsAppOtpController);

// Authenticated WhatsApp Actions
router.post('/send-bill/:subscriptionId', authenticateJWT, sendWhatsAppBillController);
router.get('/logs', authenticateJWT, getWhatsAppLogsController);
router.post('/trigger-expiry-check', authenticateJWT, requireRole('SUPER_ADMIN', 'GYM_OWNER', 'MANAGER'), triggerExpiryCheckController);

// WhatsApp Linked Device (Scan QR) Routes
router.get('/device-status', authenticateJWT, getWhatsAppDeviceStatusController);
router.post('/device-disconnect', authenticateJWT, requireRole('SUPER_ADMIN', 'GYM_OWNER', 'MANAGER'), disconnectWhatsAppDeviceController);
router.post('/device-test', authenticateJWT, requireRole('SUPER_ADMIN', 'GYM_OWNER', 'MANAGER'), sendWhatsAppDeviceTestController);

export default router;
