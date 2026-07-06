import { Module } from '@nestjs/common';

import { ActivityController } from './controllers/activity.controller';
import { ActivityService } from './services/activity.service';
import { ActivityRepository } from './repositories/activity.repository';
import { ACTIVITY_REPOSITORY } from './repositories/activity.repository.interface';
import { getAppConfig } from '@common/config';

@Module({
  imports: [],
  controllers: [ActivityController],
  providers: [
    ActivityService,
    { provide: ACTIVITY_REPOSITORY, useClass: ActivityRepository },
  ],
  exports: [ActivityService],
})
export class ActivityModule {}
