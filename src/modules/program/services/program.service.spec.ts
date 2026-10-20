import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgramService } from '@modules/program/services/program.service';
import { IProgramRepository } from '@modules/program/repositories/program.repository.interface';
import { ProgramStatus } from '@prisma/client';
import { EntityNotFoundException, EntityConflictException } from '@common/exceptions';
import { Decimal } from '@prisma/client/runtime/library';

describe('ProgramService', () => {
  let service: ProgramService;
  let repository: IProgramRepository;
  let auditLogService: any;
  let unitService: { getUserUnits: ReturnType<typeof vi.fn>; getUnitById: ReturnType<typeof vi.fn> };
  let authIntegrationService: { getAllUsers: ReturnType<typeof vi.fn> };

  const mockProgram = {
    id: 'test-uuid-1',
    code: 'PRG-2025-001',
    title: 'Test Program',
    description: 'Test description',
    objective: 'Test objective',
    year: 2025,
    categoryId: 'cat-uuid-1',
    status: ProgramStatus.DRAFT,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    budget: new Decimal(100000000),
    createdBy: 'user-uuid-1',
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { name: 'Penelitian' },
  };

  beforeEach(() => {
    repository = {
      findAll: vi.fn(),
      count: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    auditLogService = {
      log: vi.fn(),
    };

    const prismaService = {
      masterUnitType: {
        findFirst: vi.fn(),
        create: vi.fn(),
      }
    };

    authIntegrationService = { getAllUsers: vi.fn() };
    unitService = { getUserUnits: vi.fn(), getUnitById: vi.fn() };
    service = new ProgramService(repository, auditLogService, prismaService as any, unitService as any, {} as any, authIntegrationService as any, { getUrl: (path: string) => `https://files.example/${path}` } as any);
  });

  const mockAdminUser = {
    userId: 'admin-uuid',
    unitId: 'unit-uuid-admin',
    roles: ['admin_sim_iku'],
    name: 'Admin User',
  };

  const mockRegularUser = {
    userId: 'user-uuid',
    unitId: 'unit-uuid-123',
    roles: ['PIC'],
    name: 'Regular User',
  };

  describe('findAll', () => {
    it('should return paginated programs for admin without unit filter', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([mockProgram]);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await service.findAll(
        { page: 1, limit: 10, sortOrder: 'desc' },
        mockAdminUser,
      );

      expect(result.items).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(repository.findAll).toHaveBeenCalledOnce();
    });

    it('includes PIC names across user pages and preserves unassigned indicators', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([{ ...mockProgram, indicators: [
        { id: 'indicator-1', pics: [{ userId: 'user-1' }, { userId: 'user-2' }] },
        { id: 'indicator-2', pics: [] },
      ] } as any]);
      vi.mocked(repository.count).mockResolvedValue(1);
      authIntegrationService.getAllUsers
        .mockResolvedValueOnce({ items: [{ id: 'user-1', name: 'Budi' }], pagination: { totalPages: 2 } })
        .mockResolvedValueOnce({ items: [{ id: 'user-2', name: 'Siti' }], pagination: { totalPages: 2 } });

      const result = await service.findAll({ page: 1, limit: 50 }, mockAdminUser, 'Bearer token');

      expect(repository.findAll).toHaveBeenCalledWith(expect.objectContaining({
        include: { indicators: { include: { pics: true, proposalDocument: true, rabDocument: true } } },
      }));
      expect(result.items[0].indicators[0].picIds).toEqual(['user-1', 'user-2']);
      expect(result.items[0].indicators[0].pics).toEqual([
        { id: 'user-1', name: 'Budi' }, { id: 'user-2', name: 'Siti' },
      ]);
      expect(result.items[0].indicators[1].pics).toEqual([]);
      expect(authIntegrationService.getAllUsers).toHaveBeenLastCalledWith('Bearer token', {
        page: 2, limit: 100, sortOrder: 'desc',
      });
    });

    it('preserves PIC IDs when the user service is unavailable', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([{ ...mockProgram, indicators: [
        { id: 'indicator-1', pics: [{ userId: 'user-1' }] },
      ] } as any]);
      vi.mocked(repository.count).mockResolvedValue(1);
      authIntegrationService.getAllUsers.mockRejectedValue(new Error('Unavailable'));
      const result = await service.findAll({ page: 1, limit: 50 }, mockAdminUser);
      expect(result.items[0].indicators[0].pics).toEqual([{ id: 'user-1', name: 'user-1' }]);
    });

    it('should filter programs by user unitId for non-admin', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 10, sortOrder: 'desc' },
        mockRegularUser,
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            indicators: {
              some: {
                unitId: { in: [mockRegularUser.unitId] },
              },
            },
          }),
        }),
      );
    });

    it.each([
      { roles: ['PIC'], unitId: undefined, units: [{ unitId: 'unit-a' }, { id: 'unit-b' }], expected: { unitId: { in: ['unit-a', 'unit-b'] } } },
      { roles: ['PIC'], unitId: 'unit-a', units: [{ unitId: 'unit-a' }], expected: { unitId: 'unit-a' } },
      { roles: ['PIC'], unitId: 'unit-other', units: [{ unitId: 'unit-a' }], expected: { unitId: { in: [] } } },
      { roles: ['PIC'], unitId: undefined, units: [], expected: { unitId: { in: [] } } },
      { roles: ['admin_sim_iku'], unitId: 'unit-a', units: [], expected: { unitId: 'unit-a' } },
    ])('filters nested indicators consistently with program access: $roles / $unitId / $units', async ({ roles, unitId, units, expected }) => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);
      unitService.getUserUnits.mockResolvedValue(units);

      await service.findAll(
        { page: 1, limit: 50, unitId },
        { ...mockRegularUser, roles, unitId: '' },
        'Bearer token',
      );

      expect(repository.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { indicators: { some: expected } },
        include: { indicators: { where: expected, include: { pics: true, proposalDocument: true, rabDocument: true } } },
      }));
      expect(repository.count).toHaveBeenCalledWith({ indicators: { some: expected } });
    });

    it('returns unit names and fetches each assigned unit once', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([{ ...mockProgram, indicators: [
        { id: 'indicator-1', unitId: 'unit-a', pics: [] },
        { id: 'indicator-2', unitId: 'unit-a', pics: [] },
      ] } as any]);
      vi.mocked(repository.count).mockResolvedValue(1);
      unitService.getUnitById.mockResolvedValue({ id: 'unit-a', name: 'Program Studi A' });
      const result = await service.findAll({ page: 1, limit: 50 }, mockAdminUser, 'Bearer token');
      expect(result.items[0].indicators.map(indicator => indicator.unit)).toEqual([
        { id: 'unit-a', name: 'Program Studi A' }, { id: 'unit-a', name: 'Program Studi A' },
      ]);
      expect(unitService.getUnitById).toHaveBeenCalledExactlyOnceWith('unit-a', 'Bearer token');
    });

    it('returns the unit ID when unit details are unavailable', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([{ ...mockProgram, indicators: [
        { id: 'indicator-1', unitId: 'unit-a', pics: [] },
      ] } as any]);
      vi.mocked(repository.count).mockResolvedValue(1);
      unitService.getUnitById.mockRejectedValue(new Error('Unavailable'));
      const result = await service.findAll({ page: 1, limit: 50 }, mockAdminUser);
      expect(result.items[0].indicators[0].unit).toEqual({ id: 'unit-a', name: 'unit-a' });
    });

    it('includes TOR and RAB metadata, IDs and full URLs for prefill', async () => {
      const tor = { id: 'tor-id', fileName: 'tor.pdf', filePath: 'documents/tor.pdf' };
      const rab = { id: 'rab-id', fileName: 'rab.xlsx', filePath: 'documents/rab.xlsx' };
      vi.mocked(repository.findAll).mockResolvedValue([{ ...mockProgram, indicators: [
        { id: 'indicator-1', pics: [], proposalDocumentId: tor.id, rabDocumentId: rab.id,
          proposalDocument: tor, rabDocument: rab },
        { id: 'indicator-2', pics: [] },
      ] } as any]);
      vi.mocked(repository.count).mockResolvedValue(1);
      const result = await service.findAll({ page: 1, limit: 50 }, mockAdminUser);
      expect(result.items[0].indicators[0]).toMatchObject({
        proposalDocumentId: 'tor-id', rabDocumentId: 'rab-id',
        proposalDocument: { ...tor, filePath: 'https://files.example/documents/tor.pdf' },
        rabDocument: { ...rab, filePath: 'https://files.example/documents/rab.xlsx' },
        proposalURL: 'https://files.example/documents/tor.pdf',
        rabURL: 'https://files.example/documents/rab.xlsx',
      });
      expect(result.items[0].indicators[1]).toMatchObject({
        proposalDocumentId: null, rabDocumentId: null, proposalDocument: null,
        rabDocument: null, proposalURL: null, rabURL: null,
      });
    });

    it('should apply search filter', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 10, sortOrder: 'desc', search: 'test query' },
        mockAdminUser,
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: { contains: 'test query' } }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a program when found', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockProgram);

      const result = await service.findById('test-uuid-1');

      expect(result.id).toBe('test-uuid-1');
      expect(result.title).toBe('Test Program');
    });

    it('should throw EntityNotFoundException when not found', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('create', () => {
    it('should create a program successfully', async () => {
      vi.mocked(repository.findByCode).mockResolvedValue(null);
      vi.mocked(repository.create).mockResolvedValue(mockProgram);

      const dto = {
        code: 'PRG-2025-001',
        title: 'Test Program',
        year: 2025,
        categoryId: 'cat-uuid-1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        budget: 100000000,
      };

      const result = await service.create(dto, 'user-uuid-1');

      expect(result.code).toBe('PRG-2025-001');
      expect(repository.create).toHaveBeenCalledOnce();
    });

    it('should throw EntityConflictException for duplicate code', async () => {
      vi.mocked(repository.findByCode).mockResolvedValue(mockProgram);

      const dto = {
        code: 'PRG-2025-001',
        title: 'Duplicate',
        year: 2025,
        categoryId: 'cat-uuid-1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        budget: 0,
      };

      await expect(service.create(dto, 'user-uuid-1')).rejects.toThrow(EntityConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a program', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockProgram);
      vi.mocked(repository.delete).mockResolvedValue(mockProgram);

      await service.remove('test-uuid-1');

      expect(repository.delete).toHaveBeenCalledWith('test-uuid-1');
    });

    it('should throw EntityNotFoundException when deleting non-existent', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(EntityNotFoundException);
    });
  });
});
