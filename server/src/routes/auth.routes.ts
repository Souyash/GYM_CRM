import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { extractDeviceId } from '../middleware/device.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', extractDeviceId, login);
router.get('/me', authenticateJWT, getMe);

export default router;

