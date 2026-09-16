import prisma from '../utils/prisma.js';

export interface SendWhatsAppOtpParams {
  phone: string;
  otpCode: string;
  fullName?: string;
  gymName?: string;
  userId?: string;
  gymId?: string;
}

export interface SendWelcomeAndBillParams {
  phone?: string;
  recipientPhone?: string;
  fullName: string;
  gymName?: string;
  inviteCode?: string;
  planName: string;
  durationDays?: number;
  price?: number;
  amount?: number;
  startDate: Date | string;
  endDate: Date | string;
  invoiceNumber: string;
  paymentMethod?: string;
  userId?: string;
  gymId?: string;
  healthGoals?: string;
  email?: string;
  gymAddress?: string;
  gymPhone?: string;
  subscriptionId?: string;
}

export interface SendExpiryReminderParams {
  phone?: string;
  recipientPhone?: string;
  fullName: string;
  gymName?: string;
  planName: string;
  endDate: Date | string;
  daysRemaining: number;
  userId?: string;
  gymId?: string;
}

export interface SendPaymentReceiptParams {
  phone?: string;
  recipientPhone?: string;
  fullName: string;
  gymName?: string;
  planName: string;
  price?: number;
  amount?: number;
  startDate?: Date | string;
  endDate: Date | string;
  invoiceNumber: string;
  paymentMethod?: string;
  userId?: string;
  gymId?: string;
  subscriptionId?: string;
}

/**
 * Normalizes user phone number to standard E.164 format.
 * Defaults to +91 (India) if 10-digit number is provided without international prefix.
 */
export function normalizeWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');

  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned; // Standard 10-digit default
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Generates an invoice number like INV-2026-89421
 */
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `INV-${year}-${rand}`;
}

import {
  isWhatsAppSocketConnected,
  sendSocketWhatsAppMessage,
  sendSocketWhatsAppDocument
} from './whatsappSocket.service.js';
import {
  generateMembershipBillPdf,
  generateEnrollmentFormPdf
} from './pdfGenerator.service.js';
import { exportDatabaseSnapshot } from '../utils/dbPersistence.js';

/**
 * Low-level dispatch function:
 * Supports WhatsApp Linked Device (Socket), Meta Cloud API, and local Developer Sandbox simulation.
 */
