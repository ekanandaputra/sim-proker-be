import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Workbook } from 'exceljs';
import { ProgramStatus } from '@prisma/client';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { ACTIVE_PROGRAM_STATUSES } from '@common/constants';
import { ProgramStatusRecapExportService } from './program-status-recap-export.service';
import { ProgramStatusRecapService } from './program-status-recap.service';

const STATUSES = ACTIVE_PROGRAM_STATUSES;
const statusList = (counts: Partial<Record<ProgramStatus, number>>) =>
  STATUSES.map((status) => ({ status, count: counts[status] ?? 0 }));

async function load(buffer: Buffer) {
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  return workbook;
}

describe('ProgramStatusRecapExportService', () => {
  const recapService = { getRecap: vi.fn(), findUnprocessed: vi.fn() };
  const user = { userId: 'u1', roles: [] } as unknown as JwtPayload;
  let service: ProgramStatusRecapExportService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new ProgramStatusRecapExportService(
      recapService as unknown as ProgramStatusRecapService,
    );
  });

  it('builds the status recap and lists programs not processed by their unit', async () => {
    recapService.getRecap.mockResolvedValue({
      total: 5,
      statuses: statusList({ ASSIGNED_TO_UNIT: 2, APPROVED: 3 }),
      years: [],
      units: [
        {
          unitId: 'unit-a',
          unitName: 'Akademik',
          year: 2026,
          total: 2,
          statuses: statusList({ APPROVED: 2 }),
        },
        {
          unitId: 'unit-b',
          unitName: 'Bengkel',
          year: 2026,
          total: 3,
          statuses: statusList({ ASSIGNED_TO_UNIT: 2, APPROVED: 1 }),
        },
      ],
    });
    recapService.findUnprocessed.mockResolvedValue([
      {
        unitId: 'unit-b',
        name: 'Indikator 2',
        createdAt: new Date('2026-02-01T00:00:00Z'),
        program: { code: 'P-02', title: 'Program Dua', year: 2026 },
      },
      {
        unitId: 'unit-b',
        name: 'Indikator 1',
        createdAt: new Date('2026-01-15T00:00:00Z'),
        program: { code: 'P-01', title: 'Program Satu', year: 2026 },
      },
    ]);

    const workbook = await load(await service.exportExcel({ year: 2026 }, user, 'token'));

    expect(recapService.getRecap).toHaveBeenCalledWith({ year: 2026 }, user, 'token');
    expect(workbook.worksheets.map((s) => s.name)).toEqual(['Rekap Status', 'Belum Diproses']);

    const recap = workbook.getWorksheet('Rekap Status')!;
    expect(recap.getCell('A1').value).toBe('REKAP STATUS PROGRAM KERJA UNIT TAHUN 2026');
    expect(recap.getCell('C6').value).toBe(': 1 unit (2 program)');
    // header row 8, data rows 9..10, total row 11; status cols E..J, note column K
    expect(recap.getRow(8).values).toEqual([
      undefined,
      'No',
      'Nama Unit',
      'Tahun',
      'Total',
      'Ditugaskan ke Unit',
      'Diajukan',
      'Disetujui',
      'Ditolak',
      'Revisi',
      'Berjalan',
      'Keterangan',
    ]);
    expect(recap.getCell('B9').value).toBe('Akademik');
    expect(recap.getCell('K9').value).toBe('Semua program sudah diproses');
    expect(recap.getCell('B10').value).toBe('Bengkel');
    expect(recap.getCell('E10').value).toBe(2);
    expect(recap.getCell('K10').value).toBe('Belum memproses 2 program');
    expect(recap.getCell('D11').value).toBe(5);
    expect(recap.getCell('E11').value).toBe(2);

    const pending = workbook.getWorksheet('Belum Diproses')!;
    expect(pending.getRow(5).values).toEqual([
      undefined,
      1,
      'Bengkel',
      2026,
      'P-01',
      'Program Satu',
      'Indikator 1',
      '15/01/2026',
    ]);
    expect(pending.getCell('D6').value).toBe('P-02');
  });

  it('notes when every program has been processed', async () => {
    recapService.getRecap.mockResolvedValue({
      total: 0,
      statuses: statusList({}),
      years: [],
      units: [],
    });
    recapService.findUnprocessed.mockResolvedValue([]);

    const workbook = await load(await service.exportExcel({}, user, 'token'));

    expect(workbook.getWorksheet('Rekap Status')!.getCell('A1').value).toBe(
      'REKAP STATUS PROGRAM KERJA UNIT SEMUA TAHUN',
    );
    expect(workbook.getWorksheet('Belum Diproses')!.getCell('A5').value).toBe(
      'Semua program sudah diproses oleh unit',
    );
  });
});
