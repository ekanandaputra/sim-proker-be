import { Injectable } from '@nestjs/common';
import * as exceljs from 'exceljs';
import { IndicatorCategory, ProgramStatus } from '@prisma/client';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import {
  CURRENCY_FORMAT,
  addSheetTitle,
  uniqueSheetName,
  writeDataRow,
  writeHeaderRow,
  writeLabelValue,
  writeSectionTitle,
  writeTotalRow,
} from '@common/utils/excel-sheet.util';
import { BudgetRecapService } from './budget-recap.service';
import {
  BudgetRecapIndicatorDto,
  BudgetRecapQuery,
  BudgetRecapResponseDto,
  BudgetRecapUnitDto,
} from '../dto/budget-recap.dto';

export const INDICATOR_CATEGORY_LABELS: Record<IndicatorCategory, string> = {
  TUSI: 'Tusi',
  RUTIN: 'Rutin',
  PENGEMBANGAN: 'Pengembangan',
};

export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  ASSIGNED_TO_UNIT: 'Ditugaskan ke Unit',
  DRAFT: 'Draft',
  SUBMITTED: 'Diajukan',
  REVISION: 'Revisi',
  INDICATOR_APPROVED: 'Indikator Disetujui',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  IN_PROGRESS: 'Berjalan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

const COUNT_FORMAT = '#,##0';
const PERCENT_FORMAT = '0.00"%"';

@Injectable()
export class BudgetRecapExportService {
  constructor(private readonly budgetRecapService: BudgetRecapService) {}

