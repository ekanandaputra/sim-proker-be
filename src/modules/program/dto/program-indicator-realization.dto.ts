import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export const programIndicatorRealizationSchema = z.object({
  month: z.number().int().min(1).max(12),
  realization: z.number().nonnegative(),
  remark: z.string().optional(),
});

export class CreateProgramIndicatorRealizationDto {
  @ApiProperty({ description: 'Month (1-12)', example: 1 })
  month!: number;

  @ApiProperty({ description: 'Realization value for this month', example: 15.5 })
  realization!: number;

  @ApiPropertyOptional({ description: 'Optional remark/note', example: 'Target exceeded due to...' })
  remark?: string;
}

export class ProgramIndicatorRealizationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  indicatorId!: string;

  @ApiProperty()
  month!: number;

  @ApiProperty()
  realization!: number;

  @ApiPropertyOptional()
  remark?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
