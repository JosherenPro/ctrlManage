import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionDto } from '../common/dto/session.dto';

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'List sessions' })
  findAll(@CurrentUser() user: RequestUser, @Query('courseId') courseId?: string) {
    return this.sessionsService.findAll(user, courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  findOne(@Param('id') id: string) {
    return this.sessionsService.findById(id);
  }

  @Post()
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Create a session' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto, user);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Update a session' })
  update(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.sessionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a session' })
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }

  @Post(':id/open')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Open a session for attendance' })
  openSession(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.sessionsService.openSession(id, user);
  }

  @Post(':id/close')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Close a session' })
  closeSession(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.sessionsService.closeSession(id, user);
  }

  @Post(':id/qrcode')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Generate a QR code for a session' })
  generateQrCode(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.sessionsService.generateQrCode(id, user);
  }
}