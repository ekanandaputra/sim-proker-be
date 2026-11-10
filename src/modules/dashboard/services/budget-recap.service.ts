import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, ProgramStatus } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { STORAGE_SERVICE, IStorageService } from '@common/storage';
import { UnitService } from '../../unit/services/unit.service';
import { AuthIntegrationService } from '../../external/auth-integration/services/auth-integration.service';
import { UnitBudgetProposalService } from '../../unit-budget-proposal/services/unit-budget-proposal.service';
import {
  BudgetRecapIndicatorDto,
  BudgetRecapQuery,
  BudgetRecapResponseDto,
  BudgetRecapStatusDto,
  BudgetRecapUnitDto,
} from '../dto/budget-recap.dto';

const PAGE_LIMIT = 100;

interface UnitInfo {
  name: string;
  code: string | null;
}

@Injectable()
export class BudgetRecapService {
  private readonly logger = new Logger(BudgetRecapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly unitService: UnitService,
    private readonly authIntegrationService: AuthIntegrationService,
    private readonly unitBudgetProposalService: UnitBudgetProposalService,
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
  ) {}

  /**
   * Budget recap of program indicators (only those with a budget > 0) for one year. ADMIN sees every unit; other roles only the
   * units they belong to. Unit and PIC names come from the Auth Service and fall back to IDs.
   */
  async getRecap(
    query: BudgetRecapQuery,
    currentUser: JwtPayload,
    token: string,
  ): Promise<BudgetRecapResponseDto> {
    const { year, unitId, category, status } = query;
    const allowedUnitIds = await this.unitBudgetProposalService.getAllowedUnitIds(
      currentUser,
      token,
    );

    // Only indicators with a filled, non-zero budget are part of the recap.
    const where: Prisma.ProgramIndicatorWhereInput = { program: { year }, budget: { gt: 0 } };
    if (category) where.category = category;
    if (status) where.status = status;
    if (allowedUnitIds) {
      where.unitId =
        unitId !== undefined
          ? allowedUnitIds.includes(unitId)
            ? unitId
            : { in: [] }
          : { in: allowedUnitIds };
    } else if (unitId) {
      where.unitId = unitId;
    }

    const indicators = await this.prisma.programIndicator.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        budget: true,
        unitId: true,
        programId: true,
        updatedAt: true,
        program: { select: { id: true, code: true, title: true } },
        pics: { select: { userId: true } },
        rabDocument: { select: { filePath: true } },
      },
      orderBy: [{ budget: 'desc' }, { name: 'asc' }],
    });

    const [units, picNames] = await Promise.all([
      indicators.length > 0 ? this.getUnits(token) : new Map<string, UnitInfo>(),
      this.getUserNames(new Set(indicators.flatMap((i) => i.pics.map((p) => p.userId))), token),
    ]);
    const unitInfo = (id: string): UnitInfo => units.get(id) ?? { name: id, code: null };

    const indicatorRows: BudgetRecapIndicatorDto[] = indicators.map((ind) => {
      const unit = unitInfo(ind.unitId);
      return {
        id: ind.id,
        name: ind.name,
        category: ind.category,
        status: ind.status,
        budget: ind.budget ? Number(ind.budget) : 0,
        unitId: ind.unitId,
        unitName: unit.name,
        unitCode: unit.code,
        program: ind.program,
        pics: ind.pics.map((p) => ({ id: p.userId, name: picNames.get(p.userId) ?? p.userId })),
        rabURL: ind.rabDocument ? this.storageService.getUrl(ind.rabDocument.filePath) : null,
        updatedAt: ind.updatedAt,
      };
    });

    const unitRows = new Map<string, BudgetRecapUnitDto & { programIds: Set<string> }>();
    const statusCounts = new Map<ProgramStatus, number>();
    for (const [i, row] of indicatorRows.entries()) {
      statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);

      let unitRow = unitRows.get(row.unitId);
      if (!unitRow) {
        unitRow = {
          unitId: row.unitId,
          unitName: row.unitName,
          unitCode: row.unitCode,
          indicatorCount: 0,
          programCount: 0,
          totalBudget: 0,
          programIds: new Set(),
        };
        unitRows.set(row.unitId, unitRow);
      }
      unitRow.indicatorCount++;
      unitRow.totalBudget += row.budget;
      unitRow.programIds.add(indicators[i].programId);
    }

    const totalIndicators = indicatorRows.length;
    const statusBreakdown: BudgetRecapStatusDto[] = [...statusCounts.entries()]
      .map(([s, count]) => ({
        status: s,
        count,
        percentage: Math.round((count / totalIndicators) * 10000) / 100,
      }))
      .sort((a, b) => b.count - a.count);

    const unitList: BudgetRecapUnitDto[] = [...unitRows.values()]
      .map(({ programIds, ...row }) => ({ ...row, programCount: programIds.size }))
      .sort((a, b) => b.totalBudget - a.totalBudget || a.unitName.localeCompare(b.unitName));

    return {
      year,
      summary: {
        totalBudget: indicatorRows.reduce((sum, r) => sum + r.budget, 0),
        totalIndicators,
        totalUnits: unitList.length,
        totalPrograms: new Set(indicators.map((i) => i.programId)).size,
      },
      statusBreakdown,
      units: unitList,
      indicators: indicatorRows,
    };
  }

  /** Map of unit ID → name/code across every page of the Auth Service. Empty on failure. */
  private async getUnits(token: string): Promise<Map<string, UnitInfo>> {
    const units = new Map<string, UnitInfo>();
    try {
      let page = 1;
      let totalPages = 1;
      do {
        const response = await this.unitService.getUnits(token, { page, limit: PAGE_LIMIT });
        for (const unit of response.items ?? []) {
          const id = unit.id ?? unit.unitId;
          const name = unit.name ?? unit.unitName;
          if (id && name) units.set(id, { name, code: unit.code ?? unit.unitCode ?? null });
        }
        totalPages = response.pagination?.totalPages ?? 1;
        page++;
      } while (page <= totalPages);
    } catch (err) {
      this.logger.warn(
        `Failed to fetch units: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
    return units;
  }

  /** Resolves user names for the given IDs, paging the Auth Service until all are found. */
  private async getUserNames(ids: Set<string>, token: string): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    const unresolved = new Set(ids);
    if (unresolved.size === 0) return names;
    try {
      let page = 1;
      let totalPages = 1;
      do {
        const response = await this.authIntegrationService.getAllUsers(token, {
          page,
          limit: PAGE_LIMIT,
          sortOrder: 'desc',
        });
        for (const user of response.items) {
          if (unresolved.delete(user.id)) names.set(user.id, user.name || user.id);
        }
        totalPages = response.pagination.totalPages;
        page++;
      } while (page <= totalPages && unresolved.size > 0);
    } catch (err) {
      this.logger.warn(
        `Failed to fetch PIC names: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
    return names;
  }
}
