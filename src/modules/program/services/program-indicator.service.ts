import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { EntityNotFoundException } from '@common/exceptions';
import { CreateProgramIndicatorDto, UpdateProgramIndicatorDto, SetIndicatorTargetDto } from '../dto/program-indicator.dto';
import { CreateProgramIndicatorRealizationDto } from '../dto/program-indicator-realization.dto';
import { UnitService } from '../../unit/services/unit.service';

@Injectable()
export class ProgramIndicatorService {
  private readonly logger = new Logger(ProgramIndicatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly unitService: UnitService,
  ) {}

  async findAllByProgramId(programId: string, token: string) {
    const indicators = await this.prisma.programIndicator.findMany({
      where: { programId },
      orderBy: { order: 'asc' },
    });

    // Fetch unit info for all unique unitIds
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
    
    return indicators.map(indicator => ({
      ...indicator,
      unit: unitMap.get(indicator.unitId) || null,
      unit_measurement: indicator.unit, // preserve the original unit measurement string if needed, although user wants 'property unit'
    }));
  }

  async create(programId: string, dto: CreateProgramIndicatorDto) {
    // Check if program exists
    const program = await this.prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
      throw new EntityNotFoundException('Program', programId);
    }

    return this.prisma.programIndicator.create({
      data: {
        ...dto,
        programId,
      },
    });
  }

  async update(programId: string, id: string, dto: UpdateProgramIndicatorDto) {
    const indicator = await this.prisma.programIndicator.findFirst({
      where: { id, programId },
    });
    if (!indicator) {
      throw new EntityNotFoundException('ProgramIndicator', id);
    }

    return this.prisma.programIndicator.update({
      where: { id },
      data: dto,
    });
  }

  async remove(programId: string, id: string) {
    const indicator = await this.prisma.programIndicator.findFirst({
      where: { id, programId },
    });
    if (!indicator) {
      throw new EntityNotFoundException('ProgramIndicator', id);
    }

    await this.prisma.programIndicator.delete({
      where: { id },
    });
  }

  async setTarget(programId: string, id: string, dto: SetIndicatorTargetDto) {
    const indicator = await this.prisma.programIndicator.findFirst({
      where: { id, programId },
    });
    if (!indicator) {
      throw new EntityNotFoundException('ProgramIndicator', id);
    }

    // Ubah status ke IN_PROGRESS jika sebelumnya ASSIGNED_TO_UNIT
    const newStatus = indicator.status === 'ASSIGNED_TO_UNIT' ? 'IN_PROGRESS' : indicator.status;

    return this.prisma.programIndicator.update({
      where: { id },
      data: {
        ...dto,
        status: newStatus,
      },
    });
  }

  async getRealizations(programId: string, indicatorId: string) {
    const indicator = await this.prisma.programIndicator.findFirst({
      where: { id: indicatorId, programId },
    });
    if (!indicator) {
      throw new EntityNotFoundException('ProgramIndicator', indicatorId);
    }

    const realizations = await this.prisma.programIndicatorRealization.findMany({
      where: { indicatorId },
      orderBy: { month: 'asc' },
      include: {
        documents: {
          include: { document: true }
        }
      }
    });

    return realizations.map(r => ({
      ...r,
      documents: r.documents.map(rd => rd.document)
    }));
  }

  async upsertRealization(programId: string, indicatorId: string, dto: CreateProgramIndicatorRealizationDto) {
    const indicator = await this.prisma.programIndicator.findFirst({
      where: { id: indicatorId, programId },
    });
    if (!indicator) {
      throw new EntityNotFoundException('ProgramIndicator', indicatorId);
    }

    const realization = await this.prisma.programIndicatorRealization.upsert({
      where: {
        indicatorId_month: {
          indicatorId,
          month: dto.month,
        }
      },
      update: {
        realization: dto.realization,
        remark: dto.remark,
        documents: dto.documentIds ? {
          deleteMany: {},
          create: dto.documentIds.map(id => ({ documentId: id })),
        } : undefined,
      },
      create: {
        indicatorId,
        month: dto.month,
        realization: dto.realization,
        remark: dto.remark,
        documents: dto.documentIds ? {
          create: dto.documentIds.map(id => ({ documentId: id })),
        } : undefined,
      },
      include: {
        documents: {
          include: { document: true }
        }
      }
    });

    return {
      ...realization,
      documents: realization.documents.map(d => d.document)
    };
  }
}
