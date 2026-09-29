import { Module } from '@nestjs/common';

import { GuideController } from './controllers/guide.controller';
import { GuideService } from './services/guide.service';
import { GuideRepository } from './repositories/guide.repository';
import { GUIDE_REPOSITORY } from './repositories/guide.repository.interface';
import { StorageModule } from '@common/storage';

@Module({
  imports: [StorageModule],
  controllers: [GuideController],
  providers: [GuideService, { provide: GUIDE_REPOSITORY, useClass: GuideRepository }],
  exports: [GuideService],
})
export class GuideModule {}
