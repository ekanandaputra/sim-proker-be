import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PROGRAM_REPOSITORY,
  IProgramRepository,
} from '../repositories/program.repository.interface';
import { CreateProgramDto } from '../dto/create-program.dto';
import { UpdateProgramDto } from '../dto/update-program.dto';
import { AssignProgramDto } from '../dto/assign-program.dto';
import { ProgramQueryDto } from '../dto/program-query.dto';
import { ProgramResponseDto } from '../dto/program-response.dto';
import { ProgramMapper } from '../mapper/program.mapper';
import { PaginatedResponse } from '@common/dto/pagination.dto';
import { buildPaginationArgs, buildPaginatedResponse } from '@common/utils/pagination.util';
import {
  EntityNotFoundException,
  EntityConflictException,
} from '@common/exceptions';
import { AuditLogService } from '@modules/audit-log/services/audit-log.service';
import { PrismaService } from '@database/prisma/prisma.service';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { Role } from '@common/constants';
import { STORAGE_SERVICE, IStorageService } from '@common/storage';
import { UnitService } from '../../unit/services/unit.service';
import { AuthIntegrationService } from '../../external/auth-integration/services/auth-integration.service';
import { IkuService } from '../../iku/services/iku.service';
import { z } from 'zod';


@Injectable()
export class ProgramService {
  private readonly logger = new Logger(ProgramService.name);

  constructor(
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: IProgramRepository,
    private readonly auditLogService: AuditLogService,
    private readonly prisma: PrismaService,
    private readonly unitService: UnitService,
    private readonly authIntegrationService: AuthIntegrationService,
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
    private readonly ikuService: IkuService,
  ) {}

  async migrateIkuIds(token: string | undefined, userId: string) {
    const programs = await this.prisma.program.findMany({ select: { id: true, ikuId: true } });
    const legacyPrograms = programs.filter(program =>
      program.ikuId !== null && !z.string().uuid().safeParse(program.ikuId).success,
    );
    const skippedCount = programs.length - legacyPrograms.length;
    if (legacyPrograms.length === 0) return { updatedCount: 0, skippedCount };

    const idByCode = new Map<string, string>();
    let page = 1;
    while (true) {
      const response = await this.ikuService.getAllIkus(token, { page, limit: 1000 });
      for (const iku of response.items) {
        const code = iku.code.trim().toLowerCase();
        if (!z.string().uuid().safeParse(iku.id).success) {
          throw new BadRequestException(`Invalid SIM IKU UUID for code '${iku.code}'`);
        }
        if (idByCode.has(code) && idByCode.get(code) !== iku.id) {
          throw new BadRequestException(`Ambiguous IKU code '${iku.code}'`);
        }
        idByCode.set(code, iku.id);
      }
      if (page >= response.pagination.totalPages) break;
      page++;
    }

    const matchedPrograms = legacyPrograms.filter(program =>
      idByCode.has(program.ikuId!.trim().toLowerCase()),
    );
    if (matchedPrograms.length === 0) return { updatedCount: 0, skippedCount: programs.length };
    const results = await this.prisma.$transaction(matchedPrograms.map(program =>
      this.prisma.program.updateMany({
        where: { id: program.id, ikuId: program.ikuId },
        data: { ikuId: idByCode.get(program.ikuId!.trim().toLowerCase())!, updatedBy: userId },
      }),
    ));
    const updatedCount = results.reduce((total, result) => total + result.count, 0);
    return { updatedCount, skippedCount: programs.length - updatedCount };
  }

