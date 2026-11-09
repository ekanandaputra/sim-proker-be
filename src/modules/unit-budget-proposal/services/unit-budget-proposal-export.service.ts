import { Injectable, Logger } from '@nestjs/common';
import * as exceljs from 'exceljs';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { UnitService } from '../../unit/services/unit.service';
import { UnitBudgetProposalService } from './unit-budget-proposal.service';
import {
  UNIT_BUDGET_PROPOSAL_KINDS,
  UNIT_BUDGET_PROPOSAL_KIND_LABELS,
  UnitBudgetProposalResponseDto,
} from '../dto/unit-budget-proposal.dto';

const UNIT_PAGE_LIMIT = 100;
const CURRENCY_FORMAT = '"Rp" #,##0';
const HEADER_FILL: exceljs.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF9BC2E6' },
};
const TOTAL_FILL: exceljs.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDDEBF7' },
};
const BORDER: Partial<exceljs.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

interface UnitProposal {
  unitName: string;
  proposal: UnitBudgetProposalResponseDto;
}

@Injectable()
export class UnitBudgetProposalExportService {
  private readonly logger = new Logger(UnitBudgetProposalExportService.name);

  constructor(
    private readonly unitBudgetProposalService: UnitBudgetProposalService,
    private readonly unitService: UnitService,
  ) {}

