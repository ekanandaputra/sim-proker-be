import { describe, it, expect, vi } from 'vitest';
import { ProgramIndicatorController } from './program-indicator.controller';
import { ProgramStatus } from '@prisma/client';

describe('ProgramIndicatorController audit actor', () => {
  const actor = { userId: 'jwt-user-id', name: 'User', roles: [], unitId: '' };
  const req = { headers: { authorization: 'Bearer token' } } as any;

  it('passes JWT userId to every indicator mutation', async () => {
    const service = {
      create: vi.fn(), update: vi.fn(), updateStatus: vi.fn(), remove: vi.fn(),
      setTarget: vi.fn(), upsertRealization: vi.fn(),
    };
    const controller = new ProgramIndicatorController(service as any);
    const dto = { name: 'Indicator', unitId: 'unit', masterUnitTypeId: 'type' };
    await controller.create('program', dto, req, actor);
    await controller.update('program', 'indicator', dto, req, actor);
    await controller.updateStatus('program', 'indicator', { status: ProgramStatus.APPROVED }, actor);
    await controller.remove('program', 'indicator', actor);
    await controller.setTarget('program', 'indicator', { propsal: 'proposal', rab: 'rab' }, req, actor);
    await controller.upsertRealization('program', 'indicator', { month: 1, realization: 1 }, req, actor);
    const expectedActor = { id: actor.userId, name: actor.name };
    for (const method of Object.values(service)) {
      expect(method).toHaveBeenCalledOnce();
      expect(method.mock.calls[0]).toContainEqual(expectedActor);
    }
  });
});
