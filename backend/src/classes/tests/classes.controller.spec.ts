import { Test, TestingModule } from '@nestjs/testing';
import { ClassesController } from '../classes.controller';
import { ClassesService } from '../classes.service';

describe('ClassesController', () => {
  let controller: ClassesController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 50 }),
      findById: jest.fn().mockResolvedValue({ id: '1', code: 'L3-INFO-A', name: 'Class A' }),
      create: jest.fn().mockResolvedValue({ id: '1', code: 'L3-INFO-A', name: 'Class A' }),
      update: jest.fn().mockResolvedValue({ id: '1', name: 'Updated' }),
      remove: jest.fn().mockResolvedValue({ id: '1' }),
      getStudents: jest.fn().mockResolvedValue([]),
      addStudent: jest.fn().mockResolvedValue({ id: 's1', classId: '1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassesController],
      providers: [{ provide: ClassesService, useValue: mockService }],
    }).compile();

    controller = module.get<ClassesController>(ClassesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with academicYear filter', async () => {
      await controller.findAll('2025-2026');
      expect(mockService.findAll).toHaveBeenCalledWith('2025-2026');
    });

    it('should call service.findAll without filter', async () => {
      await controller.findAll();
      expect(mockService.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('findOne', () => {
    it('should call service.findById', async () => {
      await controller.findOne('1');
      expect(mockService.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto = { code: 'L3-INFO-A', name: 'Class A', academicYear: '2025-2026', establishmentId: 'default-establishment' };
      await controller.create(dto);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto = { name: 'Updated' };
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

  describe('getStudents', () => {
    it('should call service.getStudents', async () => {
      await controller.getStudents('1');
      expect(mockService.getStudents).toHaveBeenCalledWith('1');
    });
  });

  describe('addStudent', () => {
    it('should call service.addStudent', async () => {
      await controller.addStudent('1', 's1');
      expect(mockService.addStudent).toHaveBeenCalledWith('1', 's1');
    });
  });
});