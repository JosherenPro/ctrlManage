import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../audit.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let mockPrisma: any;

  const mockAuditLog = {
    id: 'log-1',
    actorId: 'user-1',
    action: 'CREATE',
    entityType: 'User',
    entityId: 'user-2',
    metadata: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockPrisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await service.log('user-1', 'CREATE', 'User', 'user-2');
      expect(result).toEqual(mockAuditLog);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'user-1',
          action: 'CREATE',
          entityType: 'User',
          entityId: 'user-2',
          establishmentId: 'default-establishment',
          metadata: undefined,
        },
      });
    });

    it('should create audit log with null actorId', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ ...mockAuditLog, actorId: null });

      await service.log(null, 'SYSTEM', 'Session', 'session-1');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ actorId: null }) }),
      );
    });

    it('should include metadata when provided', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(mockAuditLog);
      const metadata = { ip: '127.0.0.1', userAgent: 'test' };

      await service.log('user-1', 'LOGIN', 'Auth', undefined, metadata);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ metadata }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([{ ...mockAuditLog, actor: { id: 'user-1', email: 'a@b.com', fullName: 'Admin' } }]);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll({});
      expect(result).toEqual({ items: expect.any(Array), total: 1, page: 1, limit: 50 });
    });

    it('should filter by actorId', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.findAll({ actorId: 'user-1' });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ actorId: 'user-1' }) }),
      );
    });

    it('should filter by entityType', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.findAll({ entityType: 'User' });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ entityType: 'User' }) }),
      );
    });

    it('should filter by action', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.findAll({ action: 'CREATE' });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ action: 'CREATE' }) }),
      );
    });
  });
});