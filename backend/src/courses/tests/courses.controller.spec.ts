import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from '../courses.controller';
import { CoursesService } from '../courses.service';

describe('CoursesController', () => {
  let controller: CoursesController;
  let mockService: any;

  const mockUser = { id: 'u1', role: { name: 'ADMIN' } };

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 50 }),
      findById: jest.fn().mockResolvedValue({ id: '1', code: 'CS101', title: 'Intro CS' }),
      create: jest.fn().mockResolvedValue({ id: '1', code: 'CS101', title: 'Intro CS' }),
      update: jest.fn().mockResolvedValue({ id: '1', title: 'Updated' }),
      remove: jest.fn().mockResolvedValue({ id: '1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [{ provide: CoursesService, useValue: mockService }],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with user and classId', async () => {
      await controller.findAll(mockUser as any, 'class-1');
      expect(mockService.findAll).toHaveBeenCalledWith(mockUser, 'class-1');
    });

    it('should call service.findAll without classId', async () => {
      await controller.findAll(mockUser as any);
      expect(mockService.findAll).toHaveBeenCalledWith(mockUser, undefined);
    });
  });

  describe('findOne', () => {
    it('should call service.findById', async () => {
      await controller.findOne('1');
      expect(mockService.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { code: 'CS101', title: 'Intro CS', classId: 'c1', teacherId: 't1', establishmentId: 'default-establishment' };
      await controller.create(dto);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto = { title: 'Updated' };
      await controller.update('1', dto);
      expect(mockService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      await controller.remove('1');
      expect(mockService.remove).toHaveBeenCalledWith('1');
    });
  });
});