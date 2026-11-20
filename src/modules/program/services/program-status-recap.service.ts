import { Injectable, Logger } from '@nestjs/common';
import { Prisma, ProgramStatus } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { ACTIVE_PROGRAM_STATUSES, Role } from '@common/constants';
import { UnitService } from '../../unit/services/unit.service';
import {
  ProgramStatusCountDto,
  ProgramStatusRecapQuery,
  ProgramStatusRecapResponseDto,
  ProgramStatusRecapRowDto,
  ProgramStatusSummaryDto,
} from '../dto/program-status-recap.dto';

const UNIT_PAGE_LIMIT = 100;
const STATUSES: readonly ProgramStatus[] = ACTIVE_PROGRAM_STATUSES;

type Counts = Map<ProgramStatus, number>;
/** status → unit ID → indicator count */
type UnitCounts = Map<ProgramStatus, Map<string, number>>;

export interface UnprocessedIndicator {
  unitId: string;
  name: string;
  createdAt: Date;
  program: { code: string; title: string; year: number };
}

const toStatusList = (counts: Counts): ProgramStatusCountDto[] =>
  STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 }));

const sum = (counts: Counts) => [...counts.values()].reduce((s, n) => s + n, 0);

const increment = (counts: Counts, status: ProgramStatus) =>
  counts.set(status, (counts.get(status) ?? 0) + 1);

const incrementUnit = (unitCounts: UnitCounts, status: ProgramStatus, unitId: string) => {
  const perUnit = unitCounts.get(status) ?? new Map<string, number>();
  perUnit.set(unitId, (perUnit.get(unitId) ?? 0) + 1);
  unitCounts.set(status, perUnit);
};

const toSummaryList = (
  counts: Counts,
  unitCounts: UnitCounts,
  unitNames: Map<string, string>,
): ProgramStatusSummaryDto[] =>
  STATUSES.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
    units: [...(unitCounts.get(status) ?? new Map<string, number>()).entries()]
      .map(([unitId, count]) => ({ unitId, unitName: unitNames.get(unitId) ?? unitId, count }))
      .sort((a, b) => b.count - a.count || a.unitName.localeCompare(b.unitName)),
  }));

@Injectable()
export class ProgramStatusRecapService {
  private readonly logger = new Logger(ProgramStatusRecapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly unitService: UnitService,
  ) {}

  /**
   * Counts program indicators (a program assigned to a unit) per status, per unit and per year.
   * ADMIN sees every unit; other roles only the units they belong to.
   */
  async getRecap(
    query: ProgramStatusRecapQuery,
    currentUser: JwtPayload,
    token: string,
  ): Promise<ProgramStatusRecapResponseDto> {
    const where = await this.buildWhere(query, currentUser, token);

    const indicators = await this.prisma.programIndicator.findMany({
      where,
      select: { unitId: true, status: true, program: { select: { year: true } } },
    });

    const overall: Counts = new Map();
    const overallUnits: UnitCounts = new Map();
    const perYear = new Map<number, { counts: Counts; units: UnitCounts }>();
    const perUnitYear = new Map<string, { unitId: string; year: number; counts: Counts }>();

    for (const { unitId: indicatorUnitId, status, program } of indicators) {
      increment(overall, status);
      incrementUnit(overallUnits, status, indicatorUnitId);

      const yearRow = perYear.get(program.year) ?? { counts: new Map(), units: new Map() };
      increment(yearRow.counts, status);
      incrementUnit(yearRow.units, status, indicatorUnitId);
      perYear.set(program.year, yearRow);

      const key = `${indicatorUnitId}|${program.year}`;
      const row = perUnitYear.get(key) ?? {
        unitId: indicatorUnitId,
        year: program.year,
        counts: new Map(),
      };
      increment(row.counts, status);
      perUnitYear.set(key, row);
    }

    const unitNames =
      indicators.length > 0 ? await this.getUnitNames(token) : new Map<string, string>();

    const units: ProgramStatusRecapRowDto[] = [...perUnitYear.values()]
      .map((row) => ({
        unitId: row.unitId,
        unitName: unitNames.get(row.unitId) ?? row.unitId,
        year: row.year,
        total: sum(row.counts),
        statuses: toStatusList(row.counts),
      }))
      .sort((a, b) => a.year - b.year || a.unitName.localeCompare(b.unitName));

    return {
      total: indicators.length,
      statuses: toSummaryList(overall, overallUnits, unitNames),
      years: [...perYear.entries()]
        .sort(([a], [b]) => a - b)
        .map(([y, row]) => ({
          year: y,
          total: sum(row.counts),
          statuses: toSummaryList(row.counts, row.units, unitNames),
        })),
      units,
    };
  }

  /**
   * Indicators still in ASSIGNED_TO_UNIT, i.e. programs given to a unit that the unit has not
   * processed yet. Same filter and access rules as getRecap.
   */
  async findUnprocessed(
    query: ProgramStatusRecapQuery,
    currentUser: JwtPayload,
    token: string,
  ): Promise<UnprocessedIndicator[]> {
    const where = await this.buildWhere(query, currentUser, token);
    return this.prisma.programIndicator.findMany({
      where: { ...where, status: ProgramStatus.ASSIGNED_TO_UNIT },
      select: {
        unitId: true,
        name: true,
        createdAt: true,
        program: { select: { code: true, title: true, year: true } },
      },
      orderBy: [{ program: { year: 'asc' } }, { program: { code: 'asc' } }],
    });
  }

  private async buildWhere(
    query: ProgramStatusRecapQuery,
    currentUser: JwtPayload,
    token: string,
  ): Promise<Prisma.ProgramIndicatorWhereInput> {
    const { year, unitId } = query;
    const allowedUnitIds = await this.getAllowedUnitIds(currentUser, token);

    const where: Prisma.ProgramIndicatorWhereInput = { status: { in: [...STATUSES] } };
    if (year) where.program = { year };
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
    return where;
  }

  /** null for ADMIN (all units), otherwise the unit IDs the user belongs to. */
  private async getAllowedUnitIds(
    currentUser: JwtPayload,
    token: string,
  ): Promise<string[] | null> {
    if (currentUser.roles?.includes(Role.ADMIN)) return null;

    let allowedUnitIds = [currentUser.unitId].filter((id): id is string => Boolean(id));
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

  /** Map of unit ID → unit name across every page of the Auth Service. Empty on failure. */
  private async getUnitNames(token: string): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    try {
      let page = 1;
      let totalPages = 1;
      do {
        const response = await this.unitService.getUnits(token, { page, limit: UNIT_PAGE_LIMIT });
        for (const unit of response.items ?? []) {
          const id = unit.id ?? unit.unitId;
          const name = unit.name ?? unit.unitName;
          if (id && name) names.set(id, name);
        }
        totalPages = response.pagination?.totalPages ?? 1;
        page++;
      } while (page <= totalPages);
    } catch (err) {
      this.logger.warn(
        `Failed to fetch unit names: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
    return names;
  }
}
