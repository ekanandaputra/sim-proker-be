import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { UnitService } from '../../unit/services/unit.service';
import * as exceljs from 'exceljs';
import { Response } from 'express';
import { MasterUnitType } from '@prisma/client';

export interface ImportRowDetail {
  row: number;
  ikuId: string;
  program: string;
  indicator: string;
  unit: string;
  satuan: string;
  status: 'success' | 'skipped';
  reason?: string;
  programCreated?: boolean;
  indicatorCreated?: boolean;
  satuanCreated?: boolean;
}

export interface ImportResult {
  totalRows: number;
  success: number;
  skipped: number;
  details: ImportRowDetail[];
}

@Injectable()
export class ProgramIndicatorImportService {
  private readonly logger = new Logger(ProgramIndicatorImportService.name);

  private readonly COL_IKU = 1;
  private readonly COL_PROGRAM = 2;
  private readonly COL_INDICATOR = 3;
  private readonly COL_UNIT = 4;
  private readonly COL_SATUAN = 5;

  private unitTypeCache = new Map<string, MasterUnitType>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly unitService: UnitService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // EXPORT — download Excel dengan data assign indikator saat ini
  // ─────────────────────────────────────────────────────────────────────────
  async exportTemplate(year: number, token: string, res: Response): Promise<void> {
    this.logger.log(`Exporting assign-indicator template for year ${year}`);

    const indicators = await this.prisma.programIndicator.findMany({
      where: { program: { year } },
      include: {
        program: { select: { title: true, ikuId: true } },
        masterUnitType: { select: { name: true } },
      },
      orderBy: [{ program: { title: 'asc' } }, { order: 'asc' }],
    });

    const uniqueUnitIds = [...new Set(indicators.map((i) => i.unitId).filter(Boolean))];
    const unitNameMap = new Map<string, string>();
    await Promise.all(
      uniqueUnitIds.map(async (unitId) => {
        try {
          const unit = await this.unitService.getUnitById(unitId, token);
          unitNameMap.set(unitId, unit?.name || unitId);
        } catch {
          unitNameMap.set(unitId, unitId);
        }
      }),
    );

    const workbook = new exceljs.Workbook();
    workbook.creator = 'SIM PROKER';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Assign Indikator');

    const headerFill: exceljs.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9BC2E6' },
    };
    const border: Partial<exceljs.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    sheet.getColumn(this.COL_IKU).width = 15;
    sheet.getColumn(this.COL_PROGRAM).width = 45;
    sheet.getColumn(this.COL_INDICATOR).width = 55;
    sheet.getColumn(this.COL_UNIT).width = 30;
    sheet.getColumn(this.COL_SATUAN).width = 20;

