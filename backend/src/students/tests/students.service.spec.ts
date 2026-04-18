import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from '../students.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('StudentsService', () => {
  let service: StudentsService;

  const mockPrisma = {
    student: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should return matching students by student number', async () => {
      const mockStudents = [
        { id: 's-1', studentNumber: 'STU001', user: { fullName: 'Alice' }, class: { code: 'L3' } },
      ];
      mockPrisma.student.findMany.mockResolvedValue(mockStudents as any);

      const result = await service.search('STU001');

      expect(result).toHaveLength(1);
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { studentNumber: { contains: 'STU001', mode: 'insensitive' } },
              { user: { fullName: { contains: 'STU001', mode: 'insensitive' } } },
            ]),
          }),
          take: 20,
        }),
      );
    });

    it('should return matching students by name', async () => {
      const mockStudents = [
        { id: 's-1', studentNumber: 'STU001', user: { fullName: 'Alice Martin' }, class: { code: 'L3' } },
      ];
      mockPrisma.student.findMany.mockResolvedValue(mockStudents as any);

      const result = await service.search('Alice');

      expect(result).toHaveLength(1);
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { studentNumber: { contains: 'Alice', mode: 'insensitive' } },
              { user: { fullName: { contains: 'Alice', mode: 'insensitive' } } },
            ]),
          }),
        }),
      );
    });

    it('should return empty array for empty query', async () => {
      const result = await service.search('');
      expect(result).toEqual([]);
      expect(mockPrisma.student.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array for whitespace-only query', async () => {
      const result = await service.search('   ');
      expect(result).toEqual([]);
      expect(mockPrisma.student.findMany).not.toHaveBeenCalled();
    });

    it('should respect custom limit parameter', async () => {
      mockPrisma.student.findMany.mockResolvedValue([]);

      await service.search('test', 5);

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });
});