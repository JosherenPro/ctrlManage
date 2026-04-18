import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from '../common/dto/course.dto';
import { RequestUser } from '../common/interfaces';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: RequestUser, classId?: string, page = 1, limit = 50) {
    const where: Record<string, unknown> = {};
    if (classId) where.classId = classId;
    if (user.role?.name === 'PROFESSOR' && user.teacherProfile) {
      where.teacherId = user.teacherProfile.id;
    }
    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: { class: true, teacher: { include: { user: true } }, _count: { select: { sessions: true } } },
        orderBy: { title: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { class: true, teacher: { include: { user: true } }, sessions: { orderBy: { startsAt: 'desc' } } },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async create(dto: CreateCourseDto) {
    return this.prisma.course.create({ data: dto, include: { class: true, teacher: { include: { user: true } } } });
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findById(id);
    return this.prisma.course.update({ where: { id }, data: dto, include: { class: true, teacher: { include: { user: true } } } });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.course.delete({ where: { id } });
  }
}