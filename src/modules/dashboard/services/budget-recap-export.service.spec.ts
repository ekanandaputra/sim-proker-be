import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Workbook } from 'exceljs';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { BudgetRecapExportService } from './budget-recap-export.service';
import { BudgetRecapService } from './budget-recap.service';
import { BudgetRecapResponseDto } from '../dto/budget-recap.dto';

const indicator = (
  id: string,
  unitId: string,
  budget: number,
  status: 'APPROVED' | 'SUBMITTED',
) => ({
  id,
  name: `Indikator ${id}`,
  category: 'TUSI' as const,
  status,
  budget,
  unitId,
  unitName: unitId === 'unit-a' ? 'Akademik' : 'Bengkel',
  unitCode: unitId === 'unit-a' ? 'AKD' : null,
  program: { id: 'p1', code: 'PRG-1', title: 'Program Satu' },
  pics:
    id === 'i1'
      ? [
          { id: 'u1', name: 'Budi' },
          { id: 'u2', name: 'Siti' },
        ]
      : [],
  rabURL: id === 'i1' ? 'https://files.test/rab-i1.pdf' : null,
  updatedAt: new Date('2026-01-01'),
});

const recap: BudgetRecapResponseDto = {
  year: 2026,
  summary: { totalBudget: 3500, totalIndicators: 3, totalUnits: 2, totalPrograms: 1 },
  statusBreakdown: [
    { status: 'APPROVED', count: 2, percentage: 66.67 },
    { status: 'SUBMITTED', count: 1, percentage: 33.33 },
  ],
  units: [
    {
      unitId: 'unit-b',
      unitName: 'Bengkel',
      unitCode: null,
      indicatorCount: 1,
      programCount: 1,
      totalBudget: 2000,
    },
    {
      unitId: 'unit-a',
      unitName: 'Akademik',
      unitCode: 'AKD',
      indicatorCount: 2,
      programCount: 1,
      totalBudget: 1500,
    },
  ],
  indicators: [
    indicator('i3', 'unit-b', 2000, 'APPROVED'),
    indicator('i1', 'unit-a', 1000, 'APPROVED'),
    indicator('i2', 'unit-a', 500, 'SUBMITTED'),
  ],
};

async function load(buffer: Buffer) {
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  return workbook;
}

/** All non-empty cell values of a sheet, row by row (merged cells counted once). */
function values(workbook: Workbook, sheetName: string): unknown[][] {
  const rows: unknown[][] = [];
  workbook.getWorksheet(sheetName)!.eachRow((row) => {
    const cells: unknown[] = [];
    row.eachCell((cell) => {
      if (cell.isMerged && cell.master !== cell) return;
      if (cell.value !== null && cell.value !== undefined && cell.value !== '')
        cells.push(cell.value);
    });
    rows.push(cells);
  });
  return rows;
}

describe('BudgetRecapExportService', () => {
  const recapService = { getRecap: vi.fn() };
  const user = { userId: 'admin', roles: ['admin_sim_iku'] } as unknown as JwtPayload;
  let service: BudgetRecapExportService;

  beforeEach(() => {
    vi.resetAllMocks();
    recapService.getRecap.mockResolvedValue(recap);
    service = new BudgetRecapExportService(recapService as unknown as BudgetRecapService);
  });

  it('builds a summary sheet followed by one sheet per unit', async () => {
    const query = { year: 2026, status: 'APPROVED' as const };
    const workbook = await load(await service.exportExcel(query, user, 'Bearer t'));

    expect(recapService.getRecap).toHaveBeenCalledWith(query, user, 'Bearer t');
    expect(workbook.worksheets.map((s) => s.name)).toEqual(['Ringkasan', 'Bengkel', 'AKD']);

    const summary = values(workbook, 'Ringkasan');
    expect(summary).toContainEqual(['Filter', 'Status: Disetujui']);
    expect(summary).toContainEqual(['Total Anggaran Diajukan', 3500]);
    expect(summary).toContainEqual([1, 'Disetujui', 2, 66.67]);
    expect(summary).toContainEqual([1, 'Bengkel', '-', 1, 1, 2000]);
    expect(summary).toContainEqual([2, 'Akademik', 'AKD', 1, 2, 1500]);
    expect(summary).toContainEqual(['TOTAL', 1, 3, 3500]);
  });

  it('lists each unit indicators with status, budget, RAB document and total', async () => {
    const workbook = await load(await service.exportExcel({ year: 2026 }, user, 'Bearer t'));
    const unitSheet = values(workbook, 'AKD');

    expect(unitSheet).toContainEqual(['Unit Kerja', ': Akademik']);
    expect(unitSheet).toContainEqual([
      1,
      'PRG-1 - Program Satu',
      'Indikator i1',
      'Tusi',
      'Disetujui',
      1000,
      { text: 'https://files.test/rab-i1.pdf', hyperlink: 'https://files.test/rab-i1.pdf' },
    ]);
    expect(unitSheet).toContainEqual([
      2,
      'PRG-1 - Program Satu',
      'Indikator i2',
      'Tusi',
      'Diajukan',
      500,
      '-',
    ]);
    expect(unitSheet).toContainEqual(['TOTAL', 1500]);
  });
});
