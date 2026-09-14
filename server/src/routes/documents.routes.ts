import { Router } from 'express';
import {
  getInvoicePdfController,
  getEnrollmentFormPdfController,
  submitEnrollmentFormController,
  resendMemberDocumentsWhatsAppController
} from '../controllers/documents.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Member and Staff access to view / download PDFs
router.get('/invoice/:subscriptionId/pdf', authenticateJWT, getInvoicePdfController);
router.get('/enrollment-form/:userId/pdf', authenticateJWT, getEnrollmentFormPdfController);

// Member submits their first-time personal details form
router.post('/submit-enrollment', authenticateJWT, submitEnrollmentFormController);

// Gym Owner / Staff action to re-send documents to Member's WhatsApp
router.post(
  '/resend-whatsapp/:userId',
  authenticateJWT,
  requireRole('SUPER_ADMIN', 'GYM_OWNER', 'MANAGER'),
  resendMemberDocumentsWhatsAppController
);

export default router;
