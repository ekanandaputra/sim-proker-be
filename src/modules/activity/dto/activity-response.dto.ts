import { ApiProperty } from '@nestjs/swagger';
import { ActivityStatus } from '@prisma/client';

export class ActivityResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  programId!: string;

  @ApiProperty({ example: 'Workshop Pelatihan' })
  title!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: 25.0 })
  weight!: number;

  @ApiProperty({ enum: ActivityStatus })
  status!: ActivityStatus;

  @ApiProperty()
  startDate!: Date;

  @ApiProperty()
  endDate!: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
