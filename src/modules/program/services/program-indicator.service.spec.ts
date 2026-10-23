import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { describe, it, expect, vi } from 'vitest';
import { ProgramIndicatorService } from './program-indicator.service';
import { ProgramStatus } from '@prisma/client';
import { EntityNotFoundException } from '@common/exceptions';
import { submitIndicatorTargetSchema, setIndicatorTargetSchema, updateProgramIndicatorStatusSchema } from '../dto/program-indicator.dto';

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

describe('set-target submission document validation', () => {
  const documents = { propsal: picIds[0], rab: picIds[1] };
  it.each([
    {}, { rab: picIds[1] }, { propsal: picIds[0] },
    { ...documents, propsal: null }, { ...documents, rab: null },
    { ...documents, propsal: '' }, { ...documents, rab: '' },
  ])('rejects incomplete documents: %j', input => {
    expect(submitIndicatorTargetSchema.safeParse(input).success).toBe(false);
  });
  it('accepts both proposal and RAB UUIDs', () => {
    expect(submitIndicatorTargetSchema.safeParse(documents).success).toBe(true);
  });
});

describe('set-target errors for frontend', () => {
  it.each([undefined, null, '', '   '])('returns consistent required errors for %j', value => {
    const pipe = new ZodValidationPipe(submitIndicatorTargetSchema, true);
    let response: unknown;
    try { pipe.transform({ propsal: value, rab: value }); }
    catch (error) { response = (error as BadRequestException).getResponse(); }
    expect(response).toEqual({
      isSuccess: false,
      message: 'Dokumen proposal wajib dilampirkan. Dokumen RAB wajib dilampirkan.',
      errors: [
        { field: 'propsal', message: 'Dokumen proposal wajib dilampirkan.' },
        { field: 'rab', message: 'Dokumen RAB wajib dilampirkan.' },
      ],
    });
  });

  it.each(['invalid', 123, {}])('identifies an invalid proposal ID: %j', propsal => {
    const result = submitIndicatorTargetSchema.safeParse({ propsal, rab: picIds[1] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues).toEqual([
      expect.objectContaining({ path: ['propsal'], message: 'ID dokumen proposal tidak valid. Silakan unggah ulang dokumen.' }),
    ]);
  });
});

describe('ProgramIndicatorService audit logging', () => {
  const user = { id: 'jwt-user-id', name: 'User' };
  const indicator = { id: 'indicator', programId: 'program', name: 'Before', pics: [], masterUnitType: { type: 'NUMBER' } };
  function setup() {
    const prisma = {
      program: { findUnique: vi.fn().mockResolvedValue({ id: 'program' }) },
      programIndicator: {
        findFirst: vi.fn().mockResolvedValue(indicator),
        create: vi.fn().mockResolvedValue(indicator),
        update: vi.fn().mockResolvedValue({ ...indicator, name: 'After' }),
        delete: vi.fn().mockResolvedValue(indicator),
      },
      programIndicatorRealization: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({ id: 'realization', documents: [] }),
      },
    };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const service = new ProgramIndicatorService(prisma as any, {} as any, audit as any, {} as any, {} as any);
    return { prisma, audit, service };
  }
  it('records create and update with the actor and snapshots', async () => {
    const { service, audit } = setup();
    await service.create('program', { name: 'Before', unitId: 'unit', masterUnitTypeId: 'type' }, user);
    expect(audit.log).toHaveBeenLastCalledWith(expect.objectContaining({
      action: 'CREATE', entityType: 'ProgramIndicator', entityId: 'indicator', userId: user.id, userName: user.name,
      newValue: expect.objectContaining({ name: 'Before' }),
    }));
    await service.update('program', 'indicator', { name: 'After' }, user);
    expect(audit.log).toHaveBeenLastCalledWith(expect.objectContaining({
      action: 'UPDATE', userId: user.id,
      oldValue: expect.objectContaining({ name: 'Before' }), newValue: expect.objectContaining({ name: 'After' }),
    }));
  });
  it('records delete with the full previous indicator', async () => {
    const { service, audit } = setup();
    await service.remove('program', 'indicator', user);
    expect(audit.log).toHaveBeenCalledExactlyOnceWith({
      action: 'DELETE', entityType: 'ProgramIndicator', entityId: 'indicator',
      userId: user.id, userName: user.name, oldValue: indicator,
    });
  });
  it('does not record a successful deletion when deleting fails', async () => {
    const { service, audit, prisma } = setup();
    prisma.programIndicator.delete.mockRejectedValue(new Error('Database error'));
    await expect(service.remove('program', 'indicator', user)).rejects.toThrow('Database error');
    expect(audit.log).not.toHaveBeenCalled();
  });
  it.each([false, true])('records realization create/update (existing=%s)', async existing => {
    const { service, audit, prisma } = setup();
    if (existing) prisma.programIndicatorRealization.findUnique.mockResolvedValue({ id: 'realization', realization: 1 } as any);
    await service.upsertRealization('program', 'indicator', { month: 1, realization: 2 }, user);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      action: existing ? 'UPDATE' : 'CREATE', entityType: 'ProgramIndicatorRealization', entityId: 'realization', userId: user.id,
    }));
  });
});
