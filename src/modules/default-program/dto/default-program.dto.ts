import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const createDefaultProgramSchema = z.object({
  ikuId: z.string().min(1, 'ikuId is required'),
  ikuCode: z.string().min(1, 'ikuCode is required'),
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
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
}

export class DefaultProgramDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Default Program UUID' }) id!: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'IKU UUID' }) ikuId!: string;
  @ApiProperty({ example: 'IKU-01', description: 'IKU Code' }) ikuCode!: string;
  @ApiProperty({ example: 'Program Peningkatan Kualitas', description: 'Default program title' }) title!: string;
  @ApiProperty({ nullable: true, example: 'Deskripsi program', description: 'Optional description' }) description!: string | null;
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
