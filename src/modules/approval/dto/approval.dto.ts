import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { Approval, ApprovalStatus } from '@prisma/client';

// ---------- Zod Schemas ----------
export const approvalActionSchema = z.object({
  note: z.string().optional(),
});
export type ApprovalActionDto = z.infer<typeof approvalActionSchema>;

// ---------- Response DTO ----------
export class ApprovalResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() programId!: string;
  @ApiProperty({ enum: ApprovalStatus }) status!: ApprovalStatus;
  @ApiProperty({ example: 1 }) level!: number;
  @ApiProperty({ nullable: true }) approverId!: string | null;
  @ApiProperty({ nullable: true }) note!: string | null;
  @ApiProperty({ nullable: true }) approvedAt!: Date | null;
  @ApiProperty() createdAt!: Date;
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
