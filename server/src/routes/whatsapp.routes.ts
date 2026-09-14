import { Router } from 'express';
import {
  sendWhatsAppOtpController,
  verifyWhatsAppOtpController,
  sendWhatsAppBillController,
  getWhatsAppLogsController,
  triggerExpiryCheckController
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

export default router;
