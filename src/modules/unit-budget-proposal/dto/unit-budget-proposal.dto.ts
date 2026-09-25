import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const UNIT_BUDGET_PROPOSAL_KINDS = [
  'perbaikan',
  'bahanHabis',
  'peralatan',
  'pelatihan',
  'meubelair',
] as const;
export type UnitBudgetProposalKind = (typeof UNIT_BUDGET_PROPOSAL_KINDS)[number];

// --- Query ---

export const unitBudgetProposalQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  year: z.coerce.number().int().min(2000).optional(),
  unitId: z.string().optional(),
});

export type UnitBudgetProposalQuery = z.infer<typeof unitBudgetProposalQuerySchema>;

// --- Upsert ---

const documentId = (label: string) =>
  z.string().uuid(`${label} document ID must be a valid UUID`).nullable().optional();
const value = (label: string) =>
  z.number().min(0, `${label} value must be >= 0`).nullable().optional();

export const upsertUnitBudgetProposalSchema = z.object({
  perbaikanDocumentId: documentId('Usulan Perbaikan'),
  perbaikanValue: value('Usulan Perbaikan'),
  bahanHabisDocumentId: documentId('Usulan Bahan Habis'),
  bahanHabisValue: value('Usulan Bahan Habis'),
  peralatanDocumentId: documentId('Usulan Peralatan'),
  peralatanValue: value('Usulan Peralatan'),
  pelatihanDocumentId: documentId('Usulan Pelatihan'),
  pelatihanValue: value('Usulan Pelatihan'),
  meubelairDocumentId: documentId('Usulan Meubelair'),
  meubelairValue: value('Usulan Meubelair'),
});

export class UpsertUnitBudgetProposalDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description:
      'Document UUID (from POST /documents/upload) for Usulan Perbaikan. Pass null to remove it.',
    nullable: true,
  })
  perbaikanDocumentId?: string | null;

  @ApiPropertyOptional({
    example: 15000000,
    description: 'Nilai Usulan Perbaikan. Pass null to clear it.',
    nullable: true,
  })
  perbaikanValue?: number | null;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description:
      'Document UUID (from POST /documents/upload) for Usulan Bahan Habis. Pass null to remove it.',
    nullable: true,
  })
  bahanHabisDocumentId?: string | null;

  @ApiPropertyOptional({
    example: 5000000,
    description: 'Nilai Usulan Bahan Habis. Pass null to clear it.',
    nullable: true,
  })
  bahanHabisValue?: number | null;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440003',
    description:
      'Document UUID (from POST /documents/upload) for Usulan Peralatan. Pass null to remove it.',
    nullable: true,
  })
  peralatanDocumentId?: string | null;

  @ApiPropertyOptional({
    example: 25000000,
    description: 'Nilai Usulan Peralatan. Pass null to clear it.',
    nullable: true,
  })
  peralatanValue?: number | null;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440004',
    description:
      'Document UUID (from POST /documents/upload) for Usulan Pelatihan. Pass null to remove it.',
    nullable: true,
  })
  pelatihanDocumentId?: string | null;

  @ApiPropertyOptional({
    example: 10000000,
    description: 'Nilai Usulan Pelatihan. Pass null to clear it.',
    nullable: true,
  })
  pelatihanValue?: number | null;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440005',
    description:
      'Document UUID (from POST /documents/upload) for Usulan Meubelair. Pass null to remove it.',
    nullable: true,
  })
  meubelairDocumentId?: string | null;

  @ApiPropertyOptional({
    example: 8000000,
    description: 'Nilai Usulan Meubelair. Pass null to clear it.',
    nullable: true,
  })
  meubelairValue?: number | null;
}

// --- Response ---

export class UnitBudgetProposalResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'unit-uuid' })
  unitId!: string;

  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ nullable: true, example: '550e8400-e29b-41d4-a716-446655440001' })
  perbaikanDocumentId!: string | null;

  @ApiProperty({
    nullable: true,
    example: 'http://localhost:3000/uploads/documents/abc123.pdf',
    description: 'Full URL of the Usulan Perbaikan document',
  })
  perbaikanURL!: string | null;

  @ApiProperty({ nullable: true, example: 15000000 })
  perbaikanValue!: number | null;

  @ApiProperty({ nullable: true, example: '550e8400-e29b-41d4-a716-446655440002' })
  bahanHabisDocumentId!: string | null;

  @ApiProperty({
    nullable: true,
    example: 'http://localhost:3000/uploads/documents/def456.pdf',
    description: 'Full URL of the Usulan Bahan Habis document',
  })
  bahanHabisURL!: string | null;

  @ApiProperty({ nullable: true, example: 5000000 })
  bahanHabisValue!: number | null;

  @ApiProperty({ nullable: true, example: '550e8400-e29b-41d4-a716-446655440003' })
  peralatanDocumentId!: string | null;

  @ApiProperty({
    nullable: true,
    example: 'http://localhost:3000/uploads/documents/ghi789.pdf',
    description: 'Full URL of the Usulan Peralatan document',
  })
  peralatanURL!: string | null;

  @ApiProperty({ nullable: true, example: 25000000 })
  peralatanValue!: number | null;

  @ApiProperty({ nullable: true, example: '550e8400-e29b-41d4-a716-446655440004' })
  pelatihanDocumentId!: string | null;

  @ApiProperty({
    nullable: true,
    example: 'http://localhost:3000/uploads/documents/jkl012.pdf',
    description: 'Full URL of the Usulan Pelatihan document',
  })
  pelatihanURL!: string | null;

  @ApiProperty({ nullable: true, example: 10000000 })
  pelatihanValue!: number | null;

  @ApiProperty({ nullable: true, example: '550e8400-e29b-41d4-a716-446655440005' })
  meubelairDocumentId!: string | null;

  @ApiProperty({
    nullable: true,
    example: 'http://localhost:3000/uploads/documents/mno345.pdf',
    description: 'Full URL of the Usulan Meubelair document',
  })
  meubelairURL!: string | null;

  @ApiProperty({ nullable: true, example: 8000000 })
  meubelairValue!: number | null;

  @ApiProperty({ example: 63000000, description: 'Total of all five proposal values' })
  totalValue!: number;

  @ApiProperty({ example: 'user-uuid' })
  createdBy!: string;

  @ApiProperty({ nullable: true, example: 'user-uuid' })
  updatedBy!: string | null;

  @ApiProperty({ example: '2026-09-25T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-25T00:00:00.000Z' })
  updatedAt!: Date;
}
