import { Module } from '@nestjs/common';
import { IkuController } from './controllers/iku.controller';
import { IkuService } from './services/iku.service';
import { IkuIntegrationModule } from '@modules/external/iku-integration/iku-integration.module';

@Module({
  imports: [IkuIntegrationModule],
  controllers: [IkuController],
  providers: [IkuService],
  exports: [IkuService],
})
export class IkuModule {}
