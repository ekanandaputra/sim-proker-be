import { ApiProperty } from '@nestjs/swagger';
import { Document, DocumentType } from '@prisma/client';

export class DocumentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Document UUID' }) id!: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Activity UUID this document belongs to, if any', nullable: true }) activityId!: string | null;
  @ApiProperty({ enum: DocumentType, example: DocumentType.EVIDENCE, description: 'Type of the document' }) type!: DocumentType;
  @ApiProperty({ example: 'report.pdf', description: 'Original file name' }) fileName!: string;
  @ApiProperty({ example: 'documents/abc123.pdf', description: 'Storage path or URL (returned as a full URL by some endpoints, e.g. indicator realizations)' }) filePath!: string;
  @ApiProperty({ example: 'application/pdf', description: 'File MIME type' }) mimeType!: string;
  @ApiProperty({ example: 1024000, description: 'File size in bytes' }) fileSize!: number;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'UUID of the user who uploaded' }) uploadedBy!: string;
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Upload timestamp' }) createdAt!: Date;
}

export class DocumentMapper {
  static toResponse(d: Document): DocumentResponseDto {
    return {
      id: d.id, activityId: d.activityId, type: d.type, fileName: d.fileName,
      filePath: d.filePath, mimeType: d.mimeType, fileSize: d.fileSize,
      uploadedBy: d.uploadedBy, createdAt: d.createdAt,
    };
  }
  static toResponseList(list: Document[]): DocumentResponseDto[] {
    return list.map((d) => DocumentMapper.toResponse(d));
  }
}
