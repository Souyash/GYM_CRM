import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  WASocket
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import type { Server as SocketIOServer } from 'socket.io';

let sock: WASocket | null = null;
let ioInstance: SocketIOServer | null = null;
let isConnected = false;
let currentQrDataUrl: string | null = null;
let currentRawQr: string | null = null;
let linkedPhone: string | null = null;
let linkedPushName: string | null = null;
let isInitializing = false;

const SESSION_DIR = path.join(process.cwd(), 'data', 'whatsapp_session');

/**
 * Ensures session storage directory exists
 */
function ensureSessionDir() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }
}

/**
 * Initializes Baileys WhatsApp Multi-Device Socket Connection
 */
export async function initWhatsAppSocket(io?: SocketIOServer): Promise<void> {
  if (io) {
    ioInstance = io;
  }

  if (isInitializing) {
    console.log('[WhatsApp Socket] Already initializing, skipping duplicate call');
    return;
  }

  isInitializing = true;
  ensureSessionDir();

  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    // Create WhatsApp socket instance
    sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: Browsers.macOS('Desktop'),
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000
    });

    // Save auth credentials automatically whenever they update
    sock.ev.on('creds.update', saveCreds);

    // Monitor connection events and QR emission
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentRawQr = qr;
        try {
          currentQrDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            width: 320,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
        } catch (qrErr) {
          console.error('[WhatsApp Socket] Failed to generate QR data URL:', qrErr);
        }

        console.log('\n======================================================');
        console.log('📲 [WHATSAPP LINKED DEVICE] QR CODE GENERATED');
        console.log('Scan the QR code in your CRM Dashboard (or terminal) to connect!');
        console.log('Open WhatsApp > Settings / Three Dots > Linked Devices > Link a Device');
        console.log('======================================================\n');

        if (ioInstance) {
          ioInstance.emit('whatsapp:status', {
            isConnected: false,
            status: 'SCAN_QR',
            qrCode: currentQrDataUrl
          });
        }
      }

      if (connection === 'open') {
        isConnected = true;
        currentQrDataUrl = null;
        currentRawQr = null;

        const userJid = sock?.user?.id || '';
        const rawPhone = userJid.split(':')[0] || userJid.split('@')[0];
        linkedPhone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
        linkedPushName = sock?.user?.name || 'FIDGIT Gym';

        console.log('\n======================================================');
        console.log(`✅ [WHATSAPP LINKED DEVICE] CONNECTED SUCCESSFULLY!`);
        console.log(`📱 Phone: ${linkedPhone}`);
        console.log(`👤 Name: ${linkedPushName}`);
        console.log('======================================================\n');

        if (ioInstance) {
          ioInstance.emit('whatsapp:status', {
            isConnected: true,
            status: 'CONNECTED',
            phone: linkedPhone,
            pushName: linkedPushName
          });
        }
      } else if (connection === 'close') {
        isConnected = false;
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[WhatsApp Socket] Connection closed (code: ${statusCode}, reconnect: ${shouldReconnect})`);

        if (statusCode === DisconnectReason.loggedOut) {
          console.log('⚠️ [WhatsApp Socket] Session logged out. Clearing credentials...');
          try {
            if (fs.existsSync(SESSION_DIR)) {
              fs.rmSync(SESSION_DIR, { recursive: true, force: true });
            }
          } catch (e) {
            console.error('[WhatsApp Socket] Error clearing session dir:', e);
          }
          linkedPhone = null;
          linkedPushName = null;
          currentQrDataUrl = null;

          if (ioInstance) {
            ioInstance.emit('whatsapp:status', {
              isConnected: false,
              status: 'LOGGED_OUT'
            });
          }

          // Restart after cleanup to create a fresh QR code
          setTimeout(() => {
            isInitializing = false;
            initWhatsAppSocket();
          }, 3000);
        } else if (shouldReconnect) {
          console.log('[WhatsApp Socket] Reconnecting in 5 seconds...');
          setTimeout(() => {
            isInitializing = false;
            initWhatsAppSocket();
          }, 5000);
        } else {
          isInitializing = false;
        }
      }
    });
  } catch (error) {
    console.error('[WhatsApp Socket] Initialization error:', error);
    isInitializing = false;
  } finally {
    isInitializing = false;
  }
}

/**
 * Returns whether the WhatsApp socket is active and authenticated
 */
export function isWhatsAppSocketConnected(): boolean {
  return isConnected && sock !== null;
}

/**
 * Retrieves the current device status and active QR code (if awaiting scan)
 */
export function getWhatsAppDeviceStatus() {
  return {
    isConnected,
    status: isConnected ? 'CONNECTED' : (currentQrDataUrl ? 'SCAN_QR' : 'CONNECTING'),
    phone: linkedPhone,
    pushName: linkedPushName,
    qrCode: currentQrDataUrl
  };
}

/**
 * Sends a WhatsApp text message through the linked phone socket
 */
export async function sendSocketWhatsAppMessage(
  recipientPhone: string,
  content: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!sock || !isConnected) {
    return {
      success: false,
      error: 'WhatsApp Linked Device is not connected. Please scan QR in the CRM dashboard.'
    };
  }

  try {
    // Strip everything except digits and format to WhatsApp JID
    const cleanDigits = recipientPhone.replace(/[^\d]/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      return { success: false, error: `Invalid recipient phone: ${recipientPhone}` };
    }

    const jid = `${cleanDigits}@s.whatsapp.net`;
    const res = await sock.sendMessage(jid, { text: content });

    return {
      success: true,
      messageId: res?.key?.id || undefined
    };
  } catch (err: any) {
    console.error('[WhatsApp Socket Dispatch Error]:', err);
    return {
      success: false,
      error: err.message || 'Failed to dispatch via WhatsApp socket'
    };
  }
}

/**
 * Disconnects / unlinks the current session and restarts socket to produce fresh QR
 */
export async function disconnectWhatsAppDevice(): Promise<{ success: boolean; message: string }> {
  try {
    if (sock) {
      try {
        await sock.logout();
      } catch (logoutErr) {
        // Socket may already be closed
      }
      sock = null;
    }

    isConnected = false;
    linkedPhone = null;
    linkedPushName = null;
    currentQrDataUrl = null;
    currentRawQr = null;

    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    }

    if (ioInstance) {
      ioInstance.emit('whatsapp:status', {
        isConnected: false,
        status: 'DISCONNECTED'
      });
    }

    // Re-initialize to generate a brand new QR code for the user
    setTimeout(() => {
      initWhatsAppSocket();
    }, 1500);

    return { success: true, message: 'WhatsApp device session unlinked successfully. Fresh QR code generated.' };
  } catch (err: any) {
    console.error('[WhatsApp Socket Disconnect Error]:', err);
    return { success: false, message: err.message || 'Failed to disconnect WhatsApp device.' };
  }
}
