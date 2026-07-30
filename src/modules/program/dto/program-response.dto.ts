import { ApiProperty } from '@nestjs/swagger';

import { ProgramIndicatorResponseDto } from './program-indicator.dto';

export class ProgramResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Program UUID' })
  id!: string;

  @ApiProperty({ example: 'PRG-2025-001', description: 'Program code' })
  code!: string;

  @ApiProperty({ example: 'Program Penelitian Terapan', description: 'Program title' })
  title!: string;

  @ApiProperty({ example: 'Research program for applied sciences', nullable: true, description: 'Optional detailed description' })
  description!: string | null;

  @ApiProperty({ example: 'Advance applied research output', nullable: true, description: 'Optional objective' })
  objective!: string | null;

  @ApiProperty({ example: 2025, description: 'Year of the program' })
  year!: number;

  @ApiProperty({ type: () => [ProgramIndicatorResponseDto], description: 'Indicators assigned to units for this program' })
  indicators!: ProgramIndicatorResponseDto[];

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440004', description: 'UUID of the user who created this' })
  createdBy!: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: 'Update timestamp' })
  updatedAt!: Date;
}
