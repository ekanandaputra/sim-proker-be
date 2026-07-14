import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const createDefaultProgramSchema = z.object({
  ikuId: z.string().min(1, 'ikuId is required'),
  ikuCode: z.string().min(1, 'ikuCode is required'),
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
});

export class CreateDefaultProgramDto {
  @ApiProperty()
  ikuId!: string;

  @ApiProperty()
  ikuCode!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ required: false })
  description?: string;
}

export const updateDefaultProgramSchema = createDefaultProgramSchema.partial();

export class UpdateDefaultProgramDto {
  @ApiProperty({ required: false })
  ikuId?: string;

  @ApiProperty({ required: false })
  ikuCode?: string;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  description?: string;
}

export class DefaultProgramDto {
  @ApiProperty() id!: string;
  @ApiProperty() ikuId!: string;
  @ApiProperty() ikuCode!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export const assignDefaultProgramSchema = z.object({
  unitId: z.string().uuid('unitId must be a valid UUID').optional(),
  year: z.number().int().min(2000).max(2100),
});

export class AssignDefaultProgramDto {
  @ApiProperty({ required: false, description: 'ID unit yang akan di-assign program default. Jika kosong, akan di-assign ke semua unit.', example: '550e8400-e29b-41d4-a716-446655440000' })
  unitId?: string;

  @ApiProperty({ description: 'Tahun periode program', example: 2026 })
  year!: number;
}
