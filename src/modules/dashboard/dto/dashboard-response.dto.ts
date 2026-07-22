import { ApiProperty } from '@nestjs/swagger';

export class DashboardResponseDto {
  @ApiProperty({ example: 50, description: 'Total number of programs' }) totalPrograms!: number;
  @ApiProperty({ example: 20, description: 'Number of currently running/in-progress programs' }) runningPrograms!: number;
  @ApiProperty({ example: 15, description: 'Number of completed programs' }) completedPrograms!: number;
  @ApiProperty({ example: 5, description: 'Number of delayed/overdue programs' }) delayedPrograms!: number;
  @ApiProperty({ example: 500000000, description: 'Total budget allocated across all programs' }) totalBudget!: number;
  @ApiProperty({ example: 45.5, description: 'Overall completion percentage' }) completionPercentage!: number;
  @ApiProperty({ example: [{ unitId: '550e8400-e29b-41d4-a716-446655440000', count: 10 }], description: 'Program count grouped by unit' })
  programsByUnit!: Array<{ unitId: string | null; count: number }>;
  @ApiProperty({ example: [{ status: 'APPROVED', count: 15 }], description: 'Program count grouped by status' })
  programsByStatus!: Array<{ status: string; count: number }>;
}
