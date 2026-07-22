import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';

import { DashboardResponseDto } from '../dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(): Promise<DashboardResponseDto> {
    const [
      totalPrograms,
      delayedActivities,
      programsByUnit,
    ] = await Promise.all([
      this.prisma.program.count(),
      this.prisma.activity.count({ where: { status: 'DELAYED' } }),
      this.prisma.programIndicator.findMany({
        select: { unitId: true, programId: true },
      }),
    ]);

    const totalBudget = 0;
    const runningPrograms = 0;
    const completedPrograms = 0;
    const completionPercentage = 0; // Temporarily 0 since status is removed

    const programsByUnitMap = new Map<string, Set<string>>();
    const indicatorsData = programsByUnit as unknown as Array<{unitId: string, programId: string}>;
    indicatorsData.forEach(ind => {
      if (!programsByUnitMap.has(ind.unitId)) {
        programsByUnitMap.set(ind.unitId, new Set());
      }
      programsByUnitMap.get(ind.unitId)!.add(ind.programId);
    });

    return {
      totalPrograms,
      runningPrograms,
      completedPrograms,
      delayedPrograms: delayedActivities,
      totalBudget,
      completionPercentage,
      programsByUnit: Array.from(programsByUnitMap.entries()).map(([unitId, programs]) => ({
        unitId,
        count: programs.size,
      })),
      programsByStatus: [],
    };
  }
}
