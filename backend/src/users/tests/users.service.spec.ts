import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from '../../common/dto/user.dto';

describe('UsersService', () => {
  let service: UsersService;
  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    student: {
      create: jest.fn(),
    },
    teacher: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@test.com', fullName: 'User 1', passwordHash: null },
        { id: '2', email: 'user2@test.com', fullName: 'User 2', passwordHash: null },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers as any);
      mockPrisma.user.count.mockResolvedValue(2);

      const result = await service.findAll({}, 1, 10);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by role', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.findAll({ role: 'STUDENT' }, 1, 10);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: { name: 'STUDENT' } }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.findAll({ status: 'ACTIVE' }, 1, 10);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        fullName: 'Test User',
        passwordHash: 'secret',
        role: { id: 'role-1', name: 'STUDENT' },
        studentProfile: null,
        teacherProfile: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.findById('user-1');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('test@test.com');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto: CreateUserDto = {
      email: 'new@test.com',
      fullName: 'New User',
      roleId: 'role-1',
      establishmentId: 'default-establishment',
      password: 'Password123!',
    };

    it('should create user with hashed password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-new',
        email: createDto.email,
        fullName: createDto.fullName,
        roleId: createDto.roleId,
        passwordHash: 'hashed',
      } as any);

      const result = await service.create(createDto);

      expect(result.id).toBe('user-new');
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' } as any);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        fullName: 'Old Name',
        role: { id: 'role-1', name: 'STUDENT' },
      } as any);

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        fullName: 'New Name',
        role: { id: 'role-1', name: 'STUDENT' },
      } as any);

      const result = await service.update('user-1', { fullName: 'New Name' });

      expect(result.fullName).toBe('New Name');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { fullName: 'New Name' },
        include: { role: true },
      });
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', { fullName: 'Name' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete user by setting status to SUSPENDED', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        status: 'ACTIVE',
        role: { name: 'STUDENT' },
      } as any);

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        status: 'SUSPENDED',
        role: { name: 'STUDENT' },
      } as any);

      const result = await service.remove('user-1');

      expect(result.status).toBe('SUSPENDED');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { status: 'SUSPENDED' },
      });
    });
  });

  describe('createStudentProfile', () => {
    it('should create student profile for user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'student@test.com',
        studentProfile: null,
        teacherProfile: null,
        role: { name: 'STUDENT' },
        establishmentId: 'default-establishment',
      } as any);

      mockPrisma.student.create.mockResolvedValue({
        id: 'sp-1',
        userId: 'user-1',
        studentNumber: 'STU001',
      } as any);

      const result = await service.createStudentProfile('user-1', {
        userId: 'user-1',
        studentNumber: 'STU001',
        classId: 'class-1',
        establishmentId: 'default-establishment',
      });

      expect(result.id).toBe('sp-1');
      expect(mockPrisma.student.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        studentProfile: { id: 'existing' },
      } as any);

      await expect(
        service.createStudentProfile('user-1', { userId: 'user-1', studentNumber: 'STU001', classId: 'class-1', establishmentId: 'default-establishment' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
