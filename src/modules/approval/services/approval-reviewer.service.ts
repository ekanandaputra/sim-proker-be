import { Injectable, Inject, Logger } from '@nestjs/common';
import { ApprovalLevel } from '@prisma/client';
import { APPROVAL_REVIEWER_REPOSITORY, IApprovalReviewerRepository } from '../repositories/approval-reviewer.repository.interface';
import { CreateApprovalReviewerInput, ApprovalReviewerMapper, ApprovalReviewerResponseDto } from '../dto/approval-reviewer.dto';
import { EntityNotFoundException, InvalidStateException } from '@common/exceptions';

@Injectable()
export class ApprovalReviewerService {
  private readonly logger = new Logger(ApprovalReviewerService.name);

  constructor(
    @Inject(APPROVAL_REVIEWER_REPOSITORY)
    private readonly reviewerRepository: IApprovalReviewerRepository,
  ) {}

  /**
   * Create reviewer assignment(s).
   * For INDICATOR_VERIFICATION: creates one record per ikuId.
   * For BUDGET_VERIFICATION: creates a single record (ikuId = null).
   */
  async create(dto: CreateApprovalReviewerInput): Promise<ApprovalReviewerResponseDto[]> {
    const results: ApprovalReviewerResponseDto[] = [];

    if (dto.level === ApprovalLevel.BUDGET_VERIFICATION) {
      // Budget reviewer: single entry, no IKU
      const existing = await this.reviewerRepository.findByUserAndLevel(dto.userId, dto.level);
      if (existing) {
        throw new InvalidStateException(`User ${dto.userId} is already a BUDGET_VERIFICATION reviewer`);
      }

      const reviewer = await this.reviewerRepository.create({
        userId: dto.userId,
        level: dto.level,
        ikuId: null,
      });
      this.logger.log(`Assigned user ${dto.userId} as BUDGET_VERIFICATION reviewer`);
      results.push(ApprovalReviewerMapper.toResponse(reviewer));
    } else {
      // Indicator reviewer: one record per IKU
      const ikuIds = dto.ikuIds || [];
      for (const ikuId of ikuIds) {
        const existing = await this.reviewerRepository.findByUserAndLevel(dto.userId, dto.level, ikuId);
        if (existing) {
          this.logger.warn(`User ${dto.userId} is already an INDICATOR_VERIFICATION reviewer for IKU ${ikuId}, skipping`);
          results.push(ApprovalReviewerMapper.toResponse(existing));
          continue;
        }

        const reviewer = await this.reviewerRepository.create({
          userId: dto.userId,
          level: dto.level,
          ikuId,
        });
        this.logger.log(`Assigned user ${dto.userId} as INDICATOR_VERIFICATION reviewer for IKU ${ikuId}`);
        results.push(ApprovalReviewerMapper.toResponse(reviewer));
      }
    }

    return results;
  }

  /**
   * List all reviewers with optional filters.
   */
  async findAll(filters?: { level?: ApprovalLevel; ikuId?: string }): Promise<ApprovalReviewerResponseDto[]> {
    const reviewers = await this.reviewerRepository.findAll(filters);
    return ApprovalReviewerMapper.toResponseList(reviewers);
  }

  /**
   * Get a single reviewer assignment by ID.
   */
  async findById(id: string): Promise<ApprovalReviewerResponseDto> {
    const reviewer = await this.reviewerRepository.findById(id);
    if (!reviewer) throw new EntityNotFoundException('ApprovalReviewer', id);
    return ApprovalReviewerMapper.toResponse(reviewer);
  }

  /**
   * Delete a reviewer assignment by ID.
   */
  async delete(id: string): Promise<void> {
    const reviewer = await this.reviewerRepository.findById(id);
    if (!reviewer) throw new EntityNotFoundException('ApprovalReviewer', id);
    await this.reviewerRepository.delete(id);
    this.logger.log(`Deleted reviewer assignment ${id} (user: ${reviewer.userId}, level: ${reviewer.level})`);
  }

  /**
   * Check if a user is authorized to review at a given level.
   * For INDICATOR_VERIFICATION, ikuId is required.
   * For BUDGET_VERIFICATION, ikuId is ignored.
   */
  async isAuthorizedReviewer(userId: string, level: ApprovalLevel, ikuId?: string): Promise<boolean> {
    if (level === ApprovalLevel.INDICATOR_VERIFICATION) {
      if (!ikuId) return false;
      const reviewer = await this.reviewerRepository.findByUserAndLevel(userId, level, ikuId);
      return !!reviewer;
    }

    // BUDGET_VERIFICATION: ikuId is not relevant
    const reviewer = await this.reviewerRepository.findByUserAndLevel(userId, level);
    return !!reviewer;
  }
}
