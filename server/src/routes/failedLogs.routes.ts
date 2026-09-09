import { Router } from 'express';
import {
  getFailedLogs,
  getThreatStats,
  dismissAlert
} from '../controllers/failedLogs.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateJWT, requireRole('SUPER_ADMIN'), getFailedLogs);
router.get('/stats', authenticateJWT, requireRole('SUPER_ADMIN'), getThreatStats);
router.patch('/:id/dismiss', authenticateJWT, requireRole('SUPER_ADMIN'), dismissAlert);

export default router;

