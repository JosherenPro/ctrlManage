import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EstablishmentsService } from './establishments.service';
import { CreateEstablishmentDto, UpdateEstablishmentDto } from './dto/establishment.dto';

@ApiTags('establishments')
@ApiBearerAuth()
@Controller('establishments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class EstablishmentsController {
  constructor(private establishmentsService: EstablishmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all establishments' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.establishmentsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get establishment by ID' })
  findOne(@Param('id') id: string) {
    return this.establishmentsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an establishment' })
  create(@Body() dto: CreateEstablishmentDto) {
    return this.establishmentsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an establishment' })
  update(@Param('id') id: string, @Body() dto: UpdateEstablishmentDto) {
    return this.establishmentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate an establishment' })
  remove(@Param('id') id: string) {
    return this.establishmentsService.remove(id);
  }
}