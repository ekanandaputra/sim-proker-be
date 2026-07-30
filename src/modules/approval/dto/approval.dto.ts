import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Approval, ApprovalStatus } from '@prisma/client';

// ---------- Zod Schemas ----------
export const approvalActionSchema = z.object({
  note: z.string().optional(),
});
export class ApprovalActionDto {
  @ApiPropertyOptional({ example: 'Silakan direvisi pada bagian anggaran', description: 'Optional note/comment for the action' })
  note?: string;
}

// ---------- Response DTO ----------
export class ApprovalResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Approval UUID' }) id!: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Program UUID being approved' }) programId!: string;
  @ApiProperty({ enum: ApprovalStatus, example: ApprovalStatus.SUBMITTED, description: 'Current approval status' }) status!: ApprovalStatus;
  @ApiProperty({ example: 1, description: 'Approval level in the workflow hierarchy' }) level!: number;
  @ApiProperty({ nullable: true, example: '550e8400-e29b-41d4-a716-446655440002', description: 'User UUID of the approver' }) approverId!: string | null;
  @ApiProperty({ nullable: true, example: 'Telah disetujui', description: 'Note/comment left by the approver' }) note!: string | null;
  @ApiProperty({ nullable: true, example: '2024-01-15T00:00:00.000Z', description: 'Timestamp when approved/rejected' }) approvedAt!: Date | null;
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Record creation timestamp' }) createdAt!: Date;
}

// ---------- Mapper ----------
export class ApprovalMapper {
  static toResponse(a: Approval): ApprovalResponseDto {
    return {
      id: a.id, programId: a.programId, status: a.status,
      level: a.level, approverId: a.approverId, note: a.note,
      approvedAt: a.approvedAt, createdAt: a.createdAt,
    };
  }
  static toResponseList(list: Approval[]): ApprovalResponseDto[] {
    return list.map((a) => ApprovalMapper.toResponse(a));
  }
}
