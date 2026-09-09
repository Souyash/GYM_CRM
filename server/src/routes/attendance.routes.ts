import { Router } from 'express';
import {
  getLiveAttendance,
  getMyAttendanceHistory,
  manualDeskCheckout
} from '../controllers/attendance.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/live', authenticateJWT, requireRole('MANAGER', 'SUPER_ADMIN'), getLiveAttendance);
router.post('/:id/checkout', authenticateJWT, requireRole('MANAGER', 'SUPER_ADMIN'), manualDeskCheckout);
router.get('/my-history', authenticateJWT, getMyAttendanceHistory);

export default router;

