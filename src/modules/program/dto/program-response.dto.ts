import { ApiProperty } from '@nestjs/swagger';
import { ProgramStatus } from '@prisma/client';

export class ProgramResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'PRG-2025-001' })
  code!: string;

  @ApiProperty({ example: 'Program Penelitian Terapan' })
  title!: string;

  @ApiProperty({ example: 'Research program for applied sciences', nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'Advance applied research output', nullable: true })
  objective!: string | null;

  @ApiProperty({ example: 2025 })
  year!: number;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', nullable: true })
  unitId!: string | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002', nullable: true })
  categoryId!: string | null;

  @ApiProperty({ example: 'Research', nullable: true })
  categoryName!: string | null;

  @ApiProperty({ enum: ProgramStatus, example: ProgramStatus.DRAFT })
  status!: ProgramStatus;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  startDate!: Date;

  @ApiProperty({ example: '2025-12-31T00:00:00.000Z' })
  endDate!: Date;

  @ApiProperty({ example: 50000000 })
  budget!: number;


  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440004' })
  createdBy!: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
