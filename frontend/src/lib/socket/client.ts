import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Initialize Socket.io client connection
 * Called once when app starts
 */
export function initializeSocket(token: string, userId: string): Socket {
  if (socket) {
    return socket;
  }

  const backendUrl = typeof window !== 'undefined'
    ? window.location.origin.replace(/:\d+$/, ':4000') // Replace port with backend port
    : 'http://localhost:4000';

  socket = io(backendUrl, {
    auth: {
      token,
      userId,
    },
    reconnection: false, // Disabled to prevent console spam
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[Socket.io] Connected:', socket!.id);
  });

  socket.on('disconnect', () => {
    console.log('[Socket.io] Disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket.io] Connection error:', error);
  });

  socket.on('error', (error) => {
    console.error('[Socket.io] Error:', error);
  });

  return socket;
}

/**
 * Get Socket.io client instance
 */
export function getSocket(): Socket {
  if (!socket) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return socket;
}

/**
 * Disconnect Socket.io
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if Socket.io is connected
 */
export function isSocketConnected(): boolean {
  return socket ? socket.connected : false;
}

