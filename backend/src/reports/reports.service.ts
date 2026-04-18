import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { stringify } from 'csv-stringify/sync';
import * as XLSX from 'xlsx';
import * as PDFDocument from 'pdfkit';
import * as path from 'path';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async sessionReport(sessionId: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId }, include: { course: true } });
    if (!session) throw new NotFoundException('Session not found');
    const records = await this.prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: { student: { include: { user: true } } },
      orderBy: { scannedAt: 'asc' },
    });
    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const justified = records.filter((r) => r.status === 'JUSTIFIED').length;
    return { session, total, present, late, absent, justified, rate: total ? ((present + late) / total * 100).toFixed(1) : '0', records };
  }

  async courseReport(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    const sessions = await this.prisma.session.findMany({ where: { courseId } });
    const sessionIds = sessions.map((s) => s.id);
    const records = await this.prisma.attendanceRecord.findMany({ where: { sessionId: { in: sessionIds } } });
    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    return { course, totalSessions: sessions.length, totalRecords: total, attendanceRate: total ? (present / total * 100).toFixed(1) : '0' };
  }

  async classReport(classId: string) {
    const cls = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw new NotFoundException('Class not found');
    const students = await this.prisma.student.findMany({ where: { classId } });
    const studentIds = students.map((s) => s.id);
    const records = await this.prisma.attendanceRecord.findMany({ where: { studentId: { in: studentIds } } });
    return { class: cls, totalStudents: students.length, totalRecords: records.length, records };
  }

  async studentReport(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
    if (!student) throw new NotFoundException('Student not found');
    const records = await this.prisma.attendanceRecord.findMany({
      where: { studentId },
      include: { session: { include: { course: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    return { student, total, present, late, rate: total ? ((present + late) / total * 100).toFixed(1) : '0', records };
  }

  async exportCsv(courseId?: string, sessionId?: string) {
    const where: Record<string, unknown> = {};
    if (sessionId) where.sessionId = sessionId;
    if (courseId) where.session = { courseId };
    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: { student: { include: { user: true } }, session: { include: { course: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const rows = records.map((r) => ({
      student: r.student.user.fullName,
      studentNumber: r.student.studentNumber,
      course: r.session.course.code,
      session: r.session.startsAt.toISOString(),
      status: r.status,
      scannedAt: r.scannedAt?.toISOString() || '',
      validatedAt: r.validatedAt?.toISOString() || '',
    }));
    return stringify(rows, { header: true });
  }

  async exportExcel(sessionId: string): Promise<Buffer> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { course: true, teacher: { include: { user: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');

    const records = await this.prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: { student: { include: { user: true, class: true } } },
      orderBy: { scannedAt: 'asc' },
    });

    const statusLabels: Record<string, string> = {
      PRESENT: 'Présent',
      LATE: 'Retard',
      ABSENT: 'Absent',
      JUSTIFIED: 'Justifié',
    };

    const rows = records.map((r, i) => ({
      'N°': i + 1,
      'Matricule': r.student.studentNumber,
      'Nom complet': r.student.user.fullName,
      'Classe': r.student.class?.code || '',
      'Statut': statusLabels[r.status] || r.status,
      'Heure scan': r.scannedAt ? new Date(r.scannedAt).toLocaleString('fr-FR') : '',
      'Validé le': r.validatedAt ? new Date(r.validatedAt).toLocaleString('fr-FR') : '',
      'Notes': r.notes || '',
    }));

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const justified = records.filter((r) => r.status === 'JUSTIFIED').length;
    const summaryData = [
      { 'Information': 'Cours', 'Valeur': session.course.title },
      { 'Information': 'Code', 'Valeur': session.course.code },
      { 'Information': 'Date', 'Valeur': new Date(session.startsAt).toLocaleString('fr-FR') },
      { 'Information': 'Salle', 'Valeur': session.room || '—' },
      { 'Information': 'Professeur', 'Valeur': session.teacher?.user?.fullName || '—' },
      { 'Information': 'Statut', 'Valeur': session.status },
      { 'Information': '', 'Valeur': '' },
      { 'Information': 'Total présences', 'Valeur': records.length },
      { 'Information': 'Présents', 'Valeur': present },
      { 'Information': 'Retards', 'Valeur': late },
      { 'Information': 'Absents', 'Valeur': absent },
      { 'Information': 'Justifiés', 'Valeur': justified },
      { 'Information': 'Taux de présence', 'Valeur': records.length ? `${((present + late) / records.length * 100).toFixed(1)}%` : '0%' },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

    // Attendance list sheet
    const wsAttendance = XLSX.utils.json_to_sheet(rows);
    wsAttendance['!cols'] = [
      { wch: 5 },   // N°
      { wch: 15 },  // Matricule
      { wch: 25 },  // Nom
      { wch: 12 },  // Classe
      { wch: 10 },  // Statut
      { wch: 20 },  // Heure scan
      { wch: 20 },  // Validé le
      { wch: 20 },  // Notes
    ];
    XLSX.utils.book_append_sheet(wb, wsAttendance, 'Liste de présence');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buf;
  }

  async exportPdf(sessionId: string): Promise<Buffer> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { course: true, teacher: { include: { user: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');

    const records = await this.prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: { student: { include: { user: true, class: true } } },
      orderBy: { scannedAt: 'asc' },
    });

    const statusLabels: Record<string, string> = {
      PRESENT: 'Présent',
      LATE: 'Retard',
      ABSENT: 'Absent',
      JUSTIFIED: 'Justifié',
    };

    const present = records.filter((r) => r.status === 'PRESENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const justified = records.filter((r) => r.status === 'JUSTIFIED').length;
    const rate = records.length ? ((present + late) / records.length * 100).toFixed(1) : '0';

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const fontPath = path.join(__dirname, 'fonts', 'NotoSans-Regular.ttf');
      const doc = new PDFDocument({ size: 'A4', margin: 40, info: {
        Title: `Liste de présence - ${session.course.title}`,
        Author: session.teacher?.user?.fullName || 'ctrlManage',
      }});
      doc.registerFont('NotoSans', fontPath);
      doc.font('NotoSans');

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18).fillColor('#1a1a2e').text('ctrlManage', { align: 'left' });
      doc.fontSize(10).fillColor('#64748b').text('Plateforme de gestion académique', { align: 'left' });
      doc.moveDown(0.5);

      // Session info
      doc.fontSize(16).fillColor('#1a1a2e').text(`Liste de présence`, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor('#334155').text(`${session.course.title} (${session.course.code})`, { align: 'center' });
      doc.fontSize(9).fillColor('#64748b')
        .text(`Date : ${new Date(session.startsAt).toLocaleString('fr-FR')}  |  Salle : ${session.room || '—'}  |  Professeur : ${session.teacher?.user?.fullName || '—'}`, { align: 'center' });

      doc.moveDown(0.8);

      // Summary box
      const boxY = doc.y;
      const boxHeight = 50;
      doc.roundedRect(40, boxY, 515, boxHeight, 5).fill('#f1f5f9');
      doc.fillColor('#1e293b').fontSize(9);
      doc.text(`Présents : ${present}`, 55, boxY + 8, { continued: true, width: 120 });
      doc.text(`Retards : ${late}`, { continued: true, width: 100 });
      doc.text(`Absents : ${absent}`, { continued: true, width: 100 });
      doc.text(`Justifiés : ${justified}`, { continued: true, width: 100 });
      doc.text(`Taux : ${rate}%`, { width: 80 });
      doc.text(`Total : ${records.length} étudiants`, 55, boxY + 28, { width: 515 });
      doc.y = boxY + boxHeight + 15;

      // Table
      const tableTop = doc.y;
      const colWidths = [30, 80, 160, 65, 80, 100];
      const colX = [40, 70, 150, 310, 375, 455];
      const rowHeight = 22;

      // Table header
      doc.roundedRect(40, tableTop, 515, rowHeight, 0).fill('#8b5cf6');
      doc.fillColor('#ffffff').fontSize(8);
      const headers = ['N°', 'Matricule', 'Nom complet', 'Statut', 'Heure scan', 'Validé'];
      headers.forEach((h, i) => {
        doc.text(h, colX[i], tableTop + 6, { width: colWidths[i], align: i === 0 ? 'center' : 'left' });
      });
      doc.y = tableTop + rowHeight;

      // Table rows
      records.forEach((r, i) => {
        const y = doc.y;

        // Alternate row color
        if (i % 2 === 0) {
          doc.rect(40, y, 515, rowHeight).fill('#f8fafc');
        }

        const statusColor: Record<string, string> = {
          PRESENT: '#16a34a',
          LATE: '#d97706',
          ABSENT: '#dc2626',
          JUSTIFIED: '#2563eb',
        };

        doc.fillColor('#334155').fontSize(8);
        doc.text(`${i + 1}`, colX[0], y + 6, { width: colWidths[0], align: 'center' });
        doc.text(r.student.studentNumber, colX[1], y + 6, { width: colWidths[1] });
        doc.text(r.student.user.fullName, colX[2], y + 6, { width: colWidths[2] });
        doc.fillColor(statusColor[r.status] || '#334155');
        doc.text(statusLabels[r.status] || r.status, colX[3], y + 6, { width: colWidths[3] });
        doc.fillColor('#64748b');
        doc.text(r.scannedAt ? new Date(r.scannedAt).toLocaleTimeString('fr-FR') : '—', colX[4], y + 6, { width: colWidths[4] });
        doc.text(r.validatedAt ? new Date(r.validatedAt).toLocaleTimeString('fr-FR') : '—', colX[5], y + 6, { width: colWidths[5] });

        doc.y = y + rowHeight;

        // Page break
        if (doc.y > 750) {
          doc.addPage();
          doc.y = 40;
        }
      });

      // Footer
      doc.y = Math.max(doc.y + 30, 700);
      doc.fontSize(7).fillColor('#94a3b8')
        .text(`Généré par ctrlManage le ${new Date().toLocaleString('fr-FR')}  |  Document confidentiel`, { align: 'center' });

      doc.end();
    });
  }
}
