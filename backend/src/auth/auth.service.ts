import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { excludePassword } from '../common/utils/exclude-password.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already exists');

    if (dto.studentNumber) {
      const existingStudentNumber = await this.prisma.student.findUnique({
        where: { studentNumber: dto.studentNumber },
      });
      if (existingStudentNumber) throw new ConflictException('Student card number already exists');
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const studentRole = await this.prisma.role.findFirst({ where: { name: 'STUDENT' } });

    const fullName = dto.fullName?.trim() || `${dto.firstName || ''} ${dto.lastName || ''}`.trim() || 'Utilisateur';

    // Get or create establishment
    let establishment = await this.prisma.establishment.findFirst({ where: { code: 'IA_BIGDATA' } });
    if (!establishment) {
      establishment = await this.prisma.establishment.create({
        data: { name: 'Intelligence Artificielle et Big Data', code: 'IA_BIGDATA' },
      });
    }

    // Get or create default class for IA & Big Data
    const defaultClass = await this.prisma.class.upsert({
      where: { code: 'IA_BD_DEFAULT' },
      update: { name: 'Classe IA & Big Data', academicYear: new Date().getFullYear().toString() },
      create: {
        code: 'IA_BD_DEFAULT',
        name: 'Classe IA & Big Data',
        academicYear: new Date().getFullYear().toString(),
        establishmentId: establishment.id,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName,
        passwordHash: hash,
        authProvider: 'local',
        status: 'ACTIVE',
        roleId:
          studentRole?.id ?? (await this.prisma.role.create({ data: { name: 'STUDENT' } })).id,
        establishmentId: establishment.id,
      },
    });

    if (dto.studentNumber) {
      await this.prisma.student.create({
        data: {
          userId: user.id,
          studentNumber: dto.studentNumber,
          program: dto.program,
          classId: defaultClass.id,
          establishmentId: establishment.id,
        },
      });
    }
    const payload = { sub: user.id, email: user.email, role: studentRole?.name ?? 'STUDENT', establishmentId: user.establishmentId };

    const userWithProfile = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true, studentProfile: true, teacherProfile: true },
    });

    return { accessToken: this.jwtService.sign(payload), user: excludePassword(userWithProfile!) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true, studentProfile: true, teacherProfile: true },
    });
    if (!user || user.status === 'SUSPENDED')
      throw new UnauthorizedException('Invalid credentials');
    if (user.passwordHash) {
      const valid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid credentials');
    } else {
      throw new UnauthorizedException('Use external auth provider');
    }
    const payload = { sub: user.id, email: user.email, role: user.role?.name, establishmentId: user.establishmentId };
    return { accessToken: this.jwtService.sign(payload), user: excludePassword(user) };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, studentProfile: true, teacherProfile: true },
    });
    return user ? excludePassword(user) : null;
  }
}
