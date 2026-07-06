import { z } from 'zod';
import { paginationQuerySchema } from '@common/dto/pagination.dto';
import { ProgramStatus } from '@prisma/client';

export const programQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ProgramStatus).optional(),
  year: z.coerce.number().int().optional(),
  unitId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
});

export type ProgramQueryDto = z.infer<typeof programQuerySchema>;
