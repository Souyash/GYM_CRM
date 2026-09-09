import { Router } from 'express';
import {
  getDeviceRequests,
  approveDeviceRequest,
  rejectDeviceRequest
} from '../controllers/device.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/requests', authenticateJWT, requireRole('SUPER_ADMIN'), getDeviceRequests);
router.post('/requests/:id/approve', authenticateJWT, requireRole('SUPER_ADMIN'), approveDeviceRequest);
router.post('/requests/:id/reject', authenticateJWT, requireRole('SUPER_ADMIN'), rejectDeviceRequest);

export default router;

