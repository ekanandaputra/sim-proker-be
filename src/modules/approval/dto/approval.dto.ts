import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Approval, ApprovalStatus, ApprovalLevel } from '@prisma/client';

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
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Program Indicator UUID being approved' }) indicatorId!: string;
  @ApiProperty({ enum: ApprovalStatus, example: ApprovalStatus.SUBMITTED, description: 'Current approval status' }) status!: ApprovalStatus;
  @ApiProperty({ enum: ApprovalLevel, example: ApprovalLevel.INDICATOR_VERIFICATION, description: 'Approval level: INDICATOR_VERIFICATION or BUDGET_VERIFICATION' }) level!: ApprovalLevel;
  @ApiProperty({ nullable: true, example: '550e8400-e29b-41d4-a716-446655440002', description: 'User UUID of the approver' }) approverId!: string | null;
  @ApiProperty({ nullable: true, example: 'Telah disetujui', description: 'Note/comment left by the approver' }) note!: string | null;
  @ApiProperty({ nullable: true, example: '2024-01-15T00:00:00.000Z', description: 'Timestamp when approved/rejected' }) approvedAt!: Date | null;
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Record creation timestamp' }) createdAt!: Date;
}

export class SubmittedProgramIndicatorResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Indicator UUID' }) id!: string;
  @ApiProperty({ example: 'Jumlah Dokumen Laporan', description: 'Name of the indicator' }) name!: string;
  @ApiProperty({ example: 'SUBMITTED', description: 'Status of the indicator' }) status!: string;
  @ApiProperty({ 
    description: 'Program detail object assigned to this indicator', 
    type: Object,
    example: {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'Program Peningkatan Kualitas Mahasiswa',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  }) 
  program!: any;

  @ApiProperty({ 
    description: 'Unit detail object assigned to this indicator', 
    type: Object,
    example: {
      id: '550e8400-e29b-41d4-a716-446655440020',
      name: 'Fakultas Ilmu Komputer',
      code: 'FILKOM'
    }
  }) 
  unit!: any;
  @ApiProperty({ example: '2026-07-22T00:00:00.000Z' }) createdAt!: Date;
  @ApiProperty({ example: '2026-07-22T00:00:00.000Z' }) updatedAt!: Date;
}

export class RevisionIndicatorResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Indicator UUID' }) id!: string;
  @ApiProperty({ example: 'Jumlah Dokumen Laporan', description: 'Name of the indicator' }) name!: string;
  @ApiProperty({ example: 'REVISION', description: 'Status of the indicator' }) status!: string;

  @ApiProperty({ nullable: true, example: 10, type: Number }) targetQ1!: any;
  @ApiProperty({ nullable: true, example: 20, type: Number }) targetQ2!: any;
  @ApiProperty({ nullable: true, example: 30, type: Number }) targetQ3!: any;
  @ApiProperty({ nullable: true, example: 40, type: Number }) targetQ4!: any;
  @ApiProperty({ nullable: true, example: 15000000.00, type: Number }) budget?: any;

  @ApiProperty({ nullable: true, example: 'http://localhost:3000/uploads/documents/abc123.pdf', description: 'Full URL of the proposal document' })
  proposalURL!: string | null;

  @ApiProperty({ nullable: true, example: 'http://localhost:3000/uploads/documents/def456.pdf', description: 'Full URL of the RAB (budget plan) document' })
  rabURL!: string | null;

  @ApiProperty({
    description: 'Program detail object this indicator belongs to',
    type: Object,
    example: {
      id: '550e8400-e29b-41d4-a716-446655440010',
      title: 'Program Peningkatan Kualitas Mahasiswa',
    },
  })
  program!: any;

  @ApiProperty({
    description: 'Unit detail object assigned to this indicator',
    type: Object,
    example: {
      id: '550e8400-e29b-41d4-a716-446655440020',
      name: 'Fakultas Ilmu Komputer',
      code: 'FILKOM',
    },
  })
  unit!: any;

  @ApiProperty({ enum: ApprovalLevel, nullable: true, example: ApprovalLevel.INDICATOR_VERIFICATION, description: 'The approval level at which revision was requested' })
  revisionLevel!: ApprovalLevel | null;

  @ApiProperty({ nullable: true, example: 'Silakan perbaiki anggaran pada bagian operasional', description: 'Note/feedback left by the reviewer that requested this revision' })
  revisionNote!: string | null;

  @ApiProperty({ nullable: true, example: '2026-08-20T00:00:00.000Z', description: 'Timestamp when the revision was requested' })
  revisionRequestedAt!: Date | null;

  @ApiProperty({ example: '2026-07-22T00:00:00.000Z' }) createdAt!: Date;
  @ApiProperty({ example: '2026-07-22T00:00:00.000Z' }) updatedAt!: Date;
}