async function dispatchWhatsAppMessage(
  recipientPhone: string,
  content: string,
  messageType: string,
  metadata?: Record<string, any>,
  userId?: string,
  gymId?: string
): Promise<{ success: boolean; status: 'DELIVERED' | 'SIMULATED' | 'FAILED'; error?: string }> {
  const normalizedPhone = normalizeWhatsAppPhone(recipientPhone);

  const metaToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  let deliveryStatus: 'DELIVERED' | 'SIMULATED' | 'FAILED' = 'SIMULATED';
  let deliveryError: string | undefined;

  // 1. Priority: WhatsApp Linked Device (Baileys Phone Socket)
  if (isWhatsAppSocketConnected()) {
    const socketRes = await sendSocketWhatsAppMessage(normalizedPhone, content);
    if (socketRes.success) {
      deliveryStatus = 'DELIVERED';
      console.log(`[WhatsApp Linked Device] Delivered message (${messageType}) to ${normalizedPhone}, MsgId: ${socketRes.messageId}`);
    } else {
      console.warn(`[WhatsApp Socket Warning] Socket dispatch failed: ${socketRes.error}. Falling back to secondary channels...`);
      deliveryError = socketRes.error;
    }
  }

  // 2. Secondary: Meta Cloud API (if configured and socket was not used/failed)
  if (deliveryStatus !== 'DELIVERED' && metaToken && phoneNumberId) {
    try {
      const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone.replace('+', ''),
          type: 'text',
          text: { preview_url: true, body: content }
        })
      });

      const responseData: any = await response.json();
      if (response.ok && responseData?.messages?.[0]?.id) {
        deliveryStatus = 'DELIVERED';
        deliveryError = undefined;
        console.log(`[WhatsApp Live Meta API] Delivered message (${messageType}) to ${normalizedPhone}, MsgId: ${responseData.messages[0].id}`);
      } else {
        deliveryStatus = 'FAILED';
        deliveryError = responseData?.error?.message || 'Meta API returned an error';
        console.warn(`[WhatsApp API Warning] Meta API error: ${deliveryError}`);
      }
    } catch (err: any) {
      deliveryStatus = 'FAILED';
      deliveryError = err.message;
      console.error(`[WhatsApp API Exception]`, err);
    }
  } else if (deliveryStatus !== 'DELIVERED') {
    // 3. Zero-Config Developer Simulation Mode (when neither socket nor Meta API delivered)
    deliveryStatus = 'SIMULATED';
    console.log(`\n======================================================`);
    console.log(`💬 [WHATSAPP DISPATCH] (Simulated Dev Mode)`);
    console.log(`📱 To: ${normalizedPhone}`);
    console.log(`🏷️ Type: ${messageType}`);
    console.log(`📝 Content:\n${content}`);
    console.log(`======================================================\n`);
  }

  // Persist record in WhatsAppMessageLog
  try {
    await prisma.whatsAppMessageLog.create({
      data: {
        gymId: gymId || null,
        userId: userId || null,
        recipientPhone: normalizedPhone,
        messageType,
        content,
        status: deliveryStatus,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });
  } catch (dbErr) {
    console.error(`[WhatsApp Service] Failed to write WhatsAppMessageLog:`, dbErr);
  }

  return {
    success: deliveryStatus !== 'FAILED',
    status: deliveryStatus,
    error: deliveryError
  };
}

/**
 * 1. Send OTP Verification Code on WhatsApp
 */
export async function sendWhatsAppOtp(params: SendWhatsAppOtpParams) {
  const { phone, otpCode, fullName, gymName = 'FIDGIT', userId, gymId } = params;

  const content = `🏋️ *${gymName.toUpperCase()} • SECURITY OTP*
  
Hi ${fullName || 'Athlete'}, your 6-digit WhatsApp verification code is:

👉 *${otpCode}* 👈

Use this code to verify your phone number and activate your gym pass. This code expires in 10 minutes.

_Do not share this OTP with anyone for your account security._`;

  return await dispatchWhatsAppMessage(
    phone,
    content,
    'OTP',
    { otpCode, gymName },
    userId,
    gymId
  );
}

/**
 * 2. Send Welcome Packet & Membership Bill / Receipt on WhatsApp
 */
