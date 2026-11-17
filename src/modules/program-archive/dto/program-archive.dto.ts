import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProgramArchive } from '@prisma/client';

const gdriveUrlSchema = z
  .string()
  .url('Google Drive URL must be a valid URL')
  .max(500, 'Google Drive URL must be at most 500 characters')
  .refine(
    (url) => /(drive\.google\.com|docs\.google\.com)/.test(url),
    'URL must be a Google Drive link',
  );

export const createProgramArchiveSchema = z.object({
  year: z.number().int().min(2000).max(9999),
  gdriveUrl: gdriveUrlSchema,
});
export type CreateProgramArchiveBodyDto = z.infer<typeof createProgramArchiveSchema>;

export const updateProgramArchiveSchema = z
  .object({
    year: z.number().int().min(2000).max(9999).optional(),
    gdriveUrl: gdriveUrlSchema.optional(),
  })
  .refine((data) => data.year !== undefined || data.gdriveUrl !== undefined, {
    message: 'At least one of year or gdriveUrl must be provided',
  });
export type UpdateProgramArchiveBodyDto = z.infer<typeof updateProgramArchiveSchema>;

export class CreateProgramArchiveDto {
  @ApiProperty({ example: 2025, description: 'Tahun arsip proker' })
  year!: number;

  @ApiProperty({
    example: 'https://drive.google.com/drive/folders/abc123',
    description: 'Link Google Drive arsip proker',
  })
  gdriveUrl!: string;
}

export class UpdateProgramArchiveDto {
  @ApiPropertyOptional({ example: 2025, description: 'Tahun arsip proker' })
  year?: number;

  @ApiPropertyOptional({
    example: 'https://drive.google.com/drive/folders/abc123',
    description: 'Link Google Drive arsip proker',
  })
  gdriveUrl?: string;
}

export class ProgramArchiveResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Archive UUID' })
  id!: string;

  @ApiProperty({ example: 2025, description: 'Tahun arsip proker' })
  year!: number;

  @ApiProperty({
    example: 'https://drive.google.com/drive/folders/abc123',
    description: 'Link Google Drive arsip proker',
  })
  gdriveUrl!: string;
}

export class ProgramArchiveMapper {
  static toResponse(a: ProgramArchive): ProgramArchiveResponseDto {
    return { id: a.id, year: a.year, gdriveUrl: a.gdriveUrl };
  }
}
