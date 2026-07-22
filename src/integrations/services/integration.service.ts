import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { EntityNotFoundException } from '@common/exceptions';
import {
  IntegrationProgramDto,
  IntegrationOutputDto,
  IntegrationProgressDto,
  ProgramOutputsDto,
} from '../dto/integration.dto';

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  async getPrograms(prisma: PrismaService): Promise<IntegrationProgramDto[]> {
    const programs = await prisma.program.findMany({
      orderBy: { createdAt: 'desc' },
      include: { indicators: true },
    });

    return programs.map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      year: p.year,
      unitId: p.indicators[0]?.unitId ?? null,
    }));
  }

  async getProgramById(prisma: PrismaService, id: string): Promise<IntegrationProgramDto> {
    const p = await prisma.program.findUnique({ where: { id }, include: { indicators: true } });
    if (!p) throw new EntityNotFoundException('Program', id);

    return {
      id: p.id, code: p.code, title: p.title,
      year: p.year, unitId: p.indicators[0]?.unitId ?? null,
    };
  }

  async getProgramOutputs(prisma: PrismaService, programId: string): Promise<IntegrationOutputDto[]> {
    const outputs = await prisma.output.findMany({
      where: { activity: { programId } },
    });

    return outputs.map((o) => ({
      id: o.id, activityId: o.activityId, metricType: o.metricType,
      target: Number(o.target), realization: Number(o.realization),
      unit: o.unit, description: o.description,
    }));
  }

  async getProgramProgress(prisma: PrismaService, programId: string): Promise<IntegrationProgressDto[]> {
    const logs = await prisma.progressLog.findMany({
      where: { activity: { programId } },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((l) => ({
      id: l.id, activityId: l.activityId, progress: l.progress,
      note: l.note, createdAt: l.createdAt,
    }));
  }

  async queryOutputsByProgramIds(prisma: PrismaService, programIds: string[]): Promise<ProgramOutputsDto[]> {
    const outputs = await prisma.output.findMany({
      where: { activity: { programId: { in: programIds } } },
      include: { activity: { select: { programId: true } } },
    });

    // Group by programId
    const grouped = new Map<string, IntegrationOutputDto[]>();
    for (const programId of programIds) {
      grouped.set(programId, []);
    }

    for (const o of outputs) {
      const programId = o.activity.programId;
      const list = grouped.get(programId) ?? [];
      list.push({
        id: o.id, activityId: o.activityId, metricType: o.metricType,
        target: Number(o.target), realization: Number(o.realization),
        unit: o.unit, description: o.description,
      });
      grouped.set(programId, list);
    }

    return Array.from(grouped.entries()).map(([programId, outs]) => ({
      programId,
      outputs: outs,
    }));
  }
}
