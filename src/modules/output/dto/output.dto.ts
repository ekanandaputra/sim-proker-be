import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { Output } from '@prisma/client';

// ---------- Zod Schemas ----------

export const createOutputSchema = z.object({
  metricType: z.string().min(1, 'Metric type is required').max(100),
  target: z.number().min(0, 'Target must be non-negative'),
  realization: z.number().min(0).default(0),
  unit: z.string().min(1, 'Unit is required').max(50),
  description: z.string().optional(),
});
export type CreateOutputDto = z.infer<typeof createOutputSchema>;

export const updateOutputSchema = z.object({
  metricType: z.string().min(1).max(100).optional(),
  target: z.number().min(0).optional(),
  realization: z.number().min(0).optional(),
  unit: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
});
export type UpdateOutputDto = z.infer<typeof updateOutputSchema>;

// ---------- Response DTO ----------

export class OutputResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() activityId!: string;
  @ApiProperty({ example: 'Publication' }) metricType!: string;
  @ApiProperty({ example: 5 }) target!: number;
  @ApiProperty({ example: 2 }) realization!: number;
  @ApiProperty({ example: 'pcs' }) unit!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
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
