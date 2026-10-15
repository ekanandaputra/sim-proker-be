import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApprovalService } from './approval.service';
import { ProgramStatus } from '@prisma/client';

describe('ApprovalService', () => {
  let service: ApprovalService;
  let mockPrisma: any;
  let mockUnitService: any;
  let mockStorageService: any;

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

    service = new ApprovalService(
      {} as any,
      mockPrisma as any,
      mockUnitService as any,
      {} as any,
      {} as any,
      mockStorageService as any,
    );
  });

  describe('getSubmittedIndicators', () => {
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