export class RejectedIndicatorResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Indicator UUID' }) id!: string;
  @ApiProperty({ example: 'Jumlah Dokumen Laporan', description: 'Name of the indicator' }) name!: string;
  @ApiProperty({ example: 'REJECTED', description: 'Status of the indicator' }) status!: string;

  @ApiProperty({ nullable: true, example: 10, type: Number }) targetQ1!: any;
  @ApiProperty({ nullable: true, example: 20, type: Number }) targetQ2!: any;
  @ApiProperty({ nullable: true, example: 30, type: Number }) targetQ3!: any;
  @ApiProperty({ nullable: true, example: 40, type: Number }) targetQ4!: any;
  @ApiProperty({ nullable: true, example: 15000000.00, type: Number }) budget?: any;

  @ApiProperty({ nullable: true, example: 'http://localhost:3000/uploads/documents/abc123.pdf', description: 'Full URL of the proposal document' })
  proposalURL!: string | null;

  @ApiProperty({ nullable: true, example: 'http://localhost:3000/uploads/documents/def456.pdf', description: 'Full URL of the RAB (budget plan) document' })
  rabURL!: string | null;

  @ApiProperty({
    description: 'Program detail object this indicator belongs to',
    type: Object,
    example: {
      id: '550e8400-e29b-41d4-a716-446655440010',
      title: 'Program Peningkatan Kualitas Mahasiswa',
    },
  })
  program!: any;

  @ApiProperty({
    description: 'Unit detail object assigned to this indicator',
    type: Object,
    example: {
      id: '550e8400-e29b-41d4-a716-446655440020',
      name: 'Fakultas Ilmu Komputer',
      code: 'FILKOM',
    },
  })
  unit!: any;

  @ApiProperty({ enum: ApprovalLevel, nullable: true, example: ApprovalLevel.INDICATOR_VERIFICATION, description: 'The approval level at which the indicator was rejected' })
  rejectionLevel!: ApprovalLevel | null;

  @ApiProperty({ nullable: true, example: 'Indikator tidak sesuai dengan target IKU', description: 'Note/reason left by the reviewer that rejected this indicator' })
  rejectionNote!: string | null;

  @ApiProperty({ nullable: true, example: '2026-08-20T00:00:00.000Z', description: 'Timestamp when the indicator was rejected' })
  rejectedAt!: Date | null;

  @ApiProperty({ example: '2026-07-22T00:00:00.000Z' }) createdAt!: Date;
  @ApiProperty({ example: '2026-07-22T00:00:00.000Z' }) updatedAt!: Date;
}

// ---------- Mapper ----------
export class ApprovalMapper {
  static toResponse(a: Approval): ApprovalResponseDto {
    return {
      id: a.id, indicatorId: a.indicatorId, status: a.status,
      level: a.level, approverId: a.approverId, note: a.note,
      approvedAt: a.approvedAt, createdAt: a.createdAt,
    };
  }
  static toResponseList(list: Approval[]): ApprovalResponseDto[] {
    return list.map((a) => ApprovalMapper.toResponse(a));
  }
}
