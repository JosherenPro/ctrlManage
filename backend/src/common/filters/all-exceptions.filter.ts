import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    if (status >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag('path', request.url);
        scope.setExtra('statusCode', status);
        scope.setExtra('method', request.method);
        Sentry.captureException(exception);
      });
    }

    response.status(status).json({ statusCode: status, message, timestamp: new Date().toISOString() });
  }
}