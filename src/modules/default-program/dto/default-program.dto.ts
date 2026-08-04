import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDefaultProgramIndicatorDto {
  @ApiProperty({ example: 'Jumlah Laporan', description: 'Indicator name' })
  name!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-44665544000x', description: 'Master Unit Type UUID' })
  masterUnitTypeId!: string;

  @ApiPropertyOptional({ example: 1, description: 'Order of the indicator' })
  order?: number;
}

export const createDefaultProgramSchema = z.object({
  ikuId: z.string().min(1, 'ikuId is required'),
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
  indicators: z.array(z.object({
    name: z.string().min(1, 'indicator name is required'),
    masterUnitTypeId: z.string().uuid('masterUnitTypeId must be a valid UUID'),
    order: z.number().int().default(0),
  })).optional(),
});

export const addDefaultProgramIndicatorSchema = z.object({
  name: z.string().min(1, 'indicator name is required'),
  masterUnitTypeId: z.string().uuid('masterUnitTypeId must be a valid UUID'),
  order: z.number().int().default(0).optional(),
});

export class CreateDefaultProgramDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'IKU UUID' })
  ikuId!: string;

  @ApiProperty({ example: 'Program Peningkatan Kualitas', description: 'Default program title' })
  title!: string;

  @ApiPropertyOptional({ example: 'Deskripsi program', description: 'Optional description' })
  description?: string;

  @ApiPropertyOptional({
    type: [CreateDefaultProgramIndicatorDto],
    description: 'Array of indicators for this default program'
  })
  indicators?: CreateDefaultProgramIndicatorDto[];
}

export const updateDefaultProgramSchema = createDefaultProgramSchema.partial();

export class UpdateDefaultProgramDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'IKU UUID' })
  ikuId?: string;

  @ApiPropertyOptional({ example: 'Program Peningkatan Kualitas', description: 'Default program title' })
  title?: string;

  @ApiPropertyOptional({ example: 'Deskripsi program', description: 'Optional description' })
  description?: string;

  @ApiPropertyOptional({
    type: [CreateDefaultProgramIndicatorDto],
    description: 'Array of indicators for this default program'
  })
  indicators?: CreateDefaultProgramIndicatorDto[];
}

export class MasterUnitTypeSimpleDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-44665544000x' }) id!: string;
  @ApiProperty({ example: 'Biro/Unit' }) name!: string;
}

export class DefaultProgramIndicatorDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003', description: 'Indicator UUID' }) id!: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Default Program UUID' }) defaultProgramId!: string;
  @ApiProperty({ example: 'Jumlah Laporan' }) name!: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-44665544000x' }) masterUnitTypeId!: string;
  @ApiProperty({ type: () => MasterUnitTypeSimpleDto, description: 'Master Unit Type details', nullable: true, example: { id: '550e8400-e29b-41d4-a716-44665544000x', name: 'Biro/Unit' } }) masterUnitType!: MasterUnitTypeSimpleDto | null;
  @ApiProperty({ example: 1 }) order!: number;
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation timestamp' }) createdAt!: Date;
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Update timestamp' }) updatedAt!: Date;
}

export class DefaultProgramDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Default Program UUID' }) id!: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'IKU UUID' }) ikuId!: string;
  @ApiProperty({ example: 'Program Peningkatan Kualitas', description: 'Default program title' }) title!: string;
  @ApiProperty({ nullable: true, example: 'Deskripsi program', description: 'Optional description' }) description!: string | null;
  @ApiProperty({ type: () => [DefaultProgramIndicatorDto], description: 'List of indicators for this default program' }) indicators!: DefaultProgramIndicatorDto[];
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation timestamp' }) createdAt!: Date;
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Update timestamp' }) updatedAt!: Date;
}

export const assignDefaultProgramSchema = z.object({
  unitId: z.string().uuid('unitId must be a valid UUID'),
  defaultProgramId: z.string().uuid('defaultProgramId must be a valid UUID'),
  period: z.number().int().min(2000).max(2100),
});

export class AssignDefaultProgramDto {
  @ApiProperty({ description: 'ID unit yang akan di-assign program', example: '550e8400-e29b-41d4-a716-446655440000' })
  unitId!: string;

