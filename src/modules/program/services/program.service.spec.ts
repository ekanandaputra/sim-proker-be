import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgramService } from '@modules/program/services/program.service';
import { IProgramRepository } from '@modules/program/repositories/program.repository.interface';
import { ProgramStatus } from '@prisma/client';
import { EntityNotFoundException, EntityConflictException } from '@common/exceptions';
import { Decimal } from '@prisma/client/runtime/library';

describe('ProgramService', () => {
  let service: ProgramService;
  let repository: IProgramRepository;

  const mockProgram = {
    id: 'test-uuid-1',
    code: 'PRG-2025-001',
    title: 'Test Program',
    description: 'Test description',
    objective: 'Test objective',
    year: 2025,
    unitId: 'unit-uuid-1',
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

    service = new ProgramService(repository);
  });

  describe('findAll', () => {
    it('should return paginated programs', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([mockProgram]);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        sortOrder: 'desc',
      });

      expect(result.items).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(repository.findAll).toHaveBeenCalledOnce();
    });

    it('should apply search filter', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await service.findAll({
        page: 1,
        limit: 10,
        sortOrder: 'desc',
        search: 'test query',
      });

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
      expect(result.categoryName).toBe('Penelitian');
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
        unitId: 'unit-uuid-1',
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
        unitId: 'unit-uuid-1',
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
