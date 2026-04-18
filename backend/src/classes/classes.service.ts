import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto, UpdateClassDto } from '../common/dto/class.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll(academicYear?: string, page = 1, limit = 50) {
    const where = academicYear ? { academicYear } : undefined;
    const [items, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        include: { _count: { select: { students: true, courses: true } } },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.class.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      include: { students: { include: { user: true } }, courses: { include: { teacher: { include: { user: true } } } } },
    });
    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  async create(dto: CreateClassDto) {
    return this.prisma.class.create({ data: dto });
  }

  async update(id: string, dto: UpdateClassDto) {
    await this.findById(id);
    return this.prisma.class.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.class.delete({ where: { id } });
  }

  async getStudents(classId: string) {
    await this.findById(classId);
    return this.prisma.student.findMany({
      where: { classId },
      include: { user: true },
    });
  }

  async addStudent(classId: string, studentId: string) {
    await this.findById(classId);
    return this.prisma.student.update({
      where: { id: studentId },
      data: { classId },
    });
  }
}