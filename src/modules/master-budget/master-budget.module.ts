import { Module } from '@nestjs/common';
import { MasterBudgetController } from './master-budget.controller';
import { MasterBudgetService } from './master-budget.service';

@Module({
  controllers: [MasterBudgetController],
  providers: [MasterBudgetService],
  exports: [MasterBudgetService]
})
export class MasterBudgetModule {}
