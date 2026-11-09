import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Workbook } from 'exceljs';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { UnitBudgetProposalExportService } from './unit-budget-proposal-export.service';
import { UnitBudgetProposalService } from './unit-budget-proposal.service';
import { UnitService } from '../../unit/services/unit.service';

const proposal = (unitId: string, values: Partial<Record<string, number | null>>) => {
  const base = {
    perbaikanValue: null,
    bahanHabisValue: null,
    peralatanValue: null,
    pelatihanValue: null,
    meubelairValue: null,
    ...values,
  };
  return {
    id: `p-${unitId}`,
    unitId,
    year: 2026,
    perbaikanURL: unitId === 'unit-b' ? 'http://files/perbaikan.pdf' : null,
    bahanHabisURL: null,
    peralatanURL: null,
    pelatihanURL: null,
    meubelairURL: null,
    ...base,
    totalValue: Object.values(base).reduce<number>((s, v) => s + (v ?? 0), 0),
  };
};

async function load(buffer: Buffer) {
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  return workbook;
}

describe('UnitBudgetProposalExportService', () => {
  const proposals = { findAllForExport: vi.fn() };
  const units = { getUnits: vi.fn() };
  const user = { userId: 'admin', roles: ['ADMIN'] } as unknown as JwtPayload;
  let service: UnitBudgetProposalExportService;

  beforeEach(() => {
    vi.resetAllMocks();
    proposals.findAllForExport.mockResolvedValue([
      proposal('unit-b', { perbaikanValue: 1000, peralatanValue: 500 }),
      proposal('unit-a', { perbaikanValue: 200, meubelairValue: 300 }),
    ]);
    units.getUnits
      .mockResolvedValueOnce({
        items: [{ id: 'unit-b', name: 'Bengkel' }],
        pagination: { totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: [{ id: 'unit-a', name: 'Akademik' }],
        pagination: { totalPages: 2 },
      });
    service = new UnitBudgetProposalExportService(
      proposals as unknown as UnitBudgetProposalService,
      units as unknown as UnitService,
    );
  });

  it('builds a summary sheet plus one sheet per unit sorted by name', async () => {
    const workbook = await load(await service.exportExcel(2026, user, 'Bearer token'));

    expect(proposals.findAllForExport).toHaveBeenCalledWith(2026, user, 'Bearer token');
    expect(units.getUnits).toHaveBeenLastCalledWith('Bearer token', { page: 2, limit: 100 });
    expect(workbook.worksheets.map((s) => s.name)).toEqual(['Ringkasan', 'Akademik', 'Bengkel']);

    const summary = workbook.getWorksheet('Ringkasan')!;
    expect(summary.getCell('C4').value).toBe(2000);
    expect(summary.getCell('C5').value).toBe(2);
    // Per kategori: rows 9..13, total row 14
    expect(summary.getCell('B9').value).toBe('Usulan Perbaikan');
    expect(summary.getCell('C9').value).toBe(2); // two units proposed perbaikan
    expect(summary.getCell('D9').value).toBe(1200);
    expect(summary.getCell('D11').value).toBe(500);
    expect(summary.getCell('D13').value).toBe(300);
    expect(summary.getCell('D14').value).toBe(2000);
    // Per unit: header row 18, data rows 19..20, total row 21
    expect(summary.getCell('B19').value).toBe('Akademik');
    expect(summary.getCell('H19').value).toBe(500);
    expect(summary.getCell('B20').value).toBe('Bengkel');
    expect(summary.getCell('H21').value).toBe(2000);

    const bengkel = workbook.getWorksheet('Bengkel')!;
    expect(bengkel.getCell('B4').value).toBe(': Bengkel');
    expect(bengkel.getCell('C8').value).toBe(1000);
    expect(bengkel.getCell('D8').value).toMatchObject({ hyperlink: 'http://files/perbaikan.pdf' });
    expect(bengkel.getCell('C13').value).toBe(1500);
  });

  it('falls back to unit IDs and sanitises duplicate or invalid sheet names', async () => {
    units.getUnits.mockReset().mockRejectedValue(new Error('down'));
    proposals.findAllForExport.mockResolvedValue([
      proposal('unit/x', { perbaikanValue: 1 }),
      proposal('unit?x', { perbaikanValue: 2 }),
    ]);
    const workbook = await load(await service.exportExcel(2026, user, 'token'));
    expect(workbook.worksheets.map((s) => s.name)).toEqual(['Ringkasan', 'unit x', 'unit x (2)']);
  });
});
