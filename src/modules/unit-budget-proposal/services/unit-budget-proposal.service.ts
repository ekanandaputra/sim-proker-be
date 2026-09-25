import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import {
  EntityNotFoundException,
  BusinessException,
  ForbiddenActionException,
} from '@common/exceptions';
import { PaginatedResponse } from '@common/dto/pagination.dto';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { Role } from '@common/constants';
import { STORAGE_SERVICE, IStorageService } from '@common/storage';
import { AuditAction, Document, Prisma } from '@prisma/client';
import { UnitService } from '../../unit/services/unit.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
  UNIT_BUDGET_PROPOSAL_KINDS,
  UnitBudgetProposalQuery,
  UnitBudgetProposalResponseDto,
  UpsertUnitBudgetProposalDto,
} from '../dto/unit-budget-proposal.dto';

const DOCUMENT_INCLUDE = {
  perbaikanDocument: true,
  bahanHabisDocument: true,
  peralatanDocument: true,
  pelatihanDocument: true,
  meubelairDocument: true,
} satisfies Prisma.UnitBudgetProposalInclude;

type UnitBudgetProposalWithDocuments = Prisma.UnitBudgetProposalGetPayload<{
  include: typeof DOCUMENT_INCLUDE;
}>;

@Injectable()
export class UnitBudgetProposalService {
  private readonly logger = new Logger(UnitBudgetProposalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly unitService: UnitService,
    private readonly auditLogService: AuditLogService,
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
  ) {}

  private getDocumentUrl(document?: Document | null): string | null {
    return document ? this.storageService.getUrl(document.filePath) : null;
  }

  private toNumber(value: Prisma.Decimal | null): number | null {
    return value === null ? null : Number(value);
  }

  private mapToDto(proposal: UnitBudgetProposalWithDocuments): UnitBudgetProposalResponseDto {
    const values = UNIT_BUDGET_PROPOSAL_KINDS.map((kind) =>
      this.toNumber(proposal[`${kind}Value`]),
    );

    return {
      id: proposal.id,
      unitId: proposal.unitId,
      year: proposal.year,
      perbaikanDocumentId: proposal.perbaikanDocumentId,
      perbaikanURL: this.getDocumentUrl(proposal.perbaikanDocument),
      perbaikanValue: this.toNumber(proposal.perbaikanValue),
      bahanHabisDocumentId: proposal.bahanHabisDocumentId,
      bahanHabisURL: this.getDocumentUrl(proposal.bahanHabisDocument),
      bahanHabisValue: this.toNumber(proposal.bahanHabisValue),
      peralatanDocumentId: proposal.peralatanDocumentId,
      peralatanURL: this.getDocumentUrl(proposal.peralatanDocument),
      peralatanValue: this.toNumber(proposal.peralatanValue),
      pelatihanDocumentId: proposal.pelatihanDocumentId,
      pelatihanURL: this.getDocumentUrl(proposal.pelatihanDocument),
      pelatihanValue: this.toNumber(proposal.pelatihanValue),
      meubelairDocumentId: proposal.meubelairDocumentId,
      meubelairURL: this.getDocumentUrl(proposal.meubelairDocument),
      meubelairValue: this.toNumber(proposal.meubelairValue),
      totalValue: values.reduce<number>((sum, v) => sum + (v ?? 0), 0),
      createdBy: proposal.createdBy,
      updatedBy: proposal.updatedBy,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
    };
  }

  /** Returns null for ADMIN (all units allowed), otherwise the unit IDs the user belongs to. */
  private async getAllowedUnitIds(
    currentUser: JwtPayload,
    token?: string,
  ): Promise<string[] | null> {
    if (currentUser.roles?.includes(Role.ADMIN)) return null;

    let allowedUnitIds = [currentUser.unitId].filter(Boolean);
    if (token) {
      try {
        const userUnits = await this.unitService.getUserUnits(currentUser.userId, token);
        if (userUnits && userUnits.length > 0) {
          allowedUnitIds = userUnits
            .map((u: { unitId?: string; id?: string }) => u.unitId || u.id)
            .filter((id): id is string => Boolean(id));
        }
      } catch (err) {
        this.logger.warn(
          `Failed to fetch user units: ${err instanceof Error ? err.message : 'Unknown error'}`,
        );
      }
    }
    return allowedUnitIds;
  }

