import { AuditLog, Prisma } from '@prisma/client';

export interface IAuditLogRepository {
  create(data: Prisma.AuditLogCreateInput): Promise<AuditLog>;

  findAll(params: {
    skip: number;
    take: number;
    where?: Prisma.AuditLogWhereInput;
    orderBy?: Prisma.AuditLogOrderByWithRelationInput;
  }): Promise<AuditLog[]>;

  count(where?: Prisma.AuditLogWhereInput): Promise<number>;

  findById(id: string): Promise<AuditLog | null>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
