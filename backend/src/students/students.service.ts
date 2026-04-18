import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async search(query: string, limit = 20) {
    const trimmed = query.trim();
    if (!trimmed) return [];

    return this.prisma.student.findMany({
      where: {
        OR: [
          { studentNumber: { contains: trimmed, mode: 'insensitive' } },
          { user: { fullName: { contains: trimmed, mode: 'insensitive' } } },
        ],
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, status: true } },
        class: { select: { id: true, code: true, name: true } },
      },
      take: limit,
      orderBy: { studentNumber: 'asc' },
    });
  }
}