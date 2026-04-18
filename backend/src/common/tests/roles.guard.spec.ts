import { RolesGuard } from '../guards/roles.guard';
import { ForbiddenException } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: any;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RolesGuard(mockReflector);
  });

  const createMockContext = (user: any) => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockContext({ role: { name: 'STUDENT' } });

      expect(guard.canActivate(context as any)).toBe(true);
    });

    it('should allow access when user has required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN', 'PROFESSOR']);
      const context = createMockContext({ role: { name: 'PROFESSOR' } });

      expect(guard.canActivate(context as any)).toBe(true);
    });

    it('should throw ForbiddenException when user lacks required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = createMockContext({ role: { name: 'STUDENT' } });

      expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
    });

    it('should return false when no user on request', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = createMockContext(null);

      expect(guard.canActivate(context as any)).toBe(false);
    });
  });
});