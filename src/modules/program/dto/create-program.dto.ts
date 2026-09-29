import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createProgramIndicatorSchema, CreateProgramIndicatorDto } from './program-indicator.dto';

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
  indicators: z.array(createProgramIndicatorSchema).optional(),
});

export class CreateProgramDto {
  @ApiProperty({ example: 'PRG-2025-001', description: 'Program code' })
  code!: string;

  @ApiPropertyOptional({ type: String, format: 'uuid', example: '69391cba-5eeb-4218-80fd-596e2c096171', description: 'IKU (Indikator Kinerja Utama) UUID from SIM IKU this program contributes to', nullable: true })
  ikuId?: string | null;

  @ApiProperty({ example: 'Program Penelitian Terapan' })
  title!: string;

  @ApiPropertyOptional({ example: 'Research program for applied sciences' })
  description?: string;

  @ApiPropertyOptional({ example: 'Advance applied research output' })
  objective?: string;

  @ApiProperty({ example: 2025 })
  year!: number;

  @ApiPropertyOptional({
    type: () => [CreateProgramIndicatorDto],
    description: 'Daftar indikator program yang dibuat bersamaan dengan program (opsional, bisa lebih dari satu)',
  })
  indicators?: CreateProgramIndicatorDto[];
}
