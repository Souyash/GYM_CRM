import { Router } from 'express';
import { getFacilities, getFacilityById, updateGeofence } from '../controllers/facility.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateJWT, getFacilities);
router.get('/:id', authenticateJWT, getFacilityById);
router.put('/:id/geofence', authenticateJWT, requireRole('SUPER_ADMIN'), updateGeofence);

export default router;

