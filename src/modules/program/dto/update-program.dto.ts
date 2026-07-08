import { z } from 'zod';
import { ProgramStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const updateProgramSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  objective: z.string().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  unitId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.nativeEnum(ProgramStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budget: z.number().min(0).optional(),
});

export class UpdateProgramDto {
  @ApiPropertyOptional({ example: 'Program Penelitian Terapan Baru' })
  title?: string;

  @ApiPropertyOptional({ example: 'Updated research program for applied sciences' })
  description?: string;

  @ApiPropertyOptional({ example: 'Advance applied research output v2' })
  objective?: string;

  @ApiPropertyOptional({ example: 2026 })
  year?: number;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  unitId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002' })
  categoryId?: string;

  @ApiPropertyOptional({ enum: ProgramStatus, example: ProgramStatus.IN_PROGRESS })
  status?: ProgramStatus;

  @ApiPropertyOptional({ example: '2025-02-01' })
  startDate?: Date;

  @ApiPropertyOptional({ example: '2025-11-30' })
  endDate?: Date;

  @ApiPropertyOptional({ example: 75000000 })
  budget?: number;
}
