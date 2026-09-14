import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  generateMembershipBillPdf,
  generateEnrollmentFormPdf
} from '../services/pdfGenerator.service.js';
import { sendMemberDocumentsViaWhatsApp } from '../services/whatsapp.service.js';

/**
 * 1. Stream / Download Stamped Membership Bill PDF
 * GET /api/documents/invoice/:subscriptionId/pdf
 */
export async function getInvoicePdfController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { subscriptionId } = req.params;
    if (!subscriptionId) {
      res.status(400).json({ error: 'Subscription ID is required.' });
      return;
    }

    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true }
    });

    if (!sub) {
      res.status(404).json({ error: 'Subscription invoice not found.' });
      return;
    }

    // Permission check: Member can only view their own invoice; Staff/Admins can view all in gym
    const callerId = req.user?.userId;
    const callerRole = req.user?.role;
    if (callerRole === 'MEMBER' && sub.userId !== callerId) {
      res.status(403).json({ error: 'Unauthorized to view this invoice.' });
      return;
    }

    const pdfBuffer = await generateMembershipBillPdf(subscriptionId);
    const fileName = `Invoice_${sub.invoiceNumber || subscriptionId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('getInvoicePdfController error:', error);
    res.status(500).json({ error: 'Failed to generate membership bill PDF.' });
  }
}

/**
 * 2. Stream / Download Official Member Admission & KYC Form PDF
 * GET /api/documents/enrollment-form/:userId/pdf
 */
export async function getEnrollmentFormPdfController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'User ID is required.' });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    // Permission check: Member can view own form; Staff/Owner/Admin can view any
    const callerId = req.user?.userId;
    const callerRole = req.user?.role;
    if (callerRole === 'MEMBER' && userId !== callerId) {
      res.status(403).json({ error: 'Unauthorized to view this enrollment form.' });
      return;
    }

    const pdfBuffer = await generateEnrollmentFormPdf(userId);
    const cleanName = targetUser.fullName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Enrollment_Form_${cleanName}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('getEnrollmentFormPdfController error:', error);
    res.status(500).json({ error: 'Failed to generate member enrollment form PDF.' });
  }
}

/**
 * 3. Member Submits First-Time Personal Details & Admission Form
 * POST /api/documents/submit-enrollment
 */
export async function submitEnrollmentFormController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { gym: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const {
      fullName,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      emergencyContactName,
      emergencyContactPhone,
      emergencyRelation,
      address,
      city,
      state,
      pinCode,
      primaryGoal,
      targetTimeline,
      medicalHistory,
      signatureConsent
    } = req.body;

    if (!emergencyContactName || !emergencyContactPhone) {
      res.status(400).json({ error: 'Emergency contact name and phone are mandatory.' });
      return;
    }

    const parsedDob = dateOfBirth ? new Date(dateOfBirth) : null;

    // 1. Save or Update MemberEnrollmentDocument
    const enrollmentDoc = await prisma.memberEnrollmentDocument.upsert({
      where: { userId },
      update: {
        fullName: fullName || user.fullName,
        phone: phone || user.phone || '',
        email: user.email,
        dateOfBirth: parsedDob,
        gender: gender || null,
        bloodGroup: bloodGroup || 'O+',
        emergencyContactName,
        emergencyContactPhone,
        emergencyRelation: emergencyRelation || 'Family',
        address: address || 'Address on file',
        city: city || user.gym?.city || null,
        state: state || user.gym?.state || null,
        pinCode: pinCode || null,
        primaryGoal: primaryGoal || 'General Fitness',
        targetTimeline: targetTimeline || '3 Months',
        medicalHistory: medicalHistory || 'None declared',
        signatureConsent: Boolean(signatureConsent),
        signedAt: new Date()
      },
      create: {
        userId,
        gymId: user.gymId,
        fullName: fullName || user.fullName,
        phone: phone || user.phone || '',
        email: user.email,
        dateOfBirth: parsedDob,
        gender: gender || null,
        bloodGroup: bloodGroup || 'O+',
        emergencyContactName,
        emergencyContactPhone,
        emergencyRelation: emergencyRelation || 'Family',
        address: address || 'Address on file',
        city: city || user.gym?.city || null,
        state: state || user.gym?.state || null,
        pinCode: pinCode || null,
        primaryGoal: primaryGoal || 'General Fitness',
        targetTimeline: targetTimeline || '3 Months',
        medicalHistory: medicalHistory || 'None declared',
        signatureConsent: Boolean(signatureConsent),
        signedAt: new Date()
      }
    });

    // 2. Mark User as completed onboarding
    await prisma.user.update({
      where: { id: userId },
      data: {
        hasCompletedEnrollment: true,
        enrollmentFormSubmittedAt: new Date(),
        fullName: fullName || user.fullName,
        whatsAppPhone: phone || user.whatsAppPhone || user.phone,
        isWhatsAppVerified: true
      }
    });

    // 3. Keep MemberHealthProfile in sync
    try {
      await prisma.memberHealthProfile.upsert({
        where: { userId },
        update: {
          dateOfBirth: parsedDob,
          gender: gender || undefined,
          houseFlatStreet: address || undefined,
          city: city || undefined,
          state: state || undefined,
          pinCode: pinCode || undefined,
          primaryGoal: primaryGoal || undefined,
          targetTimeline: targetTimeline || undefined,
          healthConditions: medicalHistory ? JSON.stringify([medicalHistory]) : undefined
        },
        create: {
          userId,
          gymId: user.gymId,
          dateOfBirth: parsedDob,
          gender: gender || undefined,
          houseFlatStreet: address || undefined,
          city: city || undefined,
          state: state || undefined,
          pinCode: pinCode || undefined,
          primaryGoal: primaryGoal || undefined,
          targetTimeline: targetTimeline || undefined,
          healthConditions: medicalHistory ? JSON.stringify([medicalHistory]) : undefined
        }
      });
    } catch (healthErr) {
      console.warn('[Documents] Health profile sync error (non-fatal):', healthErr);
    }

    // 4. Automatically dispatch both Stamped Bill PDF & Enrollment Form PDF to Member's WhatsApp
    sendMemberDocumentsViaWhatsApp(userId).catch((err) => {
      console.error('[Documents] Background WhatsApp document dispatch error:', err);
    });

    res.json({
      success: true,
      message: 'Personal details and admission form saved successfully! Your official documents and stamped bill have been sent to your WhatsApp.',
      enrollmentDoc
    });
  } catch (error: any) {
    console.error('submitEnrollmentFormController error:', error);
    res.status(500).json({ error: 'Failed to submit enrollment particulars.' });
  }
}

/**
 * 4. Gym Owner / Admin 1-Click Action: Re-send Documents to Member's WhatsApp
 * POST /api/documents/resend-whatsapp/:userId
 */
export async function resendMemberDocumentsWhatsAppController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'User ID is required.' });
      return;
    }

    const result = await sendMemberDocumentsViaWhatsApp(userId);
    res.json({
      success: result.success,
      message: result.success
        ? 'Both Stamped Bill PDF and Admission Form PDF dispatched to member on WhatsApp.'
        : 'Failed to dispatch documents. Please verify WhatsApp device connection.',
      details: result
    });
  } catch (error: any) {
    console.error('resendMemberDocumentsWhatsAppController error:', error);
    res.status(500).json({ error: 'Failed to resend documents via WhatsApp.' });
  }
}

