import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as Sentry from '@sentry/node';

jest.mock('@sentry/node', () => ({
  withScope: jest.fn((cb) => cb({ setTag: jest.fn(), setExtra: jest.fn() })),
  captureException: jest.fn(),
}));

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jest.clearAllMocks();
  });

  const createMockHost = () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status, json };
    const request = { url: '/api/test', method: 'GET' };

    return {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
      response,
      request,
      json,
      status,
    };
  };

  describe('HttpException handling', () => {
    it('should handle HttpException with correct status and message', () => {
      const host = createMockHost();
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, host as any);

      expect(host.status).toHaveBeenCalledWith(404);
      expect(host.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Not found',
        }),
      );
    });

    it('should not report 4xx errors to Sentry', () => {
      const host = createMockHost();
      const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);

      filter.catch(exception, host as any);
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  describe('non-HttpException handling', () => {
    it('should handle unknown exceptions as 500', () => {
      const host = createMockHost();
      const exception = new Error('Database connection failed');

      filter.catch(exception, host as any);

      expect(host.status).toHaveBeenCalledWith(500);
      expect(host.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Internal server error',
        }),
      );
    });

    it('should report 500 errors to Sentry', () => {
      const host = createMockHost();
      const exception = new Error('Database connection failed');

      filter.catch(exception, host as any);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(exception);
    });
  });
});