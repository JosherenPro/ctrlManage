import { IsString, IsOptional, IsUUID, IsNotEmpty, IsEnum } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class RegisterAttendanceDto {
  @IsUUID()
  sessionId!: string;

  @IsUUID()
  studentId!: string;
}

export class ScanQrDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsUUID()
  studentId!: string;
}

export class ValidateAttendanceDto {
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}