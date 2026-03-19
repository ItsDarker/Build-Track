'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, isSocketConnected } from '@/lib/socket/client';

/**
 * Hook for using Socket.io in components
 * Provides access to socket instance and helper methods
 */
export function useSocketIO() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    try {
      socketRef.current = getSocket();
    } catch (error) {
      // console.warn('[useSocketIO] Socket not initialized yet');
    }
  }, []);

  const emit = useCallback(
    (event: string, data?: any) => {
      if (socketRef.current && isSocketConnected()) {
        socketRef.current.emit(event, data);
      } else {
        console.warn(`[Socket.io] Cannot emit '${event}': socket not connected`);
      }
    },
    []
  );

  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      if (socketRef.current) {
        socketRef.current.on(event, callback);
      }
    },
    []
  );

  const off = useCallback(
    (event: string, callback?: (...args: any[]) => void) => {
      if (socketRef.current) {
        if (callback) {
          socketRef.current.off(event, callback);
        } else {
          socketRef.current.off(event);
        }
      }
    },
    []
  );

  const once = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      if (socketRef.current) {
        socketRef.current.once(event, callback);
      }
    },
    []
  );

  const getIsConnected = useCallback(() => isSocketConnected(), []);

  return {
    emit,
    on,
    off,
    once,
    isConnected: getIsConnected(),
  };
}

