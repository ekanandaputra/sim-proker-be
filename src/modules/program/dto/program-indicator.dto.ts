import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProgramStatus } from '@prisma/client';

// --- Create ---
export const createProgramIndicatorSchema = z.object({
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  name: z.string().min(1, 'Name is required').max(255),
  unit: z.string().min(1, 'Unit (satuan) is required').max(50),
  targetQ1: z.number().nullable().optional(),
  targetQ2: z.number().nullable().optional(),
  targetQ3: z.number().nullable().optional(),
  targetQ4: z.number().nullable().optional(),
  status: z.nativeEnum(ProgramStatus).optional(),
  order: z.number().int().default(0),
});

export class CreateProgramIndicatorDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Unit UUID assigned to this indicator' })
  unitId!: string;

  @ApiProperty({ example: 'Jumlah Dokumen Laporan', description: 'Name of the indicator' })
  name!: string;

  @ApiProperty({ example: 'Dokumen', description: 'Unit of measurement (satuan)' })
  unit!: string;

  @ApiPropertyOptional({ example: 10, description: 'Target for Q1' })
  targetQ1?: number | null;

  @ApiPropertyOptional({ example: 20, description: 'Target for Q2' })
  targetQ2?: number | null;

  @ApiPropertyOptional({ example: 30, description: 'Target for Q3' })
  targetQ3?: number | null;

  @ApiPropertyOptional({ example: 40, description: 'Target for Q4' })
  targetQ4?: number | null;

  @ApiPropertyOptional({ enum: ProgramStatus, example: ProgramStatus.DRAFT, description: 'Status of the indicator' })
  status?: ProgramStatus;

  @ApiPropertyOptional({ example: 1, description: 'Sorting order' })
  order?: number;
}

// --- Update ---
export const updateProgramIndicatorSchema = createProgramIndicatorSchema.partial();

export class UpdateProgramIndicatorDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Unit UUID assigned to this indicator' })
  unitId?: string;

  @ApiPropertyOptional({ example: 'Jumlah Dokumen Laporan', description: 'Name of the indicator' })
  name?: string;

  @ApiPropertyOptional({ example: 'Dokumen', description: 'Unit of measurement (satuan)' })
  unit?: string;

  @ApiPropertyOptional({ example: 10, description: 'Target for Q1' })
  targetQ1?: number | null;

  @ApiPropertyOptional({ example: 20, description: 'Target for Q2' })
  targetQ2?: number | null;

  @ApiPropertyOptional({ example: 30, description: 'Target for Q3' })
  targetQ3?: number | null;

  @ApiPropertyOptional({ example: 40, description: 'Target for Q4' })
  targetQ4?: number | null;

  @ApiPropertyOptional({ enum: ProgramStatus, example: ProgramStatus.DRAFT, description: 'Status of the indicator' })
  status?: ProgramStatus;

  @ApiPropertyOptional({ example: 1, description: 'Sorting order' })
  order?: number;
}

// --- Response ---
export class ProgramIndicatorResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Indicator UUID' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Program UUID' })
  programId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Unit UUID assigned to this indicator' })
  unitId!: string;

  @ApiProperty({ example: 'Jumlah Dokumen Laporan', description: 'Name of the indicator' })
  name!: string;

  @ApiProperty({ example: 'Dokumen', description: 'Unit of measurement (satuan)' })
  unit!: string;

  @ApiProperty({ nullable: true, example: 10, type: Number }) targetQ1!: any;
  @ApiProperty({ nullable: true, example: 20, type: Number }) targetQ2!: any;
  @ApiProperty({ nullable: true, example: 30, type: Number }) targetQ3!: any;
  @ApiProperty({ nullable: true, example: 40, type: Number }) targetQ4!: any;
  @ApiProperty({ enum: ProgramStatus, example: ProgramStatus.DRAFT }) status!: ProgramStatus;
  @ApiProperty({ example: 1 }) order!: number;

  @ApiProperty({ example: '2026-07-22T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-07-22T00:00:00.000Z' })
  updatedAt!: Date;
}

export const setIndicatorTargetSchema = z.object({
  targetQ1: z.number().nullable().optional(),
  targetQ2: z.number().nullable().optional(),
  targetQ3: z.number().nullable().optional(),
  targetQ4: z.number().nullable().optional(),
});

export class SetIndicatorTargetDto {
  @ApiPropertyOptional({ example: 10, description: 'Target for Q1' })
  targetQ1?: number | null;

  @ApiPropertyOptional({ example: 20, description: 'Target for Q2' })
  targetQ2?: number | null;

  @ApiPropertyOptional({ example: 30, description: 'Target for Q3' })
  targetQ3?: number | null;

  @ApiPropertyOptional({ example: 40, description: 'Target for Q4' })
  targetQ4?: number | null;
}
