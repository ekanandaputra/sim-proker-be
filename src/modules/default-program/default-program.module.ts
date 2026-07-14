import { Module } from '@nestjs/common';
import { ProgramModule } from '../program/program.module';
import { UnitModule } from '../unit/unit.module';
import { IkuModule } from '../iku/iku.module';
import { DefaultProgramController } from './controllers/default-program.controller';
import { DefaultProgramService } from './services/default-program.service';

@Module({
  imports: [ProgramModule, UnitModule, IkuModule],
  controllers: [DefaultProgramController],
  providers: [DefaultProgramService],
  exports: [DefaultProgramService],
})
export class DefaultProgramModule {}
