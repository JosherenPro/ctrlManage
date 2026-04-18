import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from '../common/dto/class.dto';

@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'List all classes' })
  findAll(@Query('academicYear') academicYear?: string) {
    return this.classesService.findAll(academicYear);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class by ID' })
  findOne(@Param('id') id: string) {
    return this.classesService.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a class' })
  create(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a class' })
  update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.classesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a class' })
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Get students in a class' })
  getStudents(@Param('id') id: string) {
    return this.classesService.getStudents(id);
  }

  @Post(':id/students/:studentId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Add student to class' })
  addStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.classesService.addStudent(id, studentId);
  }
}