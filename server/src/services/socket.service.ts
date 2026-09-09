import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export function initializeSocket(httpServer: HttpServer, clientOrigin: string = '*'): Server {
  io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Join role-specific rooms
    socket.on('join_role_room', (role: string) => {
      socket.join(`role:${role}`);
      console.log(`[WebSocket] Socket ${socket.id} joined room role:${role}`);
    });

    // Join user-specific room
    socket.on('join_user_room', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`[WebSocket] Socket ${socket.id} joined room user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocketIO(): Server {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
}

/**
 * Pushes real-time verified attendance entry to Manager and Super Admin dashboards
 */
export function emitNewAttendance(entryPayload: any) {
  if (!io) return;
  io.to('role:MANAGER').to('role:SUPER_ADMIN').emit('attendance:new_entry', entryPayload);
  // Also broadcast globally so active dashboards update instantly
  io.emit('attendance:live_feed', entryPayload);
}

/**
 * Pushes member departure / checkout event to dashboards
 */
export function emitMemberExited(exitPayload: any) {
  if (!io) return;
  io.to('role:MANAGER').to('role:SUPER_ADMIN').emit('attendance:member_exited', exitPayload);
  io.emit('attendance:live_feed_exit', exitPayload);
}

/**
 * Triggers red drop-down alert banner directly on Super Admin dashboard
 */
export function emitFailedAccessAlert(alertPayload: any) {
  if (!io) return;
  io.to('role:SUPER_ADMIN').emit('alert:failed_access', alertPayload);
  // Also send to all connected admins/managers
  io.emit('alert:threat_detected', alertPayload);
}

/**
 * Pushes multi-device detection alert to Super Admin panel
 */
export function emitMultiDeviceAlert(conflictPayload: any) {
  if (!io) return;
  io.to('role:SUPER_ADMIN').emit('alert:multi_device', conflictPayload);
}

/**
 * Notifies member when admin approves or resolves a device change
 */
export function emitDeviceStatusChanged(userId: string, statusPayload: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit('member:device_status_changed', statusPayload);
}

