import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { UnitService } from '../../unit/services/unit.service';
import { IkuService } from '../../iku/services/iku.service';
import * as exceljs from 'exceljs';
import { Response } from 'express';
import * as path from 'path';

export type ExportProkerType = 'USULAN' | 'FINAL' | 'BERITA_ACARA';

@Injectable()
export class ProgramExportService {
  private readonly logger = new Logger(ProgramExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly unitService: UnitService,
    private readonly ikuService: IkuService,
  ) {}

  async exportProker(
    unitId: string,
    year: number,
    type: ExportProkerType = 'USULAN',
    token: string,
    res: Response,
  ) {
    this.logger.log(`Exporting proker for unit: ${unitId}, year: ${year}, type: ${type}`);

    if (type === 'FINAL') {
      return this.exportFinal(unitId, year, token, res);
    }

    if (type === 'BERITA_ACARA') {
      return this.exportBeritaAcara(unitId, year, token, res);
    }

    // ── USULAN (default) ────────────────────────────────────────────────────
    return this.exportUsulan(unitId, year, token, res);
  }

  // ── Private: USULAN ────────────────────────────────────────────────────────
  private async exportUsulan(unitId: string, year: number, token: string, res: Response) {
    // Fetch Unit Name
    let unitName = 'Semua Unit';
    if (unitId) {
      try {
        const unitInfo = await this.unitService.getUnitById(unitId, token);
        unitName = unitInfo.name || unitInfo.unitName || unitId;
      } catch (err) {
        this.logger.warn(`Could not fetch unit name for ${unitId}`);
      }
    }

    // Fetch IKUs
    let ikuList: any[] = [];
    try {
      const ikuResponse = await this.ikuService.getAllIkus(token, { page: 1, limit: 1000 });
      ikuList = ikuResponse.items || [];
    } catch (err) {
      this.logger.warn(`Could not fetch IKUs`);
    }
    const ikuMap = new Map(ikuList.map(i => [i.id, i.name]));

    // Fetch Indicators matching the filter
    const indicators = await this.prisma.programIndicator.findMany({
      where: {
        ...(unitId ? { unitId } : {}),
        program: { year },
      },
      include: {
        program: true,
        masterUnitType: true,
      },
      orderBy: [
        { program: { title: 'asc' } },
        { order: 'asc' },
      ],
    });

    // Map default programs to get IKU IDs
    const defaultPrograms = await this.prisma.defaultProgram.findMany({});
    const titleToIkuId = new Map(defaultPrograms.map(dp => [dp.title, dp.ikuId]));

    // Generate Workbook
    const workbook = new exceljs.Workbook();
    workbook.creator = 'SIM PROKER';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Usulan Proker');
    await addLogoToSheet(workbook, sheet, 'J1:J3');

    sheet.columns = [
      { key: 'sasaran', width: 25 },
      { key: 'iku', width: 40 },
      { key: 'strategi', width: 40 },
      { key: 'indikator', width: 40 },
      { key: 'targetTahunan', width: 15 },
      { key: 'satuan', width: 15 },
      { key: 'q1', width: 20 },
      { key: 'q2', width: 20 },
      { key: 'q3', width: 20 },
      { key: 'q4', width: 20 },
    ];

    sheet.mergeCells('A1:J1');
    const titleCell1 = sheet.getCell('A1');
    titleCell1.value = `USULAN PROGRAM KERJA UNIT TAHUN ${year}`;
    titleCell1.font = { bold: true, size: 12 };
    titleCell1.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A2:J2');
    const titleCell2 = sheet.getCell('A2');
    titleCell2.value = `POLITEKNIK PERKAPALAN NEGERI SURABAYA`;
    titleCell2.font = { bold: true, size: 12 };
    titleCell2.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.getCell('A4').value = 'Nama Unit Kerja';
    sheet.getCell('A4').font = { bold: true };
    sheet.getCell('B4').value = `: ${unitName}`;
    sheet.getCell('B4').font = { bold: true };

    sheet.getCell('A5').value = 'Tahun';
    sheet.getCell('A5').font = { bold: true };
    sheet.getCell('B5').value = `: ${year}`;
    sheet.getCell('B5').font = { bold: true };

    const headerFill: exceljs.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9BC2E6' },
    };

