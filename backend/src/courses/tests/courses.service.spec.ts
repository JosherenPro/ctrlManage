import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CoursesService } from '../courses.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CoursesService', () => {
  let service: CoursesService;
  let mockPrisma: any;

  const mockCourse = {
    id: 'course-1',
    code: 'CS101',
    title: 'Introduction to CS',
    description: 'Basic CS course',
    classId: 'class-1',
    teacherId: 'teacher-1',
  };

  const mockCourseWithRelations = {
    ...mockCourse,
    class: { id: 'class-1', code: 'L3-INFO-A' },
    teacher: { id: 'teacher-1', user: { id: 'u1', fullName: 'Prof Test' } },
    _count: { sessions: 10 },
  };

  const adminUser = { id: 'u1', role: { name: 'ADMIN' } };
  const professorUser = { id: 'u2', role: { name: 'PROFESSOR' }, teacherProfile: { id: 'teacher-1' } };

  beforeEach(async () => {
    mockPrisma = {
      course: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated courses for admin', async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseWithRelations]);
      mockPrisma.course.count.mockResolvedValue(1);

      const result = await service.findAll(adminUser as any);
      expect(result).toEqual({ items: [mockCourseWithRelations], total: 1, page: 1, limit: 50 });
    });

    it('should filter by teacherId for professor', async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseWithRelations]);
      mockPrisma.course.count.mockResolvedValue(1);

      await service.findAll(professorUser as any);
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ teacherId: 'teacher-1' }) }),
      );
    });

    it('should filter by classId', async () => {
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.course.count.mockResolvedValue(0);

      await service.findAll(adminUser as any, 'class-1');
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ classId: 'class-1' }) }),
      );
    });

    it('should paginate correctly', async () => {
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.course.count.mockResolvedValue(0);

      const result = await service.findAll(adminUser as any, undefined, 3, 20);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
    });
  });

  describe('findById', () => {
    it('should return a course with relations', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourseWithRelations);
      const result = await service.findById('course-1');
      expect(result).toEqual(mockCourseWithRelations);
    });

    it('should throw NotFoundException for missing course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a course', async () => {
      const dto = { code: 'CS101', title: 'Intro CS', classId: 'class-1', teacherId: 'teacher-1', establishmentId: 'default-establishment' };
      mockPrisma.course.create.mockResolvedValue(mockCourseWithRelations);

      const result = await service.create(dto);
      expect(result).toEqual(mockCourseWithRelations);
    });
  });

  describe('update', () => {
    it('should update a course after verifying it exists', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourseWithRelations);
      mockPrisma.course.update.mockResolvedValue({ ...mockCourseWithRelations, title: 'Updated' });

      const result = await service.update('course-1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('should throw NotFoundException when updating non-existent course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', { title: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a course after verifying it exists', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourseWithRelations);
      mockPrisma.course.delete.mockResolvedValue(mockCourse);

      const result = await service.remove('course-1');
      expect(result).toEqual(mockCourse);
    });

    it('should throw NotFoundException when deleting non-existent course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});