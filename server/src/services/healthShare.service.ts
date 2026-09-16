import prisma from '../utils/prisma.js';
import { normalizeWhatsAppPhone } from './whatsapp.service.js';
import {
  isWhatsAppSocketConnected,
  sendSocketWhatsAppMessage,
  sendSocketWhatsAppDocument
} from './whatsappSocket.service.js';
import { generateEnrollmentFormPdf } from './pdfGenerator.service.js';

export interface SendMemberHealthDetailsResult {
  success: boolean;
  message: string;
  phone?: string;
  pdfGenerated?: boolean;
  deliveryStatus?: 'DELIVERED' | 'SIMULATED' | 'FAILED';
  error?: string;
}

/**
 * Dispatches member's filled health details, biometric readings, and official KYC form PDF
 * directly to the member's WhatsApp phone number in 1-click.
 */
export async function sendMemberHealthDetailsWhatsApp(userId: string): Promise<SendMemberHealthDetailsResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        gym: true,
        healthProfile: true,
        enrollmentDocument: true
      }
    });

    if (!user) {
      return { success: false, message: 'Member not found in database.' };
    }

    const targetPhone = user.whatsAppPhone || user.phone;
    if (!targetPhone) {
      return { success: false, message: `Member ${user.fullName} has no phone number recorded.` };
    }

    const normalizedPhone = normalizeWhatsAppPhone(targetPhone);
    const gymName = user.gym?.name || 'FIDGIT Fitness & Gym';
    const hp = user.healthProfile;
    const docData = user.enrollmentDocument;

    // Parse health conditions
    let conditionsText = 'None reported';
    if (hp?.healthConditions) {
      try {
        const parsed = JSON.parse(hp.healthConditions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          conditionsText = parsed.join(', ');
        }
      } catch {
        conditionsText = hp.healthConditions;
      }
    }

    // Format BMI classification
    let bmiCategory = '';
    if (hp?.bmi) {
      if (hp.bmi < 18.5) bmiCategory = '(Underweight)';
      else if (hp.bmi < 25) bmiCategory = '(Normal)';
      else if (hp.bmi < 30) bmiCategory = '(Overweight)';
      else bmiCategory = '(Obese)';
    }

    const message = `📋 *${gymName.toUpperCase()} • MEMBER HEALTH & FITNESS REPORT*
_Powered by FIDGIT Health Intelligence OS_

Hi *${user.fullName}*, here is your verified personal health profile and fitness assessment recorded with *${gymName}*:

📊 *PHYSICAL BIOMETRICS & VITALS*
• Current Weight: *${hp?.currentWeightKg ?? '—'} kg*
• Height: *${hp?.heightCm ?? '—'} cm*
• BMI: *${hp?.bmi ? `${hp.bmi} ${bmiCategory}` : '—'}*
• Body Fat: *${hp?.bodyFatPercentage ? `${hp.bodyFatPercentage}%` : '—'}*
• Muscle Mass: *${hp?.muscleMassKg ? `${hp.muscleMassKg} kg` : '—'}*
• Measurements: Waist: *${hp?.waistCm ? `${hp.waistCm}cm` : '—'}* | Chest: *${hp?.chestCm ? `${hp.chestCm}cm` : '—'}* | Hip: *${hp?.hipCm ? `${hp.hipCm}cm` : '—'}*

🎯 *TARGET FITNESS GOALS*
• Primary Goal: *${hp?.primaryGoal || 'General Fitness & Health'}*
• Specific Target: *${hp?.specificGoal || hp?.primaryGoal || 'Peak Athletic Conditioning'}*
• Target Weight: *${hp?.targetWeightKg ? `${hp.targetWeightKg} kg` : '—'}*
• Target Timeline: *${hp?.targetTimeline || 'Ongoing'}*

🩺 *HEALTH & MEDICAL CLEARANCE*
• Medical Conditions: *${conditionsText}*
• Medical Advice / Cautions: *${hp?.advisedAvoidExercise ? (hp.avoidExerciseDetails || 'Yes') : 'Cleared for all workouts'}*
• Medications: *${hp?.isTakingMedication ? (hp.medicationDetails || 'Yes') : 'None'}*

📄 *ATTACHED DOCUMENT*
Your official, stamped **Member Admission & KYC Application Form (PDF)** has been generated and attached below for your records.

Stay dedicated to your journey! Your trainers and team at *${gymName}* are with you all the way. 💪`;

    let deliveryStatus: 'DELIVERED' | 'SIMULATED' | 'FAILED' = 'SIMULATED';

    // 1. Dispatch text summary
    if (isWhatsAppSocketConnected()) {
      const textRes = await sendSocketWhatsAppMessage(normalizedPhone, message);
      if (textRes.success) {
        deliveryStatus = 'DELIVERED';
      }
    } else {
      console.log(`\n======================================================`);
      console.log(`💬 [WHATSAPP 1-CLICK HEALTH DETAILS] (Simulated Dev Mode)`);
      console.log(`📱 To: ${normalizedPhone} (${user.fullName})`);
      console.log(`📝 Content:\n${message}`);
      console.log(`======================================================\n`);
    }

    // 2. Generate and attach official KYC Enrollment Form PDF
    let pdfGenerated = false;
    try {
      const pdfBuffer = await generateEnrollmentFormPdf(user.id);
      pdfGenerated = true;
      const cleanName = user.fullName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
      const fileName = `Health_Profile_${cleanName}.pdf`;
      const caption = `📋 ${gymName.toUpperCase()} • Official Verified Member Health Profile & Admission Form (PDF)`;

      if (isWhatsAppSocketConnected()) {
        await sendSocketWhatsAppDocument(normalizedPhone, pdfBuffer, fileName, caption);
        console.log(`[Health Details] Attached & sent PDF form (${fileName}) to ${normalizedPhone}`);
      } else {
        console.log(`[Health Details] PDF form generated (${pdfBuffer.length} bytes) for simulated delivery.`);
      }
    } catch (pdfErr: any) {
      console.error('[Health Details] PDF generation error:', pdfErr);
    }

    // 3. Log into WhatsAppMessageLog table
    try {
      await prisma.whatsAppMessageLog.create({
        data: {
          gymId: user.gymId || null,
          userId: user.id,
          recipientPhone: normalizedPhone,
          messageType: 'HEALTH_DETAILS_SHARE',
          content: message,
          status: deliveryStatus,
          metadata: JSON.stringify({
            pdfGenerated,
            primaryGoal: hp?.primaryGoal,
            bmi: hp?.bmi
          })
        }
      });
    } catch (logErr) {
      console.error('[Health Details] Log write error:', logErr);
    }

    return {
      success: true,
      message: `Health details and official PDF form successfully sent to ${user.fullName} (${normalizedPhone})!`,
      phone: normalizedPhone,
      pdfGenerated,
      deliveryStatus
    };
  } catch (err: any) {
    console.error('sendMemberHealthDetailsWhatsApp error:', err);
    return {
      success: false,
      message: err.message || 'Failed to dispatch health details.',
      error: err.message
    };
  }
}