  async findAll(query: ProgramQueryDto, currentUser: JwtPayload, token?: string): Promise<PaginatedResponse<ProgramResponseDto>> {
    const { skip, take, orderBy } = buildPaginationArgs(query);

    const where: Prisma.ProgramWhereInput = {};

    if (query.year) {
      where.year = query.year;
    }

    // Jika bukan ADMIN, filter program hanya yang indikatornya di-assign ke unit milik user
    const isAdmin = currentUser.roles.includes(Role.ADMIN);
    if (!isAdmin) {
      let allowedUnitIds = [currentUser.unitId].filter(Boolean);
      if (token) {
        try {
          const userUnits = await this.unitService.getUserUnits(currentUser.userId, token);
          if (userUnits && userUnits.length > 0) {
            allowedUnitIds = userUnits.map((u: any) => u.unitId || u.id).filter(Boolean);
          }
        } catch (e) {
          this.logger.warn(`Failed to fetch user units: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      if (query.unitId) {
        if (!allowedUnitIds.includes(query.unitId)) {
          // If the user tries to query a unit they are not assigned to, return empty result
          where.indicators = { some: { unitId: { in: [] } } };
        } else {
          where.indicators = { some: { unitId: query.unitId } };
        }
      } else if (allowedUnitIds.length > 0) {
        where.indicators = { some: { unitId: { in: allowedUnitIds } } };
      } else {
         where.indicators = { some: { unitId: { in: [] } } };
      }
    } else if (query.unitId) {
      // ADMIN bisa filter manual via query param
      where.indicators = {
        some: { unitId: query.unitId },
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { code: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const [programs, totalItems] = await Promise.all([
      this.programRepository.findAll({
        skip,
        take,
        where,
        orderBy: orderBy as Prisma.ProgramOrderByWithRelationInput,
        include: {
          indicators: {
            ...(where.indicators?.some ? { where: where.indicators.some } : {}),
            include: { pics: true, proposalDocument: true, rabDocument: true },
          },
        },
      }),
      this.programRepository.count(where),
    ]);

    const items = ProgramMapper.toResponseList(
      programs as Array<typeof programs[0] & { category?: { name: string } | null }>,
    );

    const unitIds = [...new Set(items.flatMap(program =>
      program.indicators.map(indicator => indicator.unitId).filter(Boolean),
    ))];
    const units = new Map<string, { id: string; name: string }>();
    await Promise.all(unitIds.map(async id => {
      try {
        const unit = await this.unitService.getUnitById(id, token ?? '');
        units.set(id, { id, name: unit.name || unit.unitName || id });
      } catch (e) {
        this.logger.warn(`Failed to fetch unit ${id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        units.set(id, { id, name: id });
      }
    }));

    const unresolvedIds = new Set(items.flatMap(program =>
      program.indicators.flatMap(indicator => indicator.picIds ?? []),
    ));
    const names = new Map<string, string>();
    if (unresolvedIds.size > 0) {
      try {
        let page = 1;
        let totalPages = 1;
        do {
          const response = await this.authIntegrationService.getAllUsers(token, {
            page, limit: 1000, sortOrder: 'desc',
          });
          for (const user of response.items) {
            if (unresolvedIds.has(user.id)) {
              names.set(user.id, user.name || user.id);
              unresolvedIds.delete(user.id);
            }
          }
          totalPages = response.pagination.totalPages;
          page++;
        } while (page <= totalPages && unresolvedIds.size > 0);
      } catch (e) {
        this.logger.warn(`Failed to fetch PIC names: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
    for (const program of items) {
      for (const indicator of program.indicators) {
        indicator.unit = units.get(indicator.unitId) ?? null;
        for (const key of ['proposalDocument', 'rabDocument'] as const) {
          const document = indicator[key];
          if (document) {
            indicator[key] = { ...document, filePath: this.storageService.getUrl(document.filePath) };
          }
        }
        indicator.proposalURL = indicator.proposalDocument?.filePath ?? null;
        indicator.rabURL = indicator.rabDocument?.filePath ?? null;
        indicator.pics = (indicator.picIds ?? []).map(id => ({ id, name: names.get(id) ?? id }));
      }
    }

    return buildPaginatedResponse(items, totalItems, query);
  }

  async findById(id: string): Promise<ProgramResponseDto> {
    const program = await this.programRepository.findById(id);

    if (!program) {
      throw new EntityNotFoundException('Program', id);
    }

    return ProgramMapper.toResponse(
      program as typeof program & { category?: { name: string } | null },
    );
  }

  async create(
    dto: Omit<CreateProgramDto, 'indicators'> & Partial<Pick<CreateProgramDto, 'indicators'>>,
    userId: string,
    token?: string,
    roles: string[] = [],
  ): Promise<ProgramResponseDto> {
    if (!roles.includes('admin_sim_proker')) {
      const errors = (dto.indicators ?? []).flatMap((indicator, index) => {
        if (indicator.category !== 'PENGEMBANGAN' && indicator.category !== 'RUTIN') return [];
        return (['proposalDocumentId', 'rabDocumentId'] as const)
          .filter(field => !indicator[field])
          .map(field => ({
            field: `indicators.${index}.${field}`,
            message: `${field === 'proposalDocumentId' ? 'Proposal' : 'RAB'} is required for ${indicator.category} indicators`,
          }));
      });
      if (errors.length > 0) {
        throw new BadRequestException({ isSuccess: false, message: 'Validation failed', errors });
      }
    }

    // Check for duplicate code
    const existing = await this.programRepository.findByCode(dto.code);
    if (existing) {
      throw new EntityConflictException(`Program with code '${dto.code}' already exists`);
    }

    const program = await this.programRepository.create({
      code: dto.code,
      ikuId: dto.ikuId,
      title: dto.title,
      description: dto.description,
      objective: dto.objective,
      year: dto.year,
      createdBy: userId,
      indicators: dto.indicators?.length
        ? {
            create: dto.indicators.map(({ picIds, ...indicator }) => ({
              ...indicator,
              pics: picIds?.length
                ? { create: picIds.map((picId) => ({ userId: picId })) }
                : undefined,
            })),
          }
        : undefined,
    });

    this.logger.log(`Program created: ${program.id} by user ${userId}`);

    // Audit log
    await this.auditLogService.log({
      action: 'CREATE',
      entityType: 'Program',
      entityId: program.id,
      userId,
      newValue: {
        code: program.code,
        title: program.title,
        year: program.year,
      },
    });

    for (const indicator of (program as typeof program & { indicators?: { id: string }[] }).indicators ?? []) {
      await this.auditLogService.log({
        action: 'CREATE', entityType: 'ProgramIndicator', entityId: indicator.id, userId,
        newValue: indicator as unknown as Record<string, unknown>,
      });
    }

    return ProgramMapper.toResponse(
      program as typeof program & { category?: { name: string } | null },
    );
  }

  async assignToUnit(id: string, dto: AssignProgramDto, userId: string): Promise<ProgramResponseDto> {
    const existing = await this.programRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Program', id);
    }

    const newCode = `${existing.code}-${dto.year}-${Math.floor(Math.random() * 1000)}`;

    let defaultUnit = await this.prisma.masterUnitType.findFirst({ where: { name: 'N/A' } });
    if (!defaultUnit) {
      defaultUnit = await this.prisma.masterUnitType.create({ data: { name: 'N/A', type: 'TEXT' } });
    }

    const program = await this.programRepository.create({
      code: newCode,
      title: existing.title,
      description: existing.description,
      objective: existing.objective,
      year: dto.year,
      createdBy: userId,
      indicators: dto.unitId ? {
        create: [
          {
            unitId: dto.unitId,
            name: 'Default Indicator',
            masterUnitTypeId: defaultUnit.id,
          }
        ]
      } : undefined,
    });

    this.logger.log(`Program assigned to unit: ${program.id} (from ${existing.id}) by user ${userId}`);

    await this.auditLogService.log({
      action: 'CREATE',
      entityType: 'Program',
      entityId: program.id,
      userId,
      newValue: {
        code: program.code,
        title: program.title,
        year: program.year,
        clonedFrom: existing.id,
      },
    });

    return ProgramMapper.toResponse(
      program as typeof program & { category?: { name: string } | null },
    );
  }

  async update(
    id: string,
    dto: UpdateProgramDto,
    userId: string,
    token?: string,
  ): Promise<ProgramResponseDto> {
    const existing = await this.programRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Program', id);
    }

    // Capture old values for audit
    const oldValue = {
      code: existing.code,
      title: existing.title,
      description: existing.description,
      year: existing.year,
    };

    const updateData: Prisma.ProgramUpdateInput = {
      ...dto,
      ikuId: dto.ikuId,
      updatedBy: userId,
    };

    const program = await this.programRepository.update(id, updateData);

    this.logger.log(`Program updated: ${id} by user ${userId}`);

    // Audit log
    await this.auditLogService.log({
      action: 'UPDATE',
      entityType: 'Program',
      entityId: id,
      userId,
      oldValue,
      newValue: {
        code: program.code,
        title: program.title,
        description: program.description,
        year: program.year,
      },
    });

    return ProgramMapper.toResponse(
      program as typeof program & { category?: { name: string } | null },
    );
  }

  async remove(id: string, userId?: string): Promise<void> {
    const existing = await this.programRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Program', id);
    }

    await this.programRepository.delete(id);
    this.logger.log(`Program deleted: ${id}`);

    // Audit log
    await this.auditLogService.log({
      action: 'DELETE',
      entityType: 'Program',
      entityId: id,
      userId: userId ?? existing.createdBy,
      oldValue: {
        code: existing.code,
        title: existing.title,
        year: existing.year,
      },
    });
  }
}

