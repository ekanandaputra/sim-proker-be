import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const createDefaultProgramSchema = z.object({
  ikuId: z.string().min(1, 'ikuId is required'),
  ikuCode: z.string().min(1, 'ikuCode is required'),
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
});
export type CreateDefaultProgramDto = z.infer<typeof createDefaultProgramSchema>;

export const updateDefaultProgramSchema = createDefaultProgramSchema.partial();
export type UpdateDefaultProgramDto = z.infer<typeof updateDefaultProgramSchema>;

export class DefaultProgramDto {
  @ApiProperty() id!: string;
  @ApiProperty() ikuId!: string;
  @ApiProperty() ikuCode!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
