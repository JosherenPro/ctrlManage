import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StudentsService } from './students.service';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('search')
  @Roles('ADMIN', 'PROFESSOR')
  search(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.studentsService.search(query, limit ? parseInt(limit, 10) : 20);
  }
}