import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { ProgramStatus } from '@prisma/client';

// --- Query ---

export const programStatusRecapQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).optional(),
  unitId: z.string().min(1).optional(),
});

export type ProgramStatusRecapQuery = z.infer<typeof programStatusRecapQuerySchema>;

// --- Response ---

export class ProgramStatusCountDto {
  @ApiProperty({ enum: ProgramStatus, example: ProgramStatus.APPROVED })
  status!: ProgramStatus;

  @ApiProperty({ example: 5 })
  count!: number;
}

export class ProgramStatusRecapRowDto {
  @ApiProperty({ example: '50c42d0a-e798-4d41-be97-31593d422bbe' })
  unitId!: string;

  @ApiProperty({
    example: 'Unit Teknik Informatika',
    description: 'Unit name from the Auth Service; falls back to the unit ID',
  })
  unitName!: string;

  @ApiProperty({ example: 2026, description: 'Program year' })
  year!: number;

  @ApiProperty({
    example: 12,
    description: 'Number of indicators (program assignments) of the unit',
  })
  total!: number;

  @ApiProperty({
    type: [ProgramStatusCountDto],
    description:
      'Count per status: ASSIGNED_TO_UNIT, SUBMITTED, APPROVED, REJECTED, REVISION, IN_PROGRESS (0 when none)',
  })
  statuses!: ProgramStatusCountDto[];
}

export class ProgramStatusRecapYearDto {
  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 40 })
  total!: number;

  @ApiProperty({ type: [ProgramStatusCountDto] })
  statuses!: ProgramStatusCountDto[];
}

export class ProgramStatusRecapResponseDto {
  @ApiProperty({ example: 40, description: 'Number of indicators matching the filter' })
  total!: number;

  @ApiProperty({ type: [ProgramStatusCountDto], description: 'Count per status across all rows' })
  statuses!: ProgramStatusCountDto[];

  @ApiProperty({ type: [ProgramStatusRecapYearDto], description: 'Totals per year (ascending)' })
  years!: ProgramStatusRecapYearDto[];

  @ApiProperty({
    type: [ProgramStatusRecapRowDto],
    description: 'One row per unit per year, sorted by year then unit name',
  })
  units!: ProgramStatusRecapRowDto[];
}
