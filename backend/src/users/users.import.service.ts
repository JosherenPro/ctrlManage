import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parse } from 'csv-parse/sync';
import * as bcrypt from 'bcrypt';
import { ImportResultDto, ImportError } from './dto/import-users.dto';

interface CsvRow {
  email: string;
  fullName: string;
  studentNumber: string;
  program?: string;
  classId?: string;
}

@Injectable()
export class UsersImportService {
  constructor(private prisma: PrismaService) {}

  async importFromCsv(
    file: Express.Multer.File,
    roleId: string,
    establishmentId: string,
  ): Promise<ImportResultDto> {
    if (!file) throw new BadRequestException('No file provided');
    if (!file.buffer || file.size === 0) throw new BadRequestException('Empty file');

    let records: CsvRow[];
    try {
      records = parse(file.buffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: ',',
      });
    } catch {
      throw new BadRequestException('Invalid CSV format');
    }

    if (!records.length) {
      return { total: 0, created: 0, failed: 0, errors: [] };
    }

    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new BadRequestException('Invalid role ID');

    const defaultClass = await this.prisma.class.findFirst();
    const defaultClassId = defaultClass?.id;

    const errors: ImportError[] = [];
    let created = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      if (!row.email || !row.fullName || !row.studentNumber) {
        errors.push({ row: rowNum, email: row.email || '', error: 'Champs obligatoires manquants' });
        continue;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push({ row: rowNum, email: row.email, error: 'Email invalide' });
        continue;
      }

      try {
        const existingUser = await this.prisma.user.findUnique({ where: { email: row.email } });
        if (existingUser) {
          errors.push({ row: rowNum, email: row.email, error: 'Email déjà utilisé' });
          continue;
        }

        const existingStudent = await this.prisma.student.findUnique({
          where: { studentNumber: row.studentNumber },
        });
        if (existingStudent) {
          errors.push({ row: rowNum, email: row.email, error: 'Numéro étudiant déjà utilisé' });
          continue;
        }

        const classId = row.classId || defaultClassId;
        if (!classId) {
          errors.push({ row: rowNum, email: row.email, error: 'Aucune classe disponible' });
          continue;
        }

        const password = this.generateRandomPassword();
        const hash = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
          data: {
            email: row.email,
            fullName: row.fullName,
            roleId: role.id,
            passwordHash: hash,
            authProvider: 'local',
            status: 'INVITED',
            establishmentId,
          },
        });

        await this.prisma.student.create({
          data: {
            userId: user.id,
            studentNumber: row.studentNumber,
            program: row.program || null,
            classId,
            establishmentId,
          },
        });

        created++;
      } catch (error) {
        errors.push({
          row: rowNum,
          email: row.email,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    return {
      total: records.length,
      created,
      failed: errors.length,
      errors,
    };
  }

  private generateRandomPassword(length = 12): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}