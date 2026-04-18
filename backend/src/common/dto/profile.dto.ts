import { IsString, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateStudentDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  studentNumber!: string;

  @IsUUID()
  classId!: string;

  @IsOptional()
  @IsString()
  program?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsUUID()
  establishmentId!: string;
}

export class CreateTeacherDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  employeeNumber!: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsUUID()
  establishmentId!: string;
}