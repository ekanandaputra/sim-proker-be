import { z } from 'zod';
import { paginationQuerySchema } from '@common/dto/pagination.dto';

export const auditLogQuerySchema = paginationQuerySchema.extend({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  action: z.enum([
    'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'APPROVE', 'REJECT', 'SUBMIT',
  ]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type AuditLogQueryDto = z.infer<typeof auditLogQuerySchema>;
