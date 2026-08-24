import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');

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
    .addTag('Documents', 'Supporting document management')
    .addTag('Approvals', 'Approval workflow (2-level verification: Indicator & Budget)')
    .addTag('Approval Reviewers', 'Dynamic reviewer assignment management')
    .addTag('Dashboard', 'Aggregated statistics')
    .addTag('Integration', 'APIs for SIM IKU and other microservices')
    .addTag('Master Unit Type', 'Master Unit Type management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const outputPath = path.resolve(process.cwd(), 'swagger.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
  console.log(`✅ swagger.json updated at ${outputPath}`);
  await app.close();
}

generate();
