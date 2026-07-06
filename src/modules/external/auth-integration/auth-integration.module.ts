import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { AuthIntegrationController } from './controllers/auth-integration.controller';
import { AuthIntegrationService } from './services/auth-integration.service';
import { getAppConfig } from '@common/config';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),

  ],
  controllers: [AuthIntegrationController],
  providers: [AuthIntegrationService],
  exports: [AuthIntegrationService],
})
export class AuthIntegrationModule {}
