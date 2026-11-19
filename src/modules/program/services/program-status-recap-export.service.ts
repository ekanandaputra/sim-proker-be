import { Injectable } from '@nestjs/common';
import * as exceljs from 'exceljs';
import { ProgramStatus } from '@prisma/client';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { ACTIVE_PROGRAM_STATUSES, PROGRAM_STATUS_LABELS } from '@common/constants';
import {
  addSheetTitle,
  writeDataRow,
  writeHeaderRow,
  writeLabelValue,
  writeTotalRow,
} from '@common/utils/excel-sheet.util';
import { ProgramStatusRecapService } from './program-status-recap.service';
import { ProgramStatusRecapQuery } from '../dto/program-status-recap.dto';

const STATUSES: readonly ProgramStatus[] = ACTIVE_PROGRAM_STATUSES;
const COUNT_FORMAT = '#,##0';
const UNPROCESSED_FILL: exceljs.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFCE4D6' },
};
const DONE_FILL: exceljs.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE2EFDA' },
};
const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

@Injectable()
export class ProgramStatusRecapExportService {
  constructor(private readonly programStatusRecapService: ProgramStatusRecapService) {}

  /**
   * Workbook with:
   * - "Rekap Status": one row per unit per year with the indicator count per status, highlighting
   *   units that still have programs in ASSIGNED_TO_UNIT (not processed yet);
   * - "Belum Diproses": every program still waiting on its unit.
   */
  async exportExcel(
    query: ProgramStatusRecapQuery,
    currentUser: JwtPayload,
    token: string,
  ): Promise<Buffer> {
    const [recap, unprocessed] = await Promise.all([
      this.programStatusRecapService.getRecap(query, currentUser, token),
      this.programStatusRecapService.findUnprocessed(query, currentUser, token),
    ]);
    const unitNames = new Map(recap.units.map((u) => [u.unitId, u.unitName]));

    const workbook = new exceljs.Workbook();
    workbook.creator = 'SIM PROKER';
    workbook.created = new Date();
    const period = query.year ? `TAHUN ${query.year}` : 'SEMUA TAHUN';

    // ── Sheet 1: Rekap Status ────────────────────────────────────────────────
    const sheet = workbook.addWorksheet('Rekap Status');
    // No | Nama Unit | Tahun | Total | <statuses> | Keterangan
    const firstStatusCol = 5;
    const lastStatusCol = firstStatusCol + STATUSES.length - 1;
    const noteCol = lastStatusCol + 1;

    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 40;
    sheet.getColumn(3).width = 8;
    sheet.getColumn(4).width = 10;
    for (let c = firstStatusCol; c <= lastStatusCol; c++) sheet.getColumn(c).width = 14;
    sheet.getColumn(noteCol).width = 32;

    addSheetTitle(sheet, `REKAP STATUS PROGRAM KERJA UNIT ${period}`, noteCol);

    const assignedOf = (statuses: { status: ProgramStatus; count: number }[]) =>
      statuses.find((s) => s.status === ProgramStatus.ASSIGNED_TO_UNIT)?.count ?? 0;
    const unprocessedRows = recap.units.filter((u) => assignedOf(u.statuses) > 0);

    let r = 4;
    writeLabelValue(sheet, r++, 'Total Program Ditugaskan', `: ${recap.total}`, 3);
    writeLabelValue(sheet, r++, 'Jumlah Unit', `: ${unitNames.size}`, 3);
    writeLabelValue(
      sheet,
      r++,
      'Unit Belum Memproses',
      `: ${new Set(unprocessedRows.map((u) => u.unitId)).size} unit (${unprocessed.length} program)`,
      3,
    );
    r++;

    writeHeaderRow(sheet, r, [
      'No',
      'Nama Unit',
      'Tahun',
      'Total',
      ...STATUSES.map((status) => PROGRAM_STATUS_LABELS[status]),
      'Keterangan',
    ]);
    sheet.getRow(r).height = 30;
    r++;

    recap.units.forEach((row, i) => {
      const pending = assignedOf(row.statuses);
      writeDataRow(sheet, r, [
        i + 1,
        row.unitName,
        row.year,
        row.total,
        ...row.statuses.map((s) => s.count),
        pending > 0 ? `Belum memproses ${pending} program` : 'Semua program sudah diproses',
      ]);
      for (let c = 3; c <= lastStatusCol; c++) {
        sheet.getCell(r, c).alignment = { horizontal: 'center', vertical: 'middle' };
      }
      const note = sheet.getCell(r, noteCol);
      note.fill = pending > 0 ? UNPROCESSED_FILL : DONE_FILL;
      if (pending > 0) {
        note.font = { bold: true, color: { argb: 'FFC00000' } };
        sheet.getCell(r, firstStatusCol).fill = UNPROCESSED_FILL;
      }
      r++;
    });

    const totals = [recap.total, ...recap.statuses.map((s) => s.count)];
    writeTotalRow(
      sheet,
      r,
      'TOTAL',
      lastStatusCol,
      totals,
      noteCol,
      totals.map(() => COUNT_FORMAT),
    );
    sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 8 }];

    // ── Sheet 2: Belum Diproses ──────────────────────────────────────────────
    const pendingSheet = workbook.addWorksheet('Belum Diproses');
    const widths = [6, 40, 8, 16, 50, 50, 18];
    widths.forEach((w, i) => (pendingSheet.getColumn(i + 1).width = w));
    addSheetTitle(pendingSheet, `PROGRAM BELUM DIPROSES UNIT ${period}`, widths.length);

    r = 4;
    writeHeaderRow(pendingSheet, r++, [
      'No',
      'Nama Unit',
      'Tahun',
      'Kode Program',
      'Judul Program',
      'Indikator',
      'Ditugaskan Sejak',
    ]);

    const pendingRows = unprocessed
      .map((ind) => ({ ...ind, unitName: unitNames.get(ind.unitId) ?? ind.unitId }))
      .sort(
        (a, b) =>
          a.unitName.localeCompare(b.unitName) ||
          a.program.year - b.program.year ||
          a.program.code.localeCompare(b.program.code),
      );

    if (pendingRows.length === 0) {
      pendingSheet.mergeCells(r, 1, r, widths.length);
      const cell = pendingSheet.getCell(r, 1);
      cell.value = 'Semua program sudah diproses oleh unit';
      cell.alignment = { horizontal: 'center' };
      cell.fill = DONE_FILL;
    }
    pendingRows.forEach((row, i) => {
      writeDataRow(pendingSheet, r, [
        i + 1,
        row.unitName,
        row.program.year,
        row.program.code,
        row.program.title,
        row.name,
        dateFormatter.format(row.createdAt),
      ]);
      pendingSheet.getCell(r, 3).alignment = { horizontal: 'center', vertical: 'middle' };
      r++;
    });
    pendingSheet.views = [{ state: 'frozen', ySplit: 4 }];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
