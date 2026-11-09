import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { IndicatorCategory, ProgramStatus } from '@prisma/client';

// --- Query ---

export const budgetRecapQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).default(() => new Date().getFullYear()),
  unitId: z.string().min(1).optional(),
  category: z.nativeEnum(IndicatorCategory).optional(),
  status: z.nativeEnum(ProgramStatus).optional(),
});

export type BudgetRecapQuery = z.infer<typeof budgetRecapQuerySchema>;

// --- Response ---

export class BudgetRecapSummaryDto {
  @ApiProperty({ example: 4140000000, description: 'Sum of indicator budgets matching the filter (Rp)' })
  totalBudget!: number;

  @ApiProperty({ example: 12, description: 'Number of indicators (pengajuan) matching the filter' })
  totalIndicators!: number;

  @ApiProperty({ example: 7, description: 'Number of distinct units that have at least one indicator' })
  totalUnits!: number;

  @ApiProperty({ example: 9, description: 'Number of distinct programs' })
  totalPrograms!: number;
}

export class BudgetRecapStatusDto {
  @ApiProperty({ enum: ProgramStatus, example: ProgramStatus.APPROVED })
  status!: ProgramStatus;

  @ApiProperty({ example: 5 })
  count!: number;

  @ApiProperty({ example: 41.67, description: 'Share of totalIndicators in percent (2 decimals)' })
  percentage!: number;
}

export class BudgetRecapUnitDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  unitId!: string;

  @ApiProperty({ example: 'Jurusan Teknik Permesinan Kapal', description: 'Falls back to unitId when unknown' })
  unitName!: string;

  @ApiProperty({ type: String, nullable: true, example: 'JTPK' })
  unitCode!: string | null;

  @ApiProperty({ example: 2 })
  indicatorCount!: number;

  @ApiProperty({ example: 1 })
  programCount!: number;

  @ApiProperty({ example: 1595000000 })
  totalBudget!: number;
}

export class BudgetRecapPicDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  id!: string;

  @ApiProperty({ example: 'Budi Santoso', description: 'Falls back to the user ID when unknown' })
  name!: string;
}

export class BudgetRecapProgramDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440020' })
  id!: string;

  @ApiProperty({ example: 'PRG-2026-001' })
  code!: string;

  @ApiProperty({ example: 'Peningkatan Fasilitas Laboratorium' })
  title!: string;
}

export class BudgetRecapIndicatorDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440030' })
  id!: string;

  @ApiProperty({ example: 'Jumlah alat praktikum yang diperbarui' })
  name!: string;

  @ApiProperty({ enum: IndicatorCategory, example: IndicatorCategory.PENGEMBANGAN })
  category!: IndicatorCategory;

  @ApiProperty({ enum: ProgramStatus, example: ProgramStatus.SUBMITTED })
  status!: ProgramStatus;

  @ApiProperty({ example: 750000000, description: 'Indicator budget (Rp); 0 when not filled' })
  budget!: number;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  unitId!: string;

  @ApiProperty({ example: 'Jurusan Teknik Permesinan Kapal' })
  unitName!: string;

  @ApiProperty({ type: String, nullable: true, example: 'JTPK' })
  unitCode!: string | null;

  @ApiProperty({ type: BudgetRecapProgramDto })
  program!: BudgetRecapProgramDto;

  @ApiProperty({ type: [BudgetRecapPicDto] })
  pics!: BudgetRecapPicDto[];

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  updatedAt!: Date;
}

export class BudgetRecapResponseDto {
  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ type: BudgetRecapSummaryDto })
  summary!: BudgetRecapSummaryDto;

  @ApiProperty({
    type: [BudgetRecapStatusDto],
    description: 'Indicator count per status (only statuses that occur), sorted by count desc',
  })
  statusBreakdown!: BudgetRecapStatusDto[];

  @ApiProperty({
    type: [BudgetRecapUnitDto],
    description: 'One row per unit, sorted by totalBudget desc ("Per Unit" table and distribution chart)',
  })
  units!: BudgetRecapUnitDto[];

  @ApiProperty({
    type: [BudgetRecapIndicatorDto],
    description: 'Every indicator matching the filter, sorted by budget desc ("Semua Pengajuan" table / unit detail)',
  })
  indicators!: BudgetRecapIndicatorDto[];
}
