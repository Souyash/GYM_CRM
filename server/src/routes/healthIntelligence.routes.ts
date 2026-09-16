import { Router } from 'express';
import {
  getHealthIntelligenceSummary,
  getMembersWithHealthData,
  getMemberHealthProfile,
  onboardMemberWithHealth,
  exportHealthDataCsv,
  getMyHealthProfile,
  updateMyHealthProfile,
  sendPhoneOtp,
  verifyPhoneOtp,
  sendMemberHealthDetailsController
} from '../controllers/healthIntelligence.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Developer & Admin Marketing & Health Hub
router.get('/summary', authenticateJWT, requireRole('SUPER_ADMIN', 'MANAGER'), getHealthIntelligenceSummary);
router.get('/members', authenticateJWT, requireRole('SUPER_ADMIN', 'MANAGER'), getMembersWithHealthData);
router.get('/export-csv', authenticateJWT, requireRole('SUPER_ADMIN', 'MANAGER'), exportHealthDataCsv);

// 1-Click Action for Gym Owner: Send filled health details & PDF to member on WhatsApp
router.post('/member/:userId/send-health-details', authenticateJWT, requireRole('SUPER_ADMIN', 'MANAGER'), sendMemberHealthDetailsController);

// Admission with full Form 1 & Form 2
router.post('/onboard', authenticateJWT, requireRole('SUPER_ADMIN', 'MANAGER'), onboardMemberWithHealth);

// Individual member health profile
router.get('/member/:userId', authenticateJWT, requireRole('SUPER_ADMIN', 'MANAGER'), getMemberHealthProfile);

// Member self-service
router.get('/me', authenticateJWT, getMyHealthProfile);
router.put('/me', authenticateJWT, updateMyHealthProfile);
router.get('/my-profile', authenticateJWT, getMyHealthProfile);
router.put('/my-profile', authenticateJWT, updateMyHealthProfile);

// Phone OTP verification flow
router.post('/send-phone-otp', authenticateJWT, sendPhoneOtp);
router.post('/verify-phone-otp', authenticateJWT, verifyPhoneOtp);

export default router;
