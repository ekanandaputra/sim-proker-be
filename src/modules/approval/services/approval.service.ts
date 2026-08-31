import { Injectable, Inject, Logger, ForbiddenException } from '@nestjs/common';
import { ApprovalStatus, ProgramStatus, ApprovalLevel, AuditAction, Document } from '@prisma/client';
import { APPROVAL_REPOSITORY, IApprovalRepository } from '../repositories/approval.repository.interface';
import { PrismaService } from '@database/prisma/prisma.service';
import { ApprovalActionDto, ApprovalMapper, ApprovalResponseDto } from '../dto/approval.dto';
import { EntityNotFoundException, InvalidStateException } from '@common/exceptions';
import { UnitService } from '../../unit/services/unit.service';
import { ApprovalReviewerService } from './approval-reviewer.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { STORAGE_SERVICE, IStorageService } from '@common/storage';
import { JwtPayload } from '@common/guards';
import { Role } from '@common/constants';
import { SetIndicatorTargetDto } from '../../program/dto/program-indicator.dto';

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(
    @Inject(APPROVAL_REPOSITORY) private readonly approvalRepository: IApprovalRepository,
    private readonly prisma: PrismaService,
    private readonly unitService: UnitService,
    private readonly reviewerService: ApprovalReviewerService,
    private readonly auditLogService: AuditLogService,
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
  ) {}

  private getDocumentUrl(document?: Document | null): string | null {
    return document ? this.storageService.getUrl(document.filePath) : null;
  }

  /**
   * Resolve the unit IDs a non-admin user is allowed to see/act on (a user can belong to multiple units).
   */
  private async getAllowedUnitIds(currentUser: JwtPayload, token?: string): Promise<string[]> {
    let allowedUnitIds = [currentUser.unitId].filter(Boolean);
    if (token) {
      try {
        const userUnits = await this.unitService.getUserUnits(currentUser.userId, token);
        if (userUnits && userUnits.length > 0) {
          allowedUnitIds = userUnits.map((u: any) => u.unitId || u.id).filter(Boolean);
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch user units: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    return allowedUnitIds;
  }

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
  async getSubmittedIndicators(token: string, query: { page?: number; limit?: number }, user: any) {
    const page = query?.page ? Number(query.page) : 1;
    const limit = query?.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where: any = {
      status: { in: [ProgramStatus.SUBMITTED, ProgramStatus.REVISION] },
    };

    const userId = user?.userId || user?.id;
    if (!userId) {
      return { items: [], pagination: { page, limit, totalItems: 0, totalPages: 0 } };
    }
    const reviewers = await this.prisma.approvalReviewer.findMany({
      where: { userId, level: ApprovalLevel.INDICATOR_VERIFICATION },
    });
    const allowedIkuIds = reviewers.map(r => r.ikuId).filter(Boolean) as string[];
    if (allowedIkuIds.length === 0) {
      return { items: [], pagination: { page, limit, totalItems: 0, totalPages: 0 } };
    }
    const defaultPrograms = await this.prisma.defaultProgram.findMany({
      where: { ikuId: { in: allowedIkuIds } },
      select: { title: true },
    });
    const allowedTitles = defaultPrograms.map(dp => dp.title);
    if (allowedTitles.length === 0) {
      return { items: [], pagination: { page, limit, totalItems: 0, totalPages: 0 } };
    }
    where.program = { title: { in: allowedTitles } };


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
   * Reset all APPROVED indicators in a given year to IN_PROGRESS.
   */
  async changeApprovedToInProgress(year: number): Promise<{ updatedCount: number }> {
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const result = await this.prisma.programIndicator.updateMany({
      where: {
        status: ProgramStatus.APPROVED,
        program: {
          year,
        },
      },
      data: {
        status: ProgramStatus.IN_PROGRESS,
      },
    });

    this.logger.log(`Changed ${result.count} APPROVED indicators to IN_PROGRESS for year ${year}`);
    return { updatedCount: result.count };
  }

  /**
   * Get indicators pending budget verification (INDICATOR_APPROVED status — waiting for Level 2).
   */
  async getIndicatorApprovedIndicators(token: string, query: { page?: number; limit?: number }, user: any) {
    const page = query?.page ? Number(query.page) : 1;
    const limit = query?.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where: any = {
      status: ProgramStatus.INDICATOR_APPROVED,
    };

    const userId = user?.userId || user?.id;
    if (!userId) {
      return { items: [], pagination: { page, limit, totalItems: 0, totalPages: 0 } };
    }
    const reviewer = await this.prisma.approvalReviewer.findFirst({
      where: { userId, level: ApprovalLevel.BUDGET_VERIFICATION },
    });
    if (!reviewer) {
      return { items: [], pagination: { page, limit, totalItems: 0, totalPages: 0 } };
    }

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
   * Get the "revision bucket" for the current user: indicators with REVISION status
   * that are assigned to the user's own unit(s) (ADMIN sees all units).
   */
  async getRevisionIndicators(token: string, query: { page?: number; limit?: number }, currentUser: JwtPayload) {
    const page = query?.page ? Number(query.page) : 1;
    const limit = query?.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where: any = { status: ProgramStatus.REVISION };

    const isAdmin = currentUser.roles?.includes(Role.ADMIN);
    if (!isAdmin) {
      const allowedUnitIds = await this.getAllowedUnitIds(currentUser, token);
      where.unitId = { in: allowedUnitIds };
    }

    const [totalItems, indicators] = await Promise.all([
      this.prisma.programIndicator.count({ where }),
      this.prisma.programIndicator.findMany({
        where,
        include: {
          program: true,
          proposalDocument: true,
          rabDocument: true,
          approvals: {
            where: { status: ApprovalStatus.REVISION },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const uniqueUnitIds = [...new Set(indicators.map(i => i.unitId).filter(Boolean))];
    const unitMap = new Map();
    for (const unitId of uniqueUnitIds) {
      try {
        unitMap.set(unitId, await this.unitService.getUnitById(unitId, token));
      } catch (err) {
        this.logger.error(`Failed to fetch unit ${unitId}`);
      }
    }

    const items = indicators.map(indicator => {
      const [lastRevision] = indicator.approvals;
      return {
        ...indicator,
        unit: unitMap.get(indicator.unitId) || null,
        proposalURL: this.getDocumentUrl(indicator.proposalDocument),
        rabURL: this.getDocumentUrl(indicator.rabDocument),
        revisionLevel: lastRevision?.level ?? null,
        revisionNote: lastRevision?.note ?? null,
        revisionRequestedAt: lastRevision?.createdAt ?? null,
      };
    });

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
   * Get the "rejected list" for the current user: indicators with REJECTED status
   * that are assigned to the user's own unit(s) (ADMIN sees all units). Read-only.
   */
  async getRejectedIndicators(token: string, query: { page?: number; limit?: number }, currentUser: JwtPayload) {
    const page = query?.page ? Number(query.page) : 1;
    const limit = query?.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where: any = { status: ProgramStatus.REJECTED };

    const isAdmin = currentUser.roles?.includes(Role.ADMIN);
    if (!isAdmin) {
      const allowedUnitIds = await this.getAllowedUnitIds(currentUser, token);
      where.unitId = { in: allowedUnitIds };
    }

    const [totalItems, indicators] = await Promise.all([
      this.prisma.programIndicator.count({ where }),
      this.prisma.programIndicator.findMany({
        where,
        include: {
          program: true,
          proposalDocument: true,
          rabDocument: true,
          approvals: {
            where: { status: ApprovalStatus.REJECTED },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const uniqueUnitIds = [...new Set(indicators.map(i => i.unitId).filter(Boolean))];
    const unitMap = new Map();
    for (const unitId of uniqueUnitIds) {
      try {
        unitMap.set(unitId, await this.unitService.getUnitById(unitId, token));
      } catch (err) {
        this.logger.error(`Failed to fetch unit ${unitId}`);
      }
    }

    const items = indicators.map(indicator => {
      const [lastRejection] = indicator.approvals;
      return {
        ...indicator,
        unit: unitMap.get(indicator.unitId) || null,
        proposalURL: this.getDocumentUrl(indicator.proposalDocument),
        rabURL: this.getDocumentUrl(indicator.rabDocument),
        rejectionLevel: lastRejection?.level ?? null,
        rejectionNote: lastRejection?.note ?? null,
        rejectedAt: lastRejection?.createdAt ?? null,
      };
    });

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
   * Revise an indicator (same payload as set-target) and resubmit it: the status is
   * reverted to whatever it was before the revision request (SUBMITTED for a Level 1
   * revision, INDICATOR_APPROVED for a Level 2 revision), so it re-enters the queue
   * at the level that asked for the revision.
   */
  async revise(indicatorId: string, dto: SetIndicatorTargetDto, currentUser: JwtPayload, token?: string) {
    const indicator = await this.prisma.programIndicator.findUnique({ where: { id: indicatorId } });
    if (!indicator) throw new EntityNotFoundException('ProgramIndicator', indicatorId);

    if (indicator.status !== ProgramStatus.REVISION) {
      throw new InvalidStateException(
        `Indicator can only be revised from REVISION status. Current: ${indicator.status}`
      );
    }

    const isAdmin = currentUser.roles?.includes(Role.ADMIN);
    if (!isAdmin) {
      const allowedUnitIds = await this.getAllowedUnitIds(currentUser, token);
      if (!allowedUnitIds.includes(indicator.unitId)) {
        throw new ForbiddenException('You are not allowed to revise an indicator outside your unit');
      }
    }

    const lastRevisionApproval = await this.prisma.approval.findFirst({
      where: { indicatorId, status: ApprovalStatus.REVISION },
      orderBy: { createdAt: 'desc' },
    });

    // Revert to the status the indicator had before this revision was requested
    const newStatus = lastRevisionApproval?.level === ApprovalLevel.BUDGET_VERIFICATION
      ? ProgramStatus.INDICATOR_APPROVED
      : ProgramStatus.SUBMITTED;

    const { propsal, rab, ...targets } = dto;

    const updated = await this.prisma.programIndicator.update({
      where: { id: indicatorId },
      data: {
        ...targets,
        proposalDocumentId: propsal,
        rabDocumentId: rab,
        status: newStatus,
      },
      include: {
        proposalDocument: true,
        rabDocument: true,
      },
    });

    await this.auditLogService.log({
      action: AuditAction.UPDATE,
      entityType: 'ProgramIndicator',
      entityId: indicatorId,
      userId: currentUser.userId,
      userName: currentUser.name,
      oldValue: indicator as unknown as Record<string, unknown>,
      newValue: updated as unknown as Record<string, unknown>,
    });

    this.logger.log(`Program Indicator ${indicatorId} revised by ${currentUser.userId}, status reverted to ${newStatus}`);

    return {
      ...updated,
      proposalURL: this.getDocumentUrl(updated.proposalDocument),
      rabURL: this.getDocumentUrl(updated.rabDocument),
    };
  }
}
