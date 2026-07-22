import { ApiProperty } from '@nestjs/swagger';
import { Evidence } from '@prisma/client';

export class EvidenceResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Evidence UUID' }) id!: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Activity UUID this evidence belongs to' }) activityId!: string;
  @ApiProperty({ example: 'report.pdf', description: 'Original file name' }) fileName!: string;
  @ApiProperty({ example: 'evidences/abc123.pdf', description: 'Storage path or URL' }) filePath!: string;
  @ApiProperty({ example: 'application/pdf', description: 'File MIME type' }) mimeType!: string;
  @ApiProperty({ example: 1024000, description: 'File size in bytes' }) fileSize!: number;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'UUID of the user who uploaded' }) uploadedBy!: string;
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Upload timestamp' }) createdAt!: Date;
}

export class EvidenceMapper {
  static toResponse(e: Evidence): EvidenceResponseDto {
    return {
      id: e.id, activityId: e.activityId, fileName: e.fileName,
      filePath: e.filePath, mimeType: e.mimeType, fileSize: e.fileSize,
      uploadedBy: e.uploadedBy, createdAt: e.createdAt,
    };
  }
  static toResponseList(list: Evidence[]): EvidenceResponseDto[] {
    return list.map((e) => EvidenceMapper.toResponse(e));
  }
}
