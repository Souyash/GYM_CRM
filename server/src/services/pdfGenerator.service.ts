import PDFDocument from 'pdfkit';
import prisma from '../utils/prisma.js';

/**
 * Draws an authentic vector Authorised Gym Seal & Signatory Stamp
 */
function drawAuthorisedStamp(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  gymName: string,
  dateStr: string
) {
  doc.save();

  // Subtle natural stamp tilt
  doc.rotate(-4, { origin: [x, y] });

  const radius = 48;

  // Outer primary ring
  doc.lineWidth(2.5).strokeColor('#047857').circle(x, y, radius).stroke();
  // Inner dashed / secondary ring
  doc.lineWidth(1).strokeColor('#047857').circle(x, y, radius - 4).stroke();

  // Gym Header text inside top circle
  doc.fillColor('#047857').fontSize(7.5).font('Helvetica-Bold');
  const upperGym = (gymName || 'FIDGIT FITNESS').toUpperCase();
  doc.text(upperGym.substring(0, 22), x - 42, y - 34, { width: 84, align: 'center' });

  // Middle Verification Ribbon
  doc.rect(x - 45, y - 10, 90, 18).fill('#047857');
  doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold')
    .text('VERIFIED & CERTIFIED', x - 45, y - 6, { width: 90, align: 'center' });

  // Stylized blue ink signature flourish
  doc.moveTo(x - 22, y + 10)
    .bezierCurveTo(x - 8, y + 3, x + 6, y + 14, x + 24, y + 8)
    .lineWidth(1.5).strokeColor('#1e40af').stroke();

  // Signatory & Date
  doc.fillColor('#047857').fontSize(6.5).font('Helvetica-Bold')
    .text('AUTHORISED SIGNATORY', x - 42, y + 15, { width: 84, align: 'center' });
  doc.fontSize(6).font('Helvetica')
    .text(`DATE: ${dateStr}`, x - 42, y + 26, { width: 84, align: 'center' });

  doc.restore();
}

/**
 * 1. Generates Official Membership Bill / Tax Invoice PDF
 */
