import { ApiProperty } from '@nestjs/swagger';
import { Template, TemplateType } from '@prisma/client';

export class TemplateResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Template UUID' }) id!: string;
  @ApiProperty({ enum: TemplateType, example: TemplateType.TOR, description: 'Template type' }) type!: TemplateType;
  @ApiProperty({ example: 'Template TOR 2026.docx', description: 'Original file name' }) fileName!: string;
  @ApiProperty({ example: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'File MIME type' }) mimeType!: string;
  @ApiProperty({ example: 51200, description: 'File size in bytes' }) fileSize!: number;
  @ApiProperty({ example: 'http://localhost:3000/uploads/templates/abc123.docx', description: 'Full URL of the template file' }) url!: string;
  @ApiProperty({ example: '2026-09-03T00:00:00.000Z', description: 'Last update timestamp' }) updatedAt!: Date;
}

export class TemplateMapper {
  static toResponse(t: Template, url: string): TemplateResponseDto {
    return {
      id: t.id,
      type: t.type,
      fileName: t.fileName,
      mimeType: t.mimeType,
      fileSize: t.fileSize,
      url,
      updatedAt: t.updatedAt,
    };
  }
}
