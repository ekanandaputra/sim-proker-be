import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// --- Create ---
export const createProgramIndicatorSchema = z.object({
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  name: z.string().min(1, 'Name is required').max(255),
  unit: z.string().min(1, 'Unit (satuan) is required').max(50),
  target: z.number().nullable().optional(),
  order: z.number().int().default(0),
});

export class CreateProgramIndicatorDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Unit UUID assigned to this indicator' })
  unitId!: string;

  @ApiProperty({ example: 'Jumlah Dokumen Laporan', description: 'Name of the indicator' })
  name!: string;

  @ApiProperty({ example: 'Dokumen', description: 'Unit of measurement (satuan)' })
  unit!: string;

  @ApiPropertyOptional({ example: 10, description: 'Default target for the indicator' })
  target?: number | null;

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

  @ApiPropertyOptional({ example: 10, description: 'Default target for the indicator' })
  target?: number | null;

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

  @ApiProperty({ nullable: true, example: 10, description: 'Default target for the indicator', type: Number })
  target!: any;

  @ApiProperty({ example: 1, description: 'Sorting order' })
  order!: number;

  @ApiProperty({ example: '2026-07-22T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-07-22T00:00:00.000Z' })
  updatedAt!: Date;
}