    const header = sheet.getRow(1);
    header.height = 28;
    header.getCell(this.COL_IKU).value = 'IKU Code';
    header.getCell(this.COL_PROGRAM).value = 'Nama Program';
    header.getCell(this.COL_INDICATOR).value = 'Indikator Unit';
    header.getCell(this.COL_UNIT).value = 'Unit Pelaksana';
    header.getCell(this.COL_SATUAN).value = 'Satuan';
    header.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = { bold: true, size: 11 };
      cell.border = border;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    indicators.forEach((ind, idx) => {
      const row = sheet.getRow(idx + 2);
      row.getCell(this.COL_IKU).value = ind.program.ikuId ?? '';
      row.getCell(this.COL_PROGRAM).value = ind.program.title;
      row.getCell(this.COL_INDICATOR).value = ind.name;
      row.getCell(this.COL_UNIT).value = unitNameMap.get(ind.unitId) ?? '';
      row.getCell(this.COL_SATUAN).value = ind.masterUnitType?.name ?? '';
      row.eachCell((cell) => {
        cell.border = border;
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="assign_indikator_${year}.xlsx"`,
    );
    await workbook.xlsx.write(res);
    res.end();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPORT — baca Excel, assign tiap indikator ke unit
  // Format kolom: IKU Code | Nama Program | Indikator Unit | Unit Pelaksana | Satuan
  // ─────────────────────────────────────────────────────────────────────────
  async importFromExcel(
    file: Express.Multer.File,
    token: string,
    userId: string,
    year: number,
  ): Promise<ImportResult> {
    this.logger.log(`Importing assign-indicator from file: ${file.originalname}`);
    this.unitTypeCache = new Map();

    const workbook = new exceljs.Workbook();
    const { Readable } = await import('stream');
    const readable = Readable.from(file.buffer);
    await workbook.xlsx.read(readable);

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return { totalRows: 0, success: 0, skipped: 0, details: [] };
    }

    // Build (ikuId + program name) → id map. A single IKU code can cover many
    // distinct programs, so the pair — not the IKU code alone — identifies a Program.
    const allPrograms = await this.prisma.program.findMany({
      select: { id: true, title: true, ikuId: true },
    });
    const programKeyToId = new Map<string, string>();
    for (const p of allPrograms) {
      programKeyToId.set(this.programKey(p.ikuId, p.title), p.id);
    }

    // Build unit name → id map (from auth service)
    const unitNameToId = new Map<string, string>();
    try {
      const unitResponse = await this.unitService.getUnits(token, { limit: 1000 });
      const units: any[] = unitResponse.items || [];
      for (const u of units) {
        if (u.name) unitNameToId.set(u.name.trim().toLowerCase(), u.id);
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch units: ${(err as Error).message}`);
    }

    // Parse rows (skip header row 1)
    const result: ImportResult = { totalRows: 0, success: 0, skipped: 0, details: [] };
    const dataRows: { rowNum: number; ikuId: string; programName: string; indicatorName: string; unitName: string; satuan: string }[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const ikuId = String(row.getCell(this.COL_IKU).value ?? '').trim();
      const programName = String(row.getCell(this.COL_PROGRAM).value ?? '').trim();
      const indicatorName = String(row.getCell(this.COL_INDICATOR).value ?? '').trim();
      const unitName = String(row.getCell(this.COL_UNIT).value ?? '').trim();
      const satuan = String(row.getCell(this.COL_SATUAN).value ?? '').trim();
      if (!ikuId && !programName && !indicatorName && !unitName && !satuan) return;
      dataRows.push({ rowNum: rowNumber, ikuId, programName, indicatorName, unitName, satuan });
    });

    result.totalRows = dataRows.length;

    for (const { rowNum, ikuId, programName, indicatorName, unitName, satuan } of dataRows) {
      // 1. Lookup program by (IKU Code + Nama Program) — auto-create it if it doesn't exist yet
      const programKey = this.programKey(ikuId, programName);
      let programId = programKeyToId.get(programKey);
      let programCreated = false;

      if (!programId) {
        if (!programName) {
          result.skipped++;
          result.details.push({
            row: rowNum, ikuId, program: programName, indicator: indicatorName, unit: unitName, satuan,
            status: 'skipped',
            reason: 'Nama Program kosong',
          });
          continue;
        }

        const newProgram = await this.prisma.program.create({
          data: {
            code: this.generateProgramCode(programName),
            ikuId: ikuId || null,
            title: programName,
            year,
            createdBy: userId,
          },
        });
        programId = newProgram.id;
        programCreated = true;
        programKeyToId.set(programKey, programId);
        this.logger.log(`Program "${programName}" (IKU ${ikuId || '-'}) tidak ditemukan, dibuat baru dengan id ${programId}`);
      }

      // 2. Lookup unit by name — skip the row entirely if the unit isn't recognized
      const unitId = unitNameToId.get(unitName.toLowerCase());
      if (!unitId) {
        result.skipped++;
        result.details.push({
          row: rowNum, ikuId, program: programName, indicator: indicatorName, unit: unitName, satuan,
          status: 'skipped',
          reason: `Unit "${unitName}" tidak ditemukan`,
          programCreated,
        });
        continue;
      }

      // 3. Lookup indicator by name + programId — auto-create it if it doesn't exist yet
      const indicator = await this.prisma.programIndicator.findFirst({
        where: { programId, name: { equals: indicatorName } },
      });
      let indicatorCreated = false;
      let satuanCreated = false;

      if (!indicator) {
        if (!indicatorName) {
          result.skipped++;
          result.details.push({
            row: rowNum, ikuId, program: programName, indicator: indicatorName, unit: unitName, satuan,
            status: 'skipped',
            reason: 'Nama Indikator kosong',
            programCreated,
          });
          continue;
        }

        const { unitType, created } = await this.getOrCreateMasterUnitType(satuan);
        satuanCreated = created;

        await this.prisma.programIndicator.create({
          data: {
            programId,
            unitId,
            name: indicatorName,
            masterUnitTypeId: unitType.id,
          },
        });
        indicatorCreated = true;
        this.logger.log(`Indikator "${indicatorName}" tidak ditemukan pada program "${programName}", dibuat baru`);
      } else {
        // Assign existing indicator to unit
        await this.prisma.programIndicator.update({
          where: { id: indicator.id },
          data: { unitId },
        });
      }

      result.success++;
      result.details.push({
        row: rowNum, ikuId, program: programName, indicator: indicatorName, unit: unitName, satuan,
        status: 'success',
        programCreated,
        indicatorCreated,
        satuanCreated,
      });
    }

    this.logger.log(
      `Import done — total: ${result.totalRows}, success: ${result.success}, skipped: ${result.skipped}`,
    );
    return result;
  }

  private programKey(ikuId: string | null | undefined, programName: string): string {
    return `${(ikuId ?? '').trim().toLowerCase()}::${programName.trim().toLowerCase()}`;
  }

  private generateProgramCode(title: string): string {
    const slug = title
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30) || 'PROG';
    return `${slug}-${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Look up a MasterUnitType by its name (the "Satuan" column, e.g. "Mahasiswa",
   * "%", "Dokumen"); auto-create it (defaulting to NUMBER) when it doesn't exist yet.
   */
  private async getOrCreateMasterUnitType(name: string): Promise<{ unitType: MasterUnitType; created: boolean }> {
    const trimmed = name.trim() || 'N/A';
    const cacheKey = trimmed.toLowerCase();

    const cached = this.unitTypeCache.get(cacheKey);
    if (cached) {
      return { unitType: cached, created: false };
    }

    let unitType = await this.prisma.masterUnitType.findFirst({ where: { name: trimmed } });
    let created = false;
    if (!unitType) {
      unitType = await this.prisma.masterUnitType.create({ data: { name: trimmed, type: 'NUMBER' } });
      created = true;
      this.logger.log(`Master unit type "${trimmed}" tidak ditemukan, dibuat baru dengan id ${unitType.id}`);
    }

    this.unitTypeCache.set(cacheKey, unitType);
    return { unitType, created };
  }
}
