import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentEstablishment } from '../common/decorators/current-establishment.decorator';
import { RequestUser } from '../common/interfaces';
import { UsersService } from './users.service';
import { UsersImportService } from './users.import.service';
import { CreateUserDto, UpdateUserDto } from '../common/dto/user.dto';
import { CreateStudentDto, CreateTeacherDto } from '../common/dto/profile.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private usersImportService: UsersImportService,
  ) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all users' })
  findAll(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.findAll(
      { role, status },
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: RequestUser) {
    return this.usersService.findById(user.id);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a user' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Post('import')
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Seuls les fichiers CSV sont acceptés'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import students from CSV' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        roleId: { type: 'string' },
      },
    },
  })
  async importUsers(
    @UploadedFile() file: Express.Multer.File,
    @Body('roleId') roleId: string,
    @CurrentEstablishment() establishmentId: string,
  ) {
    return this.usersImportService.importFromCsv(file, roleId, establishmentId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/student')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create student profile for user' })
  createStudentProfile(@Param('id') id: string, @Body() dto: CreateStudentDto) {
    return this.usersService.createStudentProfile(id, dto);
  }

  @Post(':id/teacher')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create teacher profile for user' })
  createTeacherProfile(@Param('id') id: string, @Body() dto: CreateTeacherDto) {
    return this.usersService.createTeacherProfile(id, dto);
  }
}