import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { DocumentResponseDto } from '../../document/dto/document.dto';

export const programIndicatorRealizationSchema = z.object({
  month: z.number().int().min(1).max(12),
  realization: z.number().nonnegative().optional(),
  valueText: z.string().min(1).optional(),
  remark: z.string().optional(),
  documentIds: z.array(z.string().uuid()).optional(),
});

export class CreateProgramIndicatorRealizationDto {
  @ApiProperty({ description: 'Month (1-12)', example: 1 })
  month!: number;

  @ApiPropertyOptional({ description: 'Realization value for this month. Required when the indicator valueType is NUMBER.', example: 15.5 })
  realization?: number;

  @ApiPropertyOptional({ description: 'Realization text value. Required when the indicator valueType is TEXT.', example: 'Dokumen telah disusun dan direview' })
  valueText?: string;

  @ApiPropertyOptional({ description: 'Optional remark/note', example: 'Target exceeded due to...' })
  remark?: string;

  @ApiPropertyOptional({ description: 'Array of document UUIDs to attach. Required (at least one) when the indicator valueType is FILE.', example: ['550e8400-e29b-41d4-a716-446655440000'] })
  documentIds?: string[];
}

export class ProgramIndicatorRealizationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  indicatorId!: string;

  @ApiProperty()
  month!: number;

  @ApiPropertyOptional({ nullable: true })
  realization?: number | null;

  @ApiPropertyOptional({ nullable: true })
  valueText?: string | null;

  @ApiPropertyOptional()
  remark?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ type: () => [DocumentResponseDto] })
  documents?: DocumentResponseDto[];
}
