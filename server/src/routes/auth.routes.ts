import { Router } from 'express';
import {
  register,
  login,
  getMe,
  sendSignupOtp,
  verifySignupOtp,
  resendSignupOtp,
  sendMemberLoginOtp,
  verifyMemberLoginOtp,
  registerBusiness,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { extractDeviceId } from '../middleware/device.middleware.js';

const router = Router();

// Business Onboarding (Khatabook SaaS style)
router.post('/register-business', registerBusiness);

// Password Recovery & Reset via Gmail OTP
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Registration & OTP Email Verification
router.post('/send-signup-otp', sendSignupOtp);
router.post('/verify-signup-otp', verifySignupOtp);
router.post('/resend-signup-otp', resendSignupOtp);

// Member Login via Gmail OTP
router.post('/send-login-otp', sendMemberLoginOtp);
router.post('/verify-login-otp', extractDeviceId, verifyMemberLoginOtp);

// Standard Direct Auth
router.post('/register', register);
router.post('/login', extractDeviceId, login);
router.get('/me', authenticateJWT, getMe);

export default router;

