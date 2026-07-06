import { Module } from '@nestjs/common';

import { ProgressController } from './controllers/progress.controller';
import { ProgressService } from './services/progress.service';
import { ProgressRepository } from './repositories/progress.repository';
import { PROGRESS_REPOSITORY } from './repositories/progress.repository.interface';
import { getAppConfig } from '@common/config';

@Module({
  imports: [],
  controllers: [ProgressController],
  providers: [
    ProgressService,
    { provide: PROGRESS_REPOSITORY, useClass: ProgressRepository },
  ],
  exports: [ProgressService],
})
export class ProgressModule {}
