import nodemailer from 'nodemailer';

export function getGmailUser(): string {
  return (process.env.GMAIL_USER || process.env.SMTP_USER || '').trim();
}

export function getGmailPass(): string {
  const raw = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').replace(/\s+/g, '');
  return raw.length > 16 ? raw.slice(0, 16) : raw;
}

export function getFromName(): string {
  return process.env.EMAIL_FROM_NAME || 'IronVault Fitness';
}

let transporter: any = null;

function getTransporter(): any {
  if (transporter) return transporter;

  const user = getGmailUser();
  const pass = getGmailPass();

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      connectionTimeout: 5000,
      greetingTimeout: 4000,
      socketTimeout: 6000,
      auth: {
        user,
        pass
      }
    });

    // Verify connection in background
    transporter.verify((err: any) => {
      if (err) {
        console.warn(`[Email Service] ⚠️ Gmail connection warning: ${err.message}. Ensure App Password is generated at Google Account > Security > 2-Step Verification > App passwords.`);
      } else {
        console.log(`[Email Service] ✅ Gmail SMTP authenticated and connected for ${user}`);
      }
    });
  } else {
    console.log(`[Email Service] ℹ️ Running in local development mode. GMAIL_USER=${user ? 'SET' : 'EMPTY'}, GMAIL_APP_PASSWORD=${pass ? 'SET' : 'EMPTY'}`);
  }

  return transporter;
}

/**
 * Multi-Tier Email Dispatcher:
 * Tier 1: Resend HTTP API (HTTPS port 443 - zero block on cloud platforms like Render Free)
 * Tier 2: Vercel Gmail Relay (HTTPS port 443 -> Vercel Serverless Function -> Gmail SMTP port 465)
 * Tier 3: Direct Gmail SMTP (port 465 - local Mac & unblocked cloud servers)
 * Tier 4: Dev console fallback
 */
