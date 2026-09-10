import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER || process.env.SMTP_USER || '';
const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').replace(/\s+/g, '');
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'IronVault Fitness';

let transporter: any = null;

function getTransporter(): any {
  if (transporter) return transporter;

  if (GMAIL_USER && GMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS
      }
    });

    // Verify connection in background
    transporter.verify((err: any) => {
      if (err) {
        console.warn(`[Email Service] ⚠️ Gmail connection warning: ${err.message}. Ensure App Password is generated at Google Account > Security > 2-Step Verification > App passwords.`);
      } else {
        console.log(`[Email Service] ✅ Gmail SMTP authenticated and connected for ${GMAIL_USER}`);
      }
    });
  } else {
    console.log(`[Email Service] ℹ️ Running in local development mode. To send real Gmail messages, add GMAIL_USER and GMAIL_APP_PASSWORD to server/.env`);
  }

  return transporter;
}

/**
 * Sends a 6-digit OTP verification code for member registration.
 */
export async function sendSignupOtpEmail(params: {
  toEmail: string;
  fullName: string;
  otpCode: string;
}): Promise<{ success: boolean; deliveredVia: 'GMAIL' | 'DEV_CONSOLE'; error?: string }> {
  const { toEmail, fullName, otpCode } = params;
  const activeTransporter = getTransporter();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IronVault Fitness - Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="540" style="max-width: 540px; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px; text-align: center; background: linear-gradient(180deg, rgba(16,185,129,0.1) 0%, rgba(17,24,39,0) 100%);">
              <div style="display: inline-block; padding: 10px 18px; border-radius: 9999px; background-color: #064e3b; border: 1px solid #059669; color: #34d399; font-weight: 800; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;">
                ⚡ IRONVAULT FITNESS
              </div>
              <h1 style="margin: 20px 0 6px; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Verify Your Email Address
              </h1>
              <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                Welcome, <strong style="color: #ffffff;">${fullName}</strong>! Complete your registration.
              </p>
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td style="padding: 20px 36px;">
              <div style="background-color: #0f172a; border: 2px dashed #10b981; border-radius: 16px; padding: 28px 20px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 2px;">
                  Your 6-Digit Verification Code
                </p>
                <div style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #ffffff; text-shadow: 0 0 20px rgba(16,185,129,0.4); font-family: 'Courier New', Courier, monospace;">
                  ${otpCode}
                </div>
                <p style="margin: 14px 0 0; font-size: 13px; color: #94a3b8;">
                  ⏱️ Valid for <strong style="color: #f59e0b;">10 minutes</strong>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding: 10px 36px 36px;">
              <div style="background-color: #1f2937; border-radius: 12px; padding: 16px; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
                <p style="margin: 0 0 8px;"><strong>🔒 Security Note:</strong> IronVault staff will never ask for your verification code.</p>
                <p style="margin: 0;">Enter this code on the registration screen to activate your <strong>30-Day Unlimited Pro Pass</strong> and unlock turnstile gate access.</p>
              </div>
              <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #64748b;">
                If you did not request this code, you can safely ignore this email.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 36px; background-color: #0a0e17; border-top: 1px solid #1f2937; text-align: center; font-size: 12px; color: #64748b;">
              IronVault Fitness • Smart Access Control • 2026
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  if (activeTransporter && GMAIL_USER) {
    try {
      await activeTransporter.sendMail({
        from: `"${FROM_NAME}" <${GMAIL_USER}>`,
        to: toEmail,
        subject: `🔐 ${otpCode} is your IronVault verification code`,
        html,
        text: `Welcome to IronVault Fitness, ${fullName}!\n\nYour 6-digit verification code is: ${otpCode}\n\nThis code expires in 10 minutes.\nIf you did not request this, please ignore this email.`
      });

      console.log(`[Email Service] ✉️ OTP code successfully emailed via Gmail to: ${toEmail}`);
      return { success: true, deliveredVia: 'GMAIL' };
    } catch (err: any) {
      console.error(`[Email Service] ❌ Failed to send email via Gmail to ${toEmail}:`, err.message);
      // Fallback to dev log output so testing flow isn't blocked
      console.log(`[Email Service: DEV FALLBACK] 🔑 OTP for ${toEmail} (${fullName}) is: ${otpCode}`);
      return { success: true, deliveredVia: 'DEV_CONSOLE', error: err.message };
    }
  }

  // If Gmail credentials are not yet configured in .env, log clearly to console
  console.log(`\n=============================================================`);
  console.log(`[Email Service: SIMULATED INBOX]`);
  console.log(`To: ${toEmail} (${fullName})`);
  console.log(`Subject: 🔐 ${otpCode} is your IronVault verification code`);
  console.log(`Code: >>> ${otpCode} <<< (Expires in 10 mins)`);
  console.log(`Tip: Add GMAIL_USER and GMAIL_APP_PASSWORD to server/.env to send to real inboxes.`);
  console.log(`=============================================================\n`);

  return { success: true, deliveredVia: 'DEV_CONSOLE' };
}

/**
 * Sends a welcome email with membership pass details after successful verification.
 */
