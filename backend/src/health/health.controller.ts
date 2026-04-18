import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private redis: Redis | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (redisUrl) {
      this.redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
    }
  }

  @Get()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    const result: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      result.database = 'connected';
    } catch {
      result.database = 'disconnected';
    }

    if (this.redis) {
      try {
        await this.redis.ping();
        result.redis = 'connected';
      } catch {
        result.redis = 'disconnected';
      }
    }

    const allConnected = result.database === 'connected' &&
      (!this.redis || result.redis === 'connected');
    result.status = allConnected ? 'ok' : 'error';

    return result;
  }
}