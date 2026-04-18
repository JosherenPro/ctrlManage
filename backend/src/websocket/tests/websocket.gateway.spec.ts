import { SessionsGateway } from '../websocket.gateway';

describe('SessionsGateway', () => {
  let gateway: SessionsGateway;
  let mockJwtVerify: jest.Mock;

  const mockSocket = {
    id: 'socket-1',
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    handshake: {
      auth: {},
      headers: {},
    },
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    sockets: {
      adapter: {
        rooms: new Map([['session:session-1', new Set(['socket-1'])]]),
      },
    },
  };

  beforeEach(() => {
    mockJwtVerify = jest.fn();
    gateway = new SessionsGateway();
    gateway.setJwtVerify(mockJwtVerify);
    gateway.server = mockServer as any;
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should authenticate client with valid token from auth', () => {
      mockJwtVerify.mockReturnValue({ sub: 'user-1', role: 'STUDENT' });
      const socket = { ...mockSocket, handshake: { auth: { token: 'valid-token' }, headers: {} } };

      gateway.handleConnection(socket as any);
      expect(mockJwtVerify).toHaveBeenCalledWith('valid-token');
    });

    it('should store anonymous client when no token provided', () => {
      const socket = { ...mockSocket, handshake: { auth: {}, headers: {} } };

      gateway.handleConnection(socket as any);
    });

    it('should store anonymous client when token is invalid', () => {
      mockJwtVerify.mockImplementation(() => { throw new Error('Invalid token'); });
      const socket = { ...mockSocket, handshake: { auth: { token: 'bad' }, headers: {} } };

      gateway.handleConnection(socket as any);
    });
  });

  describe('handleDisconnect', () => {
    it('should remove client from connected clients map', () => {
      mockJwtVerify.mockReturnValue({ sub: 'user-1', role: 'STUDENT' });
      const socket = { ...mockSocket, handshake: { auth: { token: 'valid' }, headers: {} } };
      gateway.handleConnection(socket as any);
      gateway.handleDisconnect(socket as any);
    });
  });

  describe('handleJoinSession', () => {
    it('should join a session room', () => {
      const socket = { ...mockSocket, join: jest.fn(), to: jest.fn().mockReturnThis(), emit: jest.fn() };
      const result = gateway.handleJoinSession(socket as any, { sessionId: 'session-1' });

      expect(socket.join).toHaveBeenCalledWith('session:session-1');
      expect(result.event).toBe('joinedSession');
    });
  });

  describe('handleLeaveSession', () => {
    it('should leave a session room', () => {
      const socket = { ...mockSocket, leave: jest.fn() };
      const result = gateway.handleLeaveSession(socket as any, { sessionId: 'session-1' });

      expect(socket.leave).toHaveBeenCalledWith('session:session-1');
      expect(result.event).toBe('leftSession');
    });
  });

  describe('notifyNewAttendance', () => {
    it('should emit newAttendance to session room', () => {
      const data = {
        sessionId: 'session-1',
        studentId: 'student-1',
        studentName: 'Test Student',
        status: 'PRESENT',
        scannedAt: new Date().toISOString(),
      };

      gateway.notifyNewAttendance(data);
      expect(mockServer.to).toHaveBeenCalledWith('session:session-1');
      expect(mockServer.to('session:session-1').emit).toHaveBeenCalledWith('newAttendance', data);
    });
  });

  describe('notifySessionStatusChange', () => {
    it('should emit sessionStatusChange to session room', () => {
      const data = { sessionId: 'session-1', status: 'OPEN', teacherId: 'teacher-1' };

      gateway.notifySessionStatusChange(data);
      expect(mockServer.to).toHaveBeenCalledWith('session:session-1');
    });
  });

  describe('notifyQrCodeGenerated', () => {
    it('should emit qrCodeGenerated to session room', () => {
      gateway.notifyQrCodeGenerated('session-1', 'qr-token', '2025-01-01T00:00:00Z');
      expect(mockServer.to).toHaveBeenCalledWith('session:session-1');
    });
  });

  describe('getSessionViewerCount', () => {
    it('should return viewer count for a session', () => {
      const count = gateway.getSessionViewerCount('session-1');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for a session with no viewers', () => {
      const count = gateway.getSessionViewerCount('non-existent');
      expect(count).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return stats with total connections and role breakdown', () => {
      mockJwtVerify.mockReturnValue({ sub: 'user-1', role: 'ADMIN' });
      const socket = { ...mockSocket, handshake: { auth: { token: 'valid' }, headers: {} } };
      gateway.handleConnection(socket as any);

      const stats = gateway.getStats();
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('byRole');
    });
  });
});