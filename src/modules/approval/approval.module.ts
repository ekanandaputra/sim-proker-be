import { Module } from '@nestjs/common';

import { ApprovalController } from './controllers/approval.controller';
import { ApprovalReviewerController } from './controllers/approval-reviewer.controller';
import { ApprovalService } from './services/approval.service';
import { ApprovalReviewerTransferService } from './services/approval-reviewer-transfer.service';
import { ApprovalReviewerService } from './services/approval-reviewer.service';
import { ApprovalRepository } from './repositories/approval.repository';
import { APPROVAL_REPOSITORY } from './repositories/approval.repository.interface';
import { ApprovalReviewerRepository } from './repositories/approval-reviewer.repository';
import { APPROVAL_REVIEWER_REPOSITORY } from './repositories/approval-reviewer.repository.interface';
import { UnitModule } from '../unit/unit.module';
import { AuthIntegrationModule } from '../external/auth-integration/auth-integration.module';
import { IkuIntegrationModule } from '../external/iku-integration/iku-integration.module';
import { StorageModule } from '@common/storage';

@Module({
  imports: [UnitModule, AuthIntegrationModule, IkuIntegrationModule, StorageModule],
  controllers: [ApprovalController, ApprovalReviewerController],
  providers: [
    ApprovalService,
    ApprovalReviewerService,
    ApprovalReviewerTransferService,
    { provide: APPROVAL_REPOSITORY, useClass: ApprovalRepository },
    { provide: APPROVAL_REVIEWER_REPOSITORY, useClass: ApprovalReviewerRepository },
  ],
  exports: [ApprovalService, ApprovalReviewerService],
})
export class ApprovalModule {}
