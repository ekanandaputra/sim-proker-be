import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { UnitService } from '../../unit/services/unit.service';
import * as exceljs from 'exceljs';
import { Response } from 'express';

export interface ImportRowDetail {
  row: number;
  program: string;
  indicator: string;
  unit: string;
  status: 'success' | 'skipped';
  reason?: string;
  programCreated?: boolean;
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

  private readonly COL_PROGRAM = 1;
  private readonly COL_INDICATOR = 2;
  private readonly COL_UNIT = 3;

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
      include: { program: { select: { title: true } } },
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

    sheet.getColumn(this.COL_PROGRAM).width = 45;
    sheet.getColumn(this.COL_INDICATOR).width = 55;
    sheet.getColumn(this.COL_UNIT).width = 30;

    const header = sheet.getRow(1);
    header.height = 28;
    header.getCell(this.COL_PROGRAM).value = 'Nama Program';
    header.getCell(this.COL_INDICATOR).value = 'Indikator Unit';
    header.getCell(this.COL_UNIT).value = 'Unit Pelaksana';
    header.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = { bold: true, size: 11 };
      cell.border = border;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    indicators.forEach((ind, idx) => {
      const row = sheet.getRow(idx + 2);
      row.getCell(this.COL_PROGRAM).value = ind.program.title;
      row.getCell(this.COL_INDICATOR).value = ind.name;
      row.getCell(this.COL_UNIT).value = unitNameMap.get(ind.unitId) ?? '';
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
  // ─────────────────────────────────────────────────────────────────────────
  async importFromExcel(
    file: Express.Multer.File,
    token: string,
    userId: string,
    year: number,
  ): Promise<ImportResult> {
    this.logger.log(`Importing assign-indicator from file: ${file.originalname}`);

    const workbook = new exceljs.Workbook();
    const { Readable } = await import('stream');
    const readable = Readable.from(file.buffer);
    await workbook.xlsx.read(readable);

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return { totalRows: 0, success: 0, skipped: 0, details: [] };
    }

    // Build program name → id map
    const allPrograms = await this.prisma.program.findMany({
      select: { id: true, title: true },
    });
    const programNameToId = new Map<string, string>();
    for (const p of allPrograms) {
      programNameToId.set(p.title.trim().toLowerCase(), p.id);
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
    const dataRows: { rowNum: number; programName: string; indicatorName: string; unitName: string }[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const programName = String(row.getCell(this.COL_PROGRAM).value ?? '').trim();
      const indicatorName = String(row.getCell(this.COL_INDICATOR).value ?? '').trim();
      const unitName = String(row.getCell(this.COL_UNIT).value ?? '').trim();
      if (!programName && !indicatorName && !unitName) return;
      dataRows.push({ rowNum: rowNumber, programName, indicatorName, unitName });
    });

    result.totalRows = dataRows.length;

    for (const { rowNum, programName, indicatorName, unitName } of dataRows) {
      // 1. Lookup program by name — auto-create it if it doesn't exist yet
      let programId = programNameToId.get(programName.toLowerCase());
      let programCreated = false;

      if (!programId) {
        if (!programName) {
          result.skipped++;
          result.details.push({
            row: rowNum,
            program: programName,
            indicator: indicatorName,
            unit: unitName,
            status: 'skipped',
            reason: 'Nama Program kosong',
          });
          continue;
        }

        const newProgram = await this.prisma.program.create({
          data: {
            code: this.generateProgramCode(programName),
            title: programName,
            year,
            createdBy: userId,
          },
        });
        programId = newProgram.id;
        programCreated = true;
        programNameToId.set(programName.toLowerCase(), programId);
        this.logger.log(`Program "${programName}" tidak ditemukan, dibuat baru dengan id ${programId}`);
      }

      // 2. Lookup indicator by name + programId
      const indicator = await this.prisma.programIndicator.findFirst({
        where: { programId, name: { equals: indicatorName } },
      });
      if (!indicator) {
        result.skipped++;
        result.details.push({
          row: rowNum,
          program: programName,
          indicator: indicatorName,
          unit: unitName,
          status: 'skipped',
          reason: programCreated
            ? `Program "${programName}" baru dibuat, namun indikator "${indicatorName}" belum ada di dalamnya`
            : `Indikator "${indicatorName}" tidak ditemukan pada program "${programName}"`,
          programCreated,
        });
        continue;
      }

      // 3. Lookup unit by name
      const unitId = unitNameToId.get(unitName.toLowerCase());
      if (!unitId) {
        result.skipped++;
        result.details.push({
          row: rowNum,
          program: programName,
          indicator: indicatorName,
          unit: unitName,
          status: 'skipped',
          reason: `Unit "${unitName}" tidak ditemukan`,
          programCreated,
        });
        continue;
      }

      // 4. Assign indicator to unit
      await this.prisma.programIndicator.update({
        where: { id: indicator.id },
        data: { unitId },
      });

      result.success++;
      result.details.push({
        row: rowNum,
        program: programName,
        indicator: indicatorName,
        unit: unitName,
        status: 'success',
        programCreated,
      });
    }

    this.logger.log(
      `Import done — total: ${result.totalRows}, success: ${result.success}, skipped: ${result.skipped}`,
    );
    return result;
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
}
