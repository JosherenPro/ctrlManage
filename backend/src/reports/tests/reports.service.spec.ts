import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReportsService } from '../reports.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrisma = {
    session: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    class: {
      findUnique: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    attendanceRecord: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  describe('sessionReport', () => {
    it('should return session report with attendance stats', async () => {
      const mockSession = { id: 'session-1', course: { id: 'course-1', title: 'Math' } };
      const mockRecords = [
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'LATE' },
        { status: 'ABSENT' },
        { status: 'JUSTIFIED' },
      ];

      mockPrisma.session.findUnique.mockResolvedValue(mockSession as any);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue(mockRecords as any);

      const result = await service.sessionReport('session-1');

      expect(result.session.id).toBe('session-1');
      expect(result.total).toBe(5);
      expect(result.present).toBe(2);
      expect(result.late).toBe(1);
      expect(result.absent).toBe(1);
      expect(result.justified).toBe(1);
      expect(result.rate).toBe('60.0');
    });

    it('should return 0 rate when no records', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({ id: 'session-1', course: {} } as any);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);

      const result = await service.sessionReport('session-1');

      expect(result.total).toBe(0);
      expect(result.rate).toBe('0');
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(service.sessionReport('bad-session')).rejects.toThrow(NotFoundException);
      await expect(service.sessionReport('bad-session')).rejects.toThrow('Session not found');
    });
  });

  describe('courseReport', () => {
    it('should return course report with aggregate stats', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'course-1', title: 'Math' } as any);
      mockPrisma.session.findMany.mockResolvedValue([{ id: 's-1' }, { id: 's-2' }] as any);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'LATE' },
        { status: 'ABSENT' },
      ] as any);

      const result = await service.courseReport('course-1');

      expect(result.course.title).toBe('Math');
      expect(result.totalSessions).toBe(2);
      expect(result.totalRecords).toBe(4);
      expect(result.attendanceRate).toBe('75.0');
    });

    it('should return 0 rate when no records', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'course-1' } as any);
      mockPrisma.session.findMany.mockResolvedValue([]);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);

      const result = await service.courseReport('course-1');

      expect(result.attendanceRate).toBe('0');
    });

    it('should throw NotFoundException when course not found', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(service.courseReport('bad-course')).rejects.toThrow(NotFoundException);
      await expect(service.courseReport('bad-course')).rejects.toThrow('Course not found');
    });
  });

  describe('classReport', () => {
    it('should return class report with student records', async () => {
      mockPrisma.class.findUnique.mockResolvedValue({ id: 'class-1', code: 'L3-CS' } as any);
      mockPrisma.student.findMany.mockResolvedValue([{ id: 'student-1' }, { id: 'student-2' }] as any);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([
        { id: 'rec-1', status: 'PRESENT' },
        { id: 'rec-2', status: 'ABSENT' },
      ] as any);

      const result = await service.classReport('class-1');

      expect(result.class.id).toBe('class-1');
      expect(result.totalStudents).toBe(2);
      expect(result.totalRecords).toBe(2);
    });

    it('should throw NotFoundException when class not found', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null);

      await expect(service.classReport('bad-class')).rejects.toThrow(NotFoundException);
      await expect(service.classReport('bad-class')).rejects.toThrow('Class not found');
    });
  });

  describe('studentReport', () => {
    it('should return student report with attendance stats', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student-1',
        user: { fullName: 'Test Student' },
      } as any);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'LATE' },
        { status: 'ABSENT' },
      ] as any);

      const result = await service.studentReport('student-1');

      expect(result.student.id).toBe('student-1');
      expect(result.total).toBe(4);
      expect(result.present).toBe(2);
      expect(result.late).toBe(1);
      expect(result.rate).toBe('75.0');
    });

    it('should return 0 rate when no records', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student-1',
        user: { fullName: 'Test' },
      } as any);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);

      const result = await service.studentReport('student-1');

      expect(result.rate).toBe('0');
    });

    it('should throw NotFoundException when student not found', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);

      await expect(service.studentReport('bad-student')).rejects.toThrow(NotFoundException);
      await expect(service.studentReport('bad-student')).rejects.toThrow('Student not found');
    });
  });

  describe('exportCsv', () => {
    it('should export CSV with no filters', async () => {
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([
        {
          student: { user: { fullName: 'John Doe' }, studentNumber: 'STU001' },
          session: { course: { code: 'CS101' }, startsAt: new Date('2026-01-01') },
          status: 'PRESENT',
          scannedAt: new Date('2026-01-01T09:00:00Z'),
          validatedAt: null,
          createdAt: new Date(),
        },
      ] as any);

      const result = await service.exportCsv();

      expect(typeof result).toBe('string');
      expect(result).toContain('John Doe');
      expect(result).toContain('CS101');
      expect(result).toContain('PRESENT');
    });

    it('should export CSV with courseId filter', async () => {
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);

      await service.exportCsv('course-1');

      expect(mockPrisma.attendanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ session: { courseId: 'course-1' } }),
        }),
      );
    });

    it('should export CSV with sessionId filter', async () => {
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);

      await service.exportCsv(undefined, 'session-1');

      expect(mockPrisma.attendanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ sessionId: 'session-1' }),
        }),
      );
    });

    it('should export CSV with both filters', async () => {
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);

      await service.exportCsv('course-1', 'session-1');

      expect(mockPrisma.attendanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sessionId: 'session-1',
            session: { courseId: 'course-1' },
          }),
        }),
      );
    });
  });

  describe('exportExcel', () => {
    it('should return a Buffer for valid session', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        course: { title: 'Math', code: 'MATH101' },
        teacher: { user: { fullName: 'Prof Test' } },
        startsAt: new Date('2026-01-01'),
        room: 'A101',
        status: 'CLOSED',
      } as any);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([
        {
          student: { studentNumber: 'STU001', user: { fullName: 'John Doe' }, class: { code: 'L3' } },
          status: 'PRESENT',
          scannedAt: new Date('2026-01-01T09:00:00Z'),
          validatedAt: null,
          notes: '',
        },
      ] as any);

      const result = await service.exportExcel('session-1');

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(service.exportExcel('bad-session')).rejects.toThrow(NotFoundException);
    });

    it('should handle empty records', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        course: { title: 'Math', code: 'M101' },
        teacher: { user: { fullName: 'Prof' } },
        startsAt: new Date(),
        room: 'A1',
        status: 'CLOSED',
      } as any);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);

      const result = await service.exportExcel('session-1');

      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('exportPdf', () => {
    it('should return a PDF Buffer for valid session', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        course: { title: 'Math', code: 'MATH101' },
        teacher: { user: { fullName: 'Prof Test' } },
        startsAt: new Date('2026-01-01'),
        room: 'A101',
        status: 'CLOSED',
      } as any);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([
        {
          student: { studentNumber: 'STU001', user: { fullName: 'John Doe' }, class: { code: 'L3' } },
          status: 'PRESENT',
          scannedAt: new Date('2026-01-01T09:00:00Z'),
          validatedAt: null,
          notes: '',
        },
      ] as any);

      const result = await service.exportPdf('session-1');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString('ascii', 0, 5)).toBe('%PDF-');
    });

    it('should handle French-accented characters in PDF', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        course: { title: 'Mathématiques', code: 'MATH101' },
        teacher: { user: { fullName: 'Prof Rémi' } },
        startsAt: new Date('2026-01-01'),
        room: 'Salle à côté',
        status: 'CLOSED',
      } as any);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([
        {
          student: { studentNumber: 'STU001', user: { fullName: 'Élise Lefèvre' }, class: { code: 'L3' } },
          status: 'JUSTIFIED',
          scannedAt: null,
          validatedAt: new Date(),
          notes: 'Absence justifiée',
        },
      ] as any);

      const result = await service.exportPdf('session-1');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString('ascii', 0, 5)).toBe('%PDF-');
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(service.exportPdf('bad-session')).rejects.toThrow(NotFoundException);
    });

    it('should handle empty records in PDF', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        course: { title: 'Math', code: 'M101' },
        teacher: { user: { fullName: 'Prof' } },
        startsAt: new Date(),
        room: 'A1',
        status: 'CLOSED',
      } as any);
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);

      const result = await service.exportPdf('session-1');

      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });
});