import { Module } from '@nestjs/common';

import { OutputController } from './controllers/output.controller';
import { OutputService } from './services/output.service';
import { OutputRepository } from './repositories/output.repository';
import { OUTPUT_REPOSITORY } from './repositories/output.repository.interface';
import { getAppConfig } from '@common/config';

@Module({
  imports: [],
  controllers: [OutputController],
  providers: [
    OutputService,
    { provide: OUTPUT_REPOSITORY, useClass: OutputRepository },
  ],
  exports: [OutputService, OUTPUT_REPOSITORY],
})
export class OutputModule {}
