import { Module } from '@nestjs/common';

import { ApprovalController } from './controllers/approval.controller';
import { ApprovalService } from './services/approval.service';
import { ApprovalRepository } from './repositories/approval.repository';
import { APPROVAL_REPOSITORY } from './repositories/approval.repository.interface';
import { PROGRAM_REPOSITORY } from '@modules/program/repositories/program.repository.interface';
import { ProgramRepository } from '@modules/program/repositories/program.repository';
import { getAppConfig } from '@common/config';

@Module({
  imports: [],
  controllers: [ApprovalController],
  providers: [
    ApprovalService,
    { provide: APPROVAL_REPOSITORY, useClass: ApprovalRepository },
    { provide: PROGRAM_REPOSITORY, useClass: ProgramRepository },
  ],
  exports: [ApprovalService],
})
export class ApprovalModule {}
