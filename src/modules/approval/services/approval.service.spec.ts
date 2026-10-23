import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApprovalService } from './approval.service';
import { ApprovalLevel, ProgramStatus } from '@prisma/client';

describe('ApprovalService', () => {
  let service: ApprovalService;
  let mockPrisma: any;
  let mockUnitService: any;
  let mockStorageService: any;
  let mockIkuService: any;

  beforeEach(() => {
    mockPrisma = {
      approvalReviewer: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      programIndicator: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'ind-1',
            name: 'Indikator 1',
            status: ProgramStatus.SUBMITTED,
            unitId: 'unit-1',
            program: { id: 'prog-1', ikuId: 'iku-1' },
            proposalDocument: null,
            rabDocument: null,
          },
        ]),
      },
    };

    mockUnitService = {
      getUnitById: vi.fn().mockResolvedValue({ id: 'unit-1', name: 'Unit 1' }),
    };

    mockStorageService = {
      getUrl: vi.fn().mockReturnValue(null),
    };

    mockIkuService = { getAllIkus: vi.fn() };

    service = new ApprovalService(
      {} as any,
      mockPrisma as any,
      mockUnitService as any,
      {} as any,
      {} as any,
      mockStorageService as any,
      mockIkuService as any,
    );
  });

  describe('approve reviewer authorization', () => {
    const ikuUuid = '550e8400-e29b-41d4-a716-446655440001';

    async function approveWithAssignments(assignedIds: string[]) {
      const reviewer = {
        isAuthorizedReviewer: vi.fn(async (_userId, _level, ikuId) => assignedIds.includes(ikuId)),
      };
      const repository = { create: vi.fn().mockResolvedValue({ id: 'approval-1' }) };
      mockPrisma.programIndicator.findUnique = vi.fn().mockResolvedValue({
        id: 'ind-1', status: ProgramStatus.SUBMITTED, program: { ikuId: 'IKU1.3' },
      });
      mockPrisma.programIndicator.update = vi.fn().mockResolvedValue({});
      mockIkuService.getAllIkus.mockResolvedValue({
        items: [{ id: ikuUuid, code: 'IKU1.3' }], pagination: { totalPages: 1 },
      });
      const approvalService = new ApprovalService(
        repository as any, mockPrisma, mockUnitService, reviewer as any,
        {} as any, mockStorageService, mockIkuService,
      );
      return { reviewer, repository, approvalService };
    }

    it('accepts a UUID assignment for the program IKU code', async () => {
      const { reviewer, approvalService } = await approveWithAssignments([ikuUuid]);
      await approvalService.approve('ind-1', {}, 'user-1', 'Bearer token');
      expect(mockIkuService.getAllIkus).toHaveBeenCalledWith('Bearer token', { page: 1, limit: 1000 });
      expect(reviewer.isAuthorizedReviewer).toHaveBeenLastCalledWith(
        'user-1', ApprovalLevel.INDICATOR_VERIFICATION, ikuUuid,
      );
      expect(mockPrisma.programIndicator.update).toHaveBeenCalledWith({
        where: { id: 'ind-1' }, data: { status: ProgramStatus.INDICATOR_APPROVED },
      });
    });

    it('continues to accept code assignments without fetching SIM IKU', async () => {
      const { approvalService } = await approveWithAssignments(['IKU1.3']);
      await approvalService.approve('ind-1', {}, 'user-1', 'Bearer token');
      expect(mockIkuService.getAllIkus).not.toHaveBeenCalled();
    });

    it('rejects a reviewer assigned to another IKU without changing the indicator', async () => {
      const { repository, approvalService } = await approveWithAssignments(['other-iku']);
      await expect(approvalService.approve('ind-1', {}, 'user-1', 'Bearer token'))
        .rejects.toThrow('is not authorized');
      expect(repository.create).not.toHaveBeenCalled();
      expect(mockPrisma.programIndicator.update).not.toHaveBeenCalled();
    });
  });

  describe('getSubmittedIndicators', () => {
    it('resolves assigned UUIDs across IKU pages and preserves code assignments', async () => {
      const ikuId = '550e8400-e29b-41d4-a716-446655440001';
      mockPrisma.approvalReviewer.findMany.mockResolvedValue([
        { ikuId }, { ikuId: 'IKU2.1' },
      ]);
      mockIkuService.getAllIkus
        .mockResolvedValueOnce({ items: [], pagination: { totalPages: 2 } })
        .mockResolvedValueOnce({ items: [{ id: ikuId, code: 'IKU1.1' }], pagination: { totalPages: 2 } });

      await service.getSubmittedIndicators('mock-token', { page: 1, limit: 10 }, { userId: 'user-1' });

      expect(mockIkuService.getAllIkus).toHaveBeenLastCalledWith('mock-token', { page: 2, limit: 1000 });
      expect(mockPrisma.programIndicator.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          status: { in: [ProgramStatus.SUBMITTED, ProgramStatus.REVISION] },
          program: { ikuId: { in: ['IKU2.1', 'IKU1.1'] } },
        },
        skip: 0,
        take: 10,
      }));
    });

    it('keeps the filter restricted when an assigned UUID cannot be resolved', async () => {
      mockPrisma.approvalReviewer.findMany.mockResolvedValue([
        { ikuId: '550e8400-e29b-41d4-a716-446655440001' },
      ]);
      mockIkuService.getAllIkus.mockResolvedValue({ items: [], pagination: { totalPages: 0 } });

      await service.getSubmittedIndicators('mock-token', {}, { userId: 'user-1' });

      expect(mockPrisma.programIndicator.count).toHaveBeenCalledWith({ where: {
        status: { in: [ProgramStatus.SUBMITTED, ProgramStatus.REVISION] },
        program: { ikuId: { in: [] } },
      } });
    });

    it('should query without unitId when not provided', async () => {
      mockPrisma.approvalReviewer.findMany.mockResolvedValue([{ ikuId: 'iku-1' }]);

      const result = await service.getSubmittedIndicators(
        'mock-token',
        { page: 1, limit: 10 },
        { userId: 'user-1' },
      );

      expect(mockPrisma.programIndicator.count).toHaveBeenCalledWith({
        where: {
          status: { in: [ProgramStatus.SUBMITTED, ProgramStatus.REVISION] },
          program: { ikuId: { in: ['iku-1'] } },
        },
      });
      expect(mockPrisma.programIndicator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: { in: [ProgramStatus.SUBMITTED, ProgramStatus.REVISION] },
            program: { ikuId: { in: ['iku-1'] } },
          },
        }),
      );
      expect(result.items).toHaveLength(1);
    });

    it('should query with unitId when provided', async () => {
      mockPrisma.approvalReviewer.findMany.mockResolvedValue([{ ikuId: 'iku-1' }]);

      await service.getSubmittedIndicators(
        'mock-token',
        { page: 1, limit: 10, unitId: 'unit-1' },
        { userId: 'user-1' },
      );

      expect(mockPrisma.programIndicator.count).toHaveBeenCalledWith({
        where: {
          status: { in: [ProgramStatus.SUBMITTED, ProgramStatus.REVISION] },
          unitId: 'unit-1',
          program: { ikuId: { in: ['iku-1'] } },
        },
      });
      expect(mockPrisma.programIndicator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: { in: [ProgramStatus.SUBMITTED, ProgramStatus.REVISION] },
            unitId: 'unit-1',
            program: { ikuId: { in: ['iku-1'] } },
          },
        }),
      );
    });
  });

  describe('getIndicatorApprovedIndicators', () => {
    it('should query without unitId when not provided', async () => {
      mockPrisma.approvalReviewer.findFirst.mockResolvedValue({ id: 'rev-1' });

      const result = await service.getIndicatorApprovedIndicators(
        'mock-token',
        { page: 1, limit: 10 },
        { userId: 'user-1' },
      );

      expect(mockPrisma.programIndicator.count).toHaveBeenCalledWith({
        where: {
          status: ProgramStatus.INDICATOR_APPROVED,
        },
      });
      expect(mockPrisma.programIndicator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: ProgramStatus.INDICATOR_APPROVED,
          },
        }),
      );
      expect(result.items).toHaveLength(1);
    });

    it('should query with unitId when provided', async () => {
      mockPrisma.approvalReviewer.findFirst.mockResolvedValue({ id: 'rev-1' });

      await service.getIndicatorApprovedIndicators(
        'mock-token',
        { page: 1, limit: 10, unitId: 'unit-1' },
        { userId: 'user-1' },
      );

      expect(mockPrisma.programIndicator.count).toHaveBeenCalledWith({
        where: {
          status: ProgramStatus.INDICATOR_APPROVED,
          unitId: 'unit-1',
        },
      });
      expect(mockPrisma.programIndicator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: ProgramStatus.INDICATOR_APPROVED,
            unitId: 'unit-1',
          },
        }),
      );
    });
  });
});
