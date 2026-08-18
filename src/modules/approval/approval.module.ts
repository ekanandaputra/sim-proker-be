import { Module } from '@nestjs/common';

import { ApprovalController } from './controllers/approval.controller';
import { ApprovalReviewerController } from './controllers/approval-reviewer.controller';
import { ApprovalService } from './services/approval.service';
import { ApprovalReviewerService } from './services/approval-reviewer.service';
import { ApprovalRepository } from './repositories/approval.repository';
import { APPROVAL_REPOSITORY } from './repositories/approval.repository.interface';
import { ApprovalReviewerRepository } from './repositories/approval-reviewer.repository';
import { APPROVAL_REVIEWER_REPOSITORY } from './repositories/approval-reviewer.repository.interface';
import { UnitModule } from '../unit/unit.module';
import { AuthIntegrationModule } from '../external/auth-integration/auth-integration.module';

@Module({
  imports: [UnitModule, AuthIntegrationModule],
  controllers: [ApprovalController, ApprovalReviewerController],
  providers: [
    ApprovalService,
    ApprovalReviewerService,
    { provide: APPROVAL_REPOSITORY, useClass: ApprovalRepository },
    { provide: APPROVAL_REVIEWER_REPOSITORY, useClass: ApprovalReviewerRepository },
  ],
  exports: [ApprovalService, ApprovalReviewerService],
})
export class ApprovalModule {}
