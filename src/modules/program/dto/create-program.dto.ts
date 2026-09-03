import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProgramStatus } from '@prisma/client';

export const createProgramSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must be at most 50 characters'),
  ikuId: z
    .string()
    .max(50, 'IKU ID must be at most 50 characters')
    .nullable()
    .optional(),
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
});

export class CreateProgramDto {
  @ApiProperty({ example: 'PRG-2025-001', description: 'Program code' })
  code!: string;

  @ApiPropertyOptional({ example: 'IKU1.1', description: 'IKU (Indikator Kinerja Utama) code this program contributes to', nullable: true })
  ikuId?: string | null;

  @ApiProperty({ example: 'Program Penelitian Terapan' })
  title!: string;

  @ApiPropertyOptional({ example: 'Research program for applied sciences' })
  description?: string;

  @ApiPropertyOptional({ example: 'Advance applied research output' })
  objective?: string;

  @ApiProperty({ example: 2025 })
  year!: number;
}
