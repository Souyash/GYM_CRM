import { Router } from 'express';
import {
  onboardMember,
  sendOnboardOtp,
  verifyOnboardOtp,
  deskBilling,
  getMembers,
  getPlans
} from '../controllers/membership.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/plans', getPlans);
router.get('/', authenticateJWT, requireRole('MANAGER', 'SUPER_ADMIN'), getMembers);
router.post('/onboard', authenticateJWT, requireRole('MANAGER', 'SUPER_ADMIN'), onboardMember);
router.post('/onboard/send-otp', authenticateJWT, requireRole('MANAGER', 'SUPER_ADMIN'), sendOnboardOtp);
router.post('/onboard/verify-otp', authenticateJWT, requireRole('MANAGER', 'SUPER_ADMIN'), verifyOnboardOtp);
router.post('/bill', authenticateJWT, requireRole('MANAGER', 'SUPER_ADMIN'), deskBilling);

export default router;

