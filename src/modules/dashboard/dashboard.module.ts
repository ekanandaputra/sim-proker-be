import { Module } from '@nestjs/common';

import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { getAppConfig } from '@common/config';

@Module({
  imports: [],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
