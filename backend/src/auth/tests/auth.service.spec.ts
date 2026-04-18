import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

describe('AuthService', () => {
  let service: AuthService;
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    class: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'student@test.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      studentNumber: 'STU001',
      program: 'Computer Science',
    };

    it('should register a new student successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.student.findUnique.mockResolvedValue(null);
      mockPrisma.role.findFirst.mockResolvedValue({ id: 'role-1', name: 'STUDENT' } as any);
      mockPrisma.class.upsert.mockResolvedValue({ id: 'class-1' } as any);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: registerDto.email,
        fullName: 'John Doe',
        passwordHash: 'hashed',
        roleId: 'role-1',
        status: 'ACTIVE',
        authProvider: 'local',
      } as any);
      mockPrisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: 'user-1',
        email: registerDto.email,
        fullName: 'John Doe',
        role: { id: 'role-1', name: 'STUDENT' },
        studentProfile: { id: 'sp-1' },
        teacherProfile: null,
      } as any);

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe(registerDto.email);
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.student.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' } as any);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if student number exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.student.findUnique.mockResolvedValue({ id: 'existing' } as any);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'student@test.com',
      password: 'Password123!',
    };

    it('should login successfully with valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: loginDto.email,
        passwordHash: '$2b$10$hashedpassword',
        status: 'ACTIVE',
        role: { name: 'STUDENT' },
        studentProfile: { id: 'sp-1' },
        teacherProfile: null,
      } as any);

      const bcrypt = await import('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for suspended user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: loginDto.email,
        status: 'SUSPENDED',
        role: { name: 'STUDENT' },
      } as any);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: loginDto.email,
        passwordHash: '$2b$10$hashedpassword',
        status: 'ACTIVE',
        role: { name: 'STUDENT' },
        studentProfile: null,
        teacherProfile: null,
      } as any);

      const bcrypt = await import('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user without password if found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: null,
        role: { name: 'STUDENT' },
        studentProfile: null,
        teacherProfile: null,
      } as any);

      const result = await service.validateUser('user-1');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@test.com');
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('non-existent');

      expect(result).toBeNull();
    });
  });
});
