import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { EntityNotFoundException } from '@common/exceptions';
import { PaginationQuery, PaginatedResponse } from '@common/dto/pagination.dto';
import {
  CreateMasterBudgetDto,
  UpdateMasterBudgetBudgetDto,
  UpdateMasterBudgetRealizationDto,
  MasterBudgetDto,
} from './dto/master-budget.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MasterBudgetService {
  private readonly logger = new Logger(MasterBudgetService.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapToDto(budget: any): MasterBudgetDto {
    return {
      ...budget,
      budget: Number(budget.budget),
      realization: Number(budget.realization),
    };
  }

  async findAll(query: PaginationQuery): Promise<PaginatedResponse<MasterBudgetDto>> {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MasterBudgetWhereInput = search
      ? {
          year: { equals: parseInt(search) || undefined },
        }
      : {};

    const [items, totalItems] = await Promise.all([
      this.prisma.masterBudget.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'year']: sortOrder || 'desc' },
      }),
      this.prisma.masterBudget.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: items.map((item) => this.mapToDto(item)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  async findByYear(year: number): Promise<MasterBudgetDto> {
    const budget = await this.prisma.masterBudget.findUnique({
      where: { year },
    });
    if (!budget) {
      throw new EntityNotFoundException('MasterBudget', year.toString());
    }
    return this.mapToDto(budget);
  }

  async create(data: CreateMasterBudgetDto): Promise<MasterBudgetDto> {
    const existing = await this.prisma.masterBudget.findUnique({
      where: { year: data.year },
    });
    if (existing) {
      throw new ConflictException(`Master budget for year ${data.year} already exists.`);
    }

    const budget = await this.prisma.masterBudget.create({
      data: {
        year: data.year,
        budget: data.budget,
        realization: data.realization || 0,
      },
    });
    return this.mapToDto(budget);
  }

  async updateBudget(year: number, data: UpdateMasterBudgetBudgetDto): Promise<MasterBudgetDto> {
    await this.findByYear(year); // Check existence

    const budget = await this.prisma.masterBudget.update({
      where: { year },
      data: { budget: data.budget },
    });
    return this.mapToDto(budget);
  }

  async updateRealization(year: number, data: UpdateMasterBudgetRealizationDto): Promise<MasterBudgetDto> {
    await this.findByYear(year); // Check existence

    const budget = await this.prisma.masterBudget.update({
      where: { year },
      data: { realization: data.realization },
    });
    return this.mapToDto(budget);
  }

  async remove(year: number): Promise<void> {
    await this.findByYear(year); // Check existence
    
    await this.prisma.masterBudget.delete({
      where: { year },
    });
  }
}
