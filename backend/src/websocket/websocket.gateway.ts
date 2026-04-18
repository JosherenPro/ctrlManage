import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface AttendanceEvent {
  sessionId: string;
  studentId: string;
  studentName: string;
  status: string;
  scannedAt: string;
}

interface SessionEvent {
  sessionId: string;
  status: string;
  teacherId: string;
  message?: string;
}

@WebSocketGateway({
  namespace: 'sessions',
  cors: {
    origin: process.env.FRONTEND_URL?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
    ],
    credentials: true,
  },
})
export class SessionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server = null!;

  private readonly logger = new Logger(SessionsGateway.name);
  private connectedClients = new Map<string, { socketId: string; userId?: string; role?: string }>();
  private jwtVerify: ((token: string) => any) | null = null;

  setJwtVerify(fn: (token: string) => any) {
    this.jwtVerify = fn;
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token && this.jwtVerify) {
        const payload = this.jwtVerify(token);
        this.connectedClients.set(client.id, {
          socketId: client.id,
          userId: payload.sub,
          role: payload.role,
        });
        this.logger.log(`Client connected: ${client.id} (User: ${payload.sub}, Role: ${payload.role})`);
      } else {
        this.connectedClients.set(client.id, { socketId: client.id });
        this.logger.log(`Client connected (anonymous): ${client.id}`);
      }
    } catch (error) {
      this.connectedClients.set(client.id, { socketId: client.id });
      this.logger.log(`Client connected (no auth): ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Subscribe to a session room for real-time attendance updates
   */
  @SubscribeMessage('joinSession')
  handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const room = `session:${data.sessionId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);

    // Notify others that a viewer joined
    client.to(room).emit('viewerJoined', {
      sessionId: data.sessionId,
      socketId: client.id,
      timestamp: new Date().toISOString(),
    });

    return { event: 'joinedSession', data: { sessionId: data.sessionId } };
  }

  /**
   * Unsubscribe from a session room
   */
  @SubscribeMessage('leaveSession')
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const room = `session:${data.sessionId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    return { event: 'leftSession', data: { sessionId: data.sessionId } };
  }

  /**
   * Notify all clients in a session about a new attendance
   */
  notifyNewAttendance(data: AttendanceEvent) {
    const room = `session:${data.sessionId}`;
    this.server.to(room).emit('newAttendance', data);
    this.logger.debug(`Attendance notification sent to ${room}: ${data.studentName}`);
  }

  /**
   * Notify all clients in a session about session status change
   */
  notifySessionStatusChange(data: SessionEvent) {
    const room = `session:${data.sessionId}`;
    this.server.to(room).emit('sessionStatusChange', data);
    this.logger.debug(`Session status change to ${room}: ${data.status}`);
  }

  /**
   * Broadcast a new QR code generated for a session
   */
  notifyQrCodeGenerated(sessionId: string, token: string, expiresAt: string) {
    const room = `session:${sessionId}`;
    this.server.to(room).emit('qrCodeGenerated', {
      sessionId,
      token,
      expiresAt,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get connected clients count for a session
   */
  getSessionViewerCount(sessionId: string): number {
    const room = this.server.sockets.adapter.rooms.get(`session:${sessionId}`);
    return room ? room.size : 0;
  }

  /**
   * Get all connected clients stats
   */
  getStats() {
    const stats = {
      totalConnections: this.connectedClients.size,
      byRole: {} as Record<string, number>,
    };

    this.connectedClients.forEach(client => {
      const role = client.role || 'anonymous';
      stats.byRole[role] = (stats.byRole[role] || 0) + 1;
    });

    return stats;
  }
}