export async function sendWelcomeEmail(params: {
  toEmail: string;
  fullName: string;
  planName: string;
  endDate: Date;
}): Promise<void> {
  const { toEmail, fullName, planName, endDate } = params;
  const activeTransporter = getTransporter();

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(endDate);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to IronVault Fitness</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="540" style="max-width: 540px; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden;">
          <tr>
            <td style="padding: 36px; text-align: center; background: linear-gradient(180deg, rgba(16,185,129,0.15) 0%, rgba(17,24,39,0) 100%);">
              <div style="display: inline-block; padding: 8px 16px; border-radius: 9999px; background-color: #064e3b; border: 1px solid #059669; color: #34d399; font-weight: 800; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;">
                🎉 MEMBERSHIP ACTIVATED
              </div>
              <h1 style="margin: 20px 0 10px; font-size: 26px; font-weight: 800; color: #ffffff;">
                Welcome to IronVault, ${fullName}!
              </h1>
              <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                Your digital membership pass is now active and ready to use at the gym turnstiles.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 36px 20px;">
              <div style="background-color: #0f172a; border: 1px solid #10b981; border-radius: 14px; padding: 20px;">
                <h3 style="margin: 0 0 12px; color: #10b981; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">
                  📋 Pass Details
                </h3>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Plan:</strong> ${planName}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Status:</strong> <span style="color: #34d399;">● ACTIVE</span></p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Valid Until:</strong> ${formattedDate}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 36px 36px;">
              <div style="background-color: #1f2937; border-radius: 12px; padding: 18px; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
                <strong style="color: #ffffff;">🏋️ Turnstile Access:</strong>
                <p style="margin: 6px 0 0;">Open your IronVault app at the entrance turnstile, tap "Scan Gate QR", and point your camera at the turnstile QR to unlock.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px; background-color: #0a0e17; text-align: center; font-size: 12px; color: #64748b;">
              IronVault Fitness • 24/7 Smart Gym Facility
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  if (activeTransporter && GMAIL_USER) {
    try {
      await activeTransporter.sendMail({
        from: `"${FROM_NAME}" <${GMAIL_USER}>`,
        to: toEmail,
        subject: `🎉 Welcome to IronVault Fitness, ${fullName}! Your pass is active`,
        html,
        text: `Welcome to IronVault Fitness, ${fullName}!\n\nYour membership pass (${planName}) is active until ${formattedDate}.\nOpen your app at the gym entrance to scan through the turnstile.`
      });
      console.log(`[Email Service] ✉️ Welcome email dispatched to: ${toEmail}`);
    } catch (err: any) {
      console.warn(`[Email Service] Could not send welcome email: ${err.message}`);
    }
  } else {
    console.log(`[Email Service] Welcome email queued for ${toEmail} (${fullName})`);
  }
}

/**
 * Sends a turnstile check-in / check-out notification email.
 */
export async function sendTurnstileScanEmail(params: {
  toEmail: string;
  fullName: string;
  type: 'ENTRANCE' | 'EXIT';
  timestamp: Date;
  facilityName: string;
}): Promise<void> {
  const { toEmail, fullName, type, timestamp, facilityName } = params;
  const activeTransporter = getTransporter();

  const timeStr = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const isEntrance = type === 'ENTRANCE';
  const subject = isEntrance
    ? `🏋️ Gym Check-in Confirmed: ${facilityName}`
    : `✅ Gym Check-out Confirmed: ${facilityName}`;

  const messageText = isEntrance
    ? `Hi ${fullName},\n\nYou checked into ${facilityName} at ${timeStr}. Have a great workout!`
    : `Hi ${fullName},\n\nYou checked out of ${facilityName} at ${timeStr}. Great job on today's session!`;

  if (activeTransporter && GMAIL_USER) {
    try {
      await activeTransporter.sendMail({
        from: `"${FROM_NAME}" <${GMAIL_USER}>`,
        to: toEmail,
        subject,
        text: messageText
      });
      console.log(`[Email Service] ✉️ Turnstile scan notification dispatched to: ${toEmail}`);
    } catch (err: any) {
      console.warn(`[Email Service] Scan notification email error: ${err.message}`);
    }
  }
}

/**
 * Sends a group class booking confirmation email.
 */
export async function sendClassBookingEmail(params: {
  toEmail: string;
  fullName: string;
  className: string;
  coach: string;
  startTime: Date;
  zone: string;
}): Promise<void> {
  const { toEmail, fullName, className, coach, startTime, zone } = params;
  const activeTransporter = getTransporter();

  const dateStr = startTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const timeStr = startTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const subject = `📅 Booking Confirmed: ${className} with Coach ${coach}`;
  const messageText = `Hi ${fullName},\n\nYour spot is reserved for:\n\nClass: ${className}\nCoach: ${coach}\nDate & Time: ${dateStr} at ${timeStr}\nLocation: ${zone}\n\nSee you on the gym floor!`;

  if (activeTransporter && GMAIL_USER) {
    try {
      await activeTransporter.sendMail({
        from: `"${FROM_NAME}" <${GMAIL_USER}>`,
        to: toEmail,
        subject,
        text: messageText
      });
      console.log(`[Email Service] ✉️ Class booking email dispatched to: ${toEmail}`);
    } catch (err: any) {
      console.warn(`[Email Service] Class booking email error: ${err.message}`);
    }
  }
}
