import { describe, it, expect, vi } from 'vitest';
import * as exceljs from 'exceljs';
import { ProgramIndicatorImportService } from './program-indicator-import.service';

describe('ProgramIndicatorImportService IKU mapping', () => {
  const ikuId = '550e8400-e29b-41d4-a716-446655440001';

  async function setup(code: string, existing = false) {
    const prisma = {
      program: {
        findMany: vi.fn().mockResolvedValue(existing ? [{ id: 'program-1', title: 'Program', ikuId }] : []),
        create: vi.fn().mockResolvedValue({ id: 'program-1' }),
      },
      programIndicator: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
      masterUnitType: { findFirst: vi.fn().mockResolvedValue({ id: 'type-1' }) },
    };
    const units = { getUnits: vi.fn().mockResolvedValue({ items: [{ id: 'unit-1', name: 'Unit' }] }) };
    const ikus = { getAllIkus: vi.fn()
      .mockResolvedValueOnce({ items: [], pagination: { totalPages: 2 } })
      .mockResolvedValueOnce({ items: [{ id: ikuId, code: 'IKU1.3' }], pagination: { totalPages: 2 } }) };
    const service = new ProgramIndicatorImportService(prisma as any, units as any, ikus as any);
    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet('Import');
    sheet.addRow(['IKU Code', 'Nama Program', 'Indikator Unit', 'Unit Pelaksana', 'Satuan', 'Kategori']);
    sheet.addRow([code, 'Program', 'Indicator', 'Unit', 'Dokumen', 'TUSI']);
    const file = { originalname: 'import.xlsx', buffer: Buffer.from(await workbook.xlsx.writeBuffer()) } as Express.Multer.File;
    return { prisma, ikus, service, file };
  }

  it('converts the Excel code into a UUID before creating a program', async () => {
    const { prisma, ikus, service, file } = await setup(' iku1.3 ');
    const result = await service.importFromExcel(file, 'token', 'user-1', 2026);
    expect(result.success).toBe(1);
    expect(prisma.program.create).toHaveBeenCalledWith({ data: expect.objectContaining({ ikuId, year: 2026 }) });
    expect(ikus.getAllIkus).toHaveBeenLastCalledWith('token', { page: 2, limit: 1000 });
  });

  it('matches an existing program by UUID and year instead of creating a duplicate', async () => {
    const { prisma, service, file } = await setup('IKU1.3', true);
    const result = await service.importFromExcel(file, 'token', 'user-1', 2026);
    expect(result.success).toBe(1);
    expect(prisma.program.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { year: 2026 } }));
    expect(prisma.program.create).not.toHaveBeenCalled();
  });

  it('skips unknown codes without creating programs or indicators', async () => {
    const { prisma, service, file } = await setup('UNKNOWN');
    const result = await service.importFromExcel(file, 'token', 'user-1', 2026);
    expect(result.skipped).toBe(1);
    expect(result.details[0].reason).toContain('tidak ditemukan di SIM IKU');
    expect(prisma.program.create).not.toHaveBeenCalled();
    expect(prisma.programIndicator.create).not.toHaveBeenCalled();
  });
});
