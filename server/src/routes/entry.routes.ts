import { Router } from 'express';
import {
  processEntryScan,
  processExitScan,
  getActiveSession,
  scanAndLogin
} from '../controllers/entry.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { extractDeviceId } from '../middleware/device.middleware.js';

const router = Router();

// Check if authenticated member currently has an active in-gym workout session
router.get('/active-session', authenticateJWT, getActiveSession);

// Member scans static facility QR code to check-in while authenticated
router.post('/scan', authenticateJWT, extractDeviceId, processEntryScan);

// Member completes workout / scans exit gate QR
router.post('/exit', authenticateJWT, extractDeviceId, processExitScan);

// Member scans static facility QR code to authenticate and check-in or exit in 1 step
router.post('/scan-login', extractDeviceId, scanAndLogin);

export default router;
