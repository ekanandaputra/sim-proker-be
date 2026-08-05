import { Injectable, Inject, Logger } from '@nestjs/common';
import { ApprovalStatus, ProgramStatus } from '@prisma/client';
import { APPROVAL_REPOSITORY, IApprovalRepository } from '../repositories/approval.repository.interface';
import { PrismaService } from '@database/prisma/prisma.service';
import { ApprovalActionDto, ApprovalMapper, ApprovalResponseDto } from '../dto/approval.dto';
import { EntityNotFoundException, InvalidStateException } from '@common/exceptions';
import { UnitService } from '../../unit/services/unit.service';

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(
    @Inject(APPROVAL_REPOSITORY) private readonly approvalRepository: IApprovalRepository,
    private readonly prisma: PrismaService,
    private readonly unitService: UnitService,
  ) {}

  async approve(indicatorId: string, dto: ApprovalActionDto, userId: string): Promise<ApprovalResponseDto> {
    const indicator = await this.prisma.programIndicator.findUnique({ where: { id: indicatorId } });
    if (!indicator) throw new EntityNotFoundException('ProgramIndicator', indicatorId);

    if (indicator.status !== ProgramStatus.SUBMITTED && indicator.status !== ProgramStatus.REVISION) {
      throw new InvalidStateException(`ProgramIndicator can only be approved from SUBMITTED or REVISION status. Current: ${indicator.status}`);
    }

    const approval = await this.approvalRepository.create({
      status: ApprovalStatus.APPROVED,
      level: 1, // level might need logic if there are multiple levels
      indicator: { connect: { id: indicatorId } },
      approverId: userId,
      note: dto.note,
      approvedAt: new Date(),
    });

    // Update indicator status
    await this.prisma.programIndicator.update({
      where: { id: indicatorId },
      data: { status: ProgramStatus.APPROVED }
    });

    this.logger.log(`Program Indicator ${indicatorId} approved by ${userId}`);
    return ApprovalMapper.toResponse(approval);
  }

  async reject(indicatorId: string, dto: ApprovalActionDto, userId: string): Promise<ApprovalResponseDto> {
    const indicator = await this.prisma.programIndicator.findUnique({ where: { id: indicatorId } });
    if (!indicator) throw new EntityNotFoundException('ProgramIndicator', indicatorId);

    if (indicator.status !== ProgramStatus.SUBMITTED && indicator.status !== ProgramStatus.REVISION) {
      throw new InvalidStateException(`ProgramIndicator can only be rejected from SUBMITTED or REVISION status. Current: ${indicator.status}`);
    }

    const approval = await this.approvalRepository.create({
      status: ApprovalStatus.REJECTED,
      level: 1,
      indicator: { connect: { id: indicatorId } },
      approverId: userId,
      note: dto.note,
      approvedAt: new Date(),
    });

    // Update indicator status
    await this.prisma.programIndicator.update({
      where: { id: indicatorId },
      data: { status: ProgramStatus.REJECTED }
    });

    this.logger.log(`Program Indicator ${indicatorId} rejected by ${userId}`);
    return ApprovalMapper.toResponse(approval);
  }

  async requestRevision(indicatorId: string, dto: ApprovalActionDto, userId: string): Promise<ApprovalResponseDto> {
    const indicator = await this.prisma.programIndicator.findUnique({ where: { id: indicatorId } });
    if (!indicator) throw new EntityNotFoundException('ProgramIndicator', indicatorId);

    if (indicator.status !== ProgramStatus.SUBMITTED) {
      throw new InvalidStateException(`Revision can only be requested from SUBMITTED status. Current: ${indicator.status}`);
    }

    const approval = await this.approvalRepository.create({
      status: ApprovalStatus.REVISION,
      level: 1,
      indicator: { connect: { id: indicatorId } },
      approverId: userId,
      note: dto.note,
    });

    // Update indicator status
    await this.prisma.programIndicator.update({
      where: { id: indicatorId },
      data: { status: ProgramStatus.REVISION }
    });

    this.logger.log(`Program Indicator ${indicatorId} revision requested by ${userId}`);
    return ApprovalMapper.toResponse(approval);
  }

  async getSubmittedIndicators(token: string, query: { page?: number; limit?: number }) {
    const page = query?.page ? Number(query.page) : 1;
    const limit = query?.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [totalItems, indicators] = await Promise.all([
      this.prisma.programIndicator.count({
        where: { status: ProgramStatus.SUBMITTED },
      }),
      this.prisma.programIndicator.findMany({
        where: { status: ProgramStatus.SUBMITTED },
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
