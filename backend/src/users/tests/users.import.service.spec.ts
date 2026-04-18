import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UsersImportService } from '../users.import.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsersImportService', () => {
  let service: UsersImportService;
  let mockPrisma: any;

  const studentRole = { id: 'role-student', name: 'STUDENT' };

  beforeEach(async () => {
    mockPrisma = {
      role: { findUnique: jest.fn() },
      class: { findFirst: jest.fn() },
      user: { findUnique: jest.fn(), create: jest.fn() },
      student: { findUnique: jest.fn(), create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersImportService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersImportService>(UsersImportService);
    jest.clearAllMocks();
  });

  const createCsvFile = (content: string): Express.Multer.File => {
    const buf = Buffer.from(content);
    return {
      buffer: buf,
      size: buf.length,
      originalname: 'test.csv',
      mimetype: 'text/csv',
      destination: '',
      filename: 'test.csv',
      path: '',
      fieldname: 'file',
      encoding: '7bit',
      stream: null as any,
    };
  };

  describe('importFromCsv', () => {
    it('should throw BadRequestException if no file provided', async () => {
      await expect(service.importFromCsv(null as any, 'role-id', 'default-establishment')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid role ID', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);
      mockPrisma.class.findFirst.mockResolvedValue({ id: 'class-1' });
      const file = createCsvFile('email,fullName,studentNumber,program\ntest@test.com,Test User,STU001,Info');
      await expect(service.importFromCsv(file, 'invalid-role', 'default-establishment')).rejects.toThrow(BadRequestException);
    });

    it('should return empty result for empty CSV', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(studentRole);
      mockPrisma.class.findFirst.mockResolvedValue({ id: 'class-1' });
      const file = createCsvFile('email,fullName,studentNumber,program');
      const result = await service.importFromCsv(file, 'role-student', 'default-establishment');
      expect(result).toEqual({ total: 0, created: 0, failed: 0, errors: [] });
    });

    it('should import valid students', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(studentRole);
      mockPrisma.class.findFirst.mockResolvedValue({ id: 'class-1' });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.student.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'u1', email: 'test@test.com', fullName: 'Test User' });
      mockPrisma.student.create.mockResolvedValue({ id: 's1', userId: 'u1', studentNumber: 'STU001', classId: 'class-1' });

      const file = createCsvFile('email,fullName,studentNumber,program\ntest@test.com,Test User,STU001,Info');
      const result = await service.importFromCsv(file, 'role-student', 'default-establishment');
      expect(result.created).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should report error for duplicate email', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(studentRole);
      mockPrisma.class.findFirst.mockResolvedValue({ id: 'class-1' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'dup@test.com' });

      const file = createCsvFile('email,fullName,studentNumber,program\ndup@test.com,Dup User,STU001,Info');
      const result = await service.importFromCsv(file, 'role-student', 'default-establishment');
      expect(result.created).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toContain('Email');
    });

    it('should report error for missing required fields', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(studentRole);
      mockPrisma.class.findFirst.mockResolvedValue({ id: 'class-1' });

      const file = createCsvFile('email,fullName,studentNumber,program\n,Missing Fields,,Info');
      const result = await service.importFromCsv(file, 'role-student', 'default-establishment');
      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toContain('obligatoires');
    });

    it('should report error for duplicate student number', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(studentRole);
      mockPrisma.class.findFirst.mockResolvedValue({ id: 'class-1' });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.student.findUnique.mockResolvedValue({ id: 'existing', studentNumber: 'STU001' });

      const file = createCsvFile('email,fullName,studentNumber,program\nnew@test.com,New User,STU001,Info');
      const result = await service.importFromCsv(file, 'role-student', 'default-establishment');
      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toContain('Numéro étudiant');
    });

    it('should throw BadRequestException for invalid CSV format', async () => {
      const file = createCsvFile('not valid csv {{{{');
      // csv-parse with columns:true will throw on completely malformed data
      // but might not always throw, so let's test with truly malformed data
      const brokenFile: Express.Multer.File = {
        ...file,
        buffer: Buffer.from('"broken,csv\n"unclosed'),
      };
      await expect(service.importFromCsv(brokenFile, 'role-student', 'default-establishment')).rejects.toThrow();
    });
  });
});