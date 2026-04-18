import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEstablishmentDto, UpdateEstablishmentDto } from './dto/establishment.dto';

@Injectable()
export class EstablishmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 50) {
    const [items, total] = await Promise.all([
      this.prisma.establishment.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.establishment.count({ where: { active: true } }),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string) {
    const establishment = await this.prisma.establishment.findUnique({ where: { id } });
    if (!establishment) throw new NotFoundException('Establishment not found');
    return establishment;
  }

  async create(dto: CreateEstablishmentDto) {
    const existing = await this.prisma.establishment.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Establishment code already exists');
    return this.prisma.establishment.create({ data: dto });
  }

  async update(id: string, dto: UpdateEstablishmentDto) {
    await this.findById(id);
    return this.prisma.establishment.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.establishment.update({
      where: { id },
      data: { active: false },
    });
  }
}