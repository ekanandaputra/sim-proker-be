import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProgramStatus, IndicatorCategory } from '@prisma/client';

const budgetSchema = z
  .union([z.number(), z.string().refine((val) => val.trim() !== '' && !isNaN(Number(val)), 'Budget must be a valid number')])
  .nullable()
  .optional();

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
  budget: budgetSchema,
  picIds: z.array(z.string().uuid('PIC must be a valid UUID')).optional(),
  order: z.number().int().default(0),
  proposalDocumentId: z.string().uuid('Proposal document ID must be a valid UUID').nullable().optional(),
  rabDocumentId: z.string().uuid('RAB document ID must be a valid UUID').nullable().optional(),
  usulanPerbaikanDocumentId: z.string().uuid('Usulan Perbaikan document ID must be a valid UUID').nullable().optional(),
  usulanBahanHabisDocumentId: z.string().uuid('Usulan Bahan Habis document ID must be a valid UUID').nullable().optional(),
  usulanPeralatanDocumentId: z.string().uuid('Usulan Peralatan document ID must be a valid UUID').nullable().optional(),
  usulanPelatihanDocumentId: z.string().uuid('Usulan Pelatihan document ID must be a valid UUID').nullable().optional(),
  usulanMeubelairDocumentId: z.string().uuid('Usulan Meubelair document ID must be a valid UUID').nullable().optional(),
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

  @ApiPropertyOptional({ example: 15000000.00, description: 'Budget allocated for this indicator', type: 'number', oneOf: [{ type: 'number' }, { type: 'string' }] })
  budget?: number | string | null;

  @ApiPropertyOptional({ description: 'Array of PIC User UUIDs', example: ['550e8400-e29b-41d4-a716-446655440003'] })
  picIds?: string[];

  @ApiPropertyOptional({ example: 1, description: 'Sorting order' })
  order?: number;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440004', description: 'Document UUID (from POST /documents/upload) to set as the proposal document', nullable: true })
  proposalDocumentId?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440005', description: 'Document UUID (from POST /documents/upload) to set as the RAB (budget plan) document', nullable: true })
  rabDocumentId?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440006', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Perbaikan document', nullable: true })
  usulanPerbaikanDocumentId?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440007', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Bahan Habis document', nullable: true })
  usulanBahanHabisDocumentId?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440008', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Peralatan document', nullable: true })
  usulanPeralatanDocumentId?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440009', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Pelatihan document', nullable: true })
  usulanPelatihanDocumentId?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-44665544000a', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Meubelair document', nullable: true })
  usulanMeubelairDocumentId?: string | null;
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

  @ApiPropertyOptional({ example: 15000000.00, description: 'Budget allocated for this indicator', type: 'number', oneOf: [{ type: 'number' }, { type: 'string' }] })
  budget?: number | string | null;

  @ApiPropertyOptional({ description: 'Array of PIC User UUIDs', example: ['550e8400-e29b-41d4-a716-446655440003'] })
  picIds?: string[];

  @ApiPropertyOptional({ example: 1, description: 'Sorting order' })
  order?: number;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440004', description: 'Document UUID (from POST /documents/upload) to set as the proposal document. Pass null to remove it.', nullable: true })
  proposalDocumentId?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440005', description: 'Document UUID (from POST /documents/upload) to set as the RAB (budget plan) document. Pass null to remove it.', nullable: true })
  rabDocumentId?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440006', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Perbaikan document. Pass null to remove it.', nullable: true })
  usulanPerbaikanDocumentId?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440007', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Bahan Habis document. Pass null to remove it.', nullable: true })
  usulanBahanHabisDocumentId?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440008', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Peralatan document. Pass null to remove it.', nullable: true })
  usulanPeralatanDocumentId?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440009', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Pelatihan document. Pass null to remove it.', nullable: true })
  usulanPelatihanDocumentId?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-44665544000a', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Meubelair document. Pass null to remove it.', nullable: true })
  usulanMeubelairDocumentId?: string | null;
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

  @ApiProperty({ nullable: true, example: 'http://localhost:3000/uploads/documents/abc123.pdf', description: 'Full URL of the proposal document, ready to be opened/displayed by the frontend' })
  proposalURL!: string | null;

  @ApiProperty({ nullable: true, example: 'http://localhost:3000/uploads/documents/def456.pdf', description: 'Full URL of the RAB (budget plan) document, ready to be opened/displayed by the frontend' })
  rabURL!: string | null;

  @ApiProperty({ nullable: true, example: 'http://localhost:3000/uploads/documents/ghi789.pdf', description: 'Full URL of the Format Usulan Perbaikan document, ready to be opened/displayed by the frontend' })
  usulanPerbaikanURL!: string | null;

  @ApiProperty({ nullable: true, example: 'http://localhost:3000/uploads/documents/jkl012.pdf', description: 'Full URL of the Format Usulan Bahan Habis document, ready to be opened/displayed by the frontend' })
  usulanBahanHabisURL!: string | null;

  @ApiProperty({ nullable: true, example: 'http://localhost:3000/uploads/documents/mno345.pdf', description: 'Full URL of the Format Usulan Peralatan document, ready to be opened/displayed by the frontend' })
  usulanPeralatanURL!: string | null;

  @ApiProperty({ nullable: true, example: 'http://localhost:3000/uploads/documents/pqr678.pdf', description: 'Full URL of the Format Usulan Pelatihan document, ready to be opened/displayed by the frontend' })
  usulanPelatihanURL!: string | null;

  @ApiProperty({ nullable: true, example: 'http://localhost:3000/uploads/documents/stu901.pdf', description: 'Full URL of the Format Usulan Meubelair document, ready to be opened/displayed by the frontend' })
  usulanMeubelairURL!: string | null;

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
  budget: budgetSchema,
  propsal: z.string().uuid('propsal must be a valid document UUID').nullable().optional(),
  rab: z.string().uuid('rab must be a valid document UUID').nullable().optional(),
  usulanPerbaikan: z.string().uuid('usulanPerbaikan must be a valid document UUID').nullable().optional(),
  usulanBahanHabis: z.string().uuid('usulanBahanHabis must be a valid document UUID').nullable().optional(),
  usulanPeralatan: z.string().uuid('usulanPeralatan must be a valid document UUID').nullable().optional(),
  usulanPelatihan: z.string().uuid('usulanPelatihan must be a valid document UUID').nullable().optional(),
  usulanMeubelair: z.string().uuid('usulanMeubelair must be a valid document UUID').nullable().optional(),
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

  @ApiPropertyOptional({ example: 15000000.00, description: 'Budget allocated for this indicator', type: 'number', oneOf: [{ type: 'number' }, { type: 'string' }] })
  budget?: number | string | null;

  @ApiPropertyOptional({ example: '3f5b85cb-a0db-4c5a-a465-f69b57e91a98', description: 'Document UUID (from POST /documents/upload) to set as the proposal document. Pass null to remove it.', nullable: true })
  propsal?: string | null;

  @ApiPropertyOptional({ example: '1d5a827c-18b5-4dcc-af1b-a071adb0e048', description: 'Document UUID (from POST /documents/upload) to set as the RAB (budget plan) document. Pass null to remove it.', nullable: true })
  rab?: string | null;

  @ApiPropertyOptional({ example: '2a3b4c5d-6e7f-4890-a1b2-c3d4e5f60718', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Perbaikan document. Pass null to remove it.', nullable: true })
  usulanPerbaikan?: string | null;

  @ApiPropertyOptional({ example: '3b4c5d6e-7f80-4901-a2b3-d4e5f6071829', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Bahan Habis document. Pass null to remove it.', nullable: true })
  usulanBahanHabis?: string | null;

  @ApiPropertyOptional({ example: '4c5d6e7f-8091-4a12-b3c4-e5f607182930', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Peralatan document. Pass null to remove it.', nullable: true })
  usulanPeralatan?: string | null;

  @ApiPropertyOptional({ example: '5d6e7f80-91a2-4b23-c4d5-f60718293041', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Pelatihan document. Pass null to remove it.', nullable: true })
  usulanPelatihan?: string | null;

  @ApiPropertyOptional({ example: '6e7f8091-a2b3-4c34-d5e6-071829304152', description: 'Document UUID (from POST /documents/upload) to set as the Format Usulan Meubelair document. Pass null to remove it.', nullable: true })
  usulanMeubelair?: string | null;
}
