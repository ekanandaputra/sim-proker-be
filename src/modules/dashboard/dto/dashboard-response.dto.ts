import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardResponseDto {
  @ApiProperty({ example: 50, description: 'Total number of programs' })
  totalPrograms!: number;

  @ApiProperty({ example: 120, description: 'Total number of indicators across all programs' })
  totalIndicators!: number;

  @ApiProperty({ example: 35, description: 'Total number of activities' })
  totalActivities!: number;

  @ApiProperty({
    example: [{ status: 'IN_PROGRESS', count: 15 }],
    description: 'Indicator count grouped by status'
  })
  indicatorsByStatus!: Array<{ status: string; count: number }>;

  @ApiProperty({
    example: [{ unitId: '550e8400-e29b-41d4-a716-446655440000', count: 10 }],
    description: 'Distinct program count grouped by unit'
  })
  programsByUnit!: Array<{ unitId: string; count: number }>;
}

export class UnitDashboardResponseDto {
  @ApiProperty({ example: 10, description: 'Total programs assigned to this unit' })
  totalPrograms!: number;

  @ApiProperty({ example: 25, description: 'Total indicators assigned to this unit' })
  totalIndicators!: number;

  @ApiProperty({
    example: [{ status: 'COMPLETED', count: 5 }],
    description: 'Indicator count for this unit grouped by status'
  })
  indicatorsByStatus!: Array<{ status: string; count: number }>;
}
