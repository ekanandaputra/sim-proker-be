import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { EntityNotFoundException } from '@common/exceptions';
import { CreateProgramIndicatorDto, UpdateProgramIndicatorDto, SetIndicatorTargetDto } from '../dto/program-indicator.dto';
import { CreateProgramIndicatorRealizationDto } from '../dto/program-indicator-realization.dto';
import { UnitService } from '../../unit/services/unit.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { AuthIntegrationService } from '../../external/auth-integration/services/auth-integration.service';
import { AuditAction } from '@prisma/client';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { Role } from '@common/constants';

@Injectable()
export class ProgramIndicatorService {
  private readonly logger = new Logger(ProgramIndicatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly unitService: UnitService,
    private readonly auditLogService: AuditLogService,
    private readonly authIntegrationService: AuthIntegrationService,
  ) { }

  private async getPicNames(picIds: string[], token?: string): Promise<{ id: string; name: string }[]> {
    if (!picIds || picIds.length === 0) return [];
    try {
      // Fetch users with a large limit to hopefully catch the PICs
      const response = await this.authIntegrationService.getAllUsers(token, { page: 1, limit: 10000, sortOrder: 'desc' });
      const users = response.items || [];
      return picIds.map(id => {
        const found = users.find(u => u.id === id);
        return { id, name: found?.name || id };
      });
    } catch (e) {
      this.logger.warn(`Failed to fetch pic names: ${(e as Error).message}`);
      return picIds.map(id => ({ id, name: id }));
    }
  }

