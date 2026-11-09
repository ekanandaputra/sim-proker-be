import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { PrismaService } from '@database/prisma/prisma.service';
import { BudgetRecapService } from './budget-recap.service';
import { UnitService } from '../../unit/services/unit.service';
import { AuthIntegrationService } from '../../external/auth-integration/services/auth-integration.service';
import { UnitBudgetProposalService } from '../../unit-budget-proposal/services/unit-budget-proposal.service';

const indicator = (
  id: string,
  unitId: string,
  programId: string,
  budget: number | null,
  status: string,
  picIds: string[] = [],
) => ({
  id,
  name: `Indikator ${id}`,
  category: 'TUSI',
  status,
  budget: budget === null ? null : new Prisma.Decimal(budget),
  unitId,
  programId,
  updatedAt: new Date('2026-01-01'),
  program: { id: programId, code: `PRG-${programId}`, title: `Program ${programId}` },
  pics: picIds.map((userId) => ({ userId })),
});

describe('BudgetRecapService', () => {
  const prisma = { programIndicator: { findMany: vi.fn() } };
  const units = { getUnits: vi.fn() };
  const auth = { getAllUsers: vi.fn() };
  const proposals = { getAllowedUnitIds: vi.fn() };
  const user = { userId: 'u1', roles: ['admin_sim_iku'] } as unknown as JwtPayload;
  let service: BudgetRecapService;

  beforeEach(() => {
    vi.resetAllMocks();
    proposals.getAllowedUnitIds.mockResolvedValue(null);
    prisma.programIndicator.findMany.mockResolvedValue([
      indicator('i1', 'unit-a', 'p1', 1000, 'APPROVED', ['pic-1']),
      indicator('i2', 'unit-a', 'p1', 500, 'SUBMITTED'),
      indicator('i3', 'unit-b', 'p2', 2000, 'APPROVED', ['pic-2']),
      indicator('i4', 'unit-a', 'p3', null, 'REJECTED'),
    ]);
    units.getUnits.mockResolvedValue({
      items: [
        { id: 'unit-a', name: 'Akademik', code: 'AKD' },
        { id: 'unit-b', name: 'Bengkel', code: 'BKL' },
      ],
      pagination: { totalPages: 1 },
    });
    auth.getAllUsers.mockResolvedValue({
      items: [{ id: 'pic-1', name: 'Budi' }],
      pagination: { totalPages: 1 },
    });
    service = new BudgetRecapService(
      prisma as unknown as PrismaService,
      units as unknown as UnitService,
      auth as unknown as AuthIntegrationService,
      proposals as unknown as UnitBudgetProposalService,
    );
  });

  it('aggregates summary, status breakdown and units', async () => {
    const result = await service.getRecap({ year: 2026 }, user, 'Bearer t');

    expect(prisma.programIndicator.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { program: { year: 2026 } } }),
    );
    expect(result.summary).toEqual({
      totalBudget: 3500,
      totalIndicators: 4,
      totalUnits: 2,
      totalPrograms: 3,
    });
    expect(result.statusBreakdown[0]).toEqual({ status: 'APPROVED', count: 2, percentage: 50 });
    expect(result.statusBreakdown).toHaveLength(3);
    expect(result.units).toEqual([
      {
        unitId: 'unit-b',
        unitName: 'Bengkel',
        unitCode: 'BKL',
        indicatorCount: 1,
        programCount: 1,
        totalBudget: 2000,
      },
      {
        unitId: 'unit-a',
        unitName: 'Akademik',
        unitCode: 'AKD',
        indicatorCount: 3,
        programCount: 2,
        totalBudget: 1500,
      },
    ]);
  });

  it('resolves PIC names and falls back to IDs', async () => {
    const result = await service.getRecap({ year: 2026 }, user, 'Bearer t');
    expect(result.indicators.find((i) => i.id === 'i1')!.pics).toEqual([
      { id: 'pic-1', name: 'Budi' },
    ]);
    expect(result.indicators.find((i) => i.id === 'i3')!.pics).toEqual([
      { id: 'pic-2', name: 'pic-2' },
    ]);
    expect(result.indicators.find((i) => i.id === 'i4')!.budget).toBe(0);
  });

  it('scopes non-admin users to their units', async () => {
    proposals.getAllowedUnitIds.mockResolvedValue(['unit-a']);

    await service.getRecap({ year: 2026, category: 'TUSI', status: 'APPROVED' }, user, 'Bearer t');
    expect(prisma.programIndicator.findMany.mock.calls[0][0].where).toEqual({
      program: { year: 2026 },
      category: 'TUSI',
      status: 'APPROVED',
      unitId: { in: ['unit-a'] },
    });

    await service.getRecap({ year: 2026, unitId: 'unit-b' }, user, 'Bearer t');
    expect(prisma.programIndicator.findMany.mock.calls[1][0].where.unitId).toEqual({ in: [] });
  });

  it('returns empty totals and falls back to unit IDs when the Auth Service fails', async () => {
    units.getUnits.mockRejectedValue(new Error('down'));
    const result = await service.getRecap({ year: 2026 }, user, 'Bearer t');
    expect(result.units[0].unitName).toBe('unit-b');
    expect(result.units[0].unitCode).toBeNull();

    prisma.programIndicator.findMany.mockResolvedValue([]);
    const empty = await service.getRecap({ year: 2026 }, user, 'Bearer t');
    expect(empty.summary).toEqual({
      totalBudget: 0,
      totalIndicators: 0,
      totalUnits: 0,
      totalPrograms: 0,
    });
    expect(empty.statusBreakdown).toEqual([]);
  });
});
