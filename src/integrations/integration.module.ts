import { Module } from '@nestjs/common';
import { IntegrationController } from './controllers/integration.controller';
import { IntegrationService } from './services/integration.service';

@Module({
  controllers: [IntegrationController],
  providers: [IntegrationService],
})
export class IntegrationModule {}
