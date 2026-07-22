import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { paginationQuerySchema } from '@common/dto/pagination.dto';
import { ProgramStatus } from '@prisma/client';

export const programQuerySchema = paginationQuerySchema.extend({
  year: z.preprocess((val) => val ? Number(val) : undefined, z.number().int().optional()),
  unitId: z.string().uuid().optional(),
});

export type ProgramQueryDtoType = z.infer<typeof programQuerySchema>;

export class ProgramQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  page!: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  limit!: number;

  @ApiPropertyOptional({ description: 'Search keyword' })
  search?: string;

  @ApiPropertyOptional({ description: 'Field to sort by' })
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'Sort direction' })
  sortOrder!: 'asc' | 'desc';

  @ApiPropertyOptional({ example: 2024, description: 'Filter by year' })
  year?: number;

  @ApiPropertyOptional({ description: 'Filter by unit ID' })
  unitId?: string;
}
