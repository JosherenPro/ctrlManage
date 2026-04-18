import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from '../common/dto/user.dto';
import { CreateStudentDto, CreateTeacherDto } from '../common/dto/profile.dto';
import { excludePassword, excludePasswordFromList } from '../common/utils/exclude-password.util';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: { role?: string; status?: string }, page = 1, limit = 50) {
    const where: Record<string, unknown> = {};
    if (filters.role) {
      where.role = { name: filters.role };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { role: true, studentProfile: true, teacherProfile: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items: excludePasswordFromList(items), total, page, limit };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, studentProfile: true, teacherProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return excludePassword(user);
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already exists');
    const hash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;
    const created = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        roleId: dto.roleId,
        passwordHash: hash,
        authProvider: hash ? 'local' : undefined,
        status: 'INVITED',
        establishmentId: dto.establishmentId,
      },
      include: { role: true },
    });
    return excludePassword(created);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.status && { status: dto.status }),
        ...(dto.roleId && { roleId: dto.roleId }),
      },
      include: { role: true },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    // Soft-delete: set status to SUSPENDED instead of hard-delete
    return this.prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });
  }

  async createStudentProfile(userId: string, dto: CreateStudentDto) {
    const user = await this.findById(userId);
    if (user.studentProfile) throw new ConflictException('Student profile already exists');
    return this.prisma.student.create({
      data: {
        userId,
        studentNumber: dto.studentNumber,
        classId: dto.classId,
        program: dto.program,
        level: dto.level,
        establishmentId: dto.establishmentId,
      },
      include: { user: { include: { role: true } }, class: true },
    });
  }

  async createTeacherProfile(userId: string, dto: CreateTeacherDto) {
    const user = await this.findById(userId);
    if (user.teacherProfile) throw new ConflictException('Teacher profile already exists');
    return this.prisma.teacher.create({
      data: {
        userId,
        employeeNumber: dto.employeeNumber,
        department: dto.department,
        establishmentId: dto.establishmentId,
      },
      include: { user: { include: { role: true } } },
    });
  }
}