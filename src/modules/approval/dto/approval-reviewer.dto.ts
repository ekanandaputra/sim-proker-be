import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalLevel } from '@prisma/client';

// ---------- Zod Schemas ----------

export const createApprovalReviewerSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  level: z.nativeEnum(ApprovalLevel),
  ikuIds: z.array(z.string().min(1)).optional(),
}).refine(
  (data) => {
    // ikuIds is required for INDICATOR_VERIFICATION level
    if (data.level === ApprovalLevel.INDICATOR_VERIFICATION) {
      return data.ikuIds && data.ikuIds.length > 0;
    }
    return true;
  },
  { message: 'ikuIds is required for INDICATOR_VERIFICATION level', path: ['ikuIds'] },
);

export type CreateApprovalReviewerInput = z.infer<typeof createApprovalReviewerSchema>;

export class CreateApprovalReviewerDto {
  @ApiProperty({ example: 'user-uuid-001', description: 'User ID of the reviewer' })
  userId!: string;

  @ApiProperty({ enum: ApprovalLevel, example: ApprovalLevel.INDICATOR_VERIFICATION, description: 'Verification level' })
  level!: ApprovalLevel;

  @ApiPropertyOptional({
    description: 'Array of IKU IDs (required for INDICATOR_VERIFICATION level, ignored for BUDGET_VERIFICATION)',
    example: ['iku-uuid-001', 'iku-uuid-002'],
    type: [String],
  })
  ikuIds?: string[];
}

// ---------- Response DTO ----------

export class ApprovalReviewerResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Reviewer assignment UUID' })
  id!: string;

  @ApiProperty({ example: 'user-uuid-001', description: 'User ID of the reviewer' })
  userId!: string;

  @ApiProperty({ enum: ApprovalLevel, example: ApprovalLevel.INDICATOR_VERIFICATION, description: 'Verification level' })
  level!: ApprovalLevel;

  @ApiPropertyOptional({ example: 'iku-uuid-001', description: 'IKU ID (only for INDICATOR_VERIFICATION)' })
  ikuId!: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Record creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Record update timestamp' })
  updatedAt!: Date;
}

// ---------- Mapper ----------

export class ApprovalReviewerMapper {
  static toResponse(r: any): ApprovalReviewerResponseDto {
    return {
      id: r.id,
      userId: r.userId,
      level: r.level,
      ikuId: r.ikuId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  static toResponseList(list: any[]): ApprovalReviewerResponseDto[] {
    return list.map((r) => ApprovalReviewerMapper.toResponse(r));
  }
}
