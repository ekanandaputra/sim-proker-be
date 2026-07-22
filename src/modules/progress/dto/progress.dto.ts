import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProgressLog } from '@prisma/client';

// ---------- Zod Schema ----------
export const createProgressSchema = z.object({
  progress: z.number().int().min(0, 'Progress must be 0-100').max(100, 'Progress must be 0-100'),
  note: z.string().optional(),
});
export class CreateProgressDto {
  @ApiProperty({ example: 75, description: 'Progress percentage (0-100)' }) progress!: number;
  @ApiPropertyOptional({ example: 'Sudah selesai tahap persiapan', description: 'Optional progress note' }) note?: string;
}

// ---------- Response DTO ----------
export class ProgressResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Progress log UUID' }) id!: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Activity UUID' }) activityId!: string;
  @ApiProperty({ example: 75, description: 'Progress percentage (0-100)' }) progress!: number;
  @ApiProperty({ nullable: true, example: 'Selesai tahap 1', description: 'Optional note' }) note!: string | null;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'UUID of the user who logged progress' }) createdBy!: string;
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Log creation timestamp' }) createdAt!: Date;
}

// ---------- Mapper ----------
export class ProgressMapper {
  static toResponse(p: ProgressLog): ProgressResponseDto {
    return {
      id: p.id, activityId: p.activityId, progress: p.progress,
      note: p.note, createdBy: p.createdBy, createdAt: p.createdAt,
    };
  }
  static toResponseList(list: ProgressLog[]): ProgressResponseDto[] {
    return list.map((p) => ProgressMapper.toResponse(p));
  }
}
