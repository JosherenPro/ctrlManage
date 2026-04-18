import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from '../audit.controller';
import { AuditService } from '../audit.service';

describe('AuditController', () => {
  let controller: AuditController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 50 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: mockService }],
    }).compile();

    controller = module.get<AuditController>(AuditController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with filters', async () => {
      await controller.findAll('actor-1', 'User', 'CREATE', 1, 20);
      expect(mockService.findAll).toHaveBeenCalledWith(
        { actorId: 'actor-1', entityType: 'User', action: 'CREATE' },
        1,
        20,
      );
    });

    it('should call service.findAll with default pagination', async () => {
      await controller.findAll();
      expect(mockService.findAll).toHaveBeenCalledWith({}, 1, 50);
    });
  });
});