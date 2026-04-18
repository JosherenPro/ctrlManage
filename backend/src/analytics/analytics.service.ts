import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/interfaces';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(user: RequestUser) {
    if (user.role?.name === 'STUDENT') {
      return this.getStudentOverview(user);
    }
    if (user.role?.name === 'PROFESSOR') {
      return this.getProfessorOverview(user);
    }
    return this.getAdminOverview();
  }

  private async getAdminOverview() {
    const [
      totalStudents,
      totalCourses,
      totalSessions,
      openSessions,
      attendanceByMonth,
      topCourses,
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.course.count(),
      this.prisma.session.count(),
      this.prisma.session.count({ where: { status: 'OPEN' } }),
      this.getAttendanceByMonth(),
      this.getTopCourses(),
    ]);

    return {
      totalStudents,
      totalCourses,
      totalSessions,
      openSessions,
      attendanceByMonth,
      topCourses,
    };
  }

  private async getProfessorOverview(user: RequestUser) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
    });
    const teacherId = teacher?.id;

    const [totalCourses, totalSessions, openSessions, attendanceByMonth, topCourses] =
      await Promise.all([
        this.prisma.course.count({ where: { teacherId } }),
        this.prisma.session.count({ where: { teacherId } }),
        this.prisma.session.count({ where: { teacherId, status: 'OPEN' } }),
        this.getAttendanceByMonth(teacherId),
        this.getTopCourses(teacherId),
      ]);

    return { totalCourses, totalSessions, openSessions, attendanceByMonth, topCourses };
  }

  private async getStudentOverview(user: RequestUser) {
    const student = await this.prisma.student.findUnique({
      where: { userId: user.id },
    });
    const studentId = student?.id;
    if (!studentId) return { totalRecords: 0, rate: 0, presentCount: 0, lateCount: 0, absentCount: 0, attendanceByMonth: [] };

    const [records, attendanceByMonth] = await Promise.all([
      this.prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { studentId },
        _count: true,
      }),
      this.getAttendanceByMonth(undefined, studentId),
    ]);

    const presentCount = records.find(r => r.status === 'PRESENT')?._count || 0;
    const lateCount = records.find(r => r.status === 'LATE')?._count || 0;
    const absentCount = records.find(r => r.status === 'ABSENT')?._count || 0;
    const total = presentCount + lateCount + absentCount;
    const rate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

    return { presentCount, lateCount, absentCount, rate, attendanceByMonth };
  }

  private async getAttendanceByMonth(teacherId?: string, studentId?: string) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const whereSession: any = { startsAt: { gte: twelveMonthsAgo } };
    if (teacherId) whereSession.teacherId = teacherId;

    const sessions = await this.prisma.session.findMany({
      where: whereSession,
      select: { id: true, startsAt: true },
    });

    const sessionIds = sessions.map(s => s.id);

    const whereRecord: any = { sessionId: { in: sessionIds } };
    if (studentId) whereRecord.studentId = studentId;

    const records = await this.prisma.attendanceRecord.findMany({
      where: whereRecord,
      select: { status: true, session: { select: { startsAt: true } } },
    });

    const monthMap = new Map<string, { present: number; absent: number; late: number }>();

    for (const record of records) {
      const month = record.session.startsAt.toISOString().slice(0, 7);
      const entry = monthMap.get(month) || { present: 0, absent: 0, late: 0 };
      if (record.status === 'PRESENT') entry.present++;
      else if (record.status === 'ABSENT') entry.absent++;
      else if (record.status === 'LATE') entry.late++;
      monthMap.set(month, entry);
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }

  private async getTopCourses(teacherId?: string) {
    const where: any = {};
    if (teacherId) where.teacherId = teacherId;

    const courses = await this.prisma.course.findMany({
      where,
      select: {
        id: true,
        code: true,
        title: true,
        sessions: {
          select: {
            id: true,
            attendanceRecords: {
              select: { status: true },
            },
          },
        },
      },
      take: 5,
    });

    return courses.map(course => {
      const totalRecords = course.sessions.reduce(
        (sum, s) => sum + s.attendanceRecords.length, 0,
      );
      const presentOrLate = course.sessions.reduce(
        (sum, s) =>
          sum + s.attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length,
        0,
      );
      return {
        courseId: course.id,
        code: course.code,
        title: course.title,
        attendanceRate: totalRecords > 0 ? Math.round((presentOrLate / totalRecords) * 100) : 0,
        totalSessions: course.sessions.length,
      };
    }).sort((a, b) => b.attendanceRate - a.attendanceRate);
  }
}