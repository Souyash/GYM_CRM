import http from 'http';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { initializeSocket } from './services/socket.service.js';

dotenv.config();

const app = createApp();
const server = http.createServer(app);

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
initializeSocket(server, clientOrigin);

const PORT = process.env.PORT || 5001;

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 IronVault Gym CRM Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server listening for live attendance & threats`);
  console.log(`🛡️ Anti-Fraud Geofencing & Strict Device Binding ACTIVE`);
  console.log(`====================================================`);
});

