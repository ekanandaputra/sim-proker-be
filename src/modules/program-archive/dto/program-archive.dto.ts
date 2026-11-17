import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
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

export const updateProgramArchiveSchema = z.object({
  gdriveUrl: gdriveUrlSchema,
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
  @ApiProperty({
    example: 'https://drive.google.com/drive/folders/abc123',
    description: 'Link Google Drive arsip proker',
  })
  gdriveUrl!: string;
}

export class ProgramArchiveResponseDto {
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
    return { year: a.year, gdriveUrl: a.gdriveUrl };
  }
}
