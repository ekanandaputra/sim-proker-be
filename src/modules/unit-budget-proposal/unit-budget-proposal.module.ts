import { Module } from '@nestjs/common';
import { UnitBudgetProposalController } from './controllers/unit-budget-proposal.controller';
import { UnitBudgetProposalService } from './services/unit-budget-proposal.service';
import { UnitBudgetProposalExportService } from './services/unit-budget-proposal-export.service';
import { UnitModule } from '../unit/unit.module';
import { StorageModule } from '@common/storage';

@Module({
  imports: [UnitModule, StorageModule],
  controllers: [UnitBudgetProposalController],
  providers: [UnitBudgetProposalService, UnitBudgetProposalExportService],
  exports: [UnitBudgetProposalService],
})
export class UnitBudgetProposalModule {}
