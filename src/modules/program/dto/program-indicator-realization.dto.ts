import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { DocumentResponseDto } from '../../document/dto/document.dto';

export const programIndicatorRealizationSchema = z.object({
  month: z.number().int().min(1).max(12),
  realization: z.number().nonnegative(),
  remark: z.string().optional(),
  documentIds: z.array(z.string().uuid()).optional(),
});

export class CreateProgramIndicatorRealizationDto {
  @ApiProperty({ description: 'Month (1-12)', example: 1 })
  month!: number;

  @ApiProperty({ description: 'Realization value for this month', example: 15.5 })
  realization!: number;

  @ApiPropertyOptional({ description: 'Optional remark/note', example: 'Target exceeded due to...' })
  remark?: string;

  @ApiPropertyOptional({ description: 'Array of document UUIDs to attach', example: ['550e8400-e29b-41d4-a716-446655440000'] })
  documentIds?: string[];
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

  @ApiPropertyOptional({ type: () => [DocumentResponseDto] })
  documents?: DocumentResponseDto[];
}
