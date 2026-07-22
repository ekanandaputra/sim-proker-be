import { Module } from '@nestjs/common';

import { ProgramController } from './controllers/program.controller';
import { ProgramIndicatorController } from './controllers/program-indicator.controller';
import { ProgramService } from './services/program.service';
import { ProgramIndicatorService } from './services/program-indicator.service';
import { ProgramRepository } from './repositories/program.repository';
import { PROGRAM_REPOSITORY } from './repositories/program.repository.interface';
import { getAppConfig } from '@common/config';

@Module({
  imports: [],
  controllers: [ProgramController, ProgramIndicatorController],
  providers: [
    ProgramService,
    ProgramIndicatorService,
    {
      provide: PROGRAM_REPOSITORY,
      useClass: ProgramRepository,
    },
  ],
  exports: [ProgramService],
})
export class ProgramModule {}
