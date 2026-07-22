import { ApiProperty } from '@nestjs/swagger';
import { ActivityStatus } from '@prisma/client';

export class ActivityResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Activity UUID' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Program UUID' })
  programId!: string;

  @ApiProperty({ example: 'Workshop Pelatihan', description: 'Title of the activity' })
  title!: string;

  @ApiProperty({ nullable: true, example: 'Deskripsi kegiatan', description: 'Detailed description' })
  description!: string | null;

  @ApiProperty({ example: 25.0, description: 'Weight of the activity in percentage (0-100)' })
  weight!: number;

  @ApiProperty({ enum: ActivityStatus, example: ActivityStatus.NOT_STARTED, description: 'Current status of the activity' })
  status!: ActivityStatus;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z', description: 'Start date of the activity' })
  startDate!: Date;

  @ApiProperty({ example: '2024-01-31T00:00:00.000Z', description: 'End date of the activity' })
  endDate!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Record creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Record last update timestamp' })
  updatedAt!: Date;
}
