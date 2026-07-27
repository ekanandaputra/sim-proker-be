import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { ProgramStatus } from '@prisma/client';
import { EntityNotFoundException } from '@common/exceptions';
import { UnitService } from '../../unit/services/unit.service';
import { IkuService } from '../../iku/services/iku.service';
import { CreateDefaultProgramDto, UpdateDefaultProgramDto, DefaultProgramDto, AssignDefaultProgramDto, AssignDefaultProgramIndicatorDto, CreateDefaultProgramIndicatorDto } from '../dto/default-program.dto';
import { ProgramService } from '../../program/services/program.service';
import { randomBytes } from 'crypto';
import { PaginationQuery, PaginatedResponse } from '@common/dto/pagination.dto';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
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

  async addIndicator(defaultProgramId: string, data: CreateDefaultProgramIndicatorDto): Promise<DefaultProgramDto> {
    await this.findById(defaultProgramId); // Check existence
    
    await this.prisma.defaultProgramIndicator.create({
      data: {
        defaultProgramId,
        name: data.name,
        unit: data.unit,
        order: data.order || 0,
      }
    });

    return this.findById(defaultProgramId);
  }

  async assignToUnit(dto: AssignDefaultProgramDto, userId: string, token: string): Promise<{ createdCount: number }> {
    const { unitId, defaultProgramId, period } = dto;

    // Set standard start and end dates for the given year

    const dp = await this.findById(defaultProgramId);

    // Find if the program already exists for this year and title
    let program: any = await this.prisma.program.findFirst({
      where: {
        year: period,
        title: dp.title,
      }
    });

    if (!program) {
      const randomStr = randomBytes(3).toString('hex').toUpperCase();
      const code = `PRG-${period}-${randomStr}`;

      program = await this.programService.create({
        code,
        title: dp.title,
        description: dp.description || undefined,
        objective: '',
        year: period,
      }, userId);
    }

    // Check existing indicators for this unit in the program to avoid duplicates
    const existingIndicators = await this.prisma.programIndicator.findMany({
      where: {
        programId: program.id,
        unitId,
      }
    });
    const existingIndicatorNames = new Set(existingIndicators.map(i => i.name));

    let createdCount = 0;

    if (dp.indicators && dp.indicators.length > 0) {
      const indicatorsToCreate = dp.indicators.filter(ind => !existingIndicatorNames.has(ind.name));
      if (indicatorsToCreate.length > 0) {
        await this.prisma.programIndicator.createMany({
          data: indicatorsToCreate.map((ind) => ({
            programId: program.id,
            unitId,
            name: ind.name,
            unit: ind.unit,
            status: ProgramStatus.ASSIGNED_TO_UNIT,
            order: ind.order,
          }))
        });
        createdCount += indicatorsToCreate.length;
      }
    } else {
      if (!existingIndicatorNames.has(dp.title)) {
        await this.prisma.programIndicator.create({
          data: {
            programId: program.id,
            unitId,
            name: dp.title, // Default name based on program title or default program title
            unit: 'N/A', // Default unit
            status: ProgramStatus.ASSIGNED_TO_UNIT,
          }
        });
        createdCount++;
      }
    }

    return { createdCount };
  }

  async assignIndicatorToUnit(dto: AssignDefaultProgramIndicatorDto, userId: string, token: string): Promise<{ createdCount: number }> {
    const { unitId, defaultProgramIndicatorId, period } = dto;

    const ind = await this.prisma.defaultProgramIndicator.findUnique({
      where: { id: defaultProgramIndicatorId },
      include: { defaultProgram: true },
    });

    if (!ind) {
      throw new EntityNotFoundException('DefaultProgramIndicator', defaultProgramIndicatorId);
    }

    const dp = ind.defaultProgram;

    // Find if the program already exists for this year and title
    let program: any = await this.prisma.program.findFirst({
      where: {
        year: period,
        title: dp.title,
      }
    });

    // If program doesn't exist, create it (fallback scenario if they assign indicator before program)
    if (!program) {
      const randomStr = randomBytes(3).toString('hex').toUpperCase();
      const code = `PRG-${period}-${randomStr}`;

      program = await this.programService.create({
        code,
        title: dp.title,
        description: dp.description || undefined,
        objective: '',
        year: period,
      }, userId);
    }

    // Check if this indicator is already assigned
    const existingIndicator = await this.prisma.programIndicator.findFirst({
      where: {
        programId: program.id,
        unitId,
        name: ind.name,
      }
    });

    if (existingIndicator) {
      throw new BadRequestException(`Indikator dengan nama '${ind.name}' sudah diassign pada tahun ${period}`);
    }

    await this.prisma.programIndicator.create({
      data: {
        programId: program.id,
        unitId,
        name: ind.name,
        unit: ind.unit,
        status: ProgramStatus.ASSIGNED_TO_UNIT,
        order: ind.order,
      }
    });

    return { createdCount: 1 };
  }

  async getAssignmentStructure(year: number, token: string, filters?: { ikuId?: string; unitId?: string; programTitle?: string }) {
    // 1. Fetch all IKUs from external service
    const ikuResult = await this.ikuService.getAllIkus(token, { page: 1, limit: 1000 });
    let ikuList = ikuResult.items || [];

    // Apply IKU filter if provided
    if (filters?.ikuId) {
      ikuList = ikuList.filter((iku: any) => iku.id === filters.ikuId);
    }

    // 2. Fetch all default programs with indicators from local DB
    const allDefaultPrograms = await this.prisma.defaultProgram.findMany({
      include: { indicators: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });

    // Group default programs by ikuId
    const dpByIku = new Map<string, typeof allDefaultPrograms>();
    for (const dp of allDefaultPrograms) {
      const list = dpByIku.get(dp.ikuId) || [];
      list.push(dp);
      dpByIku.set(dp.ikuId, list);
    }

    // 3. Fetch all program indicators for the given year (to check assignment status)
    const assignedIndicators = await this.prisma.programIndicator.findMany({
      where: {
        program: { year },
      },
      include: {
        program: true,
      },
    });

    // Build a lookup: programTitle + indicatorName -> list of { unitId }
    const assignmentMap = new Map<string, { unitId: string }[]>();
    for (const ai of assignedIndicators) {
      const key = `${ai.program.title}::${ai.name}`;
      const list = assignmentMap.get(key) || [];
      list.push({ unitId: ai.unitId });
      assignmentMap.set(key, list);
    }

    // 4. Collect all unique unitIds from assignments for batch fetching
    const allUnitIds = new Set<string>();
    for (const entries of assignmentMap.values()) {
      for (const entry of entries) {
        allUnitIds.add(entry.unitId);
      }
    }

    // 5. Fetch unit info for all unique unitIds
    const unitInfoMap = new Map<string, { id: string; name: string }>();
    const unitFetchPromises = Array.from(allUnitIds).map(async (unitId) => {
      try {
        const unitInfo = await this.unitService.getUnitById(unitId, token);
        unitInfoMap.set(unitId, { id: unitId, name: unitInfo.name || unitInfo.unitName || unitId });
      } catch (err) {
        this.logger.warn(`Failed to fetch unit info for ${unitId}`);
        unitInfoMap.set(unitId, { id: unitId, name: unitId });
      }
    });
    await Promise.all(unitFetchPromises);

    // 6. Build the hierarchical response
    const items = ikuList.map((iku: any) => {
      const defaultPrograms = dpByIku.get(iku.id) || [];

      // Apply program title filter if provided
      let filteredPrograms = defaultPrograms;
      if (filters?.programTitle) {
        filteredPrograms = filteredPrograms.filter(dp => dp.title === filters.programTitle);
      }

      let totalIndicators = 0;

      const programs = filteredPrograms.map((dp, dpIndex) => {
        const indicators = dp.indicators.map((ind, indIndex) => {
          const key = `${dp.title}::${ind.name}`;
          const assignments = assignmentMap.get(key) || [];

          // Apply unit filter if provided
          let filteredAssignments = assignments;
          if (filters?.unitId) {
            filteredAssignments = assignments.filter(a => a.unitId === filters.unitId);
          }

          const assignedUnits = filteredAssignments.map(a => {
            const unitInfo = unitInfoMap.get(a.unitId);
            return {
              unitId: a.unitId,
              unitName: unitInfo?.name || a.unitId,
            };
          });

          const isAssigned = assignedUnits.length > 0;

          totalIndicators++;

          return {
            id: ind.id,
            name: ind.name,
            unit: ind.unit,
            order: ind.order || indIndex + 1,
            assignedUnits,
            isAssigned,
          };
        });

        return {
          id: dp.id,
          title: dp.title,
          description: dp.description,
          order: dpIndex + 1,
          indicators,
        };
      });

      // If unit filter is provided, only include programs that have at least one indicator matching
      let finalPrograms = programs;
      if (filters?.unitId) {
        finalPrograms = programs.filter(p => p.indicators.some(i => i.isAssigned));
      }

      return {
        iku: {
          id: iku.id,
          code: iku.code,
          name: iku.name,
          description: iku.description,
        },
        totalPrograms: filteredPrograms.length,
        totalIndicators,
        programs: finalPrograms,
      };
    });

    return { items };
  }

  async exportExcel(): Promise<Buffer> {
    const defaultPrograms = await this.prisma.defaultProgram.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const excelData = defaultPrograms.map((dp) => ({
      'IKU ID': dp.ikuId,
      'Title': dp.title,
      'Description': dp.description || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Default Programs');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async importExcel(buffer: Buffer, token: string): Promise<{ createdCount: number; skippedCount: number }> {
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

    // Fetch all IKUs to build a code -> id map
    const ikuResult = await this.ikuService.getAllIkus(token, { page: 1, limit: 1000 });
    const ikuCodeToId = new Map<string, string>();
    for (const iku of ikuResult.items || []) {
      ikuCodeToId.set(iku.code, iku.id);
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      const ikuCode = row['IKU Code'];
      const title = row['Title'];
      const description = row['Description'] || null;

      if (!ikuCode || !title) {
        this.logger.warn(`Skipping invalid row: missing required fields (IKU Code or Title)`);
        continue;
      }

      // Resolve IKU Code to IKU ID
      const ikuId = ikuCodeToId.get(ikuCode);
      if (!ikuId) {
        this.logger.warn(`Skipping row: IKU Code '${ikuCode}' not found`);
        skippedCount++;
        continue;
      }

      // Check for duplicate: same ikuId + title
      const existing = await this.prisma.defaultProgram.findFirst({
        where: { ikuId, title },
      });

      if (existing) {
        this.logger.warn(`Skipping duplicate default program: ikuCode=${ikuCode}, title=${title}`);
        skippedCount++;
        continue;
      }

      await this.prisma.defaultProgram.create({
        data: {
          ikuId,
          title,
          description,
        },
      });
      createdCount++;
    }

    return { createdCount, skippedCount };
  }

  async exportIndicatorsCsv(): Promise<string> {
    const indicators = await this.prisma.defaultProgramIndicator.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        defaultProgram: true
      }
    });

    const csvData = indicators.map((ind) => ({
      'Default Program ID': ind.defaultProgramId,
      'Default Program Title': ind.defaultProgram.title,
      'Indicator Name': ind.name,
      'Unit': ind.unit,
      'Order': ind.order,
    }));

    return Papa.unparse(csvData);
  }

  async importIndicatorsCsv(buffer: Buffer): Promise<{ createdCount: number; skippedCount: number }> {
    const csvString = buffer.toString('utf-8');
    const result = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
    });

    if (result.errors && result.errors.length > 0) {
      throw new Error(`CSV Parsing Error: ${result.errors[0].message}`);
    }

    const rows: any[] = result.data;
    let createdCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      const defaultProgramId = row['Default Program ID'];
      const name = row['Indicator Name'];
      const unit = row['Unit'];
      const order = row['Order'] ? parseInt(row['Order'], 10) : 0;

      if (!defaultProgramId || !name || !unit) {
        this.logger.warn(`Skipping invalid CSV row: missing required fields`);
        continue;
      }

      // Check for duplicate: same defaultProgramId + name
      const existing = await this.prisma.defaultProgramIndicator.findFirst({
        where: { defaultProgramId, name },
      });

      if (existing) {
        this.logger.warn(`Skipping duplicate indicator: defaultProgramId=${defaultProgramId}, name=${name}`);
        skippedCount++;
        continue;
      }

      await this.prisma.defaultProgramIndicator.create({
        data: {
          defaultProgramId,
          name,
          unit,
          order: isNaN(order) ? 0 : order,
        },
      });
      createdCount++;
    }

    return { createdCount, skippedCount };
  }
}

