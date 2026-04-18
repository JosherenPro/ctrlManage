import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClassesService } from '../classes.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ClassesService', () => {
  let service: ClassesService;
  let mockPrisma: any;

  const mockClass = {
    id: 'class-1',
    code: 'L3-INFO-A',
    name: 'Licence 3 Informatique A',
    academicYear: '2025-2026',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockClassWithCount = {
    ...mockClass,
    _count: { students: 30, courses: 5 },
  };

  const mockClassWithRelations = {
    ...mockClass,
    students: [{ id: 's1', user: { id: 'u1', email: 's1@test.com', fullName: 'Student 1' } }],
    courses: [{ id: 'c1', teacher: { id: 't1', user: { id: 'u2', fullName: 'Teacher 1' } } }],
  };

  beforeEach(async () => {
    mockPrisma = {
      class: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      student: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated classes without filter', async () => {
      mockPrisma.class.findMany.mockResolvedValue([mockClassWithCount]);
      mockPrisma.class.count.mockResolvedValue(1);

      const result = await service.findAll();
      expect(result).toEqual({ items: [mockClassWithCount], total: 1, page: 1, limit: 50 });
      expect(mockPrisma.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 50 }),
      );
    });

    it('should filter by academicYear', async () => {
      mockPrisma.class.findMany.mockResolvedValue([mockClassWithCount]);
      mockPrisma.class.count.mockResolvedValue(1);

      await service.findAll('2025-2026');
      expect(mockPrisma.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { academicYear: '2025-2026' } }),
      );
    });

    it('should paginate correctly', async () => {
      mockPrisma.class.findMany.mockResolvedValue([]);
      mockPrisma.class.count.mockResolvedValue(0);

      const result = await service.findAll(undefined, 2, 10);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(mockPrisma.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  describe('findById', () => {
    it('should return a class with relations', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(mockClassWithRelations);

      const result = await service.findById('class-1');
      expect(result).toEqual(mockClassWithRelations);
    });

    it('should throw NotFoundException for missing class', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a class', async () => {
      const dto = { code: 'L3-INFO-A', name: 'Licence 3 Info A', academicYear: '2025-2026', establishmentId: 'default-establishment' };
      mockPrisma.class.create.mockResolvedValue(mockClass);

      const result = await service.create(dto);
      expect(result).toEqual(mockClass);
      expect(mockPrisma.class.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('update', () => {
    it('should update a class after verifying it exists', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(mockClassWithRelations);
      mockPrisma.class.update.mockResolvedValue({ ...mockClass, name: 'Updated' });

      const result = await service.update('class-1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when updating non-existent class', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a class after verifying it exists', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      mockPrisma.class.delete.mockResolvedValue(mockClass);

      const result = await service.remove('class-1');
      expect(result).toEqual(mockClass);
    });

    it('should throw NotFoundException when deleting non-existent class', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStudents', () => {
    it('should return students for a class', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      const students = [{ id: 's1', user: { id: 'u1', fullName: 'Student 1' } }];
      mockPrisma.student.findMany.mockResolvedValue(students);

      const result = await service.getStudents('class-1');
      expect(result).toEqual(students);
    });

    it('should throw NotFoundException if class does not exist', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null);
      await expect(service.getStudents('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addStudent', () => {
    it('should add a student to a class', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      const updated = { id: 's1', classId: 'class-1' };
      mockPrisma.student.update.mockResolvedValue(updated);

      const result = await service.addStudent('class-1', 's1');
      expect(result).toEqual(updated);
      expect(mockPrisma.student.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { classId: 'class-1' },
      });
    });

    it('should throw NotFoundException if class does not exist', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null);
      await expect(service.addStudent('missing', 's1')).rejects.toThrow(NotFoundException);
    });
  });
});