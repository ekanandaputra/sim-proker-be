import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDefaultProgramIndicatorDto {
  @ApiProperty({ example: 'Jumlah Laporan', description: 'Indicator name' })
  name!: string;

  @ApiProperty({ example: 'Dokumen', description: 'Indicator unit' })
  unit!: string;

  @ApiPropertyOptional({ example: 1, description: 'Order of the indicator' })
  order?: number;
}

export const createDefaultProgramSchema = z.object({
  ikuId: z.string().min(1, 'ikuId is required'),
  ikuCode: z.string().min(1, 'ikuCode is required'),
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
  indicators: z.array(z.object({
    name: z.string().min(1, 'indicator name is required'),
    unit: z.string().min(1, 'indicator unit is required'),
    order: z.number().int().default(0),
  })).optional(),
});

export class CreateDefaultProgramDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'IKU UUID' })
  ikuId!: string;

  @ApiProperty({ example: 'IKU-01', description: 'IKU Code' })
  ikuCode!: string;

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

  @ApiPropertyOptional({ example: 'IKU-01', description: 'IKU Code' })
  ikuCode?: string;

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

export class DefaultProgramIndicatorDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003', description: 'Indicator UUID' }) id!: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Default Program UUID' }) defaultProgramId!: string;
  @ApiProperty({ example: 'Jumlah Laporan' }) name!: string;
  @ApiProperty({ example: 'Dokumen' }) unit!: string;
  @ApiProperty({ example: 1 }) order!: number;
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation timestamp' }) createdAt!: Date;
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Update timestamp' }) updatedAt!: Date;
}

export class DefaultProgramDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Default Program UUID' }) id!: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'IKU UUID' }) ikuId!: string;
  @ApiProperty({ example: 'IKU-01', description: 'IKU Code' }) ikuCode!: string;
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
