import { Injectable, Inject, Logger } from '@nestjs/common';
import { ApprovalLevel } from '@prisma/client';
import { APPROVAL_REVIEWER_REPOSITORY, IApprovalReviewerRepository } from '../repositories/approval-reviewer.repository.interface';
import { CreateApprovalReviewerInput, ApprovalReviewerMapper, ApprovalReviewerResponseDto, ApprovalReviewerUserResponseDto } from '../dto/approval-reviewer.dto';
import { EntityNotFoundException, InvalidStateException } from '@common/exceptions';
import { AuthIntegrationService } from '../../external/auth-integration/services/auth-integration.service';

import { IkuIntegrationService } from '../../external/iku-integration/services/iku-integration.service';

@Injectable()
export class ApprovalReviewerService {
  private readonly logger = new Logger(ApprovalReviewerService.name);

  constructor(
    @Inject(APPROVAL_REVIEWER_REPOSITORY)
    private readonly reviewerRepository: IApprovalReviewerRepository,
    private readonly authIntegrationService: AuthIntegrationService,
    private readonly ikuIntegrationService: IkuIntegrationService,
  ) {}

  /**
   * Create reviewer assignment(s).
   * For INDICATOR_VERIFICATION: creates one record per ikuId.
   * For BUDGET_VERIFICATION: creates a single record (ikuId = null).
   */
  async create(dto: CreateApprovalReviewerInput, token?: string): Promise<ApprovalReviewerResponseDto[]> {
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

    if (token) {
      await Promise.all([this.populateUsers(results, token), this.populateIkus(results, token)]);
    }

    return results;
  }

  /**
   * List all reviewers with optional filters.
   */
  async findAll(filters?: { level?: ApprovalLevel; ikuId?: string; userId?: string; search?: string }, token?: string): Promise<ApprovalReviewerResponseDto[]> {
    const { search, ...repositoryFilters } = filters ?? {};
    const reviewers = await this.reviewerRepository.findAll(repositoryFilters);
    const mapped = ApprovalReviewerMapper.toResponseList(reviewers);
    if (token) {
      await Promise.all([this.populateUsers(mapped, token), this.populateIkus(mapped, token)]);
    }
    const term = search?.trim().toLowerCase();
    if (!term) return mapped;
    return mapped.filter((reviewer) =>
      reviewer.user?.name?.toLowerCase().includes(term) || reviewer.iku?.name.toLowerCase().includes(term),
    );
  }

  async findUsers(
    filters?: { level?: ApprovalLevel; ikuId?: string; search?: string },
    token?: string,
  ): Promise<ApprovalReviewerUserResponseDto[]> {
    const { search, ...repositoryFilters } = filters ?? {};
    const reviewers = await this.reviewerRepository.findAll(repositoryFilters);
    const uniqueReviewers = [...new Map(reviewers.map((reviewer) => [reviewer.userId, reviewer])).values()];
    const mapped = ApprovalReviewerMapper.toResponseList(uniqueReviewers);
    if (token) await this.populateUsers(mapped, token);
    const users: ApprovalReviewerUserResponseDto[] = mapped.map((reviewer) => ({
      id: reviewer.userId,
      name: reviewer.user?.name ?? 'Unknown User',
      nip: reviewer.user?.nip,
      email: reviewer.user?.email,
      roles: reviewer.user?.roles,
    }));
    const term = search?.trim().toLowerCase();
    return term ? users.filter((user) => user.name.toLowerCase().includes(term)) : users;
  }

  /**
   * Get a single reviewer assignment by ID.
   */
  async findById(id: string, token?: string): Promise<ApprovalReviewerResponseDto> {
    const reviewer = await this.reviewerRepository.findById(id);
    if (!reviewer) throw new EntityNotFoundException('ApprovalReviewer', id);
    const mapped = ApprovalReviewerMapper.toResponse(reviewer);
    if (token) {
      await Promise.all([this.populateUsers([mapped], token), this.populateIkus([mapped], token)]);
    }
    return mapped;
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

  private async populateIkus(reviewers: ApprovalReviewerResponseDto[], token: string): Promise<void> {
    const pendingIds = new Set(reviewers.map((reviewer) => reviewer.ikuId).filter((id): id is string => !!id));
    if (pendingIds.size === 0) return;

    try {
      let page = 1;
      let totalPages = 1;
      do {
        const response = await this.ikuIntegrationService.getAllIkus(token, { page, limit: 100 });
        const ikus = new Map(response.items.map((iku) => [iku.id, iku]));
        for (const reviewer of reviewers) {
          const iku = reviewer.ikuId ? ikus.get(reviewer.ikuId) : undefined;
          if (iku) {
            reviewer.iku = iku;
            pendingIds.delete(iku.id);
          }
        }
        totalPages = response.pagination.totalPages;
        page++;
      } while (page <= totalPages && pendingIds.size > 0);
    } catch (e) {
      this.logger.warn(`Failed to fetch IKU details: ${(e as Error).message}`);
    }
  }

  private async populateUsers(reviewers: ApprovalReviewerResponseDto[], token: string): Promise<void> {
    if (reviewers.length === 0) return;
    try {
      const pendingIds = new Set(reviewers.map((reviewer) => reviewer.userId));
      let page = 1;
      let totalPages = 1;
      do {
        const response = await this.authIntegrationService.getAllUsers(token, { page, limit: 100, sortOrder: 'desc' });
        const userMap = new Map((response.items || []).map((user) => [user.id, user]));
        for (const reviewer of reviewers) {
          const user = userMap.get(reviewer.userId);
          if (user) {
            reviewer.user = { id: user.id, name: user.name, nip: user.nip, email: user.email, roles: user.roles };
            pendingIds.delete(user.id);
          }
        }
        totalPages = response.pagination?.totalPages ?? 1;
        page++;
      } while (page <= totalPages && pendingIds.size > 0);
      for (const reviewer of reviewers) {
        if (!reviewer.user) reviewer.user = { id: reviewer.userId, name: 'Unknown User' };
      }
    } catch (e) {
      this.logger.warn(`Failed to fetch user names: ${(e as Error).message}`);
      for (const r of reviewers) {
        r.user = { id: r.userId, name: 'Unknown User' };
      }
    }
  }
}
