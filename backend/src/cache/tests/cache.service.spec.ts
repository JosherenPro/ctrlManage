import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from '../cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: { get: jest.Mock; set: jest.Mock; del: jest.Mock; reset: jest.Mock };

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached value', async () => {
      cacheManager.get.mockResolvedValue('cached-value');
      const result = await service.get<string>('test-key');
      expect(result).toBe('cached-value');
      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
    });

    it('should return undefined for missing key', async () => {
      cacheManager.get.mockResolvedValue(undefined);
      const result = await service.get<string>('missing');
      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      await service.set('key', 'value');
      expect(cacheManager.set).toHaveBeenCalledWith('key', 'value');
    });

    it('should set value with TTL', async () => {
      await service.set('key', 'value', 5000);
      expect(cacheManager.set).toHaveBeenCalledWith('key', 'value', 5000);
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      await service.del('key');
      expect(cacheManager.del).toHaveBeenCalledWith('key');
    });
  });

  describe('clear', () => {
    it('should clear the cache', async () => {
      await service.clear();
      expect(cacheManager.reset).toHaveBeenCalled();
    });
  });
});