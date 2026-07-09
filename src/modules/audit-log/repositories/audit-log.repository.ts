import { Injectable } from '@nestjs/common';
import { AuditLog, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { IAuditLogRepository } from './audit-log.repository.interface';

@Injectable()
export class AuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AuditLogCreateInput): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data });
  }

  async findAll(params: {
    skip: number;
    take: number;
    where?: Prisma.AuditLogWhereInput;
    orderBy?: Prisma.AuditLogOrderByWithRelationInput;
  }): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy ?? { createdAt: 'desc' },
    });
  }

  async count(where?: Prisma.AuditLogWhereInput): Promise<number> {
    return this.prisma.auditLog.count({ where });
  }

  async findById(id: string): Promise<AuditLog | null> {
    return this.prisma.auditLog.findUnique({ where: { id } });
  }
}
