import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { EntityNotFoundException } from '@common/exceptions';
import { CreateProgramIndicatorDto, UpdateProgramIndicatorDto, SetIndicatorTargetDto } from '../dto/program-indicator.dto';

@Injectable()
export class ProgramIndicatorService {
  private readonly logger = new Logger(ProgramIndicatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllByProgramId(programId: string) {
    return this.prisma.programIndicator.findMany({
      where: { programId },
      orderBy: { order: 'asc' },
    });
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
}
