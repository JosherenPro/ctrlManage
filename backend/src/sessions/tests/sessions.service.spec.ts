import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SessionsService } from '../sessions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateSessionDto } from '../../common/dto/session.dto';

describe('SessionsService', () => {
  let service: SessionsService;
  const mockPrisma = {
    session: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    qrCode: {
      create: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockSessionsGateway = {
    notifySessionStatusChange: jest.fn(),
    notifyQrCodeGenerated: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'teacher@test.com',
    role: { name: 'PROFESSOR' },
    teacherProfile: { id: 'teacher-1' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    service.setSessionsGateway(mockSessionsGateway as any);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated sessions', async () => {
      const mockSessions = [
        { id: 'session-1', courseId: 'course-1', status: 'OPEN' },
        { id: 'session-2', courseId: 'course-1', status: 'CLOSED' },
      ];

      mockPrisma.session.findMany.mockResolvedValue(mockSessions as any);
      mockPrisma.session.count.mockResolvedValue(2);

      const result = await service.findAll(mockUser as any);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should filter by courseId', async () => {
      mockPrisma.session.findMany.mockResolvedValue([]);
      mockPrisma.session.count.mockResolvedValue(0);

      await service.findAll(mockUser as any, 'course-1');

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ courseId: 'course-1' }),
        }),
      );
    });

    it('should filter by teacherId for PROFESSOR role', async () => {
      mockPrisma.session.findMany.mockResolvedValue([]);
      mockPrisma.session.count.mockResolvedValue(0);

      await service.findAll(mockUser as any);

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ teacherId: 'teacher-1' }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return session with relations', async () => {
      const mockSession = {
        id: 'session-1',
        course: { id: 'course-1', title: 'Math' },
        teacher: { id: 'teacher-1', user: { email: 'teacher@test.com' } },
        attendanceRecords: [],
        qrCodes: [],
      };

      mockPrisma.session.findUnique.mockResolvedValue(mockSession as any);

      const result = await service.findById('session-1');

      expect(result.id).toBe('session-1');
      expect(result.course.title).toBe('Math');
    });

    it('should throw NotFoundException if session not found', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto: CreateSessionDto = {
      courseId: 'course-1',
      startsAt: '2026-04-16T09:00:00Z',
      endsAt: '2026-04-16T10:00:00Z',
      room: 'Room 101',
      establishmentId: 'default-establishment',
    };

    it('should create session for teacher', async () => {
      const mockSession = {
        id: 'session-new',
        ...createDto,
        status: 'DRAFT',
        course: { id: 'course-1' },
        teacher: { id: 'teacher-1' },
      };

      mockPrisma.session.create.mockResolvedValue(mockSession as any);

      const result = await service.create(createDto, mockUser as any);

      expect(result.id).toBe('session-new');
      expect(result.status).toBe('DRAFT');
    });

    it('should throw BadRequestException if no teacher', async () => {
      const userWithoutTeacher = {
        id: 'user-2',
        email: 'user@test.com',
        role: { name: 'STUDENT' },
        teacherProfile: null,
      };

      await expect(service.create(createDto, userWithoutTeacher as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('openSession', () => {
    it('should open a DRAFT session', async () => {
      const mockSession = {
        id: 'session-1',
        status: 'DRAFT',
        teacherId: 'teacher-1',
        course: { title: 'Math' },
      };

      mockPrisma.session.findUnique.mockResolvedValue(mockSession as any);
      mockPrisma.session.update.mockResolvedValue({ ...mockSession, status: 'OPEN' } as any);

      const result = await service.openSession('session-1', mockUser as any);

      expect(result.status).toBe('OPEN');
      expect(mockSessionsGateway.notifySessionStatusChange).toHaveBeenCalled();
    });

    it('should throw BadRequestException if session already open', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        status: 'OPEN',
        teacherId: 'teacher-1',
      } as any);

      await expect(service.openSession('session-1', mockUser as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        status: 'DRAFT',
        teacherId: 'other-teacher',
      } as any);

      await expect(service.openSession('session-1', mockUser as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('closeSession', () => {
    it('should close an OPEN session', async () => {
      const mockSession = {
        id: 'session-1',
        status: 'OPEN',
        teacherId: 'teacher-1',
        course: { title: 'Math' },
      };

      mockPrisma.session.findUnique.mockResolvedValue(mockSession as any);
      mockPrisma.session.update.mockResolvedValue({ ...mockSession, status: 'CLOSED' } as any);

      const result = await service.closeSession('session-1', mockUser as any);

      expect(result.status).toBe('CLOSED');
      expect(mockSessionsGateway.notifySessionStatusChange).toHaveBeenCalled();
    });

    it('should throw BadRequestException if session not open', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        status: 'DRAFT',
        teacherId: 'teacher-1',
      } as any);

      await expect(service.closeSession('session-1', mockUser as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generateQrCode', () => {
    it('should generate QR code for open session', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        status: 'OPEN',
      } as any);

      mockPrisma.qrCode.create.mockResolvedValue({
        id: 'qr-1',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      } as any);

      const result = await service.generateQrCode('session-1', mockUser as any);

      expect(result.token).toBe('test-token');
      expect(result.qrUrl).toContain("token=");
      expect(mockPrisma.qrCode.create).toHaveBeenCalled();
      expect(mockSessionsGateway.notifyQrCodeGenerated).toHaveBeenCalled();
    });

    it('should throw BadRequestException if session not open', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        status: 'DRAFT',
      } as any);

      await expect(service.generateQrCode('session-1', mockUser as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
