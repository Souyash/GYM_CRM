import { Router } from 'express';
import { handleSecurityAlertWebhook } from '../controllers/webhook.controller.js';

const router = Router();

router.post('/security-alert', handleSecurityAlertWebhook);

export default router;

