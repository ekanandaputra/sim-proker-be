import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UnitController } from './controllers/unit.controller';
import { UnitService } from './services/unit.service';
import { PrismaModule } from '@database/prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [UnitController],
  providers: [UnitService],
  exports: [UnitService],
})
export class UnitModule {}
