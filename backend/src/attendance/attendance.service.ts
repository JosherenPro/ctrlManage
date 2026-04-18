import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ValidateAttendanceDto } from '../common/dto/attendance.dto';
import { RequestUser } from '../common/interfaces';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

  async getBySession(sessionId: string) {
    return this.prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: { student: { include: { user: true } }, session: { include: { course: true } } },
      orderBy: { scannedAt: 'asc' },
    });
  }

  async getByStudent(studentId: string) {
    return this.prisma.attendanceRecord.findMany({
      where: { studentId },
      include: { session: { include: { course: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getByUser(user: RequestUser) {
    if (!user.studentProfile) throw new BadRequestException('User is not a student');
    return this.prisma.attendanceRecord.findMany({
      where: { studentId: user.studentProfile.id },
      include: { session: { include: { course: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async registerAttendance(user: RequestUser, sessionId: string, studentId: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'OPEN') throw new BadRequestException('Session is not open');

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { sessionId_studentId: { sessionId, studentId } },
    });
    if (existing) throw new BadRequestException('Attendance already recorded for this student');

    const record = await this.prisma.attendanceRecord.create({
      data: {
        sessionId,
        studentId,
        status: 'PRESENT',
        scannedAt: new Date(),
      },
    });

    await this.auditService.log(user.id, 'REGISTER_ATTENDANCE', 'AttendanceRecord', record.id);
    return record;
  }

  async scanQrCode(user: RequestUser, token: string, studentId: string) {
    const qrCode = await this.prisma.qrCode.findUnique({ where: { token } });
    if (!qrCode) throw new NotFoundException('QR code not found');
    if (qrCode.usedAt) throw new BadRequestException('QR code already used');
    if (qrCode.revokedAt) throw new BadRequestException('QR code has been revoked');
    if (new Date() > qrCode.expiresAt) throw new BadRequestException('QR code has expired');

    const session = await this.prisma.session.findUnique({
      where: { id: qrCode.sessionId },
    });
    if (!session || session.status !== 'OPEN') {
      throw new BadRequestException('Session is not open');
    }

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { sessionId_studentId: { sessionId: qrCode.sessionId, studentId } },
    });
    if (existing) throw new BadRequestException('Attendance already recorded for this session');

    const [record] = await this.prisma.$transaction([
      this.prisma.attendanceRecord.create({
        data: {
          sessionId: qrCode.sessionId,
          studentId,
          status: 'PRESENT',
          scannedAt: new Date(),
        },
      }),
      this.prisma.qrCode.update({
        where: { id: qrCode.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await this.auditService.log(user.id, 'SCAN_QR', 'AttendanceRecord', record.id, { qrCodeId: qrCode.id });
    return record;
  }

  async validateAttendance(id: string, user: RequestUser, dto: ValidateAttendanceDto) {
    const record = await this.prisma.attendanceRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');

    const updated = await this.prisma.attendanceRecord.update({
      where: { id },
      data: {
        status: dto.status,
        validatedAt: new Date(),
        validatedById: user.id,
        notes: dto.notes,
      },
    });

    await this.auditService.log(user.id, 'VALIDATE_ATTENDANCE', 'AttendanceRecord', id, { status: dto.status });
    return updated;
  }
}