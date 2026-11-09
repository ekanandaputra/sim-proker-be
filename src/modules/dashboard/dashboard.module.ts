import { Module } from '@nestjs/common';

import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { BudgetRecapService } from './services/budget-recap.service';
import { BudgetRecapExportService } from './services/budget-recap-export.service';
import { UnitModule } from '../unit/unit.module';
import { AuthIntegrationModule } from '../external/auth-integration/auth-integration.module';
import { UnitBudgetProposalModule } from '../unit-budget-proposal/unit-budget-proposal.module';

@Module({
  imports: [UnitModule, AuthIntegrationModule, UnitBudgetProposalModule],
  controllers: [DashboardController],
  providers: [DashboardService, BudgetRecapService, BudgetRecapExportService],
})
export class DashboardModule {}
