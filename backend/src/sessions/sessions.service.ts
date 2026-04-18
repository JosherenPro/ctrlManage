import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSessionDto, UpdateSessionDto } from '../common/dto/session.dto';
import { RequestUser } from '../common/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { SessionsGateway } from '../websocket/websocket.gateway';

@Injectable()
export class SessionsService {
  private sessionsGateway: SessionsGateway | null = null;

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  setSessionsGateway(gateway: SessionsGateway) {
    this.sessionsGateway = gateway;
  }

  async findAll(user: RequestUser, courseId?: string, page = 1, limit = 50) {
    const where: Record<string, unknown> = {};
    if (courseId) where.courseId = courseId;
    if (user.role?.name === 'PROFESSOR' && user.teacherProfile) {
      where.teacherId = user.teacherProfile.id;
    }
    const [items, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        include: { course: true, teacher: { include: { user: true } }, _count: { select: { attendanceRecords: true, qrCodes: true } } },
        orderBy: { startsAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.session.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        course: true,
        teacher: { include: { user: true } },
        attendanceRecords: { include: { student: { include: { user: true } } } },
        qrCodes: true,
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async create(dto: CreateSessionDto, user: RequestUser) {
    const teacherId = user.teacherProfile?.id || dto.teacherId;
    if (!teacherId) {
      throw new BadRequestException('Teacher ID is required');
    }
    return this.prisma.session.create({
      data: {
        courseId: dto.courseId,
        teacherId,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        room: dto.room,
        status: 'DRAFT',
        establishmentId: dto.establishmentId,
      },
      include: { course: true, teacher: { include: { user: true } } },
    });
  }

  async update(id: string, dto: UpdateSessionDto) {
    await this.findById(id);
    const data: Record<string, unknown> = {};
    if (dto.startsAt) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt) data.endsAt = new Date(dto.endsAt);
    if (dto.room) data.room = dto.room;
    return this.prisma.session.update({ where: { id }, data, include: { course: true } });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.session.delete({ where: { id } });
  }

  async openSession(id: string, user: RequestUser) {
    const session = await this.findById(id);
    if (session.status === 'OPEN') throw new BadRequestException('Session is already open');
    if (user.role?.name !== 'ADMIN' && user.teacherProfile?.id !== session.teacherId) {
      throw new ForbiddenException('You can only open your own sessions');
    }
    const updated = await this.prisma.session.update({
      where: { id },
      data: { status: 'OPEN' },
      include: { course: true },
    });
    await this.auditService.log(user.id, 'OPEN_SESSION', 'Session', id);

    // Notify connected clients about session status change
    this.sessionsGateway?.notifySessionStatusChange({
      sessionId: id,
      status: 'OPEN',
      teacherId: session.teacherId,
      message: `Session ${session.course?.title || 'Unknown'} is now open`,
    });

    return updated;
  }

  async closeSession(id: string, user: RequestUser) {
    const session = await this.findById(id);
    if (session.status !== 'OPEN') throw new BadRequestException('Session is not open');
    if (user.role?.name !== 'ADMIN' && user.teacherProfile?.id !== session.teacherId) {
      throw new ForbiddenException('You can only close your own sessions');
    }
    const updated = await this.prisma.session.update({
      where: { id },
      data: { status: 'CLOSED' },
      include: { course: true },
    });
    await this.auditService.log(user.id, 'CLOSE_SESSION', 'Session', id);

    // Notify connected clients about session status change
    this.sessionsGateway?.notifySessionStatusChange({
      sessionId: id,
      status: 'CLOSED',
      teacherId: session.teacherId,
      message: `Session ${session.course?.title || 'Unknown'} is now closed`,
    });

    return updated;
  }

  async generateQrCode(sessionId: string, user: RequestUser) {
    const session = await this.findById(sessionId);
    if (session.status !== 'OPEN') throw new BadRequestException('Session must be open to generate QR code');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const token = uuidv4();
    const qrCode = await this.prisma.qrCode.create({
      data: {
        sessionId,
        token,
        expiresAt,
        issuedById: user.id,
      },
    });
    await this.auditService.log(user.id, 'GENERATE_QR', 'QrCode', qrCode.id);

    // Notify connected clients about new QR code
    this.sessionsGateway?.notifyQrCodeGenerated(sessionId, token, expiresAt.toISOString());

    return { ...qrCode, qrUrl: `/attendance/scan?token=${token}` };
  }
}
