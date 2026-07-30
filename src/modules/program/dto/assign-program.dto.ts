import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const assignProgramSchema = z.object({
  year: z.number().int().min(2000, 'Year must be at least 2000').max(2100, 'Year must be at most 2100'),
  unitId: z.string().uuid('Unit ID must be a valid UUID').optional(),
});

export class AssignProgramDto {
  @ApiProperty({ example: 2026, description: 'The new year for the assigned program' })
  year!: number;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'The unit ID to assign the program to (optional, defaults to current unit if not provided)' })
  unitId?: string;
}
