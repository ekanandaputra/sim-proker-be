import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@common/filters';
import { ResponseInterceptor } from '@common/interceptors';
import { LoggingInterceptor } from '@common/interceptors';
import { getAppConfig } from '@common/config';

async function bootstrap() {
  const config = getAppConfig();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Pino as the application logger
  app.useLogger(app.get(Logger));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  });

  // Global filters, interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(), new LoggingInterceptor());

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SIM PROKER API')
    .setDescription(
      'Program Kerja Information System — REST API Documentation.\n\n' +
      'This service manages program planning, activity management, output tracking, ' +
      'progress monitoring, evidence management, and approval workflows.\n\n' +
      '**Authentication**: All endpoints require a valid JWT Bearer token from Auth Service.',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter the JWT token obtained from Auth Service',
    })
    .addTag('Programs', 'Program Kerja management')
    .addTag('Activities', 'Activity management within programs')
    .addTag('Outputs', 'Output / deliverable tracking')
    .addTag('Progress', 'Progress logging (append-only)')
    .addTag('Evidences', 'Supporting document management')
    .addTag('Approvals', 'Approval workflow')
    .addTag('Dashboard', 'Aggregated statistics')
    .addTag('Integration', 'APIs for SIM IKU and other microservices')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(config.PORT);

  const logger = app.get(Logger);
  logger.log(`🚀 SIM PROKER API is running on: http://localhost:${config.PORT}/api/v1`);
  logger.log(`📚 Swagger documentation: http://localhost:${config.PORT}/api/docs`);
}

bootstrap();
