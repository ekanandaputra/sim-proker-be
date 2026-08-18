import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProgramStatus, IndicatorCategory } from '@prisma/client';

// --- Create ---
export const createProgramIndicatorSchema = z.object({
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  name: z.string().min(1, 'Name is required').max(255),
  masterUnitTypeId: z.string().uuid('Master Unit Type ID must be a valid UUID'),
  category: z.nativeEnum(IndicatorCategory).default(IndicatorCategory.TUSI),
  isDefaultProgramIndicator: z.boolean().default(false).optional(),
  targetQ1: z.number().nullable().optional(),
  targetQ2: z.number().nullable().optional(),
  targetQ3: z.number().nullable().optional(),
  targetQ4: z.number().nullable().optional(),
  budget: z.number().nullable().optional(),
  picIds: z.array(z.string().uuid('PIC must be a valid UUID')).optional(),
  order: z.number().int().default(0),
});

export class CreateProgramIndicatorDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Unit UUID assigned to this indicator' })
  unitId!: string;

  @ApiProperty({ example: 'Jumlah Dokumen Laporan', description: 'Name of the indicator' })
  name!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-44665544000x', description: 'Master Unit Type UUID' })
  masterUnitTypeId!: string;

  @ApiPropertyOptional({ enum: IndicatorCategory, example: IndicatorCategory.TUSI, description: 'Category of the indicator' })
  category?: IndicatorCategory;

  @ApiPropertyOptional({ example: false, description: 'Flag indicating if this was created from a default program' })
  isDefaultProgramIndicator?: boolean;

  @ApiPropertyOptional({ example: 10, description: 'Target for Q1' })
  targetQ1?: number | null;

  @ApiPropertyOptional({ example: 20, description: 'Target for Q2' })
  targetQ2?: number | null;

  @ApiPropertyOptional({ example: 30, description: 'Target for Q3' })
  targetQ3?: number | null;

  @ApiPropertyOptional({ example: 40, description: 'Target for Q4' })
  targetQ4?: number | null;

  @ApiPropertyOptional({ example: 15000000.00, description: 'Budget allocated for this indicator' })
  budget?: number | null;

  @ApiPropertyOptional({ description: 'Array of PIC User UUIDs', example: ['550e8400-e29b-41d4-a716-446655440003'] })
  picIds?: string[];

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

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-44665544000x', description: 'Master Unit Type UUID' })
  masterUnitTypeId?: string;

  @ApiPropertyOptional({ enum: IndicatorCategory, example: IndicatorCategory.TUSI, description: 'Category of the indicator' })
  category?: IndicatorCategory;

  @ApiPropertyOptional({ example: false, description: 'Flag indicating if this was created from a default program' })
  isDefaultProgramIndicator?: boolean;

  @ApiPropertyOptional({ example: 10, description: 'Target for Q1' })
  targetQ1?: number | null;

  @ApiPropertyOptional({ example: 20, description: 'Target for Q2' })
  targetQ2?: number | null;

  @ApiPropertyOptional({ example: 30, description: 'Target for Q3' })
  targetQ3?: number | null;

  @ApiPropertyOptional({ example: 40, description: 'Target for Q4' })
  targetQ4?: number | null;

  @ApiPropertyOptional({ example: 15000000.00, description: 'Budget allocated for this indicator' })
  budget?: number | null;

  @ApiPropertyOptional({ description: 'Array of PIC User UUIDs', example: ['550e8400-e29b-41d4-a716-446655440003'] })
  picIds?: string[];

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

  @ApiProperty({ description: 'Unit detail object assigned to this indicator', type: Object })
  unit!: any;

  @ApiProperty({ description: 'Master Unit Type object for unit of measurement', required: false, type: Object })
  masterUnitType?: any;

  @ApiProperty({ enum: IndicatorCategory, example: IndicatorCategory.TUSI, description: 'Category of the indicator' })
  category!: IndicatorCategory;

  @ApiProperty({ example: false, description: 'Flag indicating if this was created from a default program' })
  isDefaultProgramIndicator!: boolean;

  @ApiProperty({ nullable: true, example: 10, type: Number }) targetQ1!: any;
  @ApiProperty({ nullable: true, example: 20, type: Number }) targetQ2!: any;
  @ApiProperty({ nullable: true, example: 30, type: Number }) targetQ3!: any;
  @ApiProperty({ nullable: true, example: 40, type: Number }) targetQ4!: any;
  @ApiProperty({ nullable: true, example: 15000000.00, type: Number }) budget?: any;
  @ApiProperty({ description: 'Array of PIC User UUIDs', type: [String], required: false }) picIds?: string[];
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