export async function sendWelcomeAndBillWhatsApp(params: SendWelcomeAndBillParams) {
  const targetPhone = params.recipientPhone || params.phone || '';
  const gymName = params.gymName || 'FIDGIT Fitness & Gym';
  const inviteCode = params.inviteCode || 'PASS-ACTIVE';
  const paymentMethod = params.paymentMethod || 'CASH';
  const durationDays = params.durationDays || Math.max(1, Math.round((new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / (24 * 60 * 60 * 1000)));

  const {
    fullName,
    planName,
    price,
    startDate,
    endDate,
    invoiceNumber,
    userId,
    gymId,
    healthGoals
  } = params;

  const startDateStr = new Date(startDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const endDateStr = new Date(endDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const priceValue = Number(params.price ?? params.amount ?? 0);

  const content = `🎉 *WELCOME TO ${gymName.toUpperCase()}!*
_Powered by FIDGIT Smart Gym OS_

Hi *${fullName}*, your gym membership account has been verified and activated! Here are your official enrollment details and invoice:

📋 *MEMBERSHIP SUMMARY*
• Member Name: *${fullName}*
• Gym Facility: *${gymName}*
• Access Pass ID: *#${inviteCode}*
• Active Plan: *${planName}* (${durationDays} Days)
• Status: *ACTIVE* 🟢
• Validity: *${startDateStr}* to *${endDateStr}*
${healthGoals ? `• Fitness Target: *${healthGoals}*\n` : ''}
🧾 *DIGITAL TAX INVOICE & RECEIPT*
• Invoice #: *${invoiceNumber}*
• Date: *${startDateStr}*
• Amount Paid: *₹${priceValue.toFixed(2)}*
• Mode of Payment: *${paymentMethod}*
• Entrance QR Turnstile: *UNLOCKED & ACTIVE* ⚡

📱 *HOW TO ENTER THE GYM:*
1. Open the FIDGIT mobile app on your smartphone.
2. Tap *Scanner* and scan the QR code located at the entrance gate.
3. Access is verified in under 1 second!

Keep this receipt for your records. Have a powerful workout today! 💪`;

  const dispatchResult = await dispatchWhatsAppMessage(
    targetPhone,
    content,
    'WELCOME_PACKET',
    {
      invoiceNumber,
      planName,
      price,
      startDate: startDateStr,
      endDate: endDateStr,
      paymentMethod
    },
    userId,
    gymId
  );

  // Automatically generate and attach the official Stamped Membership Bill PDF
  try {
    let subId = params.subscriptionId;
    if (!subId && invoiceNumber) {
      const found = await prisma.subscription.findFirst({ where: { invoiceNumber } });
      if (found) subId = found.id;
    }
    if (!subId && userId) {
      const found = await prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
      if (found) subId = found.id;
    }

    if (subId) {
      const billPdfBuffer = await generateMembershipBillPdf(subId);
      const invoiceNo = invoiceNumber || 'INV-ACTIVE';
      const cleanFileName = `Membership_Bill_${invoiceNo}.pdf`;
      const caption = `🧾 *${gymName.toUpperCase()}* • Official Membership Tax Invoice & Receipt (#${invoiceNo}) with Authorized Stamp`;
      const normalizedPhone = normalizeWhatsAppPhone(targetPhone);

      if (isWhatsAppSocketConnected()) {
        await sendSocketWhatsAppDocument(normalizedPhone, billPdfBuffer, cleanFileName, caption);
        console.log(`[WhatsApp Document] Attached and sent bill PDF (${cleanFileName}) to ${normalizedPhone}`);
      } else {
        console.log(`[WhatsApp Document] Bill PDF generated (${billPdfBuffer.length} bytes) for simulated delivery to ${normalizedPhone}.`);
      }
    }
  } catch (pdfErr) {
    console.error('[WhatsApp Document] Error attaching bill PDF on joining:', pdfErr);
  }

  // Persist database snapshot asynchronously
  exportDatabaseSnapshot().catch(() => {});

  return dispatchResult;
}

/**
 * 3. Send Prior Expiry Reminders on WhatsApp (5-Day, 3-Day, 1-Day, and Day-of)
 */
export async function sendExpiryReminderWhatsApp(params: SendExpiryReminderParams) {
  const targetPhone = params.recipientPhone || params.phone || '';
  const gymName = params.gymName || 'FIDGIT Fitness & Gym';
  const { fullName, planName, endDate, daysRemaining, userId, gymId } = params;

  const endDateStr = new Date(endDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  let header = '';
  let body = '';

  if (daysRemaining === 5) {
    header = `⚠️ *${gymName.toUpperCase()} • MEMBERSHIP RENEWAL NOTICE (5 DAYS LEFT)*`;
    body = `Hi *${fullName}*, this is a friendly reminder that your *${planName}* gym membership will expire in *5 days* on *${endDateStr}*.

To prevent any interruption or delay at the entrance turnstiles, please renew your membership early at the front desk or through your member portal.

_Note: Once your renewal payment is received, all expiry alerts are automatically turned off._`;
  } else if (daysRemaining === 3) {
    header = `⚠️ *${gymName.toUpperCase()} • MEMBERSHIP NOTICE (3 DAYS LEFT)*`;
    body = `Hi *${fullName}*, your *${planName}* pass will expire in *3 days* on *${endDateStr}*.

Avoid interruption to your entrance turnstile access by renewing early at the front desk or via your member app.

_Note: Once renewal payment is processed, all expiry alerts are automatically turned off._`;
  } else if (daysRemaining === 1) {
    header = `🚨 *URGENT: MEMBERSHIP EXPIRES TOMORROW*`;
    body = `Hi *${fullName}*, this is an important reminder that your gym pass at *${gymName}* expires *TOMORROW (${endDateStr})*.

Please visit the front desk to complete your fee payment and keep your training streak uninterrupted!`;
  } else {
    header = `🔒 *MEMBERSHIP EXPIRED • ${gymName.toUpperCase()}*`;
    body = `Hi *${fullName}*, your gym membership expired today (${endDateStr}).

Your turnstile QR access pass has been temporarily paused. Renew at the desk today to immediately restore entrance access.`;
  }

  const content = `${header}\n\n${body}\n\n_FIDGIT Automated Membership Alert_`;

  return await dispatchWhatsAppMessage(
    targetPhone,
    content,
    'EXPIRY_REMINDER',
    { daysRemaining, endDate: endDateStr, planName },
    userId,
    gymId
  );
}

/**
 * 4. Send Payment Receipt on WhatsApp (Auto-turns off reminders)
 */
export async function sendPaymentReceiptWhatsApp(params: SendPaymentReceiptParams) {
  const targetPhone = params.recipientPhone || params.phone || '';
  const gymName = params.gymName || 'FIDGIT Fitness & Gym';
  const paymentMethod = params.paymentMethod || 'CASH';
  const { fullName, planName, price, endDate, invoiceNumber, userId, gymId } = params;

  const endDateStr = new Date(endDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const priceValue = Number(params.price ?? params.amount ?? 0);

  const content = `✅ *PAYMENT CONFIRMED • RENEWAL RECEIPT*
*${gymName.toUpperCase()}*

Hi *${fullName}*, your payment has been successfully recorded!

🧾 *OFFICIAL RECEIPT DETAILS*
• Invoice #: *${invoiceNumber}*
• Plan Renewed: *${planName}*
• Amount Paid: *₹${priceValue.toFixed(2)}*
• Payment Mode: *${paymentMethod}*
• New Expiration Date: *${endDateStr}*
• Entrance Status: *ACTIVE & UNLOCKED* 🟢

🔔 *NOTIFICATION STATUS:*
Your membership expiry reminders have been *TURNED OFF*. Your entrance QR pass is valid and fully active.

Thank you for training with us! 💪`;

  const dispatchResult = await dispatchWhatsAppMessage(
    targetPhone,
    content,
    'RENEWAL_CONFIRMATION',
    { invoiceNumber, planName, price, endDate: endDateStr, paymentMethod },
    userId,
    gymId
  );

  // Automatically generate and attach renewal Bill PDF
  try {
    let subId = params.subscriptionId;
    if (!subId && invoiceNumber) {
      const found = await prisma.subscription.findFirst({ where: { invoiceNumber } });
      if (found) subId = found.id;
    }
    if (!subId && userId) {
      const found = await prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
      if (found) subId = found.id;
    }

    if (subId) {
      const billPdfBuffer = await generateMembershipBillPdf(subId);
      const invoiceNo = invoiceNumber || 'INV-RENEW';
      const cleanFileName = `Renewal_Receipt_${invoiceNo}.pdf`;
      const caption = `🧾 *${gymName.toUpperCase()}* • Official Renewal Receipt & Stamped Tax Invoice (#${invoiceNo})`;
      const normalizedPhone = normalizeWhatsAppPhone(targetPhone);

      if (isWhatsAppSocketConnected()) {
        await sendSocketWhatsAppDocument(normalizedPhone, billPdfBuffer, cleanFileName, caption);
        console.log(`[WhatsApp Document] Attached and sent renewal bill PDF (${cleanFileName}) to ${normalizedPhone}`);
      } else {
        console.log(`[WhatsApp Document] Renewal bill PDF generated (${billPdfBuffer.length} bytes) for simulated delivery to ${normalizedPhone}.`);
      }
    }
  } catch (pdfErr) {
    console.error('[WhatsApp Document] Error attaching renewal bill PDF:', pdfErr);
  }

  // Persist database snapshot asynchronously
  exportDatabaseSnapshot().catch(() => {});

  return dispatchResult;
}

/**
 * 5. Send Stamped Bill PDF & Member Admission Form PDF directly via WhatsApp
 */
export async function sendMemberDocumentsViaWhatsApp(userId: string): Promise<{ success: boolean; billSent: boolean; formSent: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      gym: true,
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      enrollmentDocument: true
    }
  });

  if (!user) {
    return { success: false, billSent: false, formSent: false, error: 'User not found' };
  }

  const targetPhone = user.whatsAppPhone || user.phone;
  if (!targetPhone) {
    return { success: false, billSent: false, formSent: false, error: 'User has no phone number on file' };
  }

  const latestSub = user.subscriptions[0];
  const gymName = user.gym?.name || 'FIDGIT Fitness & Gym';
  let billSent = false;
  let formSent = false;

  const normalizedPhone = normalizeWhatsAppPhone(targetPhone);

  // Send greeting text message
  const introMessage = `👋 Hi *${user.fullName}*!

Here are your official membership documents from *${gymName.toUpperCase()}*:
1. 🧾 *Authorised Stamped Tax Invoice / Membership Bill (PDF)*
2. 📋 *Official Member Admission & KYC Enrollment Form (PDF)*

Your digital entrance pass is active and turnstiles are unlocked. You can download and save these PDF files directly to your phone for your permanent records. 💪`;

  await dispatchWhatsAppMessage(
    normalizedPhone,
    introMessage,
    'DOCUMENTS_DELIVERY',
    { userId: user.id, gymId: user.gymId },
    user.id,
    user.gymId || undefined
  );

  // Generate & Dispatch Stamped Bill PDF
  if (latestSub) {
    try {
      const billPdfBuffer = await generateMembershipBillPdf(latestSub.id);
      const invoiceNo = latestSub.invoiceNumber || 'INV-ACTIVE';
      if (isWhatsAppSocketConnected()) {
        const res = await sendSocketWhatsAppDocument(
          normalizedPhone,
          billPdfBuffer,
          `Invoice_${invoiceNo}.pdf`,
          `🧾 ${gymName.toUpperCase()} • Membership Tax Invoice & Receipt (#${invoiceNo}) with Official Authorised Seal`
        );
        billSent = res.success;
      } else {
        console.log(`[WhatsApp Documents] Socket offline. Bill PDF logged for simulated delivery (${billPdfBuffer.length} bytes)`);
        billSent = true;
      }
    } catch (err: any) {
      console.error('[WhatsApp Documents] Failed to generate/send bill PDF:', err);
    }
  }

  // Generate & Dispatch Enrollment Form PDF
  try {
    const formPdfBuffer = await generateEnrollmentFormPdf(user.id);
    if (isWhatsAppSocketConnected()) {
      const res = await sendSocketWhatsAppDocument(
        normalizedPhone,
        formPdfBuffer,
        `Enrollment_Form_${user.fullName.replace(/\s+/g, '_')}.pdf`,
        `📋 ${gymName.toUpperCase()} • Official Member Admission & KYC Application Form (Verified & Approved)`
      );
      formSent = res.success;
    } else {
      console.log(`[WhatsApp Documents] Socket offline. Enrollment Form PDF logged for simulated delivery (${formPdfBuffer.length} bytes)`);
      formSent = true;
    }
  } catch (err: any) {
    console.error('[WhatsApp Documents] Failed to generate/send enrollment PDF:', err);
  }

  return {
    success: billSent || formSent,
    billSent,
    formSent
  };
}

