import 'dotenv/config';
import http from 'http';
import { createApp } from './app.js';
import { initializeSocket } from './services/socket.service.js';
import { startExpiryScheduler } from './services/whatsappScheduler.service.js';

const app = createApp();
const server = http.createServer(app);

const clientOrigin = process.env.CLIENT_ORIGIN || '*';
initializeSocket(server, clientOrigin);
startExpiryScheduler();

const PORT = process.env.PORT || 5001;

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 FIDGIT Gym CRM Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server listening for live attendance & threats`);
  console.log(`💬 Automated WhatsApp Expiry Reminders & Notifications ACTIVE`);
  console.log(`🛡️ Anti-Fraud Geofencing & Strict Device Binding ACTIVE`);
  console.log(`====================================================`);
});