  /**
   * Builds a workbook with a "Ringkasan" sheet (grand total, totals per category and a recap per
   * unit) followed by one sheet per unit that has a proposal for the year.
   */
  async exportExcel(year: number, currentUser: JwtPayload, token: string): Promise<Buffer> {
    const proposals = await this.unitBudgetProposalService.findAllForExport(
      year,
      currentUser,
      token,
    );
    const unitNames = await this.getUnitNames(token);

    const rows: UnitProposal[] = proposals
      .map((proposal) => ({
        unitName: unitNames.get(proposal.unitId) ?? proposal.unitId,
        proposal,
      }))
      .sort((a, b) => a.unitName.localeCompare(b.unitName));

    const workbook = new exceljs.Workbook();
    workbook.creator = 'SIM PROKER';
    workbook.created = new Date();

    this.buildSummarySheet(workbook, year, rows);

    const usedSheetNames = new Set(['ringkasan']);
    for (const row of rows) {
      this.buildUnitSheet(workbook, this.uniqueSheetName(row.unitName, usedSheetNames), year, row);
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /** Map of unit ID → unit name across every page of the auth service. Empty on failure. */
  private async getUnitNames(token: string): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    try {
      let page = 1;
      let totalPages = 1;
      do {
        const response = await this.unitService.getUnits(token, { page, limit: UNIT_PAGE_LIMIT });
        for (const unit of response.items ?? []) {
          const id = unit.id ?? unit.unitId;
          const name = unit.name ?? unit.unitName;
          if (id && name) names.set(id, name);
        }
        totalPages = response.pagination?.totalPages ?? 1;
        page++;
      } while (page <= totalPages);
    } catch (err) {
      this.logger.warn(
        `Failed to fetch unit names: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
    return names;
  }

  private buildSummarySheet(workbook: exceljs.Workbook, year: number, rows: UnitProposal[]) {
    const sheet = workbook.addWorksheet('Ringkasan');
    const kindCount = UNIT_BUDGET_PROPOSAL_KINDS.length;
    const lastCol = kindCount + 3; // No | Unit | <kinds> | Total

    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 40;
    for (let c = 3; c <= lastCol; c++) sheet.getColumn(c).width = 22;

    this.addTitle(sheet, `REKAP USULAN ANGGARAN UNIT TAHUN ${year}`, lastCol);

    const grandTotal = rows.reduce((sum, r) => sum + r.proposal.totalValue, 0);
    sheet.getCell('A4').value = 'Total Seluruh Usulan';
    sheet.getCell('A4').font = { bold: true };
    sheet.getCell('C4').value = grandTotal;
    sheet.getCell('C4').numFmt = CURRENCY_FORMAT;
    sheet.getCell('C4').font = { bold: true };
    sheet.getCell('A5').value = 'Jumlah Unit Mengajukan';
    sheet.getCell('A5').font = { bold: true };
    sheet.getCell('C5').value = rows.length;
    sheet.getCell('C5').font = { bold: true };

    // ── Per kategori ──────────────────────────────────────────────────────────
    let r = 7;
    sheet.getCell(r, 1).value = 'Rekap per Kategori';
    sheet.getCell(r, 1).font = { bold: true, size: 11 };
    r++;
    this.writeHeader(sheet, r, ['No', 'Kategori', 'Jumlah Unit', 'Total Nilai']);
    r++;
    UNIT_BUDGET_PROPOSAL_KINDS.forEach((kind, i) => {
      const values = rows.map((row) => row.proposal[`${kind}Value`]);
      const total = values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
      const unitCount = values.filter((v) => (v ?? 0) > 0).length;
      this.writeRow(
        sheet,
        r++,
        [i + 1, UNIT_BUDGET_PROPOSAL_KIND_LABELS[kind], unitCount, total],
        [4],
      );
    });
    this.writeTotalRow(sheet, r, 'TOTAL', 4, [grandTotal]);
    r += 3;

    // ── Per unit ──────────────────────────────────────────────────────────────
    sheet.getCell(r, 1).value = 'Rekap per Unit';
    sheet.getCell(r, 1).font = { bold: true, size: 11 };
    r++;
    this.writeHeader(sheet, r, [
      'No',
      'Unit',
      ...UNIT_BUDGET_PROPOSAL_KINDS.map((kind) => UNIT_BUDGET_PROPOSAL_KIND_LABELS[kind]),
      'Total',
    ]);
    r++;
    const currencyCols = Array.from({ length: kindCount + 1 }, (_, i) => i + 3);
    rows.forEach((row, i) => {
      this.writeRow(
        sheet,
        r++,
        [
          i + 1,
          row.unitName,
          ...UNIT_BUDGET_PROPOSAL_KINDS.map((kind) => row.proposal[`${kind}Value`] ?? 0),
          row.proposal.totalValue,
        ],
        currencyCols,
      );
    });
    this.writeTotalRow(sheet, r, 'TOTAL', lastCol, [
      ...UNIT_BUDGET_PROPOSAL_KINDS.map((kind) =>
        rows.reduce((sum, row) => sum + (row.proposal[`${kind}Value`] ?? 0), 0),
      ),
      grandTotal,
    ]);
  }

  private buildUnitSheet(
    workbook: exceljs.Workbook,
    sheetName: string,
    year: number,
    { unitName, proposal }: UnitProposal,
  ) {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 30;
    sheet.getColumn(3).width = 22;
    sheet.getColumn(4).width = 60;

    this.addTitle(sheet, `USULAN ANGGARAN UNIT TAHUN ${year}`, 4);

    sheet.getCell('A4').value = 'Nama Unit';
    sheet.getCell('A4').font = { bold: true };
    sheet.getCell('B4').value = `: ${unitName}`;
    sheet.getCell('B4').font = { bold: true };
    sheet.getCell('A5').value = 'Tahun';
    sheet.getCell('A5').font = { bold: true };
    sheet.getCell('B5').value = `: ${year}`;
    sheet.getCell('B5').font = { bold: true };

    let r = 7;
    this.writeHeader(sheet, r, ['No', 'Kategori', 'Nilai', 'Dokumen']);
    r++;
    UNIT_BUDGET_PROPOSAL_KINDS.forEach((kind, i) => {
      const url = proposal[`${kind}URL`];
      this.writeRow(
        sheet,
        r,
        [i + 1, UNIT_BUDGET_PROPOSAL_KIND_LABELS[kind], proposal[`${kind}Value`] ?? 0, url ?? '-'],
        [3],
      );
      if (url) {
        const cell = sheet.getCell(r, 4);
        cell.value = { text: url, hyperlink: url };
        cell.font = { color: { argb: 'FF0563C1' }, underline: true };
      }
      r++;
    });
    this.writeTotalRow(sheet, r, 'TOTAL', 3, [proposal.totalValue], 4);
  }

  private addTitle(sheet: exceljs.Worksheet, title: string, lastCol: number) {
    const lines = [title, 'POLITEKNIK PERKAPALAN NEGERI SURABAYA'];
    lines.forEach((text, i) => {
      sheet.mergeCells(i + 1, 1, i + 1, lastCol);
      const cell = sheet.getCell(i + 1, 1);
      cell.value = text;
      cell.font = { bold: true, size: 12 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  }

  private writeHeader(sheet: exceljs.Worksheet, rowNumber: number, labels: string[]) {
    labels.forEach((label, i) => {
      const cell = sheet.getCell(rowNumber, i + 1);
      cell.value = label;
      cell.fill = HEADER_FILL;
      cell.font = { bold: true, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = BORDER;
    });
  }

  private writeRow(
    sheet: exceljs.Worksheet,
    rowNumber: number,
    values: (string | number)[],
    currencyCols: number[],
  ) {
    values.forEach((value, i) => {
      const cell = sheet.getCell(rowNumber, i + 1);
      cell.value = value;
      cell.border = BORDER;
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (i === 0) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (currencyCols.includes(i + 1)) cell.numFmt = CURRENCY_FORMAT;
    });
  }

  /**
   * Writes a bold total row: `label` in a merged cell spanning columns 1..(lastCol - totals.length),
   * the totals right-aligned up to `lastCol`, and blank bordered cells up to `tableWidth`.
   */
  private writeTotalRow(
    sheet: exceljs.Worksheet,
    rowNumber: number,
    label: string,
    lastCol: number,
    totals: number[],
    tableWidth = lastCol,
  ) {
    const firstTotalCol = lastCol - totals.length + 1;
    if (firstTotalCol - 1 > 1) sheet.mergeCells(rowNumber, 1, rowNumber, firstTotalCol - 1);
    sheet.getCell(rowNumber, 1).value = label;
    sheet.getCell(rowNumber, 1).alignment = { horizontal: 'center', vertical: 'middle' };
    totals.forEach((total, i) => {
      const cell = sheet.getCell(rowNumber, firstTotalCol + i);
      cell.value = total;
      cell.numFmt = CURRENCY_FORMAT;
    });
    for (let c = 1; c <= tableWidth; c++) {
      const cell = sheet.getCell(rowNumber, c);
      cell.font = { bold: true };
      cell.fill = TOTAL_FILL;
      cell.border = BORDER;
    }
  }

  /** Excel sheet names: max 31 chars, no []:*?/\ and unique (case-insensitive). */
  private uniqueSheetName(name: string, used: Set<string>): string {
    const base = (
      name
        .replace(/[[\]:*?/\\]/g, ' ')
        .replace(/^'+|'+$/g, '')
        .trim() || 'Unit'
    ).slice(0, 31);
    let candidate = base;
    for (let i = 2; used.has(candidate.toLowerCase()); i++) {
      const suffix = ` (${i})`;
      candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  }
}
