import { Controller, Get, Param, Query, UseGuards, Header, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('session/:sessionId')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Attendance report by session' })
  sessionReport(@Param('sessionId') sessionId: string) {
    return this.reportsService.sessionReport(sessionId);
  }

  @Get('course/:courseId')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Attendance rate by course' })
  courseReport(@Param('courseId') courseId: string) {
    return this.reportsService.courseReport(courseId);
  }

  @Get('class/:classId')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Attendance overview by class' })
  classReport(@Param('classId') classId: string) {
    return this.reportsService.classReport(classId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Student attendance history' })
  studentReport(@Param('studentId') studentId: string) {
    return this.reportsService.studentReport(studentId);
  }

  @Get('export/csv')
  @Roles('ADMIN', 'PROFESSOR')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=attendance.csv')
  @ApiOperation({ summary: 'Export attendance as CSV' })
  exportCsv(@Query('courseId') courseId?: string, @Query('sessionId') sessionId?: string) {
    return this.reportsService.exportCsv(courseId, sessionId);
  }

  @Get('export/excel/:sessionId')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Export session attendance as Excel' })
  async exportExcel(@Param('sessionId') sessionId: string, @Res() res: Response) {
    const buffer = await this.reportsService.exportExcel(sessionId);
    const filename = `presence-session-${sessionId.substring(0, 8)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('export/pdf/:sessionId')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Export session attendance as PDF' })
  async exportPdf(@Param('sessionId') sessionId: string, @Res() res: Response) {
    const buffer = await this.reportsService.exportPdf(sessionId);
    const filename = `presence-session-${sessionId.substring(0, 8)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
