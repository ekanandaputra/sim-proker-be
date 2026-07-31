import { Module } from '@nestjs/common';

import { ApprovalController } from './controllers/approval.controller';
import { ApprovalService } from './services/approval.service';
import { ApprovalRepository } from './repositories/approval.repository';
import { APPROVAL_REPOSITORY } from './repositories/approval.repository.interface';

@Module({
  imports: [],
  controllers: [ApprovalController],
  providers: [
    ApprovalService,
    { provide: APPROVAL_REPOSITORY, useClass: ApprovalRepository },
  ],
  exports: [ApprovalService],
})
export class ApprovalModule {}
