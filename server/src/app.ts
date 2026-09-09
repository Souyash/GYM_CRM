import express, { Express } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import entryRoutes from './routes/entry.routes.js';
import facilityRoutes from './routes/facility.routes.js';
import membershipRoutes from './routes/membership.routes.js';
import failedLogsRoutes from './routes/failedLogs.routes.js';
import deviceRoutes from './routes/device.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/entry', entryRoutes);
  app.use('/api/facilities', facilityRoutes);
  app.use('/api/memberships', membershipRoutes);
  app.use('/api/failed-logs', failedLogsRoutes);
  app.use('/api/device-management', deviceRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/webhooks', webhookRoutes);

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ONLINE',
      service: 'IronVault Gym CRM API',
      timestamp: new Date().toISOString()
    });
  });

  return app;
}

