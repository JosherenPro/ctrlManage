import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 300000,
      max: 100,
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppCacheModule {}