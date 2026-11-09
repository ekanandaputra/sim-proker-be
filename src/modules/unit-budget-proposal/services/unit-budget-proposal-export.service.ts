import { Injectable, Logger } from '@nestjs/common';
import * as exceljs from 'exceljs';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import {
  CURRENCY_FORMAT,
  addSheetTitle,
  uniqueSheetName,
  writeDataRow,
  writeHeaderRow,
  writeTotalRow,
} from '@common/utils/excel-sheet.util';
import { UnitService } from '../../unit/services/unit.service';
import { UnitBudgetProposalService } from './unit-budget-proposal.service';
import {
  UNIT_BUDGET_PROPOSAL_KINDS,
  UNIT_BUDGET_PROPOSAL_KIND_LABELS,
  UnitBudgetProposalResponseDto,
} from '../dto/unit-budget-proposal.dto';

const UNIT_PAGE_LIMIT = 100;

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
      this.buildUnitSheet(workbook, uniqueSheetName(row.unitName, usedSheetNames), year, row);
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

    addSheetTitle(sheet, `REKAP USULAN ANGGARAN UNIT TAHUN ${year}`, lastCol);

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
    writeHeaderRow(sheet, r, ['No', 'Kategori', 'Jumlah Unit', 'Total Nilai']);
    r++;
    UNIT_BUDGET_PROPOSAL_KINDS.forEach((kind, i) => {
      const values = rows.map((row) => row.proposal[`${kind}Value`]);
      const total = values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
      const unitCount = values.filter((v) => (v ?? 0) > 0).length;
      writeDataRow(
        sheet,
        r++,
        [i + 1, UNIT_BUDGET_PROPOSAL_KIND_LABELS[kind], unitCount, total],
        [4],
      );
    });
    writeTotalRow(sheet, r, 'TOTAL', 4, [grandTotal]);
    r += 3;

    // ── Per unit ──────────────────────────────────────────────────────────────
    sheet.getCell(r, 1).value = 'Rekap per Unit';
    sheet.getCell(r, 1).font = { bold: true, size: 11 };
    r++;
    writeHeaderRow(sheet, r, [
      'No',
      'Unit',
      ...UNIT_BUDGET_PROPOSAL_KINDS.map((kind) => UNIT_BUDGET_PROPOSAL_KIND_LABELS[kind]),
      'Total',
    ]);
    r++;
    const currencyCols = Array.from({ length: kindCount + 1 }, (_, i) => i + 3);
    rows.forEach((row, i) => {
      writeDataRow(
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
    writeTotalRow(sheet, r, 'TOTAL', lastCol, [
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

    addSheetTitle(sheet, `USULAN ANGGARAN UNIT TAHUN ${year}`, 4);

    sheet.getCell('A4').value = 'Nama Unit';
    sheet.getCell('A4').font = { bold: true };
    sheet.getCell('B4').value = `: ${unitName}`;
    sheet.getCell('B4').font = { bold: true };
    sheet.getCell('A5').value = 'Tahun';
    sheet.getCell('A5').font = { bold: true };
    sheet.getCell('B5').value = `: ${year}`;
    sheet.getCell('B5').font = { bold: true };

    let r = 7;
    writeHeaderRow(sheet, r, ['No', 'Kategori', 'Nilai', 'Dokumen']);
    r++;
    UNIT_BUDGET_PROPOSAL_KINDS.forEach((kind, i) => {
      const url = proposal[`${kind}URL`];
      writeDataRow(
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
    writeTotalRow(sheet, r, 'TOTAL', 3, [proposal.totalValue], 4);
  }
}
