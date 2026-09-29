import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Guide } from '@prisma/client';
import { paginationQuerySchema } from '@common/dto/pagination.dto';

const videoUrlSchema = z
  .string()
  .url('Video URL must be a valid URL')
  .refine(
    (url) =>
      /(drive\.google\.com|docs\.google\.com)/.test(url) || /(youtube\.com|youtu\.be)/.test(url),
    'Video URL must be a Google Drive or YouTube link',
  );

export const createGuideSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
    description: z.string().optional(),
    videoUrl: z.union([videoUrlSchema, z.literal('')]).optional(),
  })
  .transform((data) => ({ ...data, videoUrl: data.videoUrl || undefined }));

export type CreateGuideBodyDto = z.infer<typeof createGuideSchema>;

export const updateGuideSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title must be at most 255 characters')
      .optional(),
    description: z.string().optional(),
    videoUrl: z.union([videoUrlSchema, z.literal('')]).optional(),
  })
  .transform((data) => ({ ...data, videoUrl: data.videoUrl === '' ? null : data.videoUrl }));

export type UpdateGuideBodyDto = z.infer<typeof updateGuideSchema>;

export const guideQuerySchema = paginationQuerySchema;
export type GuideQueryDto = z.infer<typeof guideQuerySchema>;

export class CreateGuideDto {
  @ApiProperty({
    example: 'Performance Indicator Guide',
    description: 'Title of the guide',
  })
  title!: string;

  @ApiPropertyOptional({
    example: 'Complete guide for filling out annual performance indicators',
    description: 'Description of the guide',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'https://drive.google.com/file/d/abc123/view',
    description: 'Link to a Google Drive or YouTube video explaining the guide',
  })
  videoUrl?: string;
}

export class UpdateGuideDto {
  @ApiPropertyOptional({ example: 'Performance Indicator Guide' }) title?: string;
  @ApiPropertyOptional({ example: 'Complete guide for filling out annual performance indicators' })
  description?: string;
  @ApiPropertyOptional({ example: 'https://youtu.be/abc123' }) videoUrl?: string;
}

export class GuideResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Guide UUID' })
  id!: string;
  @ApiProperty({ example: 'Performance Indicator Guide' }) title!: string;
  @ApiPropertyOptional({
    example: 'Complete guide for filling out annual performance indicators',
    nullable: true,
  })
  description!: string | null;
  @ApiPropertyOptional({
    example: 'Performance Indicator Guide.pdf',
    description: 'Original file name',
    nullable: true,
  })
  fileName!: string | null;
  @ApiPropertyOptional({
    example: 'application/pdf',
    description: 'File MIME type',
    nullable: true,
  })
  mimeType!: string | null;
  @ApiPropertyOptional({ example: 512000, description: 'File size in bytes', nullable: true })
  fileSize!: number | null;
  @ApiPropertyOptional({
    example: 'http://localhost:3000/uploads/guides/abc123.pdf',
    description: 'Full URL of the guide material file',
    nullable: true,
  })
  url!: string | null;
  @ApiPropertyOptional({
    example: 'https://drive.google.com/file/d/abc123/view',
    description: 'Video link (Google Drive or YouTube)',
    nullable: true,
  })
  videoUrl!: string | null;
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'UUID of the user who uploaded the guide',
  })
  uploadedBy!: string;
  @ApiProperty({ example: '2026-09-05T00:00:00.000Z' }) createdAt!: Date;
  @ApiProperty({ example: '2026-09-05T00:00:00.000Z' }) updatedAt!: Date;
}

export class GuideMapper {
  static toResponse(g: Guide, url: string | null): GuideResponseDto {
    return {
      id: g.id,
      title: g.title,
      description: g.description,
      fileName: g.fileName,
      mimeType: g.mimeType,
      fileSize: g.fileSize,
      url,
      videoUrl: g.videoUrl,
      uploadedBy: g.uploadedBy,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  }
}
