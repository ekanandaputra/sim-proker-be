import { AuditAction } from '@prisma/client';

export interface CreateAuditLogDto {
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId: string;
  userName?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}
