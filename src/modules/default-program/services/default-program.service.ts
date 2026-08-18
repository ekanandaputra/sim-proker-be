import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { ProgramStatus } from '@prisma/client';
import { EntityNotFoundException } from '@common/exceptions';
import { UnitService } from '../../unit/services/unit.service';
import { IkuService } from '../../iku/services/iku.service';
import { CreateDefaultProgramDto, UpdateDefaultProgramDto, DefaultProgramDto, AssignDefaultProgramDto, AssignDefaultProgramIndicatorDto, CreateDefaultProgramIndicatorDto } from '../dto/default-program.dto';
import { ProgramService } from '../../program/services/program.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { AuditAction } from '@prisma/client';
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
    private readonly auditLogService: AuditLogService,
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
        include: { indicators: { include: { masterUnitType: true } } },
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
      include: { indicators: { include: { masterUnitType: true } } },
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
      include: { indicators: { include: { masterUnitType: true } } },
    });
  }

  async create(data: CreateDefaultProgramDto, user: { id: string, name: string }): Promise<DefaultProgramDto> {
    const { indicators, ...rest } = data;
    const created = await this.prisma.defaultProgram.create({
      data: {
        ...rest,
        indicators: indicators?.length ? {
          create: indicators
        } : undefined
      },
      include: { indicators: { include: { masterUnitType: true } } },
    });

    await this.auditLogService.log({
      action: AuditAction.CREATE,
      entityType: 'DefaultProgram',
      entityId: created.id,
      userId: user.id,
      userName: user.name,
      newValue: created as unknown as Record<string, unknown>,
    });

    return created;
  }

  async update(id: string, data: UpdateDefaultProgramDto, user: { id: string, name: string }): Promise<DefaultProgramDto> {
    const oldProgram = await this.findById(id); // Check existence
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

    const updated = await this.prisma.defaultProgram.update({
      where: { id },
      data: updateData,
      include: { indicators: { include: { masterUnitType: true } } },
    });

    await this.auditLogService.log({
      action: AuditAction.UPDATE,
      entityType: 'DefaultProgram',
      entityId: id,
      userId: user.id,
      userName: user.name,
      oldValue: oldProgram as unknown as Record<string, unknown>,
      newValue: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  async remove(id: string, user: { id: string, name: string }): Promise<void> {
    const oldProgram = await this.findById(id); // Check existence
    await this.prisma.defaultProgram.delete({
      where: { id },
    });

    await this.auditLogService.log({
      action: AuditAction.DELETE,
      entityType: 'DefaultProgram',
      entityId: id,
      userId: user.id,
      userName: user.name,
      oldValue: oldProgram as unknown as Record<string, unknown>,
    });
  }

  async addIndicator(defaultProgramId: string, data: CreateDefaultProgramIndicatorDto, user: { id: string, name: string }): Promise<DefaultProgramDto> {
    await this.findById(defaultProgramId); // Check existence
    
    const indicator = await this.prisma.defaultProgramIndicator.create({
      data: {
        defaultProgramId,
        name: data.name,
        masterUnitTypeId: data.masterUnitTypeId,
        category: data.category || 'TUSI',
        order: data.order || 0,
      }
    });

    await this.auditLogService.log({
      action: AuditAction.CREATE,
      entityType: 'DefaultProgramIndicator',
      entityId: indicator.id,
      userId: user.id,
      userName: user.name,
      newValue: indicator as unknown as Record<string, unknown>,
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
            masterUnitTypeId: ind.masterUnitTypeId,
            category: ind.category,
            status: ProgramStatus.ASSIGNED_TO_UNIT,
            order: ind.order,
          }))
        });
        createdCount += indicatorsToCreate.length;
      }
    } else {
        // For title, we need a default master unit type or we might have a problem if it's required.
        // It's better to find a default one, e.g. "N/A"
        let defaultUnit = await this.prisma.masterUnitType.findFirst({ where: { name: 'N/A' } });
        if (!defaultUnit) {
          defaultUnit = await this.prisma.masterUnitType.create({ data: { name: 'N/A', type: 'TEXT' } });
        }
        if (!existingIndicatorNames.has(dp.title)) {
          await this.prisma.programIndicator.create({
            data: {
              programId: program.id,
              unitId,
              name: dp.title, // Default name based on program title or default program title
              masterUnitTypeId: defaultUnit.id, // Default unit
              category: 'TUSI', // Default category
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
        masterUnitTypeId: ind.masterUnitTypeId,
        category: ind.category,
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
      include: { indicators: { include: { masterUnitType: true }, orderBy: { order: 'asc' } } },
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
            masterUnitTypeId: ind.masterUnitTypeId,
            masterUnitType: ind.masterUnitType,
            category: ind.category,
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

  async exportExcel(token: string): Promise<Buffer> {
    const defaultPrograms = await this.prisma.defaultProgram.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all IKUs to build id -> code map
    const ikuResult = await this.ikuService.getAllIkus(token, { page: 1, limit: 1000 });
    const ikuIdToCode = new Map<string, string>();
    for (const iku of ikuResult.items || []) {
      ikuIdToCode.set(iku.id, iku.code);
    }

    const excelData = defaultPrograms.map((dp) => ({
      'IKU Code': ikuIdToCode.get(dp.ikuId) || dp.ikuId,
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
      const ikuCode = typeof row['IKU Code'] === 'string' ? row['IKU Code'].trim() : row['IKU Code'];
      const title = typeof row['Title'] === 'string' ? row['Title'].trim() : row['Title'];
      const description = typeof row['Description'] === 'string' ? row['Description'].trim() : (row['Description'] || null);

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

  async exportIndicatorsExcel(): Promise<Buffer> {
    const indicators = await this.prisma.defaultProgramIndicator.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        defaultProgram: true,
        masterUnitType: true,
      }
    });

    const excelData = indicators.map((ind) => ({
      'Default Program Title': ind.defaultProgram.title,
      'Indicator Name': ind.name,
      'Unit': ind.masterUnitType.name,
      'Category': ind.category,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Default Program Indicators');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async importIndicatorsExcel(buffer: Buffer): Promise<{ createdCount: number; skippedCount: number }> {
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

    // Cache: Default Program Title -> DefaultProgram record (or null if not found)
    const dpCache = new Map<string, { id: string } | null>();

    let createdCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      const defaultProgramTitle = typeof row['Default Program Title'] === 'string' ? row['Default Program Title'].trim() : row['Default Program Title'];
      const name = typeof row['Indicator Name'] === 'string' ? row['Indicator Name'].trim() : row['Indicator Name'];
      const unit = typeof row['Unit'] === 'string' ? row['Unit'].trim() : row['Unit'];
      const category = typeof row['Category'] === 'string' ? row['Category'].trim().toUpperCase() : 'TUSI';

      if (!defaultProgramTitle || !name || !unit) {
        this.logger.warn(`Skipping invalid row: missing required fields (Default Program Title, Indicator Name, or Unit)`);
        continue;
      }

      // Validasi kategori
      if (!['TUSI', 'RUTIN', 'PENGEMBANGAN'].includes(category)) {
        this.logger.warn(`Skipping row: Invalid Category '${category}'. Must be TUSI, RUTIN, or PENGEMBANGAN`);
        continue;
      }

      // Resolve Default Program by title
      if (!dpCache.has(defaultProgramTitle)) {
        const found = await this.prisma.defaultProgram.findFirst({
          where: { title: defaultProgramTitle },
        });
        dpCache.set(defaultProgramTitle, found ? { id: found.id } : null);
      }

      const dp = dpCache.get(defaultProgramTitle);
      if (!dp) {
        this.logger.warn(`Skipping row: Default Program '${defaultProgramTitle}' not found in database`);
        skippedCount++;
        continue;
      }

      // Check for duplicate indicator
      const existing = await this.prisma.defaultProgramIndicator.findFirst({
        where: { defaultProgramId: dp.id, name },
      });

      if (existing) {
        this.logger.warn(`Skipping duplicate indicator: program='${defaultProgramTitle}', name='${name}'`);
        skippedCount++;
        continue;
      }

      // Find or Create MasterUnitType
      let masterUnitType = await this.prisma.masterUnitType.findFirst({
        where: { name: unit }
      });
      if (!masterUnitType) {
        masterUnitType = await this.prisma.masterUnitType.create({
          data: {
            name: unit,
            type: 'TEXT',
          }
        });
      }

      await this.prisma.defaultProgramIndicator.create({
        data: {
          defaultProgramId: dp.id,
          name,
          masterUnitTypeId: masterUnitType.id,
          category: category as any,
        },
      });
      createdCount++;
    }

    return { createdCount, skippedCount };
  }
}

