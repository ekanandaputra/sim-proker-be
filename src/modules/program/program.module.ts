import { Module } from '@nestjs/common';

import { ProgramController } from './controllers/program.controller';
import { ProgramIndicatorController } from './controllers/program-indicator.controller';
import { ProgramService } from './services/program.service';
import { ProgramIndicatorService } from './services/program-indicator.service';
import { ProgramIndicatorImportService } from './services/program-indicator-import.service';
import { ProgramRepository } from './repositories/program.repository';
import { PROGRAM_REPOSITORY } from './repositories/program.repository.interface';
import { getAppConfig } from '@common/config';

import { UnitModule } from '../unit/unit.module';
import { AuthIntegrationModule } from '../external/auth-integration/auth-integration.module';
import { IkuModule } from '../iku/iku.module';
import { ProgramExportService } from './services/program-export.service';
import { StorageModule } from '@common/storage';

@Module({
  imports: [UnitModule, AuthIntegrationModule, IkuModule, StorageModule],
  controllers: [ProgramController, ProgramIndicatorController],
  providers: [
    ProgramService,
    ProgramIndicatorService,
    ProgramExportService,
    ProgramIndicatorImportService,
    {
      provide: PROGRAM_REPOSITORY,
      useClass: ProgramRepository,
    },
  ],
  exports: [ProgramService],
})
export class ProgramModule {}