  private async assertUnitAccess(unitId: string, currentUser: JwtPayload, token?: string) {
    const allowedUnitIds = await this.getAllowedUnitIds(currentUser, token);
    if (allowedUnitIds && !allowedUnitIds.includes(unitId)) {
      throw new ForbiddenActionException('You do not have access to this unit');
    }
  }

  private async assertDocumentsExist(dto: UpsertUnitBudgetProposalDto) {
    const ids = UNIT_BUDGET_PROPOSAL_KINDS.map((kind) => dto[`${kind}DocumentId`]).filter(
      (id): id is string => typeof id === 'string',
    );
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return;

    const found = await this.prisma.document.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((d) => d.id));
    const missing = uniqueIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new BusinessException(`Document(s) not found: ${missing.join(', ')}`);
    }
  }

  async findAll(
    query: UnitBudgetProposalQuery,
    currentUser: JwtPayload,
    token?: string,
  ): Promise<PaginatedResponse<UnitBudgetProposalResponseDto>> {
    const { page, limit, year, unitId } = query;
    const allowedUnitIds = await this.getAllowedUnitIds(currentUser, token);

    const where: Prisma.UnitBudgetProposalWhereInput = {};
    if (year) where.year = year;
    if (allowedUnitIds) {
      where.unitId = unitId
        ? allowedUnitIds.includes(unitId)
          ? unitId
          : { in: [] }
        : { in: allowedUnitIds };
    } else if (unitId) {
      where.unitId = unitId;
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.unitBudgetProposal.findMany({
        where,
        include: DOCUMENT_INCLUDE,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ year: 'desc' }, { unitId: 'asc' }],
      }),
      this.prisma.unitBudgetProposal.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapToDto(item)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findByUnitAndYear(unitId: string, year: number, currentUser: JwtPayload, token?: string) {
    await this.assertUnitAccess(unitId, currentUser, token);

    const proposal = await this.prisma.unitBudgetProposal.findUnique({
      where: { unitId_year: { unitId, year } },
      include: DOCUMENT_INCLUDE,
    });
    if (!proposal) {
      throw new EntityNotFoundException('UnitBudgetProposal', `${unitId}/${year}`);
    }
    return this.mapToDto(proposal);
  }

  async upsert(
    unitId: string,
    year: number,
    dto: UpsertUnitBudgetProposalDto,
    currentUser: JwtPayload,
    token?: string,
  ) {
    await this.assertUnitAccess(unitId, currentUser, token);
    await this.assertDocumentsExist(dto);

    const existing = await this.prisma.unitBudgetProposal.findUnique({
      where: { unitId_year: { unitId, year } },
    });

    const proposal = await this.prisma.unitBudgetProposal.upsert({
      where: { unitId_year: { unitId, year } },
      create: { ...dto, unitId, year, createdBy: currentUser.userId },
      update: { ...dto, updatedBy: currentUser.userId },
      include: DOCUMENT_INCLUDE,
    });

    await this.auditLogService.log({
      action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
      entityType: 'UnitBudgetProposal',
      entityId: proposal.id,
      userId: currentUser.userId,
      userName: currentUser.name,
      oldValue: (existing ?? undefined) as unknown as Record<string, unknown> | undefined,
      newValue: proposal as unknown as Record<string, unknown>,
    });

    return this.mapToDto(proposal);
  }

  async remove(unitId: string, year: number, currentUser: JwtPayload) {
    const existing = await this.prisma.unitBudgetProposal.findUnique({
      where: { unitId_year: { unitId, year } },
    });
    if (!existing) {
      throw new EntityNotFoundException('UnitBudgetProposal', `${unitId}/${year}`);
    }

    await this.prisma.unitBudgetProposal.delete({ where: { id: existing.id } });

    await this.auditLogService.log({
      action: AuditAction.DELETE,
      entityType: 'UnitBudgetProposal',
      entityId: existing.id,
      userId: currentUser.userId,
      userName: currentUser.name,
      oldValue: existing as unknown as Record<string, unknown>,
    });
  }
}
