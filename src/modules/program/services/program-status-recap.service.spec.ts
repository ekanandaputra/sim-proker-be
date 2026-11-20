import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgramStatus } from '@prisma/client';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { ACTIVE_PROGRAM_STATUSES, Role } from '@common/constants';
import { PrismaService } from '@database/prisma/prisma.service';
import { UnitService } from '../../unit/services/unit.service';
import { ProgramStatusRecapService } from './program-status-recap.service';

const indicator = (unitId: string, status: ProgramStatus, year: number) => ({
  unitId,
  status,
  program: { year },
});

const countOf = (statuses: { status: ProgramStatus; count: number }[], status: ProgramStatus) =>
  statuses.find((s) => s.status === status)?.count;

describe('ProgramStatusRecapService', () => {
  const prisma = { programIndicator: { findMany: vi.fn() } };
  const units = { getUnits: vi.fn(), getUserUnits: vi.fn() };
  const admin = { userId: 'admin', roles: [Role.ADMIN] } as unknown as JwtPayload;
  let service: ProgramStatusRecapService;

  beforeEach(() => {
    vi.resetAllMocks();
    units.getUnits.mockResolvedValue({
      items: [
        { id: 'unit-a', name: 'Akademik' },
        { id: 'unit-b', name: 'Bengkel' },
      ],
      pagination: { totalPages: 1 },
    });
    service = new ProgramStatusRecapService(
      prisma as unknown as PrismaService,
      units as unknown as UnitService,
    );
  });

  it('groups indicator status counts per unit and year', async () => {
    prisma.programIndicator.findMany.mockResolvedValue([
      indicator('unit-b', ProgramStatus.APPROVED, 2026),
      indicator('unit-b', ProgramStatus.APPROVED, 2026),
      indicator('unit-a', ProgramStatus.SUBMITTED, 2026),
      indicator('unit-a', ProgramStatus.IN_PROGRESS, 2025),
    ]);

    const recap = await service.getRecap({}, admin, 'token');

    expect(prisma.programIndicator.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: { in: [...ACTIVE_PROGRAM_STATUSES] } } }),
    );
    expect(recap.total).toBe(4);
    expect(countOf(recap.statuses, ProgramStatus.APPROVED)).toBe(2);
    expect(recap.statuses.map((s) => s.status)).toEqual(ACTIVE_PROGRAM_STATUSES);
    expect(recap.years.map((y) => [y.year, y.total])).toEqual([
      [2025, 1],
      [2026, 3],
    ]);
    expect(recap.units.map((u) => [u.year, u.unitName, u.total])).toEqual([
      [2025, 'Akademik', 1],
      [2026, 'Akademik', 1],
      [2026, 'Bengkel', 2],
    ]);
    expect(countOf(recap.units[2].statuses, ProgramStatus.APPROVED)).toBe(2);

    const approved = recap.statuses.find((st) => st.status === ProgramStatus.APPROVED)!;
    expect(approved.units).toEqual([{ unitId: 'unit-b', unitName: 'Bengkel', count: 2 }]);
    const submitted2026 = recap.years[1].statuses.find(
      (st) => st.status === ProgramStatus.SUBMITTED,
    )!;
    expect(submitted2026.units).toEqual([{ unitId: 'unit-a', unitName: 'Akademik', count: 1 }]);
    const assigned = recap.statuses.find((st) => st.status === ProgramStatus.ASSIGNED_TO_UNIT)!;
    expect(assigned).toEqual({ status: ProgramStatus.ASSIGNED_TO_UNIT, count: 0, units: [] });
    expect(countOf(recap.units[2].statuses, ProgramStatus.REJECTED)).toBe(0);
  });

  it('restricts non-admin users to their own units and applies the year filter', async () => {
    units.getUserUnits.mockResolvedValue([{ unitId: 'unit-a' }]);
    prisma.programIndicator.findMany.mockResolvedValue([]);
    const user = { userId: 'u1', roles: ['USER'] } as unknown as JwtPayload;

    const recap = await service.getRecap({ year: 2026, unitId: 'unit-b' }, user, 'token');

    expect(prisma.programIndicator.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { in: [...ACTIVE_PROGRAM_STATUSES] },
          program: { year: 2026 },
          unitId: { in: [] },
        },
      }),
    );
    expect(recap).toMatchObject({ total: 0, years: [], units: [] });
    expect(units.getUnits).not.toHaveBeenCalled();
  });
});
