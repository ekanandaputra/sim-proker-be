import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApprovalLevel } from '@prisma/client';
import { Workbook } from 'exceljs';
import { Readable } from 'stream';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { ApprovalReviewerTransferService } from './approval-reviewer-transfer.service';
import { IApprovalReviewerRepository } from '../repositories/approval-reviewer.repository.interface';
import { AuthIntegrationService } from '../../external/auth-integration/services/auth-integration.service';
import { IkuIntegrationService } from '../../external/iku-integration/services/iku-integration.service';

vi.mock('@common/config', () => ({
  getAppConfig: () => ({ AUTH_SERVICE_URL: 'http://auth.test' }),
}));

const nip = '00198001012005011001';
async function file(rows: (string | number)[][], headers = ['IKU Code', 'NIP']) {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Reviewers');
  sheet.addRow(headers);
  rows.forEach((row) => sheet.addRow(row));
  return { originalname: 'reviewers.xlsx', buffer: Buffer.from(await workbook.xlsx.writeBuffer()) } as Express.Multer.File;
}
const page = (items: unknown[], totalPages = 1) => ({ items, pagination: { totalPages } });

describe('ApprovalReviewerTransferService', () => {
  const repository = { findAll: vi.fn(), findByUserAndLevel: vi.fn(), create: vi.fn() };
  const auth = { getAllUsers: vi.fn() };
  const iku = { getAllIkus: vi.fn() };
  let service: ApprovalReviewerTransferService;
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getAllUsers.mockResolvedValue(page([{ id: 'user-1', nip }]));
    iku.getAllIkus.mockResolvedValue(page([{ id: 'iku-1', code: 'IKU-01' }]));
    repository.findByUserAndLevel.mockResolvedValue(null);
    repository.findAll.mockResolvedValue([{ id: 'reviewer-1', userId: 'user-1', ikuId: 'iku-1' }]);
    service = new ApprovalReviewerTransferService(
      repository as unknown as IApprovalReviewerRepository,
      auth as unknown as AuthIntegrationService,
      iku as unknown as IkuIntegrationService,
    );
  });

  it('imports using paginated references, trimmed codes, and exact text NIP', async () => {
    auth.getAllUsers.mockResolvedValueOnce(page([], 2));
    iku.getAllIkus.mockResolvedValueOnce(page([], 2));
    const result = await service.importExcel(await file([[' iku-01 ', ` ${nip} `]]), 'Bearer token');
    expect(result).toMatchObject({ totalRows: 1, success: 1, skipped: 0 });
    expect(repository.create).toHaveBeenCalledWith({ userId: 'user-1', ikuId: 'iku-1', level: ApprovalLevel.INDICATOR_VERIFICATION });
    expect(auth.getAllUsers).toHaveBeenNthCalledWith(2, 'Bearer token', { page: 2, limit: 100, sortOrder: 'asc' });
    expect(iku.getAllIkus).toHaveBeenNthCalledWith(2, 'Bearer token', { page: 2, limit: 100 });
  });

  it('imports a NIP on a later Auth Service page using the actual response format', async () => {
    const http = { get: vi.fn()
      .mockReturnValueOnce(of({ data: {
        success: true,
        data: [{ id: 'other-user', nip: 'other-nip' }],
        pagination: { page: 1, limit: 100, total: 101, totalPages: 2 },
      } }))
      .mockReturnValueOnce(of({ data: {
        success: true,
        data: [{ id: 'user-1', nip }],
        pagination: { page: 2, limit: 100, total: 101, totalPages: 2 },
      } })),
    };
    const realAuth = new AuthIntegrationService(http as unknown as HttpService);
    service = new ApprovalReviewerTransferService(
      repository as unknown as IApprovalReviewerRepository,
      realAuth,
      iku as unknown as IkuIntegrationService,
    );
    const result = await service.importExcel(await file([['IKU-01', nip]]), 'Bearer token');
    expect(result).toMatchObject({ totalRows: 1, success: 1, skipped: 0 });
    expect(repository.create).toHaveBeenCalledWith({ userId: 'user-1', ikuId: 'iku-1', level: ApprovalLevel.INDICATOR_VERIFICATION });
    expect(http.get).toHaveBeenCalledTimes(2);
    expect(http.get).toHaveBeenLastCalledWith('http://auth.test/api/users', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      params: expect.objectContaining({ page: 2, limit: 100 }),
    }));
  });

  it('skips existing assignments and duplicate rows within the file', async () => {
    repository.findByUserAndLevel.mockResolvedValueOnce(null).mockResolvedValue({ id: 'reviewer-1' });
    const result = await service.importExcel(await file([['IKU-01', nip], ['IKU-01', nip]]), 'token');
    expect(result).toMatchObject({ totalRows: 2, success: 1, skipped: 1 });
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it('reports invalid rows and ignores empty rows', async () => {
    const result = await service.importExcel(await file([
      ['', ''], ['unknown', nip], ['IKU-01', 'missing'], ['IKU-01', ''], ['IKU-01', 198001012005011001],
    ]), 'token');
    expect(result).toMatchObject({ totalRows: 4, success: 0, skipped: 4 });
    expect(result.details.map((row) => row.row)).toEqual([3, 4, 5, 6]);
    expect(result.details[3].reason).toContain('teks');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('skips ambiguous NIP rather than assigning the wrong user', async () => {
    auth.getAllUsers.mockResolvedValue(page([{ id: 'one', nip }, { id: 'two', nip }]));
    expect((await service.importExcel(await file([['IKU-01', nip]]), 'token')).skipped).toBe(1);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects missing, corrupt, and incorrectly headed files', async () => {
    await expect(service.importExcel(undefined, 'token')).rejects.toThrow('Upload file');
    await expect(service.importExcel({ originalname: 'bad.xlsx', buffer: Buffer.from('invalid') } as Express.Multer.File, 'token')).rejects.toThrow('tidak valid');
    await expect(service.importExcel(await file([], ['Code', 'NIP']), 'token')).rejects.toThrow('Header wajib');
    expect(auth.getAllUsers).not.toHaveBeenCalled();
  });

  it('does not create assignments when a reference service is unavailable', async () => {
    auth.getAllUsers.mockRejectedValue(new Error('Auth unavailable'));
    await expect(service.importExcel(await file([['IKU-01', nip]]), 'token')).rejects.toThrow('Auth unavailable');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('exports the requested headers and preserves long NIP including leading zeros on round trip', async () => {
    const buffer = await service.exportExcel('token');
    const workbook = new Workbook();
    await workbook.xlsx.read(Readable.from(buffer));
    const sheet = workbook.worksheets[0];
    expect([sheet.getCell('A1').text, sheet.getCell('B1').text]).toEqual(['IKU Code', 'NIP']);
    expect(sheet.getCell('B2').value).toBe(nip);
    expect(sheet.getCell('B2').numFmt).toBe('@');
    expect(repository.findAll).toHaveBeenCalledWith({ level: ApprovalLevel.INDICATOR_VERIFICATION });
    expect((await service.importExcel({ originalname: 'export.xlsx', buffer } as Express.Multer.File, 'token')).success).toBe(1);
  });

  it('exports a header-only template when no reviewers exist', async () => {
    repository.findAll.mockResolvedValue([]);
    const workbook = new Workbook();
    await workbook.xlsx.read(Readable.from(await service.exportExcel('token')));
    expect(workbook.worksheets[0].rowCount).toBe(1);
    expect(auth.getAllUsers).not.toHaveBeenCalled();
  });

  it('rejects export when a NIP is unavailable rather than generating incomplete rows', async () => {
    auth.getAllUsers.mockResolvedValue(page([{ id: 'user-1' }]));
    await expect(service.exportExcel('token')).rejects.toThrow('NIP tidak tersedia');
  });
});
