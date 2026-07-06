import { Injectable, Inject, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PROGRAM_REPOSITORY,
  IProgramRepository,
} from '../repositories/program.repository.interface';
import { CreateProgramDto } from '../dto/create-program.dto';
import { UpdateProgramDto } from '../dto/update-program.dto';
import { ProgramQueryDto } from '../dto/program-query.dto';
import { ProgramResponseDto } from '../dto/program-response.dto';
import { ProgramMapper } from '../mapper/program.mapper';
import { PaginatedResponse } from '@common/dto/pagination.dto';
import { buildPaginationArgs, buildPaginatedResponse } from '@common/utils/pagination.util';
import {
  EntityNotFoundException,
  EntityConflictException,
} from '@common/exceptions';

@Injectable()
export class ProgramService {
  private readonly logger = new Logger(ProgramService.name);

  constructor(
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: IProgramRepository,
  ) {}

  async findAll(query: ProgramQueryDto): Promise<PaginatedResponse<ProgramResponseDto>> {
    const { skip, take, orderBy } = buildPaginationArgs(query);

    const where: Prisma.ProgramWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.year) {
      where.year = query.year;
    }
    if (query.unitId) {
      where.unitId = query.unitId;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { code: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const [programs, totalItems] = await Promise.all([
      this.programRepository.findAll({
        skip,
        take,
        where,
        orderBy: orderBy as Prisma.ProgramOrderByWithRelationInput,
      }),
      this.programRepository.count(where),
    ]);

    const items = ProgramMapper.toResponseList(
      programs as Array<typeof programs[0] & { category?: { name: string } | null }>,
    );

    return buildPaginatedResponse(items, totalItems, query);
  }

  async findById(id: string): Promise<ProgramResponseDto> {
    const program = await this.programRepository.findById(id);

    if (!program) {
      throw new EntityNotFoundException('Program', id);
    }

    return ProgramMapper.toResponse(
      program as typeof program & { category?: { name: string } | null },
    );
  }

  async create(dto: CreateProgramDto, userId: string): Promise<ProgramResponseDto> {
    // Check for duplicate code
    const existing = await this.programRepository.findByCode(dto.code);
    if (existing) {
      throw new EntityConflictException(`Program with code '${dto.code}' already exists`);
    }

    const program = await this.programRepository.create({
      code: dto.code,
      title: dto.title,
      description: dto.description,
      objective: dto.objective,
      year: dto.year,
      unitId: dto.unitId,
      category: { connect: { id: dto.categoryId } },
      startDate: dto.startDate,
      endDate: dto.endDate,
      budget: dto.budget,
      picId: dto.picId,
      createdBy: userId,
    });

    this.logger.log(`Program created: ${program.id} by user ${userId}`);

    return ProgramMapper.toResponse(
      program as typeof program & { category?: { name: string } | null },
    );
  }

  async update(
    id: string,
    dto: UpdateProgramDto,
    userId: string,
  ): Promise<ProgramResponseDto> {
    const existing = await this.programRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Program', id);
    }

    const updateData: Prisma.ProgramUpdateInput = {
      ...dto,
      updatedBy: userId,
    };

    // If categoryId is provided, use connect syntax
    if (dto.categoryId) {
      updateData.category = { connect: { id: dto.categoryId } };
      delete (updateData as Record<string, unknown>)['categoryId'];
    }

    // Handle date coercion
    if (dto.startDate) {
      updateData.startDate = dto.startDate;
    }
    if (dto.endDate) {
      updateData.endDate = dto.endDate;
    }

    const program = await this.programRepository.update(id, updateData);

    this.logger.log(`Program updated: ${id} by user ${userId}`);

    return ProgramMapper.toResponse(
      program as typeof program & { category?: { name: string } | null },
    );
  }

  async remove(id: string): Promise<void> {
    const existing = await this.programRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Program', id);
    }

    await this.programRepository.delete(id);
    this.logger.log(`Program deleted: ${id}`);
  }
}
