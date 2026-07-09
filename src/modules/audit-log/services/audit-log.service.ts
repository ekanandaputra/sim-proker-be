import { Injectable, Inject, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AUDIT_LOG_REPOSITORY,
  IAuditLogRepository,
} from '../repositories/audit-log.repository.interface';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';
import { PaginatedResponse } from '@common/dto/pagination.dto';
import { buildPaginationArgs, buildPaginatedResponse } from '@common/utils/pagination.util';
import { EntityNotFoundException } from '@common/exceptions';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  /**
   * Record an audit log entry.
   * This method is fire-and-forget — errors are logged but not thrown
   * to avoid disrupting the main business flow.
   */
  async log(dto: CreateAuditLogDto): Promise<void> {
    try {
      await this.auditLogRepository.create({
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId,
        userId: dto.userId,
        userName: dto.userName,
        oldValue: dto.oldValue ? (dto.oldValue as Prisma.InputJsonValue) : undefined,
        newValue: dto.newValue ? (dto.newValue as Prisma.InputJsonValue) : undefined,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      });

      this.logger.log(
        `Audit: ${dto.action} ${dto.entityType}#${dto.entityId} by ${dto.userId}`,
      );
    } catch (error) {
      // Audit logging should never break the main flow
      this.logger.error(
        `Failed to write audit log: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async findAll(query: AuditLogQueryDto): Promise<PaginatedResponse<AuditLogResponseDto>> {
    const { skip, take, orderBy } = buildPaginationArgs(query);

    const where: Prisma.AuditLogWhereInput = {};

    if (query.entityType) {
      where.entityType = query.entityType;
    }
    if (query.entityId) {
      where.entityId = query.entityId;
    }
    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.action) {
      where.action = query.action;
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }
    if (query.search) {
      where.OR = [
        { entityType: { contains: query.search } },
        { entityId: { contains: query.search } },
        { userName: { contains: query.search } },
      ];
    }

    const [logs, totalItems] = await Promise.all([
      this.auditLogRepository.findAll({
        skip,
        take,
        where,
        orderBy: orderBy as Prisma.AuditLogOrderByWithRelationInput,
      }),
      this.auditLogRepository.count(where),
    ]);

    const items: AuditLogResponseDto[] = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      userId: log.userId,
      userName: log.userName,
      oldValue: log.oldValue as Record<string, unknown> | null,
      newValue: log.newValue as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }));

    return buildPaginatedResponse(items, totalItems, query);
  }

  async findById(id: string): Promise<AuditLogResponseDto> {
    const log = await this.auditLogRepository.findById(id);

    if (!log) {
      throw new EntityNotFoundException('AuditLog', id);
    }

    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      userId: log.userId,
      userName: log.userName,
      oldValue: log.oldValue as Record<string, unknown> | null,
      newValue: log.newValue as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    };
  }
}
