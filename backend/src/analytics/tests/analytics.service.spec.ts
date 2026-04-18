import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockPrisma: any;

  const adminUser = { id: 'u1', role: { name: 'ADMIN' } };
  const professorUser = { id: 'u2', role: { name: 'PROFESSOR' } };
  const studentUser = { id: 'u3', role: { name: 'STUDENT' } };

  beforeEach(async () => {
    mockPrisma = {
      student: { count: jest.fn().mockResolvedValue(0), findUnique: jest.fn() },
      course: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
      session: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
      attendanceRecord: { findMany: jest.fn().mockResolvedValue([]), groupBy: jest.fn().mockResolvedValue([]) },
      teacher: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  describe('getOverview (admin)', () => {
    it('should return admin overview with stats', async () => {
      mockPrisma.student.count.mockResolvedValue(100);
      mockPrisma.course.count.mockResolvedValue(10);
      // First call returns total sessions, second call returns open sessions
      mockPrisma.session.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(3);

      const result = await service.getOverview(adminUser as any);
      expect(result).toHaveProperty('totalStudents', 100);
      expect(result).toHaveProperty('totalCourses', 10);
      expect(result).toHaveProperty('totalSessions', 50);
      expect(result).toHaveProperty('openSessions', 3);
      expect(result).toHaveProperty('attendanceByMonth');
      expect(result).toHaveProperty('topCourses');
    });
  });

  describe('getOverview (professor)', () => {
    it('should return professor overview filtered by teacherId', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({ id: 't1' });
      mockPrisma.course.count.mockResolvedValue(5);
      mockPrisma.session.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(2);

      const result = await service.getOverview(professorUser as any);
      expect(result).toHaveProperty('totalCourses', 5);
      expect(result).toHaveProperty('totalSessions', 20);
      expect(result).toHaveProperty('openSessions', 2);
    });
  });

  describe('getOverview (student)', () => {
    it('should return student attendance stats', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1' });
      mockPrisma.attendanceRecord.groupBy.mockResolvedValue([
        { status: 'PRESENT', _count: 10 },
        { status: 'LATE', _count: 2 },
        { status: 'ABSENT', _count: 3 },
      ]);

      const result = await service.getOverview(studentUser as any);
      expect(result).toHaveProperty('rate');
      expect(result).toHaveProperty('presentCount', 10);
    });

    it('should return zero stats when student has no profile', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);

      const result = await service.getOverview(studentUser as any);
      expect((result as any).rate).toBe(0);
    });
  });
});