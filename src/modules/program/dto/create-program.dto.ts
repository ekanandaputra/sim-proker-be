import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const createProgramSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must be at most 50 characters'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be at most 255 characters'),
  description: z.string().optional(),
  objective: z.string().optional(),
  year: z
    .number()
    .int()
    .min(2000, 'Year must be at least 2000')
    .max(2100, 'Year must be at most 2100'),
  unitId: z.string().uuid('Unit ID must be a valid UUID').optional(),
  categoryId: z.string().uuid('Category ID must be a valid UUID').optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  budget: z.number().min(0, 'Budget must be non-negative').default(0),

}).refine(
  (data) => data.endDate > data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] },
);

export class CreateProgramDto {
  @ApiProperty({ example: 'PRG-2025-001', description: 'Program code' })
  code!: string;

  @ApiProperty({ example: 'Program Penelitian Terapan' })
  title!: string;

  @ApiPropertyOptional({ example: 'Research program for applied sciences' })
  description?: string;

  @ApiPropertyOptional({ example: 'Advance applied research output' })
  objective?: string;

  @ApiProperty({ example: 2025 })
  year!: number;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  unitId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002' })
  categoryId?: string;

  @ApiProperty({ example: '2025-01-01' })
  startDate!: Date;

  @ApiProperty({ example: '2025-12-31' })
  endDate!: Date;

  @ApiProperty({ example: 50000000, default: 0 })
  budget!: number;

}
