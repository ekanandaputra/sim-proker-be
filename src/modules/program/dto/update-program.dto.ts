import { z } from 'zod';
import { ProgramStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const updateProgramSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  objective: z.string().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  categoryId: z.string().uuid().optional(),
  status: z.nativeEnum(ProgramStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budget: z.number().min(0).optional(),
});

export class UpdateProgramDto {
  @ApiPropertyOptional({ example: 'Program Penelitian Terapan Baru', description: 'Program title' })
  title?: string;

  @ApiPropertyOptional({ example: 'Updated research program for applied sciences', description: 'Optional detailed description' })
  description?: string;

  @ApiPropertyOptional({ example: 'Advance applied research output v2', description: 'Optional objective' })
  objective?: string;

  @ApiPropertyOptional({ example: 2026, description: 'Year of the program' })
  year?: number;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Category UUID for this program' })
  categoryId?: string;

  @ApiPropertyOptional({ enum: ProgramStatus, example: ProgramStatus.IN_PROGRESS, description: 'Current status of the program' })
  status?: ProgramStatus;

  @ApiPropertyOptional({ example: '2025-02-01', description: 'Start date' })
  startDate?: Date;

  @ApiPropertyOptional({ example: '2025-11-30', description: 'End date' })
  endDate?: Date;

  @ApiPropertyOptional({ example: 75000000, description: 'Budget allocated' })
  budget?: number;
}
