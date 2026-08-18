import { Injectable, Inject, Logger, ForbiddenException } from '@nestjs/common';
import { ApprovalStatus, ProgramStatus, ApprovalLevel } from '@prisma/client';
import { APPROVAL_REPOSITORY, IApprovalRepository } from '../repositories/approval.repository.interface';
import { PrismaService } from '@database/prisma/prisma.service';
import { ApprovalActionDto, ApprovalMapper, ApprovalResponseDto } from '../dto/approval.dto';
import { EntityNotFoundException, InvalidStateException } from '@common/exceptions';
import { UnitService } from '../../unit/services/unit.service';
import { ApprovalReviewerService } from './approval-reviewer.service';

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(
    @Inject(APPROVAL_REPOSITORY) private readonly approvalRepository: IApprovalRepository,
    private readonly prisma: PrismaService,
    private readonly unitService: UnitService,
    private readonly reviewerService: ApprovalReviewerService,
  ) {}

  /**
   * Resolve the IKU ID for a program indicator by tracing:
   * ProgramIndicator → Program (title) → DefaultProgram (ikuId)
   */
  private async resolveIkuId(indicatorId: string): Promise<string | null> {
    const indicator = await this.prisma.programIndicator.findUnique({
      where: { id: indicatorId },
      include: { program: true },
    });
    if (!indicator || !indicator.program) return null;

    // Find DefaultProgram by matching program title
    const defaultProgram = await this.prisma.defaultProgram.findFirst({
      where: { title: indicator.program.title },
    });

    return defaultProgram?.ikuId || null;
  }

  /**
   * Determine the approval level based on the current indicator status.
   */
  private determineLevel(status: ProgramStatus): ApprovalLevel {
    if (status === ProgramStatus.SUBMITTED || status === ProgramStatus.REVISION) {
      return ApprovalLevel.INDICATOR_VERIFICATION;
    }
    if (status === ProgramStatus.INDICATOR_APPROVED) {
      return ApprovalLevel.BUDGET_VERIFICATION;
    }
    throw new InvalidStateException(`Cannot determine approval level for status: ${status}`);
  }

  /**
   * Check if the user is authorized to review at the determined level.
   */
  private async assertReviewerAuthorized(userId: string, level: ApprovalLevel, indicatorId: string): Promise<void> {
    let ikuId: string | undefined;

    if (level === ApprovalLevel.INDICATOR_VERIFICATION) {
      const resolvedIkuId = await this.resolveIkuId(indicatorId);
      if (!resolvedIkuId) {
        throw new InvalidStateException('Cannot resolve IKU for this program indicator. Ensure the program has an associated DefaultProgram.');
      }
      ikuId = resolvedIkuId;
    }

    const isAuthorized = await this.reviewerService.isAuthorizedReviewer(userId, level, ikuId);
    if (!isAuthorized) {
      throw new ForbiddenException(
        `User ${userId} is not authorized as a ${level} reviewer${ikuId ? ` for IKU ${ikuId}` : ''}`
      );
    }
  }

  async approve(indicatorId: string, dto: ApprovalActionDto, userId: string): Promise<ApprovalResponseDto> {
    const indicator = await this.prisma.programIndicator.findUnique({ where: { id: indicatorId } });
    if (!indicator) throw new EntityNotFoundException('ProgramIndicator', indicatorId);

    // Determine level based on current status
    const allowedStatuses: ProgramStatus[] = [ProgramStatus.SUBMITTED, ProgramStatus.REVISION, ProgramStatus.INDICATOR_APPROVED];
    if (!allowedStatuses.includes(indicator.status)) {
      throw new InvalidStateException(
        `ProgramIndicator can only be approved from SUBMITTED, REVISION, or INDICATOR_APPROVED status. Current: ${indicator.status}`
      );
    }

    const level = this.determineLevel(indicator.status);

    // Check reviewer authorization
    await this.assertReviewerAuthorized(userId, level, indicatorId);

    // Determine new status based on level
    const newStatus = level === ApprovalLevel.INDICATOR_VERIFICATION
      ? ProgramStatus.INDICATOR_APPROVED
      : ProgramStatus.APPROVED;

    const approval = await this.approvalRepository.create({
      status: ApprovalStatus.APPROVED,
      level,
      indicator: { connect: { id: indicatorId } },
      approverId: userId,
      note: dto.note,
      approvedAt: new Date(),
    });

    // Update indicator status
    await this.prisma.programIndicator.update({
      where: { id: indicatorId },
      data: { status: newStatus },
    });

    this.logger.log(`Program Indicator ${indicatorId} approved at level ${level} by ${userId} → ${newStatus}`);
    return ApprovalMapper.toResponse(approval);
  }

  async reject(indicatorId: string, dto: ApprovalActionDto, userId: string): Promise<ApprovalResponseDto> {
    const indicator = await this.prisma.programIndicator.findUnique({ where: { id: indicatorId } });
    if (!indicator) throw new EntityNotFoundException('ProgramIndicator', indicatorId);

    const allowedStatuses: ProgramStatus[] = [ProgramStatus.SUBMITTED, ProgramStatus.REVISION, ProgramStatus.INDICATOR_APPROVED];
    if (!allowedStatuses.includes(indicator.status)) {
      throw new InvalidStateException(
        `ProgramIndicator can only be rejected from SUBMITTED, REVISION, or INDICATOR_APPROVED status. Current: ${indicator.status}`
      );
    }

    const level = this.determineLevel(indicator.status);

    // Check reviewer authorization
    await this.assertReviewerAuthorized(userId, level, indicatorId);

    const approval = await this.approvalRepository.create({
      status: ApprovalStatus.REJECTED,
      level,
      indicator: { connect: { id: indicatorId } },
      approverId: userId,
      note: dto.note,
      approvedAt: new Date(),
    });

    // Update indicator status
    await this.prisma.programIndicator.update({
      where: { id: indicatorId },
      data: { status: ProgramStatus.REJECTED },
    });

    this.logger.log(`Program Indicator ${indicatorId} rejected at level ${level} by ${userId}`);
    return ApprovalMapper.toResponse(approval);
  }

  async requestRevision(indicatorId: string, dto: ApprovalActionDto, userId: string): Promise<ApprovalResponseDto> {
    const indicator = await this.prisma.programIndicator.findUnique({ where: { id: indicatorId } });
    if (!indicator) throw new EntityNotFoundException('ProgramIndicator', indicatorId);

    const allowedStatuses: ProgramStatus[] = [ProgramStatus.SUBMITTED, ProgramStatus.INDICATOR_APPROVED];
    if (!allowedStatuses.includes(indicator.status)) {
      throw new InvalidStateException(
        `Revision can only be requested from SUBMITTED or INDICATOR_APPROVED status. Current: ${indicator.status}`
      );
    }

    const level = this.determineLevel(indicator.status);

    // Check reviewer authorization
    await this.assertReviewerAuthorized(userId, level, indicatorId);

    const approval = await this.approvalRepository.create({
      status: ApprovalStatus.REVISION,
      level,
      indicator: { connect: { id: indicatorId } },
      approverId: userId,
      note: dto.note,
    });

    // Update indicator status back to REVISION
    await this.prisma.programIndicator.update({
      where: { id: indicatorId },
      data: { status: ProgramStatus.REVISION },
    });

    this.logger.log(`Program Indicator ${indicatorId} revision requested at level ${level} by ${userId}`);
    return ApprovalMapper.toResponse(approval);
  }

  /**
   * Get indicators pending verification (SUBMITTED / REVISION status — waiting for Level 1).
   */
  async getSubmittedIndicators(token: string, query: { page?: number; limit?: number }) {
    const page = query?.page ? Number(query.page) : 1;
    const limit = query?.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where = {
      status: { in: [ProgramStatus.SUBMITTED, ProgramStatus.REVISION] },
    };

    const [totalItems, indicators] = await Promise.all([
      this.prisma.programIndicator.count({ where }),
      this.prisma.programIndicator.findMany({
        where,
        include: { program: true },
        skip,
        take: limit,
      }),
    ]);

    const uniqueUnitIds = [...new Set(indicators.map(i => i.unitId).filter(Boolean))];
    const unitMap = new Map();

    for (const unitId of uniqueUnitIds) {
      try {
        const unitInfo = await this.unitService.getUnitById(unitId, token);
        unitMap.set(unitId, unitInfo);
      } catch (err) {
        this.logger.error(`Failed to fetch unit ${unitId}`);
      }
    }

    const items = indicators.map(indicator => ({
      ...indicator,
      unit: unitMap.get(indicator.unitId) || null,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  /**
   * Get indicators pending budget verification (INDICATOR_APPROVED status — waiting for Level 2).
   */
  async getIndicatorApprovedIndicators(token: string, query: { page?: number; limit?: number }) {
    const page = query?.page ? Number(query.page) : 1;
    const limit = query?.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where = {
      status: ProgramStatus.INDICATOR_APPROVED,
    };

    const [totalItems, indicators] = await Promise.all([
      this.prisma.programIndicator.count({ where }),
      this.prisma.programIndicator.findMany({
        where,
        include: { program: true },
        skip,
        take: limit,
      }),
    ]);

    const uniqueUnitIds = [...new Set(indicators.map(i => i.unitId).filter(Boolean))];
    const unitMap = new Map();

    for (const unitId of uniqueUnitIds) {
      try {
        const unitInfo = await this.unitService.getUnitById(unitId, token);
        unitMap.set(unitId, unitInfo);
      } catch (err) {
        this.logger.error(`Failed to fetch unit ${unitId}`);
      }
    }

    const items = indicators.map(indicator => ({
      ...indicator,
      unit: unitMap.get(indicator.unitId) || null,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }
}
