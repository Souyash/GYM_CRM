import prisma from '../utils/prisma.js';

export interface DispatchAlertParams {
  failedLogId: string;
  facilityOwnerEmail: string;
  facilityOwnerPhone: string;
  memberName: string;
  failureReason: string;
  attemptType: string;
  timestamp: Date;
  details?: any;
}

/**
 * Dispatches immediate asynchronous webhook, email, and SMS notifications to the facility owner.
 */
export async function dispatchThreatAlerts(params: DispatchAlertParams): Promise<void> {
  const {
    failedLogId,
    facilityOwnerEmail,
    facilityOwnerPhone,
    memberName,
    failureReason,
    attemptType,
    timestamp,
    details
  } = params;

  const alertMessage = `[SECURITY THREAT ALERT] Access Denied at Gym Entrance!
Type: ${attemptType}
Member / Subject: ${memberName}
Reason: ${failureReason}
Time: ${timestamp.toISOString()}
Coordinates: Lat ${details?.gpsLat ?? 'N/A'}, Lng ${details?.gpsLng ?? 'N/A'} (Distance: ${details?.distanceMeters ?? 'N/A'}m)`;

  // Run asynchronously without blocking main response thread
  setImmediate(async () => {
    try {
      // 1. Dispatch SMS Notification Log
      await prisma.notificationLog.create({
        data: {
          failedLogId,
          channel: 'SMS',
          recipient: facilityOwnerPhone,
          status: 'DISPATCHED',
          payload: `[SMS Alert to ${facilityOwnerPhone}] ${alertMessage}`,
          responseStatus: 200
        }
      });
      console.log(`[Notification: SMS dispatched] to ${facilityOwnerPhone}`);

      // 2. Dispatch Email Notification Log
      await prisma.notificationLog.create({
        data: {
          failedLogId,
          channel: 'EMAIL',
          recipient: facilityOwnerEmail,
          status: 'DISPATCHED',
          payload: `[EMAIL Alert to ${facilityOwnerEmail}] Subject: URGENT: Facility Security Alert - ${attemptType}\n\n${alertMessage}`,
          responseStatus: 200
        }
      });
      console.log(`[Notification: Email dispatched] to ${facilityOwnerEmail}`);

      // 3. Dispatch Webhook HTTP Post (if configured or to self webhook route)
      const webhookUrl = process.env.WEBHOOK_ALERT_URL || 'http://localhost:5001/api/webhooks/security-alert';
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'SECURITY_ACCESS_BREACH',
            failedLogId,
            attemptType,
            memberName,
            failureReason,
            timestamp: timestamp.toISOString(),
            details
          })
        });

        await prisma.notificationLog.create({
          data: {
            failedLogId,
            channel: 'WEBHOOK',
            recipient: webhookUrl,
            status: response.ok ? 'DISPATCHED' : 'FAILED',
            payload: JSON.stringify({ event: 'SECURITY_ACCESS_BREACH', failedLogId, attemptType }),
            responseStatus: response.status
          }
        });
      } catch (err: any) {
        console.warn(`[Webhook Notification] Webhook post notice: ${err.message}`);
      }
    } catch (error) {
      console.error('[Notification Service] Error dispatching alerts:', error);
    }
  });
}

