import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { initSentry } from './common/monitoring/sentry.init';
import { AppModule } from './app.module';
import { SessionsGateway } from './websocket/websocket.gateway';
import { SessionsService } from './sessions/sessions.service';
import { JwtService } from '@nestjs/jwt';

initSentry();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Wire up SessionsGateway → SessionsService + JwtService after DI is ready
  const gateway = app.get(SessionsGateway);
  const sessionsService = app.get(SessionsService);
  sessionsService.setSessionsGateway(gateway);
  const jwtService = app.get(JwtService);
  gateway.setJwtVerify((token: string) => jwtService.verify(token));

  // Security: Helmet for HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginOpenerPolicy: process.env.NODE_ENV === 'production' ? { policy: 'same-origin' } : false,
      crossOriginResourcePolicy: process.env.NODE_ENV === 'production' ? { policy: 'same-origin' } : false,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS configuration
  const allowedOrigins = (
    process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3003',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:3002',
          'http://127.0.0.1:3003',
        ]
  ).map((origin) => origin.trim());

  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ctrlManage API')
    .setDescription('Plateforme de gestion académique')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`ctrlManage backend running on port ${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
