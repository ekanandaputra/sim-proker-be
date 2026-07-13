import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { IkuIntegrationController } from './controllers/iku-integration.controller';
import { IkuIntegrationService } from './services/iku-integration.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [IkuIntegrationController],
  providers: [IkuIntegrationService],
  exports: [IkuIntegrationService],
})
export class IkuIntegrationModule {}
