import { Module } from '@nestjs/common';
import { MasterUnitTypeController } from './master-unit-type.controller';
import { MasterUnitTypeService } from './master-unit-type.service';

@Module({
  controllers: [MasterUnitTypeController],
  providers: [MasterUnitTypeService]
})
export class MasterUnitTypeModule {}