  async findAllByProgramId(programId: string, token: string, currentUser: JwtPayload) {
    const isAdmin = currentUser.roles.includes(Role.ADMIN);

    const where: { programId: string; unitId?: string } = { programId };

    // Non-ADMIN hanya boleh melihat indicator milik unitnya sendiri
    if (!isAdmin && currentUser.unitId) {
      where.unitId = currentUser.unitId;
    }

    const indicators = await this.prisma.programIndicator.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        pics: true,
        masterUnitType: true,
      }
    });

    // Fetch unit info for all unique unitIds
    const uniqueUnitIds = [...new Set(indicators.map(i => i.unitId).filter(Boolean))];
    const unitMap = new Map();

    for (const unitId of uniqueUnitIds) {
      try {
        const unitInfo = await this.unitService.getUnitById(unitId, token);
        unitMap.set(unitId, unitInfo);
      } catch (err) {
        this.logger.error(`Failed to fetch unit ${unitId}`);
      }
    }

    return indicators.map(indicator => ({
      ...indicator,
      unit: unitMap.get(indicator.unitId) || null,
      masterUnitType: indicator.masterUnitType,
      picIds: indicator.pics.map(p => p.userId),
    }));
  }

  async create(programId: string, dto: CreateProgramIndicatorDto, user: { id: string, name: string }, token?: string) {
    const { picIds, ...rest } = dto;
    // Check if program exists
    const program = await this.prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
      throw new EntityNotFoundException('Program', programId);
    }

    const indicator = await this.prisma.programIndicator.create({
      data: {
        ...rest,
        programId,
        pics: picIds ? {
          create: picIds.map(userId => ({ userId }))
        } : undefined
      },
      include: {
        pics: true,
      }
    });

    const picsWithName = await this.getPicNames(indicator.pics.map(p => p.userId), token);

    await this.auditLogService.log({
      action: AuditAction.CREATE,
      entityType: 'ProgramIndicator',
      entityId: indicator.id,
      userId: user.id,
      userName: user.name,
      newValue: {
        ...indicator,
        pics: picsWithName,
      } as unknown as Record<string, unknown>
    });

    return {
      ...indicator,
      picIds: indicator.pics.map(p => p.userId),
    };
  }

  async update(programId: string, id: string, dto: UpdateProgramIndicatorDto, user: { id: string, name: string }, token?: string) {
    const { picIds, ...rest } = dto;
    const indicator = await this.prisma.programIndicator.findFirst({
      where: { id, programId },
      include: { pics: true }
    });
    if (!indicator) {
      throw new EntityNotFoundException('ProgramIndicator', id);
    }

    const oldPicsWithName = await this.getPicNames(indicator.pics.map(p => p.userId), token);

    const updated = await this.prisma.programIndicator.update({
      where: { id },
      data: {
        ...rest,
        pics: picIds ? {
          deleteMany: {},
          create: picIds.map(userId => ({ userId }))
        } : undefined
      },
      include: {
        pics: true,
      }
    });

    const newPicsWithName = await this.getPicNames(updated.pics.map(p => p.userId), token);

    await this.auditLogService.log({
      action: AuditAction.UPDATE,
      entityType: 'ProgramIndicator',
      entityId: updated.id,
      userId: user.id,
      userName: user.name,
      oldValue: {
        ...indicator,
        pics: oldPicsWithName,
      } as unknown as Record<string, unknown>,
      newValue: {
        ...updated,
        pics: newPicsWithName,
      } as unknown as Record<string, unknown>
    });

    return {
      ...updated,
      picIds: updated.pics.map(p => p.userId),
    };
  }

  async remove(programId: string, id: string, user: { id: string, name: string }) {
    const indicator = await this.prisma.programIndicator.findFirst({
      where: { id, programId },
      include: { pics: true }
    });
    if (!indicator) {
      throw new EntityNotFoundException('ProgramIndicator', id);
    }

    await this.prisma.programIndicator.delete({
      where: { id },
    });

    await this.auditLogService.log({
      action: AuditAction.DELETE,
      entityType: 'ProgramIndicator',
      entityId: id,
      userId: user.id,
      userName: user.name,
      oldValue: indicator as unknown as Record<string, unknown>,
    });
  }

  async setTarget(programId: string, id: string, dto: SetIndicatorTargetDto, user: { id: string, name: string }) {
    const indicator = await this.prisma.programIndicator.findFirst({
      where: { id, programId },
    });
    if (!indicator) {
      throw new EntityNotFoundException('ProgramIndicator', id);
    }

    // Ubah status ke IN_PROGRESS jika sebelumnya ASSIGNED_TO_UNIT
    // Namun untuk kategori TUSI dan PENGEMBANGAN, ubah ke SUBMITTED
    let newStatus = indicator.status;
    if (indicator.status === 'ASSIGNED_TO_UNIT') {
      if (indicator.category === 'TUSI' || indicator.category === 'PENGEMBANGAN') {
        newStatus = 'SUBMITTED';
      } else {
        newStatus = 'APPROVED';
      }
    }

    const updated = await this.prisma.programIndicator.update({
      where: { id },
      data: {
        ...dto,
        status: newStatus,
      },
    });

    await this.auditLogService.log({
      action: AuditAction.UPDATE,
      entityType: 'ProgramIndicator',
      entityId: id,
      userId: user.id,
      userName: user.name,
      oldValue: indicator as unknown as Record<string, unknown>,
      newValue: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  async getRealizations(programId: string, indicatorId: string) {
    const indicator = await this.prisma.programIndicator.findFirst({
      where: { id: indicatorId, programId },
    });
    if (!indicator) {
      throw new EntityNotFoundException('ProgramIndicator', indicatorId);
    }

    const realizations = await this.prisma.programIndicatorRealization.findMany({
      where: { indicatorId },
      orderBy: { month: 'asc' },
      include: {
        documents: {
          include: { document: true }
        }
      }
    });

    return realizations.map(r => ({
      ...r,
      documents: r.documents.map(rd => rd.document)
    }));
  }

  async upsertRealization(programId: string, indicatorId: string, dto: CreateProgramIndicatorRealizationDto, user: { id: string, name: string }) {
    const indicator = await this.prisma.programIndicator.findFirst({
      where: { id: indicatorId, programId },
    });
    if (!indicator) {
      throw new EntityNotFoundException('ProgramIndicator', indicatorId);
    }

    const oldRealization = await this.prisma.programIndicatorRealization.findUnique({
      where: {
        indicatorId_month: {
          indicatorId,
          month: dto.month,
        }
      },
      include: { documents: { include: { document: true } } }
    });

    const realization = await this.prisma.programIndicatorRealization.upsert({
      where: {
        indicatorId_month: {
          indicatorId,
          month: dto.month,
        }
      },
      update: {
        realization: dto.realization,
        remark: dto.remark,
        documents: dto.documentIds ? {
          deleteMany: {},
          create: dto.documentIds.map(id => ({ documentId: id })),
        } : undefined,
      },
      create: {
        indicatorId,
        month: dto.month,
        realization: dto.realization,
        remark: dto.remark,
        documents: dto.documentIds ? {
          create: dto.documentIds.map(id => ({ documentId: id })),
        } : undefined,
      },
      include: {
        documents: {
          include: { document: true }
        }
      }
    });

    await this.auditLogService.log({
      action: oldRealization ? AuditAction.UPDATE : AuditAction.CREATE,
      entityType: 'ProgramIndicatorRealization',
      entityId: realization.id,
      userId: user.id,
      userName: user.name,
      oldValue: oldRealization ? (oldRealization as unknown as Record<string, unknown>) : undefined,
      newValue: realization as unknown as Record<string, unknown>,
    });

    return {
      ...realization,
      documents: realization.documents.map(d => d.document)
    };
  }

  async getIndicatorUnitUsers(programId: string, indicatorId: string, token: string, query?: any) {
    const indicator = await this.prisma.programIndicator.findFirst({
      where: { id: indicatorId, programId },
    });
    if (!indicator) {
      throw new EntityNotFoundException('ProgramIndicator', indicatorId);
    }

    if (!indicator.unitId) {
      return { items: [], pagination: null };
    }

    return this.unitService.getUnitUsers(indicator.unitId, token, query || { limit: 1000 });
  }
}
