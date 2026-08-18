import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { UnitService } from '../../unit/services/unit.service';
import { IkuService } from '../../iku/services/iku.service';
import * as exceljs from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ProgramExportService {
  private readonly logger = new Logger(ProgramExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly unitService: UnitService,
    private readonly ikuService: IkuService,
  ) {}

  async exportProker(unitId: string, year: number, token: string, res: Response) {
    this.logger.log(`Exporting proker for unit: ${unitId}, year: ${year}`);

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
        program: {
          year,
        },
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

    // Setup Columns
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

    // Build Header
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
}
