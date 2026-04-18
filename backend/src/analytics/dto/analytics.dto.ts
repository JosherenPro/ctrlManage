import { ApiProperty } from '@nestjs/swagger';

export class AttendanceByMonthDto {
  @ApiProperty()
  month!: string;

  @ApiProperty()
  present!: number;

  @ApiProperty()
  absent!: number;

  @ApiProperty()
  late!: number;
}

export class TopCourseDto {
  @ApiProperty()
  courseId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  attendanceRate!: number;

  @ApiProperty()
  totalSessions!: number;
}

export class AnalyticsOverviewDto {
  @ApiProperty({ required: false })
  totalStudents?: number;

  @ApiProperty()
  totalCourses!: number;

  @ApiProperty()
  totalSessions!: number;

  @ApiProperty()
  openSessions!: number;

  @ApiProperty({ type: [AttendanceByMonthDto] })
  attendanceByMonth!: AttendanceByMonthDto[];

  @ApiProperty({ type: [TopCourseDto], required: false })
  topCourses?: TopCourseDto[];

  @ApiProperty({ required: false })
  rate?: number;

  @ApiProperty({ required: false })
  presentCount?: number;

  @ApiProperty({ required: false })
  lateCount?: number;

  @ApiProperty({ required: false })
  absentCount?: number;
}