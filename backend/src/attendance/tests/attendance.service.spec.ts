import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AttendanceService } from '../attendance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { RequestUser } from '../../common/interfaces';

describe('AttendanceService', () => {
  let service: AttendanceService;

  const mockPrisma = {
    attendanceRecord: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
    },
    qrCode: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockStudentUser: RequestUser = {
    id: 'user-1',
    email: 'student@test.com',
    fullName: 'Test Student',
    status: 'ACTIVE',
    roleId: 'role-1',
    role: { id: 'role-1', name: 'STUDENT' },
    studentProfile: { id: 'student-1', studentNumber: 'STU001', classId: 'class-1' },
    teacherProfile: null,
  };

  const mockTeacherUser: RequestUser = {
    id: 'user-2',
    email: 'teacher@test.com',
    fullName: 'Test Teacher',
    status: 'ACTIVE',
    roleId: 'role-2',
    role: { id: 'role-2', name: 'PROFESSOR' },
    studentProfile: null,
    teacherProfile: { id: 'teacher-1', employeeNumber: 'EMP001', department: 'CS' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    jest.clearAllMocks();
  });

  describe('getBySession', () => {
    it('should return attendance records for a session', async () => {
      const mockRecords = [
        { id: 'rec-1', sessionId: 'session-1', studentId: 'student-1', status: 'PRESENT' },
        { id: 'rec-2', sessionId: 'session-1', studentId: 'student-2', status: 'LATE' },
      ];
      mockPrisma.attendanceRecord.findMany.mockResolvedValue(mockRecords as any);

      const result = await service.getBySession('session-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.attendanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sessionId: 'session-1' },
          orderBy: { scannedAt: 'asc' },
        }),
      );
    });
  });

  describe('getByStudent', () => {
    it('should return attendance records for a student', async () => {
      const mockRecords = [
        { id: 'rec-1', sessionId: 'session-1', studentId: 'student-1', status: 'PRESENT' },
      ];
      mockPrisma.attendanceRecord.findMany.mockResolvedValue(mockRecords as any);

      const result = await service.getByStudent('student-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.attendanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { studentId: 'student-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('getByUser', () => {
    it('should return attendance records for a student user', async () => {
      const mockRecords = [{ id: 'rec-1', status: 'PRESENT' }];
      mockPrisma.attendanceRecord.findMany.mockResolvedValue(mockRecords as any);

      const result = await service.getByUser(mockStudentUser);

      expect(result).toHaveLength(1);
      expect(mockPrisma.attendanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { studentId: 'student-1' },
        }),
      );
    });

    it('should throw BadRequestException when user is not a student', async () => {
      await expect(service.getByUser(mockTeacherUser)).rejects.toThrow(BadRequestException);
      await expect(service.getByUser(mockTeacherUser)).rejects.toThrow('User is not a student');
    });
  });

  describe('registerAttendance', () => {
    it('should register attendance successfully', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({ id: 'session-1', status: 'OPEN' } as any);
      mockPrisma.student.findUnique.mockResolvedValue({ id: 'student-1' } as any);
      mockPrisma.attendanceRecord.findUnique.mockResolvedValue(null);
      mockPrisma.attendanceRecord.create.mockResolvedValue({
        id: 'rec-1',
        sessionId: 'session-1',
        studentId: 'student-1',
        status: 'PRESENT',
        scannedAt: new Date(),
      } as any);

      const result = await service.registerAttendance(mockTeacherUser, 'session-1', 'student-1');

      expect(result.status).toBe('PRESENT');
      expect(mockPrisma.attendanceRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: 'session-1',
            studentId: 'student-1',
            status: 'PRESENT',
          }),
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'user-2',
        'REGISTER_ATTENDANCE',
        'AttendanceRecord',
        'rec-1',
      );
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(service.registerAttendance(mockTeacherUser, 'bad-session', 'student-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.registerAttendance(mockTeacherUser, 'bad-session', 'student-1')).rejects.toThrow(
        'Session not found',
      );
    });

    it('should throw BadRequestException when session is not open', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({ id: 'session-1', status: 'CLOSED' } as any);

      await expect(service.registerAttendance(mockTeacherUser, 'session-1', 'student-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.registerAttendance(mockTeacherUser, 'session-1', 'student-1')).rejects.toThrow(
        'Session is not open',
      );
    });

    it('should throw NotFoundException when student not found', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({ id: 'session-1', status: 'OPEN' } as any);
      mockPrisma.student.findUnique.mockResolvedValue(null);

      await expect(service.registerAttendance(mockTeacherUser, 'session-1', 'bad-student')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.registerAttendance(mockTeacherUser, 'session-1', 'bad-student')).rejects.toThrow(
        'Student not found',
      );
    });

    it('should throw BadRequestException when attendance already recorded', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({ id: 'session-1', status: 'OPEN' } as any);
      mockPrisma.student.findUnique.mockResolvedValue({ id: 'student-1' } as any);
      mockPrisma.attendanceRecord.findUnique.mockResolvedValue({ id: 'existing-rec' } as any);

      await expect(service.registerAttendance(mockTeacherUser, 'session-1', 'student-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.registerAttendance(mockTeacherUser, 'session-1', 'student-1')).rejects.toThrow(
        'Attendance already recorded for this student',
      );
    });
  });

  describe('scanQrCode', () => {
    const futureExpiry = new Date(Date.now() + 5 * 60 * 1000);

    it('should scan QR code and create attendance record', async () => {
      const mockQrCode = {
        id: 'qr-1',
        token: 'valid-token',
        sessionId: 'session-1',
        usedAt: null,
        revokedAt: null,
        expiresAt: futureExpiry,
      };
      const mockRecord = {
        id: 'rec-1',
        sessionId: 'session-1',
        studentId: 'student-1',
        status: 'PRESENT',
        scannedAt: new Date(),
      };

      mockPrisma.qrCode.findUnique.mockResolvedValue(mockQrCode as any);
      mockPrisma.session.findUnique.mockResolvedValue({ id: 'session-1', status: 'OPEN' } as any);
      mockPrisma.student.findUnique.mockResolvedValue({ id: 'student-1' } as any);
      mockPrisma.attendanceRecord.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockResolvedValue([mockRecord]);

      const result = await service.scanQrCode(mockStudentUser, 'valid-token', 'student-1');

      expect(result.id).toBe('rec-1');
      expect(result.status).toBe('PRESENT');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'user-1',
        'SCAN_QR',
        'AttendanceRecord',
        'rec-1',
        { qrCodeId: 'qr-1' },
      );
    });

    it('should throw NotFoundException when QR code not found', async () => {
      mockPrisma.qrCode.findUnique.mockResolvedValue(null);

      await expect(service.scanQrCode(mockStudentUser, 'bad-token', 'student-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.scanQrCode(mockStudentUser, 'bad-token', 'student-1')).rejects.toThrow(
        'QR code not found',
      );
    });

    it('should throw BadRequestException when QR code already used', async () => {
      mockPrisma.qrCode.findUnique.mockResolvedValue({
        id: 'qr-1',
        token: 'used-token',
        usedAt: new Date(),
        revokedAt: null,
        expiresAt: futureExpiry,
      } as any);

      await expect(service.scanQrCode(mockStudentUser, 'used-token', 'student-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.scanQrCode(mockStudentUser, 'used-token', 'student-1')).rejects.toThrow(
        'QR code already used',
      );
    });

    it('should throw BadRequestException when QR code revoked', async () => {
      mockPrisma.qrCode.findUnique.mockResolvedValue({
        id: 'qr-1',
        token: 'revoked-token',
        usedAt: null,
        revokedAt: new Date(),
        expiresAt: futureExpiry,
      } as any);

      await expect(service.scanQrCode(mockStudentUser, 'revoked-token', 'student-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.scanQrCode(mockStudentUser, 'revoked-token', 'student-1')).rejects.toThrow(
        'QR code has been revoked',
      );
    });

    it('should throw BadRequestException when QR code expired', async () => {
      mockPrisma.qrCode.findUnique.mockResolvedValue({
        id: 'qr-1',
        token: 'expired-token',
        usedAt: null,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 60000),
      } as any);

      await expect(service.scanQrCode(mockStudentUser, 'expired-token', 'student-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.scanQrCode(mockStudentUser, 'expired-token', 'student-1')).rejects.toThrow(
        'QR code has expired',
      );
    });

    it('should throw BadRequestException when session not open', async () => {
      mockPrisma.qrCode.findUnique.mockResolvedValue({
        id: 'qr-1',
        token: 'valid-token',
        sessionId: 'session-1',
        usedAt: null,
        revokedAt: null,
        expiresAt: futureExpiry,
      } as any);
      mockPrisma.session.findUnique.mockResolvedValue({ id: 'session-1', status: 'CLOSED' } as any);

      await expect(service.scanQrCode(mockStudentUser, 'valid-token', 'student-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.scanQrCode(mockStudentUser, 'valid-token', 'student-1')).rejects.toThrow(
        'Session is not open',
      );
    });

    it('should throw BadRequestException when session not found', async () => {
      mockPrisma.qrCode.findUnique.mockResolvedValue({
        id: 'qr-1',
        token: 'valid-token',
        sessionId: 'session-1',
        usedAt: null,
        revokedAt: null,
        expiresAt: futureExpiry,
      } as any);
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(service.scanQrCode(mockStudentUser, 'valid-token', 'student-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.scanQrCode(mockStudentUser, 'valid-token', 'student-1')).rejects.toThrow(
        'Session is not open',
      );
    });

    it('should throw NotFoundException when student not found', async () => {
      mockPrisma.qrCode.findUnique.mockResolvedValue({
        id: 'qr-1',
        token: 'valid-token',
        sessionId: 'session-1',
        usedAt: null,
        revokedAt: null,
        expiresAt: futureExpiry,
      } as any);
      mockPrisma.session.findUnique.mockResolvedValue({ id: 'session-1', status: 'OPEN' } as any);
      mockPrisma.student.findUnique.mockResolvedValue(null);

      await expect(service.scanQrCode(mockStudentUser, 'valid-token', 'bad-student')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.scanQrCode(mockStudentUser, 'valid-token', 'bad-student')).rejects.toThrow(
        'Student not found',
      );
    });

    it('should throw BadRequestException when attendance already recorded', async () => {
      mockPrisma.qrCode.findUnique.mockResolvedValue({
        id: 'qr-1',
        token: 'valid-token',
        sessionId: 'session-1',
        usedAt: null,
        revokedAt: null,
        expiresAt: futureExpiry,
      } as any);
      mockPrisma.session.findUnique.mockResolvedValue({ id: 'session-1', status: 'OPEN' } as any);
      mockPrisma.student.findUnique.mockResolvedValue({ id: 'student-1' } as any);
      mockPrisma.attendanceRecord.findUnique.mockResolvedValue({ id: 'existing-rec' } as any);

      await expect(service.scanQrCode(mockStudentUser, 'valid-token', 'student-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.scanQrCode(mockStudentUser, 'valid-token', 'student-1')).rejects.toThrow(
        'Attendance already recorded for this session',
      );
    });
  });

  describe('validateAttendance', () => {
    it('should validate attendance record with new status', async () => {
      const mockRecord = { id: 'rec-1', status: 'PRESENT' };
      const mockUpdated = { id: 'rec-1', status: 'LATE', validatedAt: expect.any(Date), validatedById: 'user-2', notes: 'Arrived 10min late' };

      mockPrisma.attendanceRecord.findUnique.mockResolvedValue(mockRecord as any);
      mockPrisma.attendanceRecord.update.mockResolvedValue(mockUpdated as any);

      const result = await service.validateAttendance('rec-1', mockTeacherUser, {
        status: 'LATE' as any,
        notes: 'Arrived 10min late',
      });

      expect(result.status).toBe('LATE');
      expect(mockPrisma.attendanceRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rec-1' },
          data: expect.objectContaining({
            status: 'LATE',
            validatedById: 'user-2',
            notes: 'Arrived 10min late',
          }),
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'user-2',
        'VALIDATE_ATTENDANCE',
        'AttendanceRecord',
        'rec-1',
        { status: 'LATE' },
      );
    });

    it('should throw NotFoundException when record not found', async () => {
      mockPrisma.attendanceRecord.findUnique.mockResolvedValue(null);

      await expect(
        service.validateAttendance('bad-rec', mockTeacherUser, { status: 'ABSENT' as any }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.validateAttendance('bad-rec', mockTeacherUser, { status: 'ABSENT' as any }),
      ).rejects.toThrow('Attendance record not found');
    });
  });
});