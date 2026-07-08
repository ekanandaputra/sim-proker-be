import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

// ---------- Batch Query Schema ----------
export const outputsQuerySchema = z.object({
  programIds: z.array(z.string().uuid()).min(1, 'At least one programId is required'),
});
export type OutputsQueryDto = z.infer<typeof outputsQuerySchema>;

// ---------- Response DTOs ----------
export class IntegrationProgramDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() title!: string;
  @ApiProperty() status!: string;
  @ApiProperty() year!: number;
  @ApiProperty({ nullable: true }) unitId!: string | null;
  @ApiProperty() startDate!: Date;
  @ApiProperty() endDate!: Date;
  @ApiProperty() budget!: number;
}

export class IntegrationOutputDto {
  @ApiProperty() id!: string;
  @ApiProperty() activityId!: string;
  @ApiProperty() metricType!: string;
  @ApiProperty() target!: number;
  @ApiProperty() realization!: number;
  @ApiProperty() unit!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
}

export class IntegrationProgressDto {
  @ApiProperty() id!: string;
  @ApiProperty() activityId!: string;
  @ApiProperty() progress!: number;
  @ApiProperty({ nullable: true }) note!: string | null;
  @ApiProperty() createdAt!: Date;
}

export class ProgramOutputsDto {
  @ApiProperty() programId!: string;
  @ApiProperty({ type: [IntegrationOutputDto] }) outputs!: IntegrationOutputDto[];
}
