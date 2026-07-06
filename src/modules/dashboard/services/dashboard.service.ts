import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { ProgramStatus } from '@prisma/client';
import { DashboardResponseDto } from '../dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(): Promise<DashboardResponseDto> {
    const [
      totalPrograms,
      runningPrograms,
      completedPrograms,
      delayedActivities,
      budgetResult,
      programsByStatus,
      programsByUnit,
    ] = await Promise.all([
      this.prisma.program.count(),
      this.prisma.program.count({ where: { status: ProgramStatus.IN_PROGRESS } }),
      this.prisma.program.count({ where: { status: ProgramStatus.COMPLETED } }),
      this.prisma.activity.count({ where: { status: 'DELAYED' } }),
      this.prisma.program.aggregate({ _sum: { budget: true } }),
      this.prisma.program.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.program.groupBy({
        by: ['unitId'],
        _count: { _all: true },
      }),
    ]);

    const totalBudget = Number(budgetResult._sum.budget ?? 0);
    const completionPercentage =
      totalPrograms > 0 ? Math.round((completedPrograms / totalPrograms) * 10000) / 100 : 0;

    return {
      totalPrograms,
      runningPrograms,
      completedPrograms,
      delayedPrograms: delayedActivities,
      totalBudget,
      completionPercentage,
      programsByUnit: programsByUnit.map((g) => ({
        unitId: g.unitId,
        count: g._count._all,
      })),
      programsByStatus: programsByStatus.map((g) => ({
        status: g.status,
        count: g._count._all,
      })),
    };
  }
}