  @ApiProperty({ description: 'ID default program yang akan di-assign', example: '550e8400-e29b-41d4-a716-446655440001' })
  defaultProgramId!: string;

  @ApiProperty({ description: 'Tahun periode program', example: 2026 })
  period!: number;
}

export const assignDefaultProgramIndicatorSchema = z.object({
  unitId: z.string().uuid('unitId must be a valid UUID'),
  defaultProgramIndicatorId: z.string().uuid('defaultProgramIndicatorId must be a valid UUID'),
  period: z.number().int().min(2000).max(2100),
});

export class AssignDefaultProgramIndicatorDto {
  @ApiProperty({ description: 'ID unit yang akan di-assign indikator', example: '550e8400-e29b-41d4-a716-446655440000' })
  unitId!: string;

  @ApiProperty({ description: 'ID default program indikator yang akan di-assign', example: '550e8400-e29b-41d4-a716-446655440002' })
  defaultProgramIndicatorId!: string;

  @ApiProperty({ description: 'Tahun periode program', example: 2026 })
  period!: number;
}

// ============================================================================
// Assignment Structure Response DTOs
// ============================================================================

export class AssignedUnitDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Unit UUID' })
  unitId!: string;

  @ApiProperty({ example: 'Teknik Mesin', description: 'Nama unit' })
  unitName!: string;
}

export class AssignmentIndicatorDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003', description: 'Default Program Indicator UUID' })
  id!: string;

  @ApiProperty({ example: 'Jumlah Publikasi', description: 'Nama indikator' })
  name!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-44665544000x', description: 'Master Unit Type UUID' })
  masterUnitTypeId!: string;

  @ApiProperty({ type: () => MasterUnitTypeSimpleDto, description: 'Master Unit Type details', nullable: true, example: { id: '550e8400-e29b-41d4-a716-44665544000x', name: 'Biro/Unit' } })
  masterUnitType!: MasterUnitTypeSimpleDto | null;

  @ApiProperty({ example: 1, description: 'Urutan indikator' })
  order!: number;

  @ApiProperty({ type: () => [AssignedUnitDto], description: 'Daftar unit yang sudah di-assign indikator ini' })
  assignedUnits!: AssignedUnitDto[];

  @ApiProperty({ example: true, description: 'Apakah indikator sudah di-assign ke minimal 1 unit' })
  isAssigned!: boolean;
}

export class AssignmentProgramDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Default Program UUID' })
  id!: string;

  @ApiProperty({ example: 'Program Penelitian', description: 'Judul program' })
  title!: string;

  @ApiProperty({ nullable: true, example: 'Meningkatkan kualitas dan kuantitas penelitian', description: 'Deskripsi program' })
  description!: string | null;

  @ApiProperty({ example: 1, description: 'Urutan program' })
  order!: number;

  @ApiProperty({ type: () => [AssignmentIndicatorDto], description: 'Daftar indikator program' })
  indicators!: AssignmentIndicatorDto[];
}

export class AssignmentIkuDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'IKU UUID' })
  id!: string;

  @ApiProperty({ example: 'IKU-01', description: 'Kode IKU' })
  code!: string;

  @ApiProperty({ example: 'Peningkatan Tridharma Perguruan Tinggi', description: 'Nama IKU' })
  name!: string;

  @ApiProperty({ nullable: true, example: 'Deskripsi IKU', description: 'Deskripsi IKU' })
  description!: string | null;
}

export class AssignmentIkuItemDto {
  @ApiProperty({ type: () => AssignmentIkuDto, description: 'Data IKU' })
  iku!: AssignmentIkuDto;

  @ApiProperty({ example: 5, description: 'Total program di bawah IKU ini' })
  totalPrograms!: number;

  @ApiProperty({ example: 14, description: 'Total indikator di bawah IKU ini' })
  totalIndicators!: number;

  @ApiProperty({ type: () => [AssignmentProgramDto], description: 'Daftar program beserta indikator dan unit assignment' })
  programs!: AssignmentProgramDto[];
}

export class AssignmentStructureResponseDto {
  @ApiProperty({ type: () => [AssignmentIkuItemDto], description: 'Daftar IKU beserta struktur program, indikator, dan unit assignment' })
  items!: AssignmentIkuItemDto[];
}