    const borderStyle: Partial<exceljs.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    const headerFont = { bold: true, size: 10 };
    const headerAlign: Partial<exceljs.Alignment> = { horizontal: 'center', vertical: 'middle', wrapText: true };

    sheet.mergeCells('A6:A7');
    sheet.getCell('A6').value = 'SASARAN\nPROGRAM';

    sheet.mergeCells('B6:B7');
    sheet.getCell('B6').value = 'IKU';

    sheet.mergeCells('C6:C7');
    sheet.getCell('C6').value = 'STRATEGI PELAKSANAAN';

    sheet.mergeCells('D6:D7');
    sheet.getCell('D6').value = 'INDIKATOR';

    sheet.mergeCells('E6:E7');
    sheet.getCell('E6').value = 'TARGET\nTAHUNAN';

    sheet.mergeCells('F6:F7');
    sheet.getCell('F6').value = 'SATUAN';

    sheet.mergeCells('G6:J6');
    sheet.getCell('G6').value = 'TARGET TRIWULAN DAN BULAN PELAKSANAAN';

    sheet.getCell('G7').value = 'Triwulan I (Januari sd Maret)';
    sheet.getCell('H7').value = 'Triwulan II (April-Juni)';
    sheet.getCell('I7').value = 'Triwulan III (Juli-September)';
    sheet.getCell('J7').value = 'Triwulan IV (Oktober-Desember)';

    for (let r = 6; r <= 7; r++) {
      for (let c = 1; c <= 10; c++) {
        const cell = sheet.getCell(r, c);
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = headerAlign;
        cell.border = borderStyle;
      }
    }

