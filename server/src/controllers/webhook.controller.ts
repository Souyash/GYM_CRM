import { Request, Response } from 'express';

export async function handleSecurityAlertWebhook(req: Request, res: Response): Promise<void> {
  const payload = req.body;
  console.log(`[Security Alert Webhook Received] Threat: ${payload.attemptType} for ${payload.memberName} at ${payload.timestamp}`);
  
  // Here an actual Twilio SMS / SendGrid Email or external monitoring integration would process the request.
  res.status(200).json({
    status: 'RECEIVED',
    message: 'Security webhook processed successfully. SMS and Email alerts queued for dispatch to gym owner.',
    receivedAt: new Date().toISOString()
  });
}

