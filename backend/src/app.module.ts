import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClassesModule } from './classes/classes.module';
import { CoursesModule } from './courses/courses.module';
import { SessionsModule } from './sessions/sessions.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { WebsocketModule } from './websocket/websocket.module';
import { StudentsModule } from './students/students.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { EstablishmentsModule } from './establishments/establishments.module';
import { AppCacheModule } from './cache/cache.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{
          name: 'default',
          ttl: 60000,
          limit: 100,
        }],
        storage: new ThrottlerStorageRedisService(config.get<string>('REDIS_URL', 'redis://localhost:6379')),
      }),
    }),
    AppCacheModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    ClassesModule,
    CoursesModule,
    SessionsModule,
    AttendanceModule,
    ReportsModule,
    AuditModule,
    HealthModule,
    WebsocketModule,
    StudentsModule,
    AnalyticsModule,
    EstablishmentsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}