    let currentRow = 8;
    for (const ind of indicators) {
      const q1 = ind.targetQ1 ? Number(ind.targetQ1) : 0;
      const q2 = ind.targetQ2 ? Number(ind.targetQ2) : 0;
      const q3 = ind.targetQ3 ? Number(ind.targetQ3) : 0;
      const q4 = ind.targetQ4 ? Number(ind.targetQ4) : 0;
      const targetTahunan = q1 + q2 + q3 + q4;

      const ikuId = titleToIkuId.get(ind.program.title);
      const ikuName = ikuId ? ikuMap.get(ikuId) || '-' : '-';

      const row = sheet.getRow(currentRow);
      row.values = {
        sasaran: ind.category,
        iku: ikuName,
        strategi: ind.program.title,
        indikator: ind.name,
        targetTahunan: targetTahunan,
        satuan: ind.masterUnitType.name,
        q1: ind.targetQ1 ? Number(ind.targetQ1) : '',
        q2: ind.targetQ2 ? Number(ind.targetQ2) : '',
        q3: ind.targetQ3 ? Number(ind.targetQ3) : '',
        q4: ind.targetQ4 ? Number(ind.targetQ4) : '',
      };

      for (let c = 1; c <= 10; c++) {
        const cell = row.getCell(c);
        cell.border = borderStyle;
        cell.alignment = { vertical: 'middle', wrapText: true };

        if (c >= 5) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
      currentRow++;
    }

    currentRow += 2;
    sheet.getCell(`H${currentRow}`).value = `Surabaya, ..................`;
    sheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center' };

    currentRow += 4;
    sheet.getCell(`H${currentRow}`).value = `Ka Unit`;
    sheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center' };

    currentRow++;
    sheet.getCell(`H${currentRow}`).value = `NIP ........................`;
    sheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center' };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Usulan_Program_Kerja_${unitName.replace(/\s+/g, '_')}_${year}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  }

  // ── Private: FINAL ─────────────────────────────────────────────────────────
  private async exportFinal(unitId: string, year: number, token: string, res: Response) {
    // Fetch Unit Name
    let unitName = 'Semua Unit';
    if (unitId) {
      try {
        const unitInfo = await this.unitService.getUnitById(unitId, token);
        unitName = unitInfo.name || unitInfo.unitName || unitId;
      } catch (err) {
        this.logger.warn(`Could not fetch unit name for ${unitId}`);
      }
    }

    // Fetch IKUs
    let ikuList: any[] = [];
    try {
      const ikuResponse = await this.ikuService.getAllIkus(token, { page: 1, limit: 1000 });
      ikuList = ikuResponse.items || [];
    } catch (err) {
      this.logger.warn(`Could not fetch IKUs`);
    }
    const ikuMap = new Map(ikuList.map(i => [i.id, i.name]));

    // Fetch only APPROVED indicators
    const indicators = await this.prisma.programIndicator.findMany({
      where: {
        ...(unitId ? { unitId } : {}),
        program: { year },
        status: 'APPROVED',
      },
      include: {
        program: true,
        masterUnitType: true,
      },
      orderBy: [
        { program: { title: 'asc' } },
        { order: 'asc' },
      ],
    });

    // Map default programs to get IKU IDs
    const defaultPrograms = await this.prisma.defaultProgram.findMany({});
    const titleToIkuId = new Map(defaultPrograms.map(dp => [dp.title, dp.ikuId]));

    // Generate Workbook
    const workbook = new exceljs.Workbook();
    workbook.creator = 'SIM PROKER';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Program Kerja');
    await addLogoToSheet(workbook, sheet, 'J1:J3');

    sheet.columns = [
      { key: 'sasaran', width: 25 },
      { key: 'iku', width: 40 },
      { key: 'strategi', width: 40 },
      { key: 'indikator', width: 40 },
      { key: 'targetTahunan', width: 15 },
      { key: 'satuan', width: 15 },
      { key: 'q1', width: 20 },
      { key: 'q2', width: 20 },
      { key: 'q3', width: 20 },
      { key: 'q4', width: 20 },
    ];

    sheet.mergeCells('A1:J1');
    const titleCell1 = sheet.getCell('A1');
    titleCell1.value = `PROGRAM KERJA UNIT TAHUN ${year}`;
    titleCell1.font = { bold: true, size: 12 };
    titleCell1.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A2:J2');
    const titleCell2 = sheet.getCell('A2');
    titleCell2.value = `POLITEKNIK PERKAPALAN NEGERI SURABAYA`;
    titleCell2.font = { bold: true, size: 12 };
    titleCell2.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.getCell('A4').value = 'Nama Unit Kerja';
    sheet.getCell('A4').font = { bold: true };
    sheet.getCell('B4').value = `: ${unitName}`;
    sheet.getCell('B4').font = { bold: true };

    sheet.getCell('A5').value = 'Tahun';
    sheet.getCell('A5').font = { bold: true };
    sheet.getCell('B5').value = `: ${year}`;
    sheet.getCell('B5').font = { bold: true };

    const headerFill: exceljs.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9BC2E6' },
    };

    const borderStyle: Partial<exceljs.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    const headerFont = { bold: true, size: 10 };
    const headerAlign: Partial<exceljs.Alignment> = { horizontal: 'center', vertical: 'middle', wrapText: true };

    sheet.mergeCells('A6:A7');
    sheet.getCell('A6').value = 'SASARAN\nPROGRAM';

    sheet.mergeCells('B6:B7');
    sheet.getCell('B6').value = 'IKU';

    sheet.mergeCells('C6:C7');
    sheet.getCell('C6').value = 'STRATEGI PELAKSANAAN';

    sheet.mergeCells('D6:D7');
    sheet.getCell('D6').value = 'INDIKATOR';

    sheet.mergeCells('E6:E7');
    sheet.getCell('E6').value = 'JUMLAH';

    sheet.mergeCells('F6:F7');
    sheet.getCell('F6').value = 'SATUAN';

    sheet.mergeCells('G6:J6');
    sheet.getCell('G6').value = 'TARGET DAN BULAN PELAKSANAAN';

    sheet.getCell('G7').value = 'Triwulan I\n(Januari sd Maret)';
    sheet.getCell('H7').value = 'Triwulan II\n(April-Juni)';
    sheet.getCell('I7').value = 'Triwulan III\n(Juli-September)';
    sheet.getCell('J7').value = 'Triwulan IV\n(Oktober-Desember)';

    for (let r = 6; r <= 7; r++) {
      for (let c = 1; c <= 10; c++) {
        const cell = sheet.getCell(r, c);
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = headerAlign;
        cell.border = borderStyle;
      }
    }

    let currentRow = 8;
    for (const ind of indicators) {
      const q1 = ind.targetQ1 ? Number(ind.targetQ1) : 0;
      const q2 = ind.targetQ2 ? Number(ind.targetQ2) : 0;
      const q3 = ind.targetQ3 ? Number(ind.targetQ3) : 0;
      const q4 = ind.targetQ4 ? Number(ind.targetQ4) : 0;
      const targetTahunan = q1 + q2 + q3 + q4;

      const ikuId = titleToIkuId.get(ind.program.title);
      const ikuName = ikuId ? ikuMap.get(ikuId) || '-' : '-';

      const row = sheet.getRow(currentRow);
      row.values = {
        sasaran: ind.category,
        iku: ikuName,
        strategi: ind.program.title,
        indikator: ind.name,
        targetTahunan: targetTahunan,
        satuan: ind.masterUnitType.name,
        q1: ind.targetQ1 ? Number(ind.targetQ1) : '',
        q2: ind.targetQ2 ? Number(ind.targetQ2) : '',
        q3: ind.targetQ3 ? Number(ind.targetQ3) : '',
        q4: ind.targetQ4 ? Number(ind.targetQ4) : '',
      };

      for (let c = 1; c <= 10; c++) {
        const cell = row.getCell(c);
        cell.border = borderStyle;
        cell.alignment = { vertical: 'middle', wrapText: true };

        if (c >= 5) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
      currentRow++;
    }

    currentRow += 2;
    sheet.getCell(`H${currentRow}`).value = `Surabaya, ..................`;
    sheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center' };

    currentRow += 4;
    sheet.getCell(`H${currentRow}`).value = `Ka Unit`;
    sheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center' };

    currentRow++;
    sheet.getCell(`H${currentRow}`).value = `NIP ........................`;
    sheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center' };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Program_Kerja_${unitName.replace(/\s+/g, '_')}_${year}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  }

  // ── Private: BERITA_ACARA ──────────────────────────────────────────────────
  private async exportBeritaAcara(unitId: string, year: number, token: string, res: Response) {
    // Fetch Unit Name
    let unitName = '';
    if (unitId) {
      try {
        const unitInfo = await this.unitService.getUnitById(unitId, token);
        unitName = unitInfo.name || unitInfo.unitName || unitId;
      } catch (err) {
        this.logger.warn(`Could not fetch unit name for ${unitId}`);
        unitName = unitId;
      }
    }

    // Build Indonesian date strings from current date
    const now = new Date();
    const dayName   = ID_DAYS[now.getDay()];                   // e.g. "Sabtu"
    const dateWord  = numberToIdWords(now.getDate());           // e.g. "Sepuluh"
    const monthName = ID_MONTHS[now.getMonth()];                // e.g. "Januari"
    const yearWord  = numberToIdWords(now.getFullYear());       // e.g. "Dua Ribu Dua Puluh Enam"

    const workbook = new exceljs.Workbook();
    workbook.creator = 'SIM PROKER';
    workbook.created = now;

    const sheet = workbook.addWorksheet('Berita Acara');
    await addLogoToSheet(workbook, sheet, 'A1:A4');

    // Column widths — roughly match the screenshot layout
    sheet.columns = [
      { key: 'A', width: 12 },
      { key: 'B', width: 12 },
      { key: 'C', width: 12 },
      { key: 'D', width: 12 },
      { key: 'E', width: 12 },
      { key: 'F', width: 12 },
      { key: 'G', width: 12 },
      { key: 'H', width: 12 },
      { key: 'I', width: 12 },
      { key: 'J', width: 12 },
      { key: 'K', width: 12 },
      { key: 'L', width: 12 },
      { key: 'M', width: 12 },
      { key: 'N', width: 12 },
      { key: 'O', width: 12 },
    ];

    const boldFont      = { bold: true, size: 11 };
    const normalFont    = { bold: false, size: 11 };
    const centerAlign: Partial<exceljs.Alignment> = { horizontal: 'center', vertical: 'middle' };

    // ── Row 1: Title ────────────────────────────────────────────────────────
    sheet.mergeCells('B1:O1');
    const titleCell = sheet.getCell('B1');
    titleCell.value = `BERITA ACARA PERSETUJUAN PROGRAM KERJA UNIT TAHUN ${year}`;
    titleCell.font = boldFont;
    titleCell.alignment = centerAlign;

    // ── Rows 2–4: leave space for logo area ─────────────────────────────────
    sheet.getRow(1).height = 20;
    sheet.getRow(2).height = 15;
    sheet.getRow(3).height = 15;
    sheet.getRow(4).height = 30;

    // ── Row 5: Opening sentence (rich text with bold parts) ─────────────────
    sheet.mergeCells('A5:O5');
    sheet.getCell('A5').value = {
      richText: [
        { text: 'Pada hari ini ', font: normalFont },
        { text: dayName, font: boldFont },
        { text: ', tanggal ', font: normalFont },
        { text: dateWord, font: boldFont },
        { text: ' Bulan ', font: normalFont },
        { text: monthName, font: boldFont },
        { text: ' Tahun ', font: normalFont },
        { text: yearWord, font: boldFont },
        { text: ', telah dilakukan pembahasan dan', font: normalFont },
      ],
    };
    sheet.getCell('A5').alignment = { vertical: 'middle', wrapText: true };

    // ── Row 6: "verifikasi program kerja untuk Unit : <unitName>" ─────────────
    sheet.mergeCells('A6:O6');
    sheet.getCell('A6').value = {
      richText: [
        { text: 'verifikasi program kerja untuk Unit', font: normalFont },
        { text: '  :  ', font: normalFont },
        { text: unitName, font: boldFont },
      ],
    };
    sheet.getCell('A6').alignment = { vertical: 'middle', wrapText: true };

    // ── Row 7: blank ─────────────────────────────────────────────────────────

    // ── Row 8: Body paragraph (line 1) ───────────────────────────────────────
    sheet.mergeCells('A8:O8');
    sheet.getCell('A8').value =
      `Program kerja terlampir telah selaras dengan Kontrak Kinerja PPNS Tahun ${year}, dan telah mendapatkan persetujuan untuk dimonitor`;
    sheet.getCell('A8').font = normalFont;
    sheet.getCell('A8').alignment = { vertical: 'middle', wrapText: true };

    // ── Row 9: Body paragraph (line 2) ───────────────────────────────────────
    sheet.mergeCells('A9:O9');
    sheet.getCell('A9').value = 'pencapaiannya per Semester.';
    sheet.getCell('A9').font = normalFont;

    // ── Row 10: closing ───────────────────────────────────────────────────────
    sheet.mergeCells('A10:O10');
    sheet.getCell('A10').value = 'Demikian berita acara ini dibuat untuk dipergunakan dengan sebaik-baiknya.';
    sheet.getCell('A10').font = normalFont;

    // ── Rows 11–11: blank ────────────────────────────────────────────────────

    // ── Row 12: Signature labels ──────────────────────────────────────────────
    sheet.getRow(12).height = 18;
    sheet.mergeCells('A12:E12');
    sheet.getCell('A12').value = 'Direktur PPNS';
    sheet.getCell('A12').font = boldFont;

    sheet.mergeCells('H12:L12');
    sheet.getCell('H12').value = {
      richText: [
        { text: 'Kepala Unit', font: boldFont },
        { text: '  :', font: normalFont },
      ],
    };

    // ── Rows 13–16: signature space ───────────────────────────────────────────
    [13, 14, 15, 16].forEach(r => { sheet.getRow(r).height = 18; });

    // ── Row 17: Names ─────────────────────────────────────────────────────────
    sheet.getRow(17).height = 18;
    sheet.mergeCells('A17:E17');
    sheet.getCell('A17').value = 'Rachmad Tri Soelistijono, ST., MT.';
    sheet.getCell('A17').font = boldFont;

    sheet.mergeCells('H17:O17');
    sheet.getCell('H17').value = unitName || 'Prof. Dr. Eng. Mohammad Abu Jami\'in, S.T., M.T.';
    sheet.getCell('H17').font = boldFont;

    // ── Row 18: NIPs ─────────────────────────────────────────────────────────
    sheet.getRow(18).height = 18;
    sheet.mergeCells('A18:E18');
    sheet.getCell('A18').value = 'NIP. 196811091995121001';
    sheet.getCell('A18').font = normalFont;

    sheet.mergeCells('H18:O18');
    sheet.getCell('H18').value = 'NIP. 197505302001121004';
    sheet.getCell('H18').font = normalFont;

    // ── Download ──────────────────────────────────────────────────────────────
    const safeName = unitName ? unitName.replace(/\s+/g, '_') : 'Unit';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=\"Berita_Acara_${safeName}_${year}.xlsx\"`);

    await workbook.xlsx.write(res);
    res.end();
  }
}

// ── Indonesian date helpers (module-level) ─────────────────────────────────

const ID_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const ONES = [
  '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
  'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh',
  'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas',
  'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas',
];
const TENS = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh',
  'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];

function numberToIdWords(n: number): string {
  if (n === 0) return 'Nol';
  if (n < 0) return 'Minus ' + numberToIdWords(-n);
  if (n < 20) return ONES[n];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const one = n % 10;
    return one === 0 ? TENS[ten] : `${TENS[ten]} ${ONES[one]}`;
  }
  if (n < 200) return 'Seratus' + (n % 100 === 0 ? '' : ' ' + numberToIdWords(n % 100));
  if (n < 1000) {
    const h = Math.floor(n / 100);
    return `${ONES[h]} Ratus` + (n % 100 === 0 ? '' : ' ' + numberToIdWords(n % 100));
  }
  if (n < 2000) return 'Seribu' + (n % 1000 === 0 ? '' : ' ' + numberToIdWords(n % 1000));
  if (n < 1_000_000) {
    const th = Math.floor(n / 1000);
    return `${numberToIdWords(th)} Ribu` + (n % 1000 === 0 ? '' : ' ' + numberToIdWords(n % 1000));
  }
  return n.toString();
}

/**
 * Embeds the PPNS logo into a worksheet at the given cell range (e.g. 'J1:J3').
 * The range is specified as a string like 'A1:B4' which will be parsed into
 * top-left / bottom-right cell references.
 */
async function addLogoToSheet(
  workbook: exceljs.Workbook,
  sheet: exceljs.Worksheet,
  cellRange: string,
): Promise<void> {
  try {
    const logoPath = path.join(__dirname, '..', '..', '..', 'assets', 'ppns-logo.jpg');
    const imageId = workbook.addImage({ filename: logoPath, extension: 'jpeg' });
    // Use cell-range string overload — no Anchor type required
    sheet.addImage(imageId, cellRange);
  } catch (err) {
    // If logo file is missing or fails, skip silently
  }
}
