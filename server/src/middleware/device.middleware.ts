import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';

/**
 * Extracts and validates the hardware device ID from headers.
 * Mobile scans must send 'x-device-id'.
 */
export function extractDeviceId(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const deviceId = req.headers['x-device-id'] as string;
  
  if (deviceId) {
    req.deviceId = deviceId.trim();
  } else if (req.body && req.body.device_id) {
    req.deviceId = req.body.device_id.trim();
  }

  next();
}

