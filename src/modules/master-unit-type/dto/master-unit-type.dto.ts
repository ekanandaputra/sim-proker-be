import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MasterUnitTypeEnum } from '@prisma/client';

export const createMasterUnitTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.nativeEnum(MasterUnitTypeEnum),
});

export class CreateMasterUnitTypeDto {
  @ApiProperty({ example: 'Dokumen', description: 'Name of the unit type' })
  name!: string;

  @ApiProperty({ enum: MasterUnitTypeEnum, example: MasterUnitTypeEnum.FILE, description: 'Type of the unit (NUMBER, FILE, TEXT)' })
  type!: MasterUnitTypeEnum;
}

export const updateMasterUnitTypeSchema = createMasterUnitTypeSchema.partial();

export class UpdateMasterUnitTypeDto {
  @ApiPropertyOptional({ example: 'Dokumen', description: 'Name of the unit type' })
  name?: string;

  @ApiPropertyOptional({ enum: MasterUnitTypeEnum, example: MasterUnitTypeEnum.FILE, description: 'Type of the unit (NUMBER, FILE, TEXT)' })
  type?: MasterUnitTypeEnum;
}

export class MasterUnitTypeDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Master Unit Type UUID' })
  id!: string;

  @ApiProperty({ example: 'Dokumen', description: 'Name of the unit type' })
  name!: string;

  @ApiProperty({ enum: MasterUnitTypeEnum, example: MasterUnitTypeEnum.FILE, description: 'Type of the unit (NUMBER, FILE, TEXT)' })
  type!: MasterUnitTypeEnum;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Update timestamp' })
  updatedAt!: Date;
}
