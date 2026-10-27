import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalLevel } from '@prisma/client';
import { IkuDto } from '../../external/iku-integration/dto/iku-integration.dto';

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

export class ApprovalReviewerUserResponseDto {
  @ApiProperty({ example: 'user-uuid-001', description: 'User ID of the assigned reviewer' })
  id!: string;

  @ApiProperty({ example: 'Budi Santoso', description: 'User name; Unknown User when user details are unavailable' })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: '198001012005011001' })
  nip?: string | null;

  @ApiPropertyOptional({ example: 'budi@example.com' })
  email?: string;

  @ApiPropertyOptional({ type: [String], example: ['ADMIN'] })
  roles?: string[];
}

export class ApprovalReviewerResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Reviewer assignment UUID' })
  id!: string;

  @ApiProperty({ example: 'user-uuid-001', description: 'User ID of the reviewer' })
  userId!: string;

  @ApiProperty({ enum: ApprovalLevel, example: ApprovalLevel.INDICATOR_VERIFICATION, description: 'Verification level' })
  level!: ApprovalLevel;

  @ApiPropertyOptional({ example: 'iku-uuid-001', description: 'IKU ID (only for INDICATOR_VERIFICATION)' })
  ikuId!: string | null;

  @ApiProperty({
    type: () => IkuDto,
    nullable: true,
    description: 'IKU details for the reviewer table; null for budget reviewers or when IKU data is unavailable',
  })
  iku!: IkuDto | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Record creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Record update timestamp' })
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: 'User details',
    type: Object,
    example: { id: 'user-uuid-001', name: 'John Doe' },
  })
  user?: any;
}

// ---------- Mapper ----------

export class ApprovalReviewerMapper {
  static toResponse(r: any): ApprovalReviewerResponseDto {
    return {
      id: r.id,
      userId: r.userId,
      level: r.level,
      ikuId: r.ikuId,
      iku: r.iku ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: r.user,
    };
  }

  static toResponseList(list: any[]): ApprovalReviewerResponseDto[] {
    return list.map((r) => ApprovalReviewerMapper.toResponse(r));
  }
}