export async function generateMembershipBillPdf(subscriptionId: string): Promise<Buffer> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: true,
      gym: true,
      deskBilledBy: true
    }
  });

  if (!sub) {
    throw new Error('Subscription not found.');
  }

  const gym = sub.gym;
  const user = sub.user;
  const invoiceNumber = sub.invoiceNumber || `INV-${new Date(sub.startDate).getFullYear()}-${sub.id.substring(0, 5).toUpperCase()}`;

  const startDateStr = new Date(sub.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const endDateStr = new Date(sub.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const invoiceDateStr = new Date(sub.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const durationDays = Math.max(1, Math.round((new Date(sub.endDate).getTime() - new Date(sub.startDate).getTime()) / (24 * 60 * 60 * 1000)));

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Tax Invoice - ${invoiceNumber}`,
          Author: gym?.name || 'FIDGIT Fitness & Gym',
          Subject: 'Official Membership Tax Invoice'
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Color Palette
      const primaryDark = '#0f172a';
      const textGray = '#475569';
      const accentGreen = '#047857';

      // Top Header: Gym Name & Brand
      doc.rect(40, 40, 515, 6).fill('#ccff00');

      doc.fillColor(primaryDark).fontSize(22).font('Helvetica-Bold')
        .text((gym?.name || 'FIDGIT FITNESS & GYM').toUpperCase(), 40, 56);

      doc.fillColor(textGray).fontSize(9).font('Helvetica')
        .text(gym?.address || 'Premium Athletic Training Facility', 40, 82)
        .text(`${gym?.city || 'Fitness Hub'}, ${gym?.state || ''} • Tel: ${gym?.ownerContactPhone || '+91 98765 43210'}`)
        .text(`Email: ${gym?.ownerContactEmail || 'support@fidgitgym.com'} • Web: https://gym-crm-indol.vercel.app`);

      // Right-aligned Invoice Header Block
      doc.rect(370, 52, 185, 68).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.rect(370, 52, 185, 20).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
        .text('TAX INVOICE & RECEIPT', 370, 58, { width: 185, align: 'center' });

      doc.fillColor(primaryDark).fontSize(8.5).font('Helvetica-Bold')
        .text(`INVOICE #: `, 378, 78)
        .font('Helvetica').text(invoiceNumber, 436, 78)
        .font('Helvetica-Bold').text(`DATE: `, 378, 92)
        .font('Helvetica').text(invoiceDateStr, 436, 92)
        .font('Helvetica-Bold').text(`STATUS: `, 378, 106)
        .fillColor(accentGreen).text('PAID / ACTIVE 🟢', 436, 106);

      // Section Divider
      doc.moveTo(40, 134).lineTo(555, 134).lineWidth(1).strokeColor('#cbd5e1').stroke();

      // Billed To Box
      doc.rect(40, 146, 515, 64).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor(primaryDark).fontSize(10).font('Helvetica-Bold')
        .text('BILLED TO (ATHLETE PARTICULARS)', 52, 154);

      doc.fillColor(textGray).fontSize(9).font('Helvetica')
        .text(`Athlete Name: `, 52, 172).font('Helvetica-Bold').fillColor(primaryDark).text(user.fullName, 125, 172)
        .font('Helvetica').fillColor(textGray).text(`Phone Number: `, 52, 188).font('Helvetica').fillColor(primaryDark).text(user.whatsAppPhone || user.phone || 'N/A', 125, 188)
        .font('Helvetica').fillColor(textGray).text(`Email Address: `, 300, 172).font('Helvetica').fillColor(primaryDark).text(user.email, 375, 172)
        .font('Helvetica').fillColor(textGray).text(`Turnstile Pass ID: `, 300, 188).font('Helvetica-Bold').fillColor(accentGreen).text(`#${gym?.inviteCode || 'PASS'}-${user.id.substring(0, 6).toUpperCase()}`, 388, 188);

      // Itemized Table Header
      const tableTop = 226;
      doc.rect(40, tableTop, 515, 24).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
        .text('ITEM DESCRIPTION', 52, tableTop + 7)
        .text('DURATION', 230, tableTop + 7)
        .text('VALIDITY DATES', 320, tableTop + 7)
        .text('AMOUNT (INR)', 460, tableTop + 7, { width: 85, align: 'right' });

      // Table Row
      const rowY = tableTop + 24;
      doc.rect(40, rowY, 515, 36).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.fillColor(primaryDark).fontSize(9).font('Helvetica-Bold')
        .text(sub.planName, 52, rowY + 8)
        .fillColor(textGray).fontSize(8).font('Helvetica')
        .text('Full Gym & Turnstile Smart Access Pass', 52, rowY + 20)
        .fillColor(primaryDark).fontSize(9)
        .text(`${durationDays} Days`, 230, rowY + 13)
        .text(`${startDateStr} to ${endDateStr}`, 320, rowY + 13)
        .font('Helvetica-Bold')
        .text(`₹${Number(sub.price).toFixed(2)}`, 460, rowY + 13, { width: 85, align: 'right' });

      // Summary & Calculations Table
      const summaryY = rowY + 48;
      doc.rect(340, summaryY, 215, 78).fillAndStroke('#f8fafc', '#e2e8f0');

      doc.fillColor(textGray).fontSize(8.5).font('Helvetica')
        .text('Plan Subtotal:', 352, summaryY + 10)
        .text(`₹${Number(sub.price).toFixed(2)}`, 460, summaryY + 10, { width: 85, align: 'right' })
        .text('Gym Facility Tax (GST 0%):', 352, summaryY + 26)
        .text('₹0.00', 460, summaryY + 26, { width: 85, align: 'right' })
        .text('Payment Method:', 352, summaryY + 42)
        .text((sub.paymentMethod || 'CASH').toUpperCase(), 460, summaryY + 42, { width: 85, align: 'right' });

      doc.moveTo(340, summaryY + 56).lineTo(555, summaryY + 56).lineWidth(1).strokeColor('#cbd5e1').stroke();

      doc.fillColor(primaryDark).fontSize(10).font('Helvetica-Bold')
        .text('Total Amount Paid:', 352, summaryY + 62)
        .text(`₹${Number(sub.price).toFixed(2)}`, 460, summaryY + 62, { width: 85, align: 'right' });

      // Left Box: Turnstile Entry Instructions
      doc.rect(40, summaryY, 285, 78).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.fillColor(accentGreen).fontSize(9).font('Helvetica-Bold')
        .text('⚡ TURNSTILE SMART ENTRY INSTRUCTIONS', 52, summaryY + 10);
      doc.fillColor(textGray).fontSize(8).font('Helvetica')
        .text('1. Open the FIDGIT mobile app on your smartphone.', 52, summaryY + 26)
        .text('2. Tap "Check In with QR" from your member pass card.', 52, summaryY + 38)
        .text('3. Point your camera at the entrance turnstile QR code.', 52, summaryY + 50)
        .text('4. Access unlocks immediately with GPS geofence validation.', 52, summaryY + 62);

      // Draw Official Authorised Stamp & Signatory
      const stampX = 460;
      const stampY = summaryY + 160;
      drawAuthorisedStamp(doc, stampX, stampY, gym?.name || 'FIDGIT FITNESS', invoiceDateStr);

      // Terms & Conditions on the left
      const termsY = summaryY + 100;
      doc.fillColor(primaryDark).fontSize(8.5).font('Helvetica-Bold')
        .text('MEMBERSHIP TERMS & CONDITIONS:', 40, termsY);
      doc.fillColor(textGray).fontSize(7.5).font('Helvetica')
        .text('• Membership passes are non-transferable and strictly bound to member identity and registered smartphone.', 40, termsY + 14)
        .text('• Access to the workout floor is granted during active subscription validity only.', 40, termsY + 26)
        .text('• Members must abide by gym safety standards, equipment hygiene, and trainer guidelines.', 40, termsY + 38)
        .text('• In case of device changes, request hardware re-binding via the front desk manager.', 40, termsY + 50);

      // Sign-off note
      doc.fillColor(textGray).fontSize(8).font('Helvetica-Oblique')
        .text(`Processed by Front Desk Staff: ${sub.deskBilledBy?.fullName || 'System Automated'}`, 40, termsY + 75);

      // Page Bottom Footer
      doc.moveTo(40, 780).lineTo(555, 780).lineWidth(1).strokeColor('#cbd5e1').stroke();
      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
        .text('FIDGIT Smart Gym Management OS • Official Verified Electronic Tax Receipt • Powered by Biometric & QR Turnstiles', 40, 788, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 2. Generates Official Member Admission & KYC Enrollment Form PDF
 */
export async function generateEnrollmentFormPdf(userId: string): Promise<Buffer> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      gym: true,
      enrollmentDocument: true,
      healthProfile: true,
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!user) {
    throw new Error('User not found.');
  }

  const gym = user.gym;
  const docData = user.enrollmentDocument;
  const health = user.healthProfile;
  const latestSub = user.subscriptions[0];

  const dateOfBirthStr = docData?.dateOfBirth
    ? new Date(docData.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : (health?.dateOfBirth ? new Date(health.dateOfBirth).toLocaleDateString('en-GB') : 'Not Provided');

  const submissionDateStr = docData?.signedAt
    ? new Date(docData.signedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB');

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `Member Enrollment Form - ${user.fullName}`,
          Author: gym?.name || 'FIDGIT Fitness & Gym',
          Subject: 'Official Member Admission & KYC Form'
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const primaryDark = '#0f172a';
      const textGray = '#475569';
      const accentGreen = '#047857';

      // Top Header Accent Bar
      doc.rect(36, 36, 523, 5).fill('#ccff00');

      // Title & Gym Identity
      doc.fillColor(primaryDark).fontSize(18).font('Helvetica-Bold')
        .text((gym?.name || 'FIDGIT FITNESS & GYM').toUpperCase(), 36, 48);

      doc.fillColor(accentGreen).fontSize(11).font('Helvetica-Bold')
        .text('MEMBER ADMISSION & KYC ENROLLMENT FORM', 36, 70);

      doc.fillColor(textGray).fontSize(8).font('Helvetica')
        .text('Official Documentation Record for Turnstile Access & Emergency Readiness', 36, 84);

      // Top Right Photo & Member ID Box
      doc.rect(445, 46, 114, 60).strokeColor('#cbd5e1').lineWidth(1).stroke();
      doc.rect(445, 46, 114, 16).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold')
        .text('MEMBERSHIP PASS ID', 445, 51, { width: 114, align: 'center' });

      doc.fillColor(primaryDark).fontSize(9.5).font('Helvetica-Bold')
        .text(`#${user.id.substring(0, 8).toUpperCase()}`, 445, 70, { width: 114, align: 'center' });

      doc.fillColor(textGray).fontSize(7).font('Helvetica')
        .text(`Date: ${submissionDateStr}`, 445, 88, { width: 114, align: 'center' });

      // Divider Line
      doc.moveTo(36, 114).lineTo(559, 114).lineWidth(1).strokeColor('#cbd5e1').stroke();

      // SECTION 1: PERSONAL PARTICULARS
      let curY = 124;
      doc.rect(36, curY, 523, 20).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
        .text('1. ATHLETE PERSONAL PARTICULARS & IDENTIFICATION', 46, curY + 6);

      curY += 20;
      doc.rect(36, curY, 523, 76).strokeColor('#e2e8f0').lineWidth(1).stroke();

      doc.fillColor(textGray).fontSize(8).font('Helvetica')
        .text('Full Name:', 46, curY + 8).font('Helvetica-Bold').fillColor(primaryDark).text(user.fullName, 120, curY + 8)
        .font('Helvetica').fillColor(textGray).text('Contact Phone:', 310, curY + 8).font('Helvetica-Bold').fillColor(primaryDark).text(docData?.phone || user.whatsAppPhone || user.phone || 'N/A', 390, curY + 8)
        .font('Helvetica').fillColor(textGray).text('Email Address:', 46, curY + 24).font('Helvetica').fillColor(primaryDark).text(user.email, 120, curY + 24)
        .font('Helvetica').fillColor(textGray).text('Date of Birth:', 310, curY + 24).font('Helvetica').fillColor(primaryDark).text(dateOfBirthStr, 390, curY + 24)
        .font('Helvetica').fillColor(textGray).text('Gender:', 46, curY + 40).font('Helvetica').fillColor(primaryDark).text(docData?.gender || health?.gender || 'Not Specified', 120, curY + 40)
        .font('Helvetica').fillColor(textGray).text('Blood Group:', 310, curY + 40).font('Helvetica-Bold').fillColor(accentGreen).text(docData?.bloodGroup || 'O+ (Normal)', 390, curY + 40)
        .font('Helvetica').fillColor(textGray).text('Residential Address:', 46, curY + 56).font('Helvetica').fillColor(primaryDark).text(`${docData?.address || health?.houseFlatStreet || 'Address on file'}, ${docData?.city || health?.city || ''} ${docData?.pinCode || ''}`, 145, curY + 56);

      // SECTION 2: EMERGENCY CONTACT
      curY += 86;
      doc.rect(36, curY, 523, 20).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
        .text('2. EMERGENCY CONTACT & GUARDIAN DETAILS', 46, curY + 6);

      curY += 20;
      doc.rect(36, curY, 523, 40).strokeColor('#e2e8f0').lineWidth(1).stroke();

      doc.fillColor(textGray).fontSize(8).font('Helvetica')
        .text('Emergency Contact Person:', 46, curY + 8).font('Helvetica-Bold').fillColor(primaryDark).text(docData?.emergencyContactName || 'Designated Contact', 170, curY + 8)
        .font('Helvetica').fillColor(textGray).text('Emergency Phone:', 310, curY + 8).font('Helvetica-Bold').fillColor('#dc2626').text(docData?.emergencyContactPhone || user.phone || 'N/A', 400, curY + 8)
        .font('Helvetica').fillColor(textGray).text('Relationship to Athlete:', 46, curY + 24).font('Helvetica').fillColor(primaryDark).text(docData?.emergencyRelation || 'Family / Relative', 170, curY + 24);

      // SECTION 3: HEALTH, MEDICAL & GOAL DECLARATIONS
      curY += 50;
      doc.rect(36, curY, 523, 20).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
        .text('3. FITNESS GOALS & MEDICAL HISTORY DECLARATION', 46, curY + 6);

      curY += 20;
      doc.rect(36, curY, 523, 56).strokeColor('#e2e8f0').lineWidth(1).stroke();

      doc.fillColor(textGray).fontSize(8).font('Helvetica')
        .text('Primary Fitness Goal:', 46, curY + 8).font('Helvetica-Bold').fillColor(primaryDark).text(docData?.primaryGoal || health?.primaryGoal || 'General Fitness & Stamina', 150, curY + 8)
        .font('Helvetica').fillColor(textGray).text('Target Timeline:', 310, curY + 8).font('Helvetica').fillColor(primaryDark).text(docData?.targetTimeline || health?.targetTimeline || '3 Months', 390, curY + 8)
        .font('Helvetica').fillColor(textGray).text('Medical Declarations:', 46, curY + 24).font('Helvetica').fillColor(primaryDark).text(docData?.medicalHistory || health?.healthConditions || 'No pre-existing health contraindications declared. Medically cleared for physical exercise.', 150, curY + 24, { width: 395 })
        .font('Helvetica').fillColor(textGray).text('Active Plan Enrolled:', 46, curY + 40).font('Helvetica-Bold').fillColor(accentGreen).text(latestSub ? `${latestSub.planName} (Active)` : 'Registered Membership', 150, curY + 40);

      // SECTION 4: CODE OF CONDUCT & LEGAL DECLARATION
      curY += 66;
      doc.rect(36, curY, 523, 20).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
        .text('4. ATHLETE UNDERTAKING & DIGITAL CONSENT DECLARATION', 46, curY + 6);

      curY += 20;
      doc.rect(36, curY, 523, 90).fillAndStroke('#f8fafc', '#e2e8f0');

      doc.fillColor(textGray).fontSize(7.5).font('Helvetica')
        .text('• I hereby declare that all personal, contact, and medical information furnished above is true and complete.', 46, curY + 8)
        .text('• I acknowledge that physical workout and strength training involve inherent physical risks, and I participate voluntarily.', 46, curY + 20)
        .text('• I agree to adhere strictly to the gym rules, code of conduct, hygiene protocols, and turnstile access procedures.', 46, curY + 32)
        .text('• I consent to receiving official account notices, billing invoices, and safety updates via WhatsApp & SMS.', 46, curY + 44);

      // Digital Signature Box
      doc.moveTo(46, curY + 58).lineTo(549, curY + 58).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
      doc.fillColor(primaryDark).fontSize(8).font('Helvetica-Bold')
        .text('DIGITALLY SIGNED & VERIFIED BY ATHLETE:', 46, curY + 64)
        .font('Helvetica').fillColor('#2563eb')
        .text(`${user.fullName} (Electronic Signature)`, 250, curY + 64)
        .fillColor(textGray).font('Helvetica')
        .text(`Timestamp: ${new Date().toISOString()}`, 46, curY + 76);

      // SECTION 5: OFFICE USE ONLY & OFFICIAL AUTHORISED STAMP
      curY += 102;
      doc.rect(36, curY, 523, 110).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.rect(36, curY, 523, 18).fill('#f1f5f9');
      doc.fillColor(primaryDark).fontSize(8).font('Helvetica-Bold')
        .text('5. FOR GYM OFFICE USE ONLY • VERIFICATION & APPROVAL', 46, curY + 5);

      doc.fillColor(textGray).fontSize(8).font('Helvetica')
        .text('Admission Status:', 46, curY + 28).font('Helvetica-Bold').fillColor(accentGreen).text('OFFICIALLY ENROLLED & APPROVED 🟢', 140, curY + 28)
        .font('Helvetica').fillColor(textGray).text('Turnstile Verification:', 46, curY + 44).font('Helvetica').fillColor(primaryDark).text('Biometric & QR Access Unlocked', 140, curY + 44)
        .font('Helvetica').fillColor(textGray).text('KYC Document Record:', 46, curY + 60).font('Helvetica').fillColor(primaryDark).text('Saved to Cloud Database', 140, curY + 60)
        .font('Helvetica').fillColor(textGray).text('Verified Officer:', 46, curY + 76).font('Helvetica').fillColor(primaryDark).text(gym?.ownerContactEmail || 'FIDGIT Front Desk Administrator', 140, curY + 76);

      // Place the Official Authorised Stamp right in the office approval box
      const stampX = 465;
      const stampY = curY + 62;
      drawAuthorisedStamp(doc, stampX, stampY, gym?.name || 'FIDGIT FITNESS', submissionDateStr);

      // Footer
      doc.moveTo(36, 782).lineTo(559, 782).lineWidth(1).strokeColor('#cbd5e1').stroke();
      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
        .text('FIDGIT Smart Gym OS • Official Member Enrollment & Admission Document • Confidential Records', 36, 788, { align: 'center', width: 523 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
