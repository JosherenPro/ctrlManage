import { IsString, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @IsUUID()
  courseId!: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  room?: string;

  @IsUUID()
  establishmentId!: string;
}

export class UpdateSessionDto {
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  room?: string;
}