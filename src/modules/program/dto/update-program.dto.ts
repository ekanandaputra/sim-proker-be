import { z } from 'zod';
import { ProgramStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const updateProgramSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  objective: z.string().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
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
}
