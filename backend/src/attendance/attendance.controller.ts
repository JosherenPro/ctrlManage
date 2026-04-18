import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces';
import { AttendanceService } from './attendance.service';
import { RegisterAttendanceDto, ScanQrDto, ValidateAttendanceDto } from '../common/dto/attendance.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current student attendance history' })
  getMyAttendance(@CurrentUser() user: RequestUser) {
    return this.attendanceService.getByUser(user);
  }

  @Get('session/:sessionId')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Get attendance records for a session' })
  getBySession(@Param('sessionId') sessionId: string) {
    return this.attendanceService.getBySession(sessionId);
  }

  @Get('student/:studentId')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Get attendance history for a student' })
  getByStudent(@Param('studentId') studentId: string) {
    return this.attendanceService.getByStudent(studentId);
  }

  @Post('scan')
  @ApiOperation({ summary: 'Scan a QR code to register attendance' })
  scanQrCode(@CurrentUser() user: RequestUser, @Body() dto: ScanQrDto) {
    return this.attendanceService.scanQrCode(user, dto.token, dto.studentId);
  }

  @Post('register')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Register attendance manually' })
  registerAttendance(@CurrentUser() user: RequestUser, @Body() dto: RegisterAttendanceDto) {
    return this.attendanceService.registerAttendance(user, dto.sessionId, dto.studentId);
  }

  @Patch(':id/validate')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Validate or correct an attendance record' })
  validateAttendance(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: ValidateAttendanceDto,
  ) {
    return this.attendanceService.validateAttendance(id, user, dto);
  }
}