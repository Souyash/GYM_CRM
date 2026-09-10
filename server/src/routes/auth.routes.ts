import { Router } from 'express';
import {
  register,
  login,
  getMe,
  sendSignupOtp,
  verifySignupOtp,
  resendSignupOtp
} from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { extractDeviceId } from '../middleware/device.middleware.js';

const router = Router();

// Registration & OTP Email Verification
router.post('/send-signup-otp', sendSignupOtp);
router.post('/verify-signup-otp', verifySignupOtp);
router.post('/resend-signup-otp', resendSignupOtp);

// Standard Direct Auth
router.post('/register', register);
router.post('/login', extractDeviceId, login);
router.get('/me', authenticateJWT, getMe);

export default router;

