import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Output } from '@prisma/client';

// ---------- Zod Schemas ----------

export const createOutputSchema = z.object({
  metricType: z.string().min(1, 'Metric type is required').max(100),
  target: z.number().min(0, 'Target must be non-negative'),
  realization: z.number().min(0).default(0),
  unit: z.string().min(1, 'Unit is required').max(50),
  description: z.string().optional(),
});
export class CreateOutputDto {
  @ApiProperty({ example: 'Publication', description: 'Type of the output metric' }) metricType!: string;
  @ApiProperty({ example: 5, description: 'Target value for the output' }) target!: number;
  @ApiPropertyOptional({ example: 0, description: 'Current realization value' }) realization?: number;
  @ApiProperty({ example: 'pcs', description: 'Unit of measurement' }) unit!: string;
  @ApiPropertyOptional({ example: 'Jumlah publikasi yang ditargetkan', description: 'Optional description' }) description?: string;
}

export const updateOutputSchema = z.object({
  metricType: z.string().min(1).max(100).optional(),
  target: z.number().min(0).optional(),
  realization: z.number().min(0).optional(),
  unit: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
});
export class UpdateOutputDto {
  @ApiPropertyOptional({ example: 'Publication', description: 'Type of the output metric' }) metricType?: string;
  @ApiPropertyOptional({ example: 5, description: 'Target value for the output' }) target?: number;
  @ApiPropertyOptional({ example: 2, description: 'Current realization value' }) realization?: number;
  @ApiPropertyOptional({ example: 'pcs', description: 'Unit of measurement' }) unit?: string;
  @ApiPropertyOptional({ example: 'Jumlah publikasi yang ditargetkan', description: 'Optional description' }) description?: string;
}

// ---------- Response DTO ----------

export class OutputResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Output UUID' }) id!: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Activity UUID this output belongs to' }) activityId!: string;
  @ApiProperty({ example: 'Publication', description: 'Type of the output metric' }) metricType!: string;
  @ApiProperty({ example: 5, description: 'Target value' }) target!: number;
  @ApiProperty({ example: 2, description: 'Current realization' }) realization!: number;
  @ApiProperty({ example: 'pcs', description: 'Unit of measurement' }) unit!: string;
  @ApiProperty({ nullable: true, example: 'Detail output', description: 'Optional description' }) description!: string | null;
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation timestamp' }) createdAt!: Date;
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Update timestamp' }) updatedAt!: Date;
}

// ---------- Mapper ----------

export class OutputMapper {
  static toResponse(o: Output): OutputResponseDto {
    return {
      id: o.id,
      activityId: o.activityId,
      metricType: o.metricType,
      target: Number(o.target),
      realization: Number(o.realization),
      unit: o.unit,
      description: o.description,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  }
  static toResponseList(list: Output[]): OutputResponseDto[] {
    return list.map((o) => OutputMapper.toResponse(o));
  }
}