async function dispatchEmail(params: {
  toEmail: string;
  subject: string;
  html: string;
  text: string;
  devOtpCode?: string;
  fullName?: string;
}): Promise<{ success: boolean; deliveredVia: 'GMAIL' | 'DEV_CONSOLE'; error?: string }> {
  const { toEmail, subject, html, text, devOtpCode, fullName } = params;

  // Tier 1: Try Brevo HTTPS API (Sends from subhaarthabusiness@gmail.com to ANY member over HTTPS port 443)
  const brevoKey = process.env.BREVO_API_KEY;
  const fromName = getFromName();
  const user = getGmailUser();

  if (brevoKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: fromName || 'IronVault Fitness', email: user || 'subhaarthabusiness@gmail.com' },
          to: [{ email: toEmail, name: fullName || 'Gym Member' }],
          subject,
          htmlContent: html,
          textContent: text
        })
      });
      const data = await res.json() as any;
      if (res.ok && data.messageId) {
        console.log(`[Email Service] ✉️ Successfully dispatched via Brevo API to: ${toEmail} (MessageId: ${data.messageId})`);
        return { success: true, deliveredVia: 'GMAIL' };
      }
      console.warn(`[Email Service] Brevo fallback required:`, data?.message || data?.error);
    } catch (err: any) {
      console.warn(`[Email Service] Brevo error:`, err.message);
    }
  }

  // Tier 2: Try Resend HTTPS API (Fastest: ~400ms over port 443)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'IronVault Gym <onboarding@resend.dev>',
          to: [toEmail],
          subject,
          html,
          text
        })
      });
      const data = await res.json() as any;
      if (res.ok && data.id) {
        console.log(`[Email Service] ✉️ Successfully dispatched via Resend API to: ${toEmail} (ID: ${data.id})`);
        return { success: true, deliveredVia: 'GMAIL' };
      }
      console.warn(`[Email Service] Resend fallback:`, data?.message || data?.error);
    } catch (err: any) {
      console.warn(`[Email Service] Resend error:`, err.message);
    }
  }

  // Tier 2: Try Vercel Gmail Relay (HTTPS port 443 -> Vercel Serverless Function -> Gmail SMTP port 465)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const relayRes = await fetch('https://gym-crm-indol.vercel.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: toEmail, subject, html, text }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (relayRes.ok) {
      const relayData = await relayRes.json() as any;
      if (relayData.success) {
        console.log(`[Email Service] ✉️ Successfully dispatched via Vercel Gmail Relay to: ${toEmail}`);
        return { success: true, deliveredVia: 'GMAIL' };
      }
    }
  } catch (err: any) {
    console.warn(`[Email Service] Vercel relay warning:`, err.message);
  }

  // Tier 3: Direct Gmail SMTP (Local Mac & non-restricted cloud instances)
  const activeTransporter = getTransporter();

  if (activeTransporter && user) {
    try {
      await activeTransporter.sendMail({
        from: `"${fromName}" <${user}>`,
        to: toEmail,
        subject,
        html,
        text
      });
      console.log(`[Email Service] ✉️ Successfully sent via Direct Gmail SMTP to: ${toEmail}`);
      return { success: true, deliveredVia: 'GMAIL' };
    } catch (err: any) {
      console.error(`[Email Service] ❌ Direct SMTP failed for ${toEmail}:`, err.message);
    }
  }

  // Tier 4: Dev console fallback
  if (devOtpCode) {
    console.log(`\n=============================================================`);
    console.log(`[Email Service: SIMULATED INBOX]`);
    console.log(`To: ${toEmail} (${fullName || 'User'})`);
    console.log(`Subject: ${subject}`);
    console.log(`Code: >>> ${devOtpCode} <<< (Expires in 10 mins)`);
    console.log(`=============================================================\n`);
  }
  return { success: true, deliveredVia: 'DEV_CONSOLE' };
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

  return await dispatchEmail({
    toEmail,
    subject: `🔐 ${otpCode} is your IronVault verification code`,
    html,
    text: `Welcome to IronVault Fitness, ${fullName}!\n\nYour 6-digit verification code is: ${otpCode}\n\nThis code expires in 10 minutes.\nIf you did not request this, please ignore this email.`,
    devOtpCode: otpCode,
    fullName
  });
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

  await dispatchEmail({
    toEmail,
    subject: `🎉 Welcome to IronVault Fitness, ${fullName}! Your pass is active`,
    html,
    text: `Welcome to IronVault Fitness, ${fullName}!\n\nYour membership pass (${planName}) is active until ${formattedDate}.\nOpen your app at the gym entrance to scan through the turnstile.`,
    fullName
  });
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

  const user = getGmailUser();
  const fromName = getFromName();

  if (activeTransporter && user) {
    try {
      await activeTransporter.sendMail({
        from: `"${fromName}" <${user}>`,
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

  const user = getGmailUser();
  const fromName = getFromName();

  if (activeTransporter && user) {
    try {
      await activeTransporter.sendMail({
        from: `"${fromName}" <${user}>`,
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

/**
 * Sends a 6-digit OTP code when Front Desk or Gym Owner registers a new member at the desk.
 */
export async function sendDeskOnboardOtpEmail(params: {
  toEmail: string;
  fullName: string;
  otpCode: string;
  planName: string;
  staffName?: string;
}): Promise<{ success: boolean; deliveredVia: 'GMAIL' | 'DEV_CONSOLE'; error?: string }> {
  const { toEmail, fullName, otpCode, planName, staffName = 'IronVault Front Desk' } = params;
  const activeTransporter = getTransporter();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IronVault Membership Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px; text-align: center; background: linear-gradient(180deg, rgba(16,185,129,0.1) 0%, rgba(17,24,39,0) 100%);">
              <div style="display: inline-block; padding: 10px 18px; border-radius: 9999px; background-color: #064e3b; border: 1px solid #059669; color: #34d399; font-weight: 800; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;">
                ⚡ IRONVAULT DESK ENROLLMENT
              </div>
              <h1 style="margin: 20px 0 6px; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Confirm Your Membership
              </h1>
              <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                Welcome, <strong style="color: #ffffff;">${fullName}</strong>! ${staffName} is setting up your gym pass.
              </p>
            </td>
          </tr>

          <!-- Plan Info -->
          <tr>
            <td style="padding: 0 36px 16px;">
              <div style="background-color: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25); border-radius: 12px; padding: 14px; text-align: center;">
                <span style="font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Selected Plan</span>
                <p style="margin: 4px 0 0; font-size: 17px; font-weight: 800; color: #34d399;">${planName}</p>
              </div>
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td style="padding: 10px 36px 24px;">
              <div style="background-color: #0f172a; border: 2px dashed #10b981; border-radius: 16px; padding: 26px 20px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 2px;">
                  Your Front Desk Verification Code
                </p>
                <div style="font-size: 44px; font-weight: 900; letter-spacing: 12px; color: #ffffff; text-shadow: 0 0 20px rgba(16,185,129,0.4); font-family: 'Courier New', Courier, monospace;">
                  ${otpCode}
                </div>
                <p style="margin: 12px 0 0; font-size: 13px; color: #94a3b8;">
                  ⏱️ Valid for <strong style="color: #f59e0b;">15 minutes</strong>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding: 0 36px 36px;">
              <div style="background-color: #1f2937; border-radius: 12px; padding: 16px; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
                <p style="margin: 0 0 8px;"><strong>🏢 Next Step:</strong> Please share this 6-digit code with the front desk staff or manager assisting you.</p>
                <p style="margin: 0;">Once verified, your account and turnstile digital barcode will be immediately activated.</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 36px; background-color: #0a0e17; border-top: 1px solid #1f2937; text-align: center; font-size: 12px; color: #64748b;">
              IronVault Fitness • Front Desk Enrollment • 2026
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await dispatchEmail({
    toEmail,
    subject: `🔐 ${otpCode} is your IronVault Desk Verification Code`,
    html,
    text: `Welcome to IronVault Fitness, ${fullName}!\n\n${staffName} is setting up your membership for: ${planName}.\n\nYour 6-digit verification code is: ${otpCode}\n\nPlease provide this code to the staff member to complete your enrollment.\n\nCode expires in 15 minutes.`,
    devOtpCode: otpCode,
    fullName
  });
}

/**
 * Sends a 6-digit OTP code when an existing Member logs into their account via Gmail OTP.
 */
export async function sendMemberLoginOtpEmail(params: {
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
  <title>IronVault Member Login Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px; text-align: center; background: linear-gradient(180deg, rgba(16,185,129,0.1) 0%, rgba(17,24,39,0) 100%);">
              <div style="display: inline-block; padding: 10px 18px; border-radius: 9999px; background-color: #064e3b; border: 1px solid #059669; color: #34d399; font-weight: 800; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;">
                ⚡ IRONVAULT MEMBER ACCESS
              </div>
              <h1 style="margin: 20px 0 6px; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Your Sign-In Passcode
              </h1>
              <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                Welcome back, <strong style="color: #ffffff;">${fullName}</strong>! Use this code to sign in.
              </p>
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td style="padding: 16px 36px 24px;">
              <div style="background-color: #0f172a; border: 2px dashed #10b981; border-radius: 16px; padding: 26px 20px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 2px;">
                  Your 6-Digit Login Code
                </p>
                <div style="font-size: 44px; font-weight: 900; letter-spacing: 12px; color: #ffffff; text-shadow: 0 0 20px rgba(16,185,129,0.4); font-family: 'Courier New', Courier, monospace;">
                  ${otpCode}
                </div>
                <p style="margin: 12px 0 0; font-size: 13px; color: #94a3b8;">
                  ⏱️ Valid for <strong style="color: #f59e0b;">10 minutes</strong>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding: 0 36px 36px;">
              <div style="background-color: #1f2937; border-radius: 12px; padding: 16px; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
                <p style="margin: 0 0 8px;"><strong>🔒 Security Note:</strong> Never share this code with anyone. IronVault staff will never ask for your login code.</p>
                <p style="margin: 0;">Enter this code on the login screen to access your digital member pass, turnstile barcode, and class schedule.</p>
              </div>
              <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #64748b;">
                If you did not attempt to sign in, please secure your account immediately.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 36px; background-color: #0a0e17; border-top: 1px solid #1f2937; text-align: center; font-size: 12px; color: #64748b;">
              IronVault Fitness • Smart Gym Access Control • 2026
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await dispatchEmail({
    toEmail,
    subject: `🔐 ${otpCode} is your IronVault login verification code`,
    html,
    text: `Welcome back to IronVault Fitness, ${fullName}!\n\nYour 6-digit login verification code is: ${otpCode}\n\nThis code expires in 10 minutes.\nIf you did not request this, please ignore this email.`,
    devOtpCode: otpCode,
    fullName
  });
}

/**
 * Sends a 6-digit OTP code when a Gym Owner, Staff, or Member requests a password reset.
 */
export async function sendPasswordResetOtpEmail(params: {
  toEmail: string;
  fullName: string;
  otpCode: string;
}): Promise<{ success: boolean; deliveredVia: 'GMAIL' | 'DEV_CONSOLE'; error?: string }> {
  const { toEmail, fullName, otpCode } = params;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IronVault Password Reset Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px; text-align: center; background: linear-gradient(180deg, rgba(245,158,11,0.15) 0%, rgba(17,24,39,0) 100%);">
              <div style="display: inline-block; padding: 10px 18px; border-radius: 9999px; background-color: #78350f; border: 1px solid #d97706; color: #fbbf24; font-weight: 800; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;">
                🔑 PASSWORD RECOVERY
              </div>
              <h1 style="margin: 20px 0 6px; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Reset Your Password
              </h1>
              <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                Hello, <strong style="color: #ffffff;">${fullName}</strong>! We received a password reset request for your account.
              </p>
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td style="padding: 16px 36px 24px;">
              <div style="background-color: #0f172a; border: 2px dashed #f59e0b; border-radius: 16px; padding: 26px 20px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 2px;">
                  Your 6-Digit Password Reset Code
                </p>
                <div style="font-size: 44px; font-weight: 900; letter-spacing: 12px; color: #ffffff; text-shadow: 0 0 20px rgba(245,158,11,0.4); font-family: 'Courier New', Courier, monospace;">
                  ${otpCode}
                </div>
                <p style="margin: 12px 0 0; font-size: 13px; color: #94a3b8;">
                  ⏱️ Valid for <strong style="color: #f59e0b;">15 minutes</strong>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding: 0 36px 36px;">
              <div style="background-color: #1f2937; border-radius: 12px; padding: 16px; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
                <p style="margin: 0 0 8px;"><strong>🔒 Security Alert:</strong> If you did NOT request to reset your password, you can safely ignore this email. Your current password will remain unchanged.</p>
                <p style="margin: 0;">Enter this code on the password recovery screen along with your new password to restore access to your account.</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 36px; background-color: #0a0e17; border-top: 1px solid #1f2937; text-align: center; font-size: 12px; color: #64748b;">
              IronVault Fitness • Smart SaaS Gym Security • 2026
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await dispatchEmail({
    toEmail,
    subject: `🔑 ${otpCode} is your IronVault password reset code`,
    html,
    text: `Hello ${fullName},\n\nYour 6-digit password reset verification code is: ${otpCode}\n\nThis code expires in 15 minutes.\nIf you did not request a password reset, please ignore this email.`,
    devOtpCode: otpCode,
    fullName
  });
}


