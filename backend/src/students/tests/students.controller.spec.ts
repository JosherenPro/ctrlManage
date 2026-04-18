import { StudentsService } from '../students.service';
import { StudentsController } from '../students.controller';

describe('StudentsController', () => {
  let controller: StudentsController;
  let mockService: jest.Mocked<StudentsService>;

  beforeEach(() => {
    mockService = {
      search: jest.fn().mockResolvedValue([]),
    } as any;

    controller = new StudentsController(mockService as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    it('should call service.search with query and default limit', async () => {
      await controller.search('john');
      expect(mockService.search).toHaveBeenCalledWith('john', 20);
    });

    it('should call service.search with custom limit', async () => {
      await controller.search('john', '10');
      expect(mockService.search).toHaveBeenCalledWith('john', 10);
    });
  });
});