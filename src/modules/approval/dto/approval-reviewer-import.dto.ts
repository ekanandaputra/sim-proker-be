import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApprovalReviewerImportRowDto {
  @ApiProperty({ example: 2 }) row!: number;
  @ApiProperty({ example: 'IKU-01' }) ikuCode!: string;
  @ApiProperty({ example: '198001012005011001' }) nip!: string;
  @ApiProperty({ enum: ['success', 'skipped'], example: 'success' }) status!: 'success' | 'skipped';
  @ApiPropertyOptional({ example: 'Reviewer sudah terdaftar' }) reason?: string;
}

export class ApprovalReviewerImportResultDto {
  @ApiProperty({ example: 2 }) totalRows!: number;
  @ApiProperty({ example: 1 }) success!: number;
  @ApiProperty({ example: 1 }) skipped!: number;
  @ApiProperty({ type: [ApprovalReviewerImportRowDto] }) details!: ApprovalReviewerImportRowDto[];
}
