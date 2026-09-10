import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const DEFAULT_RENDER_BACKEND = 'https://gym-crm-ejgf.onrender.com';

export function getSocketUrl(): string {
  const custom = localStorage.getItem('ironvault_backend_url');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  const raw = (
    (import.meta.env.VITE_SOCKET_URL as string | undefined) ||
    (import.meta.env.VITE_API_URL as string | undefined)
  )?.trim();
  if (raw) {
    return raw.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || !window.location.hostname.includes('localhost'))) {
    return DEFAULT_RENDER_BACKEND;
  }
  return '/';
}

export function getSocket(): Socket {
  if (!socket) {
    const serverUrl = getSocketUrl();
    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[WebSocket Client] Connected to real-time server with ID:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket Client] Disconnected from real-time server');
    });
  }

  return socket;
}

export function joinRoleRoom(role: string): void {
  const s = getSocket();
  s.emit('join_role_room', role);
}

export function joinUserRoom(userId: string): void {
  const s = getSocket();
  s.emit('join_user_room', userId);
}

