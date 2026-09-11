import { Router } from 'express';
import {
  lookupGymByCode,
  getAllGyms,
  getMyGym,
  getGymById,
  updateGym
} from '../controllers/gym.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public route: Join gym 6-digit access code lookup
router.get('/lookup/:code', lookupGymByCode);

// Authenticated routes
router.get('/me', authenticateJWT, getMyGym);
router.get('/', authenticateJWT, requireRole('SUPER_ADMIN'), getAllGyms);
router.get('/:id', authenticateJWT, getGymById);
router.put('/:id', authenticateJWT, requireRole('SUPER_ADMIN', 'GYM_OWNER'), updateGym);

export default router;
