import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { EntityNotFoundException } from '@common/exceptions';
import { PaginationQuery, PaginatedResponse } from '@common/dto/pagination.dto';
import { CreateMasterUnitTypeDto, UpdateMasterUnitTypeDto, MasterUnitTypeDto } from './dto/master-unit-type.dto';

@Injectable()
export class MasterUnitTypeService {
  private readonly logger = new Logger(MasterUnitTypeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQuery): Promise<PaginatedResponse<MasterUnitTypeDto>> {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
          ],
        }
      : {};

    const [items, totalItems] = await Promise.all([
      this.prisma.masterUnitType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
      }),
      this.prisma.masterUnitType.count({ where }),
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

  async findById(id: string): Promise<MasterUnitTypeDto> {
    const unitType = await this.prisma.masterUnitType.findUnique({
      where: { id },
    });
    if (!unitType) {
      throw new EntityNotFoundException('MasterUnitType', id);
    }
    return unitType;
  }

  async create(data: CreateMasterUnitTypeDto): Promise<MasterUnitTypeDto> {
    return this.prisma.masterUnitType.create({
      data,
    });
  }

  async update(id: string, data: UpdateMasterUnitTypeDto): Promise<MasterUnitTypeDto> {
    await this.findById(id); // Check existence

    return this.prisma.masterUnitType.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id); // Check existence
    
    await this.prisma.masterUnitType.delete({
      where: { id },
    });
  }
}
