import { Module } from '@nestjs/common';

import { EvidenceController } from './controllers/evidence.controller';
import { EvidenceService } from './services/evidence.service';
import { EvidenceRepository } from './repositories/evidence.repository';
import { EVIDENCE_REPOSITORY } from './repositories/evidence.repository.interface';
import { StorageModule } from '@common/storage';
import { getAppConfig } from '@common/config';

@Module({
  imports: [

    StorageModule,
  ],
  controllers: [EvidenceController],
  providers: [
    EvidenceService,
    { provide: EVIDENCE_REPOSITORY, useClass: EvidenceRepository },
  ],
  exports: [EvidenceService],
})
export class EvidenceModule {}
