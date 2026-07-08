import { ApiProperty } from '@nestjs/swagger';

export class DashboardResponseDto {
  @ApiProperty({ example: 50 }) totalPrograms!: number;
  @ApiProperty({ example: 20 }) runningPrograms!: number;
  @ApiProperty({ example: 15 }) completedPrograms!: number;
  @ApiProperty({ example: 5 }) delayedPrograms!: number;
  @ApiProperty({ example: 500000000 }) totalBudget!: number;
  @ApiProperty({ example: 45.5 }) completionPercentage!: number;
  @ApiProperty({ example: [{ unitId: 'uuid', count: 10 }] })
  programsByUnit!: Array<{ unitId: string | null; count: number }>;
  @ApiProperty({ example: [{ status: 'APPROVED', count: 15 }] })
  programsByStatus!: Array<{ status: string; count: number }>;
}
