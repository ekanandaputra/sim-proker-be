import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityStatus } from '@prisma/client';

export const createActivitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  weight: z.number().min(0).max(100).default(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(
  (data) => data.endDate > data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] },
);

export class CreateActivityDto {
  @ApiProperty({ example: 'Workshop Pelatihan', description: 'Title of the activity' })
  title!: string;

  @ApiPropertyOptional({ example: 'Deskripsi kegiatan workshop', description: 'Detailed description' })
  description?: string;

  @ApiPropertyOptional({ example: 25.0, description: 'Weight of the activity in percentage (0-100)', default: 0 })
  weight?: number;

  @ApiProperty({ example: '2024-01-15', description: 'Start date of the activity' })
  startDate!: Date;

  @ApiProperty({ example: '2024-01-31', description: 'End date of the activity' })
  endDate!: Date;
}

export const updateActivitySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  weight: z.number().min(0).max(100).optional(),
  status: z.nativeEnum(ActivityStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export class UpdateActivityDto {
  @ApiPropertyOptional({ example: 'Workshop Pelatihan Lanjutan', description: 'Title of the activity' })
  title?: string;

  @ApiPropertyOptional({ example: 'Deskripsi kegiatan workshop', description: 'Detailed description' })
  description?: string;

  @ApiPropertyOptional({ example: 30.0, description: 'Weight of the activity in percentage (0-100)' })
  weight?: number;

  @ApiPropertyOptional({ enum: ActivityStatus, example: ActivityStatus.IN_PROGRESS, description: 'Status of the activity' })
  status?: ActivityStatus;

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Start date of the activity' })
  startDate?: Date;

  @ApiPropertyOptional({ example: '2024-01-31', description: 'End date of the activity' })
  endDate?: Date;
}