  /**
   * Workbook with a "Ringkasan" sheet (totals, status breakdown, recap per unit) followed by one
   * sheet per unit listing its indicators. Uses the same filters/access rules as the recap endpoint.
   */
  async exportExcel(
    query: BudgetRecapQuery,
    currentUser: JwtPayload,
    token: string,
  ): Promise<Buffer> {
    const recap = await this.budgetRecapService.getRecap(query, currentUser, token);

    const workbook = new exceljs.Workbook();
    workbook.creator = 'SIM PROKER';
    workbook.created = new Date();

    this.buildSummarySheet(workbook, query, recap);

    const indicatorsByUnit = new Map<string, BudgetRecapIndicatorDto[]>();
    for (const ind of recap.indicators) {
      const list = indicatorsByUnit.get(ind.unitId) ?? [];
      list.push(ind);
      indicatorsByUnit.set(ind.unitId, list);
    }

    const usedSheetNames = new Set(['ringkasan']);
    for (const unit of recap.units) {
      this.buildUnitSheet(
        workbook,
        uniqueSheetName(unit.unitCode || unit.unitName, usedSheetNames),
        recap.year,
        unit,
        indicatorsByUnit.get(unit.unitId) ?? [],
      );
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private buildSummarySheet(
    workbook: exceljs.Workbook,
    query: BudgetRecapQuery,
    recap: BudgetRecapResponseDto,
  ) {
    const sheet = workbook.addWorksheet('Ringkasan');
    const lastCol = 6; // No | Unit | Kode | Jumlah Program | Jumlah Indikator | Total Anggaran
    [6, 40, 14, 18, 18, 24].forEach((width, i) => (sheet.getColumn(i + 1).width = width));

    addSheetTitle(sheet, `REKAP ANGGARAN UNIT KERJA TAHUN ${recap.year}`, lastCol);

    const filters = [
      query.unitId ? `Unit: ${recap.units[0]?.unitName ?? query.unitId}` : null,
      query.category ? `Kategori: ${INDICATOR_CATEGORY_LABELS[query.category]}` : null,
      query.status ? `Status: ${PROGRAM_STATUS_LABELS[query.status]}` : null,
    ].filter(Boolean);

    let r = 4;
    writeLabelValue(sheet, r++, 'Filter', filters.length ? filters.join(', ') : 'Semua data', 3);
    writeLabelValue(
      sheet,
      r++,
      'Total Anggaran Diajukan',
      recap.summary.totalBudget,
      3,
      CURRENCY_FORMAT,
    );
    writeLabelValue(sheet, r++, 'Jumlah Unit Pengusul', recap.summary.totalUnits, 3);
    writeLabelValue(sheet, r++, 'Jumlah Program', recap.summary.totalPrograms, 3);
    writeLabelValue(sheet, r++, 'Jumlah Indikator', recap.summary.totalIndicators, 3);
    r++;

    // ── Status pengajuan ─────────────────────────────────────────────────────
    writeSectionTitle(sheet, r++, 'Status Pengajuan');
    writeHeaderRow(sheet, r++, ['No', 'Status', 'Jumlah', 'Persentase']);
    recap.statusBreakdown.forEach((s, i) => {
      writeDataRow(sheet, r, [i + 1, PROGRAM_STATUS_LABELS[s.status], s.count, s.percentage]);
      sheet.getCell(r, 4).numFmt = PERCENT_FORMAT;
      r++;
    });
    writeTotalRow(
      sheet,
      r,
      'TOTAL',
      4,
      [recap.summary.totalIndicators, recap.summary.totalIndicators ? 100 : 0],
      4,
      [COUNT_FORMAT, PERCENT_FORMAT],
    );
    r += 3;

    // ── Per unit ─────────────────────────────────────────────────────────────
    writeSectionTitle(sheet, r++, 'Rekap per Unit');
    writeHeaderRow(sheet, r++, [
      'No',
      'Unit Kerja',
      'Kode Unit',
      'Jumlah Program',
      'Jumlah Indikator',
      'Total Anggaran Diajukan',
    ]);
    recap.units.forEach((unit, i) => {
      writeDataRow(
        sheet,
        r++,
        [
          i + 1,
          unit.unitName,
          unit.unitCode ?? '-',
          unit.programCount,
          unit.indicatorCount,
          unit.totalBudget,
        ],
        [6],
      );
    });
    writeTotalRow(
      sheet,
      r,
      'TOTAL',
      lastCol,
      [recap.summary.totalPrograms, recap.summary.totalIndicators, recap.summary.totalBudget],
      lastCol,
      [COUNT_FORMAT, COUNT_FORMAT],
    );
  }

  private buildUnitSheet(
    workbook: exceljs.Workbook,
    sheetName: string,
    year: number,
    unit: BudgetRecapUnitDto,
    indicators: BudgetRecapIndicatorDto[],
  ) {
    const sheet = workbook.addWorksheet(sheetName);
    const lastCol = 7; // No | Program | Indikator | Kategori | Status | Anggaran | Dokumen RAB
    [6, 40, 45, 16, 20, 22, 50].forEach((width, i) => (sheet.getColumn(i + 1).width = width));

    addSheetTitle(sheet, `RINCIAN ANGGARAN UNIT KERJA TAHUN ${year}`, lastCol);

    let r = 4;
    writeLabelValue(sheet, r++, 'Unit Kerja', `: ${unit.unitName}`);
    writeLabelValue(sheet, r++, 'Kode Unit', `: ${unit.unitCode ?? '-'}`);
    writeLabelValue(sheet, r++, 'Tahun', `: ${year}`);
    r++;

    writeHeaderRow(sheet, r++, [
      'No',
      'Program',
      'Indikator',
      'Kategori',
      'Status',
      'Anggaran',
      'Dokumen RAB',
    ]);
    indicators.forEach((ind, i) => {
      writeDataRow(
        sheet,
        r,
        [
          i + 1,
          `${ind.program.code} - ${ind.program.title}`,
          ind.name,
          INDICATOR_CATEGORY_LABELS[ind.category],
          PROGRAM_STATUS_LABELS[ind.status],
          ind.budget,
          ind.rabURL ?? '-',
        ],
        [6],
      );
      if (ind.rabURL) {
        const cell = sheet.getCell(r, 7);
        cell.value = { text: ind.rabURL, hyperlink: ind.rabURL };
        cell.font = { color: { argb: 'FF0563C1' }, underline: true };
      }
      r++;
    });
    writeTotalRow(sheet, r, 'TOTAL', 6, [unit.totalBudget], lastCol);
  }
}
