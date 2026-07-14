import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
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
    });
  }

  async create(data: CreateDefaultProgramDto): Promise<DefaultProgramDto> {
    return this.prisma.defaultProgram.create({
      data,
    });
  }

  async update(id: string, data: UpdateDefaultProgramDto): Promise<DefaultProgramDto> {
    await this.findById(id); // Check existence
    return this.prisma.defaultProgram.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id); // Check existence
    await this.prisma.defaultProgram.delete({
      where: { id },
    });
  }

  async assignToUnit(dto: AssignDefaultProgramDto, userId: string, token: string): Promise<{ createdCount: number }> {
    const { unitId, year } = dto;
    let createdCount = 0;

    // Set standard start and end dates for the given year
    const startDate = new Date(`${year}-01-01T00:00:00Z`);
    const endDate = new Date(`${year}-12-31T23:59:59Z`);

    // 1. Fetch IKUs
    const ikusResponse = await this.ikuService.getAllIkus(token, { limit: 1000 });
    const ikus = ikusResponse.items || [];

    for (const iku of ikus) {
      // 2. Fetch default programs for this IKU
      const defaultPrograms = await this.prisma.defaultProgram.findMany({
        where: { ikuId: iku.id },
      });

      if (defaultPrograms.length === 0) {
        continue; // No default programs for this IKU, skip
      }

      // 3. Get assigned units for this IKU
      let targetUnitIds: string[] = [];
      if (unitId) {
        targetUnitIds = [unitId]; // Admin specified a single unit
      } else {
        // MOCK: Since IKU-to-Unit mapping doesn't exist yet in sim_iku,
        // we mock it by returning ALL active units. 
        // TODO: Replace this with the actual call to fetch units assigned to `iku.id`
        const unitsResponse = await this.unitService.getUnits(token, { limit: 1000 });
        targetUnitIds = unitsResponse.items.map((u: any) => u.id);
      }

      // 4. Create programs for each assigned unit
      for (const targetUnitId of targetUnitIds) {
        for (const dp of defaultPrograms) {
          // Check for duplicates
          const existingProgram = await this.prisma.program.findFirst({
            where: {
              unitId: targetUnitId,
              year,
              title: dp.title,
            }
          });

          if (existingProgram) {
            continue; // Skip to avoid duplicates
          }

          const randomStr = randomBytes(3).toString('hex').toUpperCase();
          const code = `PRG-${year}-${randomStr}`;

          await this.programService.create({
            code,
            title: dp.title,
            description: dp.description || undefined,
            objective: '',
            year,
            unitId: targetUnitId,
            startDate,
            endDate,
            budget: 0,
          }, userId);

          createdCount++;
        }
      }
    }

    return { createdCount };
  }
}
