import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersImportService } from './users.import.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersImportService],
  exports: [UsersService],
})
export class UsersModule {}