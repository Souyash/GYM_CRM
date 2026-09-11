import { Router } from 'express';
import {
  onboardMember,
  sendOnboardOtp,
  verifyOnboardOtp,
  deskBilling,
  getMembers,
  getPlans,
  deleteMember
} from '../controllers/membership.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/plans', getPlans);
router.get('/', authenticateJWT, requireRole('MANAGER', 'SUPER_ADMIN', 'GYM_OWNER'), getMembers);
router.post('/onboard', authenticateJWT, requireRole('MANAGER', 'SUPER_ADMIN', 'GYM_OWNER'), onboardMember);
router.post('/onboard/send-otp', authenticateJWT, requireRole('MANAGER', 'SUPER_ADMIN', 'GYM_OWNER'), sendOnboardOtp);
router.post('/onboard/verify-otp', authenticateJWT, requireRole('MANAGER', 'SUPER_ADMIN', 'GYM_OWNER'), verifyOnboardOtp);
router.post('/bill', authenticateJWT, requireRole('MANAGER', 'SUPER_ADMIN', 'GYM_OWNER'), deskBilling);
router.delete('/:id', authenticateJWT, requireRole('MANAGER', 'SUPER_ADMIN', 'GYM_OWNER'), deleteMember);

export default router;

