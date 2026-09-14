import prisma from '../utils/prisma.js';
import { sendExpiryReminderWhatsApp } from './whatsapp.service.js';

/**
 * Runs an automated check on all active subscriptions across gyms.
 * Sends WhatsApp prior notifications for memberships expiring in 3 days, 1 day, or expired.
 * Skips members who already paid or whose notification flag is turned off.
 */
export async function runExpiryNotificationCheck(): Promise<{
  checkedCount: number;
  stage3Sent: number;
  stage1Sent: number;
  expiredSent: number;
}> {
  let stage3Sent = 0;
  let stage1Sent = 0;
  let expiredSent = 0;

  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find subscriptions that are ACTIVE or nearing expiry
    const subscriptions = await prisma.subscription.findMany({
      where: {
        expiryNotificationActive: true,
        status: { in: ['ACTIVE', 'EXPIRED'] },
        endDate: { lte: threeDaysFromNow }
      },
      include: {
        user: {
          include: { gym: true }
        },
        gym: true
      }
    });

    for (const sub of subscriptions) {
      const user = sub.user;
      if (!user) continue;

      const targetPhone = user.whatsAppPhone || user.phone;
      if (!targetPhone) continue;
      if (user.whatsAppNotificationsEnabled === false) continue;

      const gymName = sub.gym?.name || user.gym?.name || 'FIDGIT Fitness';
      const msDiff = sub.endDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

      // 1. Check if 3-Day Notice needs to be sent
      if (daysRemaining > 1 && daysRemaining <= 3 && sub.expiryAlertStage !== 'STAGE_3D') {
        // Prevent duplicate sending on the same calendar day
        const alreadySentToday = sub.lastExpiryAlertSentAt &&
          new Date(sub.lastExpiryAlertSentAt).toDateString() === now.toDateString();

        if (!alreadySentToday) {
          await sendExpiryReminderWhatsApp({
            phone: targetPhone,
            fullName: user.fullName,
            gymName,
            planName: sub.planName,
            endDate: sub.endDate,
            daysRemaining: 3,
            userId: user.id,
            gymId: sub.gymId || undefined
          });

          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              expiryAlertStage: 'STAGE_3D',
              lastExpiryAlertSentAt: now
            }
          });

          stage3Sent++;
          console.log(`[Expiry Scheduler] 3-Day WhatsApp reminder sent to ${user.fullName} (${targetPhone})`);
        }
      }
      // 2. Check if 1-Day Urgent Notice needs to be sent
      else if (daysRemaining >= 0 && daysRemaining <= 1 && sub.expiryAlertStage !== 'STAGE_1D') {
        const alreadySentToday = sub.lastExpiryAlertSentAt &&
          new Date(sub.lastExpiryAlertSentAt).toDateString() === now.toDateString();

        if (!alreadySentToday) {
          await sendExpiryReminderWhatsApp({
            phone: targetPhone,
            fullName: user.fullName,
            gymName,
            planName: sub.planName,
            endDate: sub.endDate,
            daysRemaining: 1,
            userId: user.id,
            gymId: sub.gymId || undefined
          });

          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              expiryAlertStage: 'STAGE_1D',
              lastExpiryAlertSentAt: now
            }
          });

          stage1Sent++;
          console.log(`[Expiry Scheduler] 1-Day WhatsApp reminder sent to ${user.fullName} (${targetPhone})`);
        }
      }
      // 3. Check if Expired Notice needs to be sent
      else if (daysRemaining < 0 && sub.expiryAlertStage !== 'EXPIRED') {
        await sendExpiryReminderWhatsApp({
          phone: targetPhone,
          fullName: user.fullName,
          gymName,
          planName: sub.planName,
          endDate: sub.endDate,
          daysRemaining: 0,
          userId: user.id,
          gymId: sub.gymId || undefined
        });

        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'EXPIRED',
            expiryAlertStage: 'EXPIRED',
            lastExpiryAlertSentAt: now
          }
        });

        expiredSent++;
        console.log(`[Expiry Scheduler] Expired WhatsApp notice sent to ${user.fullName} (${targetPhone})`);
      }
    }

    return {
      checkedCount: subscriptions.length,
      stage3Sent,
      stage1Sent,
      expiredSent
    };
  } catch (err: any) {
    console.error('[Expiry Scheduler Error]', err);
    return {
      checkedCount: 0,
      stage3Sent,
      stage1Sent,
      expiredSent
    };
  }
}

/**
 * Initializes the background recurring timer.
 * Runs check every 6 hours and 5 seconds after server boot.
 */
export function startExpiryScheduler(): void {
  // Initial check after 5 seconds
  setTimeout(() => {
    runExpiryNotificationCheck().then((res) => {
      console.log(`[Expiry Scheduler] Initialized: ${res.checkedCount} subscriptions checked (${res.stage3Sent + res.stage1Sent + res.expiredSent} notices sent).`);
    }).catch(console.error);
  }, 5000);

  // Check every 6 hours (6 * 60 * 60 * 1000 ms)
  setInterval(() => {
    runExpiryNotificationCheck().then((res) => {
      console.log(`[Expiry Scheduler] Routine run: ${res.checkedCount} subscriptions checked.`);
    }).catch(console.error);
  }, 6 * 60 * 60 * 1000);
}
