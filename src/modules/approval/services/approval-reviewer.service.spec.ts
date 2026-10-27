import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApprovalLevel } from '@prisma/client';
import { ApprovalReviewerService } from './approval-reviewer.service';
import { IApprovalReviewerRepository } from '../repositories/approval-reviewer.repository.interface';
import { AuthIntegrationService } from '../../external/auth-integration/services/auth-integration.service';
import { IkuIntegrationService } from '../../external/iku-integration/services/iku-integration.service';

const assignment = {
  id: 'reviewer-1', userId: 'user-1', level: ApprovalLevel.INDICATOR_VERIFICATION,
  ikuId: 'iku-1', createdAt: new Date(), updatedAt: new Date(),
};
const iku = { id: 'iku-1', code: 'IKU-01', name: 'Indikator Kinerja Utama 1' };

describe('ApprovalReviewerService IKU details', () => {
  const repository = { findAll: vi.fn(), findById: vi.fn(), findByUserAndLevel: vi.fn(), create: vi.fn() };
  const auth = { getAllUsers: vi.fn() };
  const integration = { getAllIkus: vi.fn() };
  let service: ApprovalReviewerService;

  beforeEach(() => {
    vi.resetAllMocks();
    auth.getAllUsers.mockResolvedValue({ items: [] });
    repository.findAll.mockResolvedValue([assignment]);
    repository.findById.mockResolvedValue(assignment);
    repository.create.mockResolvedValue(assignment);
    integration.getAllIkus.mockResolvedValue({ items: [iku], pagination: { totalPages: 1 } });
    service = new ApprovalReviewerService(
      repository as unknown as IApprovalReviewerRepository,
      auth as unknown as AuthIntegrationService,
      integration as unknown as IkuIntegrationService,
    );
  });

  it('populates all assignments with the same IKU, including later pages', async () => {
    repository.findAll.mockResolvedValue([assignment, { ...assignment, id: 'reviewer-2' }]);
    integration.getAllIkus.mockResolvedValueOnce({ items: [], pagination: { totalPages: 2 } });
    const result = await service.findAll(undefined, 'Bearer token');
    expect(result.map((reviewer) => reviewer.iku)).toEqual([iku, iku]);
    expect(integration.getAllIkus).toHaveBeenNthCalledWith(2, 'Bearer token', { page: 2, limit: 100 });
  });

  it('searches partial user names case-insensitively across user pages', async () => {
    repository.findAll.mockResolvedValue([assignment, { ...assignment, id: 'reviewer-2', userId: 'user-2' }]);
    auth.getAllUsers
      .mockResolvedValueOnce({ items: [{ id: 'user-2', name: 'Siti' }], pagination: { totalPages: 2 } })
      .mockResolvedValueOnce({ items: [{ id: 'user-1', name: 'Budi Santoso' }], pagination: { totalPages: 2 } });
    const result = await service.findAll({ search: '  SANTOS  ' }, 'Bearer token');
    expect(result.map((reviewer) => reviewer.id)).toEqual(['reviewer-1']);
    expect(auth.getAllUsers).toHaveBeenNthCalledWith(2, 'Bearer token', { page: 2, limit: 100, sortOrder: 'desc' });
  });

  it('matches either user name or IKU name', async () => {
    repository.findAll.mockResolvedValue([assignment, { ...assignment, id: 'reviewer-2', userId: 'user-2', ikuId: null }]);
    auth.getAllUsers.mockResolvedValue({ items: [{ id: 'user-2', name: 'Kinerja Reviewer' }] });
    expect((await service.findAll({ search: 'KINERJA' }, 'Bearer token')).map((reviewer) => reviewer.id))
      .toEqual(['reviewer-1', 'reviewer-2']);
  });

  it('combines search with existing filters without passing search to the repository', async () => {
    const filters = { userId: 'user-1', ikuId: 'iku-1', level: ApprovalLevel.INDICATOR_VERIFICATION };
    expect(await service.findAll({ ...filters, search: 'not found' }, 'Bearer token')).toEqual([]);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });

  it('treats whitespace-only search as unfiltered', async () => {
    expect(await service.findAll({ search: '   ' }, 'Bearer token')).toHaveLength(1);
  });

  it('lists only assigned users, without duplicate users across assignments', async () => {
    repository.findAll.mockResolvedValue([assignment, { ...assignment, id: 'reviewer-2', ikuId: 'iku-2' }]);
    auth.getAllUsers.mockResolvedValue({ items: [
      { id: 'user-1', name: 'Budi', nip: '001234', email: 'budi@example.com', roles: ['ADMIN'] },
      { id: 'unassigned', name: 'Other User' },
    ] });
    expect(await service.findUsers(undefined, 'Bearer token')).toEqual([
      { id: 'user-1', name: 'Budi', nip: '001234', email: 'budi@example.com', roles: ['ADMIN'] },
    ]);
    expect(integration.getAllIkus).not.toHaveBeenCalled();
  });

  it('filters reviewer users by level, IKU and partial user name', async () => {
    auth.getAllUsers.mockResolvedValue({ items: [{ id: 'user-1', name: 'Budi Santoso' }] });
    const filters = { level: ApprovalLevel.INDICATOR_VERIFICATION, ikuId: 'iku-1' };
    expect(await service.findUsers({ ...filters, search: ' SANTO ' }, 'Bearer token')).toMatchObject([{ id: 'user-1', name: 'Budi Santoso' }]);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
    expect(await service.findUsers({ search: 'missing' }, 'Bearer token')).toEqual([]);
  });

  it('returns an empty user list without calling integrations if no assignments exist', async () => {
    repository.findAll.mockResolvedValue([]);
    expect(await service.findUsers(undefined, 'Bearer token')).toEqual([]);
    expect(auth.getAllUsers).not.toHaveBeenCalled();
  });

  it('keeps assigned user IDs when Auth Service is unavailable', async () => {
    auth.getAllUsers.mockRejectedValue(new Error('Unavailable'));
    expect(await service.findUsers(undefined, 'Bearer token')).toMatchObject([{ id: 'user-1', name: 'Unknown User' }]);
  });

  it('includes IKU details in the detail response', async () => {
    expect((await service.findById(assignment.id, 'Bearer token')).iku).toEqual(iku);
  });

  it.each([false, true])('includes IKU details when creating an assignment (already exists: %s)', async (existing) => {
    repository.findByUserAndLevel.mockResolvedValue(existing ? assignment : null);
    const result = await service.create({ userId: assignment.userId, level: assignment.level, ikuIds: ['iku-1'] }, 'Bearer token');
    expect(result[0].iku).toEqual(iku);
  });

  it('returns null without fetching IKUs for budget reviewers', async () => {
    repository.findAll.mockResolvedValue([{ ...assignment, level: ApprovalLevel.BUDGET_VERIFICATION, ikuId: null }]);
    expect((await service.findAll(undefined, 'Bearer token'))[0].iku).toBeNull();
    expect(integration.getAllIkus).not.toHaveBeenCalled();
  });

  it('keeps the response available when the IKU service fails', async () => {
    integration.getAllIkus.mockRejectedValue(new Error('Unavailable'));
    expect((await service.findAll(undefined, 'Bearer token'))[0]).toMatchObject({ ikuId: 'iku-1', iku: null });
  });

  it('returns null when the assigned IKU is missing', async () => {
    integration.getAllIkus.mockResolvedValue({ items: [], pagination: { totalPages: 1 } });
    expect((await service.findAll(undefined, 'Bearer token'))[0].iku).toBeNull();
  });
});
