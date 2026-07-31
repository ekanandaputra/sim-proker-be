import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { MasterUnitTypeEnum } from '@prisma/client';
import { EntityNotFoundException } from '@common/exceptions';
import { PaginationQuery, PaginatedResponse } from '@common/dto/pagination.dto';
import { CreateMasterUnitTypeDto, UpdateMasterUnitTypeDto, MasterUnitTypeDto } from './dto/master-unit-type.dto';
import * as XLSX from 'xlsx';

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

  async exportExcel(): Promise<Buffer> {
    const masterUnitTypes = await this.prisma.masterUnitType.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const excelData = masterUnitTypes.map((mut) => ({
      'Name': mut.name,
      'Type': mut.type,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Unit Types');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async importExcel(buffer: Buffer): Promise<{ createdCount: number; skippedCount: number }> {
    // Parse XLSX file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('Excel file has no sheets');
    }
    const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (rows.length === 0) {
      throw new BadRequestException('Excel file has no data rows');
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      const name = row['Name'];
      let type = row['Type'];

      if (!name || !type) {
        this.logger.warn(`Skipping invalid row: missing required fields (Name or Type)`);
        continue;
      }

      // Convert type to uppercase to match enum
      type = type.toString().toUpperCase();

      if (!Object.values(MasterUnitTypeEnum).includes(type)) {
         this.logger.warn(`Skipping invalid row: Type must be one of ${Object.values(MasterUnitTypeEnum).join(', ')}`);
         skippedCount++;
         continue;
      }

      // Check for duplicate: same name
      const existing = await this.prisma.masterUnitType.findFirst({
        where: { name },
      });

      if (existing) {
        this.logger.warn(`Skipping duplicate master unit type: name=${name}`);
        skippedCount++;
        continue;
      }

      await this.prisma.masterUnitType.create({
        data: {
          name,
          type: type as MasterUnitTypeEnum,
        },
      });
      createdCount++;
    }

    return { createdCount, skippedCount };
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
