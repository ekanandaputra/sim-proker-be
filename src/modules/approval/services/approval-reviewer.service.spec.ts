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
