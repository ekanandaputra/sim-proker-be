import { describe, it, expect, vi } from 'vitest';
import { ProgramIndicatorService } from './program-indicator.service';
import { ProgramStatus } from '@prisma/client';
import { EntityNotFoundException } from '@common/exceptions';
import { setIndicatorTargetSchema, updateProgramIndicatorStatusSchema } from '../dto/program-indicator.dto';

const picIds = [
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
];

describe('ProgramIndicatorService.setTarget PICs', () => {
  it.each([
    { input: picIds, expected: { deleteMany: {}, create: picIds.map(userId => ({ userId })) } },
    { input: [], expected: { deleteMany: {}, create: [] } },
    { input: undefined, expected: { deleteMany: {}, create: [] } },
    { input: [picIds[0], picIds[0]], expected: { deleteMany: {}, create: [{ userId: picIds[0] }] } },
  ])('updates PIC relations for $input', async ({ input, expected }) => {
    const indicator = { id: 'indicator', status: 'ASSIGNED_TO_UNIT', category: 'RUTIN', pics: [{ userId: picIds[0] }] };
    const updated = { ...indicator, status: 'SUBMITTED', pics: (input ?? []).map(userId => ({ userId })) };
    const prisma = {
      programIndicator: {
        findFirst: vi.fn().mockResolvedValue(indicator),
        update: vi.fn().mockResolvedValue(updated),
      },
    };
    const audit = { log: vi.fn() };
    const service = new ProgramIndicatorService(prisma as any, {} as any, audit as any, {} as any, {} as any);
    const dto = setIndicatorTargetSchema.parse({ targetQ1: 10, picIds: input });

    const result = await service.setTarget('program', 'indicator', dto, { id: 'user', name: 'User' });

    expect(prisma.programIndicator.update).toHaveBeenCalledWith({
      where: { id: 'indicator' },
      data: {
        targetQ1: 10,
        pics: expected,
        proposalDocumentId: undefined,
        rabDocumentId: undefined,
        status: 'SUBMITTED',
      },
      include: { pics: true, proposalDocument: true, rabDocument: true },
    });
    expect(result.picIds).toEqual(updated.pics.map(pic => pic.userId));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ oldValue: indicator, newValue: updated }));
  });

  it('rejects invalid PIC UUIDs and scalar PIC values', () => {
    expect(setIndicatorTargetSchema.safeParse({ picIds: ['invalid'] }).success).toBe(false);
    expect(setIndicatorTargetSchema.safeParse({ picIds: picIds[0] }).success).toBe(false);
  });
});

describe('ProgramIndicatorService.updateStatus', () => {
  const user = { id: 'user', name: 'User' };

  it('updates only status and records the change in the audit log', async () => {
    const indicator = { id: 'indicator', status: ProgramStatus.SUBMITTED };
    const updated = { ...indicator, status: ProgramStatus.APPROVED, pics: [] };
    const prisma = { programIndicator: {
      findFirst: vi.fn().mockResolvedValue(indicator),
      update: vi.fn().mockResolvedValue(updated),
    } };
    const audit = { log: vi.fn() };
    const service = new ProgramIndicatorService(prisma as any, {} as any, audit as any, {} as any, {} as any);

    const result = await service.updateStatus('program', 'indicator', { status: ProgramStatus.APPROVED }, user);

    expect(prisma.programIndicator.findFirst).toHaveBeenCalledWith({ where: { id: 'indicator', programId: 'program' } });
    expect(prisma.programIndicator.update).toHaveBeenCalledWith({
      where: { id: 'indicator' },
      data: { status: ProgramStatus.APPROVED },
      include: { pics: true, proposalDocument: true, rabDocument: true },
    });
    expect(result.status).toBe(ProgramStatus.APPROVED);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      userId: user.id,
      oldValue: { status: ProgramStatus.SUBMITTED },
      newValue: { status: ProgramStatus.APPROVED },
    }));
  });

  it('rejects an indicator that does not belong to the program without writing changes', async () => {
    const prisma = { programIndicator: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() } };
    const audit = { log: vi.fn() };
    const service = new ProgramIndicatorService(prisma as any, {} as any, audit as any, {} as any, {} as any);

    await expect(service.updateStatus('other-program', 'indicator', { status: ProgramStatus.APPROVED }, user))
      .rejects.toBeInstanceOf(EntityNotFoundException);
    expect(prisma.programIndicator.update).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('requires a valid status', () => {
    for (const status of Object.values(ProgramStatus)) {
      expect(updateProgramIndicatorStatusSchema.safeParse({ status }).success).toBe(true);
    }
    for (const body of [{}, { status: null }, { status: 'INVALID' }]) {
      expect(updateProgramIndicatorStatusSchema.safeParse(body).success).toBe(false);
    }
  });
});
