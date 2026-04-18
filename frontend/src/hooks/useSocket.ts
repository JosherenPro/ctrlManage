'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

interface SessionStatusEvent {
  sessionId: string;
  status: string;
  teacherId: string;
  message?: string;
}

interface AttendanceEvent {
  sessionId: string;
  studentId: string;
  studentName: string;
  status: string;
  scannedAt: string;
}

interface QrCodeEvent {
  sessionId: string;
  token: string;
  expiresAt: string;
  timestamp: string;
}

interface UseSocketOptions {
  onSessionStatusChange?: (data: SessionStatusEvent) => void;
  onNewAttendance?: (data: AttendanceEvent) => void;
  onQrCodeGenerated?: (data: QrCodeEvent) => void;
  enableNotifications?: boolean;
}

function requestNotificationPermission() {
  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'default'
  ) {
    Notification.requestPermission();
  }
}

function sendNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/favicon.ico' });
  } catch {
    // Notification API may not be available in some contexts
  }
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const socket = io(`${WS_URL}/sessions`, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[WS] Connected:', socket.id);
      if (optionsRef.current.enableNotifications) {
        requestNotificationPermission();
      }
    });

    socket.on('disconnect', reason => {
      console.log('[WS] Disconnected:', reason);
    });

    socket.on('sessionStatusChange', (data: SessionStatusEvent) => {
      optionsRef.current.onSessionStatusChange?.(data);
      if (optionsRef.current.enableNotifications && data.status === 'OPEN') {
        sendNotification(
          'Session ouverte',
          `Une session vient d'être ouverte. Scannez votre QR code !`,
        );
      }
    });

    socket.on('newAttendance', (data: AttendanceEvent) => {
      optionsRef.current.onNewAttendance?.(data);
    });

    socket.on('qrCodeGenerated', (data: QrCodeEvent) => {
      optionsRef.current.onQrCodeGenerated?.(data);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const joinSession = useCallback((sessionId: string) => {
    socketRef.current?.emit('joinSession', { sessionId });
  }, []);

  const leaveSession = useCallback((sessionId: string) => {
    socketRef.current?.emit('leaveSession', { sessionId });
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    joinSession,
    leaveSession,
  };
}
