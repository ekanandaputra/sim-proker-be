import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { ProgressLog } from '@prisma/client';

// ---------- Zod Schema ----------
export const createProgressSchema = z.object({
  progress: z.number().int().min(0, 'Progress must be 0-100').max(100, 'Progress must be 0-100'),
  note: z.string().optional(),
});
export type CreateProgressDto = z.infer<typeof createProgressSchema>;

// ---------- Response DTO ----------
export class ProgressResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() activityId!: string;
  @ApiProperty({ example: 75 }) progress!: number;
  @ApiProperty({ nullable: true }) note!: string | null;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
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
