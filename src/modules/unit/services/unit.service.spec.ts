import { describe, it, expect, vi } from 'vitest';
import { UnitService } from './unit.service';

function setup(pics: { userId: string }[]) {
  const prisma = { programIndicator: { findMany: vi.fn().mockResolvedValue([{
    id: 'indicator-1', program: { id: 'program-1' },
    masterUnitType: { id: 'type-1', name: 'Jumlah', type: 'NUMBER' },
    pics, realizations: [],
  }]) } };
  const auth = { getAllUsers: vi.fn() };
  const service = new UnitService({} as any, prisma as any, auth as any);
  return { service, auth };
}

describe('UnitService.getUnitPrograms PIC names', () => {
  it('resolves PIC names across pages and forwards the authorization token', async () => {
    const { service, auth } = setup([{ userId: 'user-1' }, { userId: 'user-2' }]);
    auth.getAllUsers
      .mockResolvedValueOnce({ items: [{ id: 'user-1', name: 'Budi' }], pagination: { totalPages: 2 } })
      .mockResolvedValueOnce({ items: [{ id: 'user-2', name: 'Siti' }], pagination: { totalPages: 2 } });
    const result = await service.getUnitPrograms('unit-1', 2026, 'Bearer token');
    expect(result[0].indikator[0].picIds).toEqual(['user-1', 'user-2']);
    expect(result[0].indikator[0].pics).toEqual([
      { id: 'user-1', name: 'Budi' }, { id: 'user-2', name: 'Siti' },
    ]);
    expect(auth.getAllUsers).toHaveBeenLastCalledWith('Bearer token', {
      page: 2, limit: 100, sortOrder: 'desc',
    });
  });

  it('preserves PIC IDs if the auth service fails', async () => {
    const { service, auth } = setup([{ userId: 'user-1' }]);
    auth.getAllUsers.mockRejectedValue(new Error('Unavailable'));
    const result = await service.getUnitPrograms('unit-1', 2026);
    expect(result[0].indikator[0].pics).toEqual([{ id: 'user-1', name: 'user-1' }]);
  });

  it('returns an empty PIC list without fetching users for unassigned indicators', async () => {
    const { service, auth } = setup([]);
    const result = await service.getUnitPrograms('unit-1', 2026);
    expect(result[0].indikator[0].pics).toEqual([]);
    expect(auth.getAllUsers).not.toHaveBeenCalled();
  });
});
