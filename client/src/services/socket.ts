import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const RAW_SOCKET_URL = (
  (import.meta.env.VITE_SOCKET_URL as string | undefined) ||
  (import.meta.env.VITE_API_URL as string | undefined)
)?.trim();

const SOCKET_SERVER_URL = RAW_SOCKET_URL
  ? RAW_SOCKET_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '')
  : '/';

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
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

