import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const createMasterBudgetSchema = z.object({
  year: z.number().int().min(2000),
  budget: z.number().min(0),
  realization: z.number().min(0).optional(),
});

export class CreateMasterBudgetDto {
  @ApiProperty({ example: 2024, description: 'Budget year' })
  year!: number;

  @ApiProperty({ example: 1000000000, description: 'Total budget for the year' })
  budget!: number;

  @ApiProperty({ example: 500000000, description: 'Total realization for the year', required: false })
  realization?: number;
}

export const updateMasterBudgetBudgetSchema = z.object({
  budget: z.number().min(0),
});

export class UpdateMasterBudgetBudgetDto {
  @ApiProperty({ example: 1500000000, description: 'Total budget for the year' })
  budget!: number;
}

export const updateMasterBudgetRealizationSchema = z.object({
  realization: z.number().min(0),
});

export class UpdateMasterBudgetRealizationDto {
  @ApiProperty({ example: 750000000, description: 'Total realization for the year' })
  realization!: number;
}

export class MasterBudgetDto {
  @ApiProperty({ example: 2024, description: 'Budget year' })
  year!: number;

  @ApiProperty({ example: 1000000000, description: 'Total budget for the year' })
  budget!: number;

  @ApiProperty({ example: 500000000, description: 'Total realization for the year' })
  realization!: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Update timestamp' })
  updatedAt!: Date;
}
