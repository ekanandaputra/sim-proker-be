import { ApiProperty } from '@nestjs/swagger';
import { Evidence } from '@prisma/client';

export class EvidenceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() activityId!: string;
  @ApiProperty({ example: 'report.pdf' }) fileName!: string;
  @ApiProperty({ example: 'evidences/abc123.pdf' }) filePath!: string;
  @ApiProperty({ example: 'application/pdf' }) mimeType!: string;
  @ApiProperty({ example: 1024000 }) fileSize!: number;
  @ApiProperty() uploadedBy!: string;
  @ApiProperty() createdAt!: Date;
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
