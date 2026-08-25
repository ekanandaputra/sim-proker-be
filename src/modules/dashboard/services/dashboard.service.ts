import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';

import { AdminDashboardResponseDto, UnitDashboardResponseDto } from '../dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAdminDashboard(year?: number): Promise<AdminDashboardResponseDto> {
    const masterBudget = await this.getMasterBudget(year);

    const [
      totalPrograms,
      totalIndicators,
      totalActivities,
      indicatorsGrouped,
      indicators,
    ] = await Promise.all([
      this.prisma.program.count(),
      this.prisma.programIndicator.count(),
      this.prisma.activity.count(),
      this.prisma.programIndicator.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      }),
      this.prisma.programIndicator.findMany({
        select: { unitId: true, programId: true },
      }),
    ]);

    const indicatorsByStatus = indicatorsGrouped.map((group) => ({
      status: group.status,
      count: group._count.id,
    }));

    const programsByUnitMap = new Map<string, Set<string>>();
    indicators.forEach(ind => {
      if (!programsByUnitMap.has(ind.unitId)) {
        programsByUnitMap.set(ind.unitId, new Set());
      }
      programsByUnitMap.get(ind.unitId)!.add(ind.programId);
    });

    const programsByUnit = Array.from(programsByUnitMap.entries()).map(([unitId, programs]) => ({
      unitId,
      count: programs.size,
    }));

    return {
      totalPrograms,
      totalIndicators,
      totalActivities,
      indicatorsByStatus,
      programsByUnit,
      masterBudget,
    };
  }

  async getUnitDashboard(unitId: string, year?: number): Promise<UnitDashboardResponseDto> {
    const masterBudget = await this.getMasterBudget(year);

    const [
      indicatorsGrouped,
      indicators,
    ] = await Promise.all([
      this.prisma.programIndicator.groupBy({
        by: ['status'],
        where: { unitId },
        _count: {
          id: true,
        },
      }),
      this.prisma.programIndicator.findMany({
        where: { unitId },
        select: { programId: true },
      }),
    ]);

    const totalIndicators = indicators.length;
    const uniquePrograms = new Set(indicators.map(ind => ind.programId));
    const totalPrograms = uniquePrograms.size;

    const indicatorsByStatus = indicatorsGrouped.map((group) => ({
      status: group.status,
      count: group._count.id,
    }));

    return {
      totalPrograms,
      totalIndicators,
      indicatorsByStatus,
      masterBudget,
    };
  }

  private async getMasterBudget(year?: number) {
    if (!year) return undefined;
    const budget = await this.prisma.masterBudget.findUnique({ where: { year } });
    if (!budget) return null;
    return {
      ...budget,
      budget: Number(budget.budget),
      realization: Number(budget.realization),
    };
  }
}
