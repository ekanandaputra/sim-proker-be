import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { ProgramStatus } from '@prisma/client';
import { EntityNotFoundException } from '@common/exceptions';
import { UnitService } from '../../unit/services/unit.service';
import { IkuService } from '../../iku/services/iku.service';
import { CreateDefaultProgramDto, UpdateDefaultProgramDto, DefaultProgramDto, AssignDefaultProgramDto } from '../dto/default-program.dto';
import { ProgramService } from '../../program/services/program.service';
import { randomBytes } from 'crypto';
import { PaginationQuery, PaginatedResponse } from '@common/dto/pagination.dto';

@Injectable()
export class DefaultProgramService {
  private readonly logger = new Logger(DefaultProgramService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly programService: ProgramService,
    private readonly unitService: UnitService,
    private readonly ikuService: IkuService,
  ) {}

  async findAll(query: PaginationQuery): Promise<PaginatedResponse<DefaultProgramDto>> {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { title: { contains: search } },
            { ikuCode: { contains: search } },
          ],
        }
      : {};

    const [items, totalItems] = await Promise.all([
      this.prisma.defaultProgram.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder },
        include: { indicators: true },
      }),
      this.prisma.defaultProgram.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  async findById(id: string): Promise<DefaultProgramDto> {
    const program = await this.prisma.defaultProgram.findUnique({
      where: { id },
      include: { indicators: true },
    });
    if (!program) {
      throw new EntityNotFoundException('DefaultProgram', id);
    }
    return program;
  }

  async findByIkuId(ikuId: string): Promise<DefaultProgramDto[]> {
    return this.prisma.defaultProgram.findMany({
      where: { ikuId },
      orderBy: { createdAt: 'desc' },
      include: { indicators: true },
    });
  }

  async create(data: CreateDefaultProgramDto): Promise<DefaultProgramDto> {
    const { indicators, ...rest } = data;
    return this.prisma.defaultProgram.create({
      data: {
        ...rest,
        indicators: indicators?.length ? {
          create: indicators
        } : undefined
      },
      include: { indicators: true },
    });
  }

  async update(id: string, data: UpdateDefaultProgramDto): Promise<DefaultProgramDto> {
    await this.findById(id); // Check existence
    const { indicators, ...rest } = data;
    
    // For simplicity, if indicators are provided in update, we replace all existing ones.
    // In a real app, you might want a separate endpoint for indicators CRUD.
    const updateData: any = { ...rest };
    if (indicators) {
      updateData.indicators = {
        deleteMany: {}, // Delete all old indicators
        create: indicators // Create new ones
      };
    }

    return this.prisma.defaultProgram.update({
      where: { id },
      data: updateData,
      include: { indicators: true },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id); // Check existence
    await this.prisma.defaultProgram.delete({
      where: { id },
    });
  }

  async assignToUnit(dto: AssignDefaultProgramDto, userId: string, token: string): Promise<{ createdCount: number }> {
    const { unitId, defaultProgramId, period } = dto;

    // Set standard start and end dates for the given year
    const startDate = new Date(`${period}-01-01T00:00:00Z`);
    const endDate = new Date(`${period}-12-31T23:59:59Z`);

    const dp = await this.findById(defaultProgramId);

    // Check for duplicates
    const existingProgram = await this.prisma.program.findFirst({
      where: {
        year: period,
        title: dp.title,
        indicators: {
          some: { unitId },
        },
      }
    });

    if (existingProgram) {
      return { createdCount: 0 }; // Skip to avoid duplicates
    }

    const randomStr = randomBytes(3).toString('hex').toUpperCase();
    const code = `PRG-${period}-${randomStr}`;

    const program = await this.programService.create({
      code,
      title: dp.title,
      description: dp.description || undefined,
      objective: '',
      year: period,
      startDate,
      endDate,
      budget: 0,
      status: ProgramStatus.ASSIGNED_TO_UNIT,
    }, userId);

    if (dp.indicators && dp.indicators.length > 0) {
      await this.prisma.programIndicator.createMany({
        data: dp.indicators.map((ind) => ({
          programId: program.id,
          unitId,
          name: ind.name,
          unit: ind.unit,
          target: ind.target ? Number(ind.target) : null,
          order: ind.order,
        }))
      });
    } else {
      await this.prisma.programIndicator.create({
        data: {
          programId: program.id,
          unitId,
          name: dp.title, // Default name based on program title or default program title
          unit: 'N/A', // Default unit
        }
      });
    }

    return { createdCount: 1 };
  }
}
