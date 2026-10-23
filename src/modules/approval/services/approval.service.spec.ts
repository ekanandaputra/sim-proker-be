import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApprovalService } from './approval.service';
import { ProgramStatus } from '@prisma/client';

